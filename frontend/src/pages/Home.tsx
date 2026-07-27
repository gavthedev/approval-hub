import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {BarChart3, Link2, Loader2, Pin, Plus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import {apiError, statusConfig} from '@/lib/requestDisplay'
import {useNotification} from '@/hooks/useNotification'
import client from '@/api/client'
import type {Company, HomeItem, HomeItemType, StatKind} from '@/types'

interface TicketTypeOption {
    id: number
    name: string
    is_active: boolean
}

interface RequestOption {
    id: number
    title: string
    ticket_type_name: string | null
}

const statKindLabel: Record<StatKind, string> = {
    my_open_requests: 'My Open Requests',
    pending_my_approval: 'Pending My Approval',
}

export default function Home() {
    const navigate = useNavigate()

    const [items, setItems] = useState<HomeItem[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [editMode, setEditMode] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [itemType, setItemType] = useState<HomeItemType>('shortcut')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')
    const {notification, notify, dismiss} = useNotification()

    const [shortcutLabel, setShortcutLabel] = useState('')
    const [shortcutCompanySlug, setShortcutCompanySlug] = useState('')
    const [shortcutTicketTypeId, setShortcutTicketTypeId] = useState('')
    const [ticketTypesBySlug, setTicketTypesBySlug] = useState<Record<string, TicketTypeOption[]>>({})

    const [pinCompanySlug, setPinCompanySlug] = useState('')
    const [pinRequestId, setPinRequestId] = useState('')
    const [requestsBySlug, setRequestsBySlug] = useState<Record<string, RequestOption[]>>({})

    const [statCompanySlug, setStatCompanySlug] = useState('')
    const [statKind, setStatKind] = useState<StatKind>('my_open_requests')

    useEffect(() => {
        client.get('/home-items/').then(res => setItems(res.data)).catch(console.error)
        client.get('/companies/').then(res => setCompanies(res.data)).catch(console.error)
    }, [])

    const loadTicketTypes = (slug: string) => {
        if (!slug || slug in ticketTypesBySlug) return
        client.get(`/companies/${slug}/ticket-types/`).then(res => {
            setTicketTypesBySlug(prev => ({...prev, [slug]: res.data}))
        }).catch(console.error)
    }

    const loadRequests = (slug: string) => {
        if (!slug || slug in requestsBySlug) return
        client.get(`/companies/${slug}/requests/`).then(res => {
            setRequestsBySlug(prev => ({...prev, [slug]: res.data}))
        }).catch(console.error)
    }

    const resetForm = () => {
        setShortcutLabel('')
        setShortcutCompanySlug('')
        setShortcutTicketTypeId('')
        setPinCompanySlug('')
        setPinRequestId('')
        setStatCompanySlug('')
        setStatKind('my_open_requests')
        setFormError('')
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        let payload: Record<string, unknown>
        if (itemType === 'shortcut') {
            const company = companies.find(c => c.slug === shortcutCompanySlug)
            if (!shortcutLabel.trim() || !company) {
                setFormError('Label and company are required.')
                return
            }
            const url = shortcutTicketTypeId
                ? `/company/${company.slug}/new-request/${shortcutTicketTypeId}`
                : `/company/${company.slug}`
            payload = {item_type: 'shortcut', label: shortcutLabel.trim(), url, company: company.id}
        } else if (itemType === 'pinned_request') {
            if (!pinRequestId) {
                setFormError('Select a request to pin.')
                return
            }
            payload = {item_type: 'pinned_request', request: Number(pinRequestId)}
        } else {
            const company = companies.find(c => c.slug === statCompanySlug)
            payload = {item_type: 'stat', stat_kind: statKind, company: company ? company.id : null}
        }

        setSubmitting(true)
        try {
            const res = await client.post('/home-items/', payload)
            setItems(prev => [...prev, res.data])
            resetForm()
            setShowAddForm(false)
            notify('success', 'Added to your home screen.')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemove = async (id: number) => {
        try {
            await client.delete(`/home-items/${id}/`)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (err) {
            notify('error', apiError(err))
        }
    }

    const shortcuts = items.filter(i => i.item_type === 'shortcut')
    const stats = items.filter(i => i.item_type === 'stat')
    const pinned = items.filter(i => i.item_type === 'pinned_request')

    return (
        <div className="mx-auto max-w-3xl">
            {notification && (
                <div className={cn(
                    'mb-4 flex items-center justify-between rounded-md border px-4 py-3 text-sm',
                    notification.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                )}>
                    <span>{notification.message}</span>
                    <button onClick={dismiss} className="ml-4 shrink-0 opacity-60 hover:opacity-100">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            )}

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Home</h1>
                <div className="flex gap-2">
                    {!showAddForm && (
                        <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
                            <Plus className="h-4 w-4"/>Add
                        </Button>
                    )}
                    {items.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                            {editMode ? 'Done' : 'Edit'}
                        </Button>
                    )}
                </div>
            </div>

            {showAddForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddItem} noValidate className="flex flex-col gap-4">
                            <div>
                                <Label>Type</Label>
                                <Select value={itemType} onValueChange={(v) => {
                                    setItemType(v as HomeItemType)
                                    setFormError('')
                                }}>
                                    <SelectTrigger className="mt-1.5 w-full">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shortcut">Shortcut</SelectItem>
                                        <SelectItem value="pinned_request">Pinned Request</SelectItem>
                                        <SelectItem value="stat">Stat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {itemType === 'shortcut' && (
                                <>
                                    <div>
                                        <Label htmlFor="shortcutLabel">Label</Label>
                                        <Input id="shortcutLabel" value={shortcutLabel}
                                               onChange={e => setShortcutLabel(e.target.value)}
                                               placeholder="Report Broken Equipment" className="mt-1.5" autoFocus/>
                                    </div>
                                    <div>
                                        <Label>Company</Label>
                                        <Select value={shortcutCompanySlug} onValueChange={(v) => {
                                            setShortcutCompanySlug(v)
                                            setShortcutTicketTypeId('')
                                            loadTicketTypes(v)
                                        }}>
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue placeholder="Select company"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map(c => (
                                                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {shortcutCompanySlug && (
                                        <div>
                                            <Label>Ticket Type (optional)</Label>
                                            <Select value={shortcutTicketTypeId} onValueChange={setShortcutTicketTypeId}>
                                                <SelectTrigger className="mt-1.5 w-full">
                                                    <SelectValue placeholder="Go to company page"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(ticketTypesBySlug[shortcutCompanySlug] ?? [])
                                                        .filter(tt => tt.is_active)
                                                        .map(tt => (
                                                            <SelectItem key={tt.id} value={String(tt.id)}>{tt.name}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}

                            {itemType === 'pinned_request' && (
                                <>
                                    <div>
                                        <Label>Company</Label>
                                        <Select value={pinCompanySlug} onValueChange={(v) => {
                                            setPinCompanySlug(v)
                                            setPinRequestId('')
                                            loadRequests(v)
                                        }}>
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue placeholder="Select company"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map(c => (
                                                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {pinCompanySlug && (
                                        <div>
                                            <Label>Request</Label>
                                            <Select value={pinRequestId} onValueChange={setPinRequestId}>
                                                <SelectTrigger className="mt-1.5 w-full">
                                                    <SelectValue placeholder="Select request"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(requestsBySlug[pinCompanySlug] ?? []).map(r => (
                                                        <SelectItem key={r.id} value={String(r.id)}>
                                                            {r.title || r.ticket_type_name || `Request #${r.id}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}

                            {itemType === 'stat' && (
                                <>
                                    <div>
                                        <Label>Company</Label>
                                        <Select value={statCompanySlug} onValueChange={setStatCompanySlug}>
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue placeholder="All companies"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map(c => (
                                                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Stat</Label>
                                        <Select value={statKind} onValueChange={(v) => setStatKind(v as StatKind)}>
                                            <SelectTrigger className="mt-1.5 w-full">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="my_open_requests">My Open Requests</SelectItem>
                                                <SelectItem value="pending_my_approval">Pending My Approval</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {formError && <p className="text-xs text-red-600">{formError}</p>}

                            <div className="flex gap-2 sm:justify-end">
                                <Button type="submit" size="sm" disabled={submitting} className="flex-1 sm:flex-initial">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin"/>}
                                    {submitting ? 'Adding...' : 'Add'}
                                </Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowAddForm(false)
                                            resetForm()
                                        }}
                                        className="flex-1 sm:flex-initial">Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {items.length === 0 && !showAddForm && (
                <div className="py-12 text-center">
                    <h3 className="mt-4 text-lg font-medium text-slate-900">Your home screen is empty</h3>
                    {companies.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-500">
                            You'll need a company first —{' '}
                            <button onClick={() => navigate('/companies')} className="text-blue-600 hover:underline">
                                create one
                            </button>.
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-slate-500">Add a shortcut, pinned ticket, or stat to get started.</p>
                    )}
                </div>
            )}

            {shortcuts.length > 0 && (
                <div className="mb-6">
                    <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Link2 className="h-3.5 w-3.5"/>Shortcuts
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {shortcuts.map(item => (
                            <Card key={item.id}
                                  className="relative cursor-pointer border-slate-200 bg-white shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
                                  onClick={() => navigate(item.url)}>
                                {editMode && (
                                    <button onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(item.id)
                                    }}
                                            className="absolute right-1.5 top-1.5 rounded-full bg-white p-0.5 text-slate-400 shadow hover:text-red-600">
                                        <X className="h-3.5 w-3.5"/>
                                    </button>
                                )}
                                <CardContent className="flex flex-col gap-1 p-4">
                                    <span className="font-medium text-slate-900">{item.label}</span>
                                    {item.company_name && <span className="text-xs text-slate-500">{item.company_name}</span>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {stats.length > 0 && (
                <div className="mb-6">
                    <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <BarChart3 className="h-3.5 w-3.5"/>Stats
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {stats.map(item => (
                            <Card key={item.id} className="relative border-slate-200 bg-white shadow-sm">
                                {editMode && (
                                    <button onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(item.id)
                                    }}
                                            className="absolute right-1.5 top-1.5 rounded-full bg-white p-0.5 text-slate-400 shadow hover:text-red-600">
                                        <X className="h-3.5 w-3.5"/>
                                    </button>
                                )}
                                <CardContent className="flex flex-col gap-1 p-4">
                                    <span className="text-2xl font-semibold text-slate-900">{item.value ?? 0}</span>
                                    <span className="text-xs text-slate-500">
                                        {item.stat_kind ? statKindLabel[item.stat_kind] : ''}
                                        {item.company_name ? ` · ${item.company_name}` : ' · All companies'}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {pinned.length > 0 && (
                <div>
                    <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <Pin className="h-3.5 w-3.5"/>Pinned Requests
                    </h2>
                    <div className="flex flex-col gap-3">
                        {pinned.filter(item => item.request_detail).map(item => {
                            const req = item.request_detail!
                            const config = statusConfig[req.status] ?? {label: req.status, className: 'bg-slate-100 text-slate-700 border-slate-200'}
                            return (
                                <Card key={item.id}
                                      className="relative cursor-pointer border-slate-200 bg-white shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
                                      onClick={() => navigate(`/company/${req.company_slug}/requests/${req.id}`)}>
                                    {editMode && (
                                        <button onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemove(item.id)
                                        }}
                                                className="absolute right-2 top-2 rounded-full bg-white p-0.5 text-slate-400 shadow hover:text-red-600">
                                            <X className="h-3.5 w-3.5"/>
                                        </button>
                                    )}
                                    <CardContent className="p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-medium text-slate-900">{req.title || req.ticket_type_name}</h3>
                                            <Badge variant="outline" className={cn('text-xs', config.className)}>{config.label}</Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{req.company_name}</p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
