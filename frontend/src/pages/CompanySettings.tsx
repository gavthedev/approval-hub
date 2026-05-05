import {useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, Trash2, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import client from '@/api/client'

interface TicketTypeField {
    id: number
    name: string
    field_type: string
    is_required: boolean
    order: number
    placeholder: string
    help_text: string
}

interface TicketType {
    id: number
    name: string
    is_active: boolean
    fields: TicketTypeField[]
}

const FIELD_TYPES = [
    {value: 'text', label: 'Text'},
    {value: 'number', label: 'Number'},
    {value: 'date', label: 'Date'},
    {value: 'textarea', label: 'Long Text'},
    {value: 'file', label: 'File Upload'},
]

export default function CompanySettings() {
    const {slug} = useParams<{ slug: string }>()
    const navigate = useNavigate()

    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
    const [companyName, setCompanyName] = useState('')
    const [expandedType, setExpandedType] = useState<number | null>(null)
    const [showNewTypeForm, setShowNewTypeForm] = useState(false)
    const [newTypeName, setNewTypeName] = useState('')
    const [submittingType, setSubmittingType] = useState(false)
    const [showNewFieldForm, setShowNewFieldForm] = useState<number | null>(null)
    const [newField, setNewField] = useState({
        name: '',
        field_type: '',
        is_required: true,
        placeholder: '',
        help_text: '',
    })
    const [submittingField, setSubmittingField] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const notify = (type: 'success' | 'error', message: string) => {
        if (notifTimer.current) clearTimeout(notifTimer.current)
        setNotification({type, message})
        notifTimer.current = setTimeout(() => setNotification(null), 4000)
    }

    const apiError = (err: unknown): string => {
        const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
        if (data) {
            const first = Object.values(data)[0]
            if (typeof first === 'string') return first
            if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
        }
        return 'Something went wrong. Please try again.'
    }

    useEffect(() => {
        client.get('/companies/').then((res) => {
            const company = (res.data as { slug: string; name: string }[]).find((c) => c.slug === slug)
            if (company) setCompanyName(company.name)
        }).catch(console.error)

        client.get(`/companies/${slug}/ticket-types/`).then((res) => {
            setTicketTypes(res.data)
        }).catch(console.error)
    }, [slug])

    const handleCreateTicketType = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTypeName.trim()) return
        setSubmittingType(true)
        try {
            const res = await client.post(`/companies/${slug}/ticket-types/`, {name: newTypeName.trim()})
            setTicketTypes([...ticketTypes, res.data])
            setNewTypeName('')
            setShowNewTypeForm(false)
            notify('success', 'Ticket type created.')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmittingType(false)
        }
    }

    const handleDeleteTicketType = async (typeId: number) => {
        try {
            await client.delete(`/companies/${slug}/ticket-types/${typeId}/`)
            setTicketTypes(ticketTypes.filter(t => t.id !== typeId))
            notify('success', 'Ticket type deleted.')
        } catch (err) {
            notify('error', apiError(err))
        }
    }

    const handleAddField = async (e: React.FormEvent, typeId: number) => {
        e.preventDefault()
        if (!newField.name.trim() || !newField.field_type) return
        setSubmittingField(true)
        try {
            const res = await client.post(`/companies/${slug}/ticket-types/${typeId}/fields/`, {
                ...newField,
                order: ticketTypes.find(t => t.id === typeId)?.fields.length ?? 0,
            })
            setTicketTypes(ticketTypes.map(t =>
                t.id === typeId ? {...t, fields: [...t.fields, res.data]} : t
            ))
            setNewField({name: '', field_type: '', is_required: true, placeholder: '', help_text: ''})
            setShowNewFieldForm(null)
            notify('success', 'Field added.')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmittingField(false)
        }
    }

    const handleDeleteField = async (typeId: number, fieldId: number) => {
        try {
            await client.delete(`/companies/${slug}/ticket-types/${typeId}/fields/${fieldId}/`)
            setTicketTypes(ticketTypes.map(t =>
                t.id === typeId ? {...t, fields: t.fields.filter(f => f.id !== fieldId)} : t
            ))
            notify('success', 'Field deleted.')
        } catch (err) {
            notify('error', apiError(err))
        }
    }

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
                    <button onClick={() => setNotification(null)}
                            className="ml-4 shrink-0 opacity-60 hover:opacity-100">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            )}

            <div className="mb-6">
                <button onClick={() => navigate(`/company/${slug}`)}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4"/>
                    Back to {companyName}
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Settings — {companyName}</h1>
                    {!showNewTypeForm && (
                        <Button size="sm" onClick={() => setShowNewTypeForm(true)} className="gap-1.5">
                            <Plus className="h-4 w-4"/>
                            New Ticket Type
                        </Button>
                    )}
                </div>
            </div>

            {showNewTypeForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4"><CardTitle className="text-lg">New Ticket Type</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateTicketType} className="flex gap-3">
                            <div className="flex-1">
                                <Label htmlFor="typeName">Name</Label>
                                <Input id="typeName" value={newTypeName}
                                       onChange={(e) => setNewTypeName(e.target.value)}
                                       placeholder="e.g. Vacation Request" className="mt-1.5" autoFocus/>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit" size="sm" disabled={submittingType}>
                                    {submittingType && <Loader2 className="h-4 w-4 animate-spin"/>}
                                    Create
                                </Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowNewTypeForm(false);
                                            setNewTypeName('')
                                        }}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-4">
                {ticketTypes.map((type) => (
                    <Card key={type.id} className="border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
                                    className="flex items-center gap-2 font-medium text-slate-900">
                                    {expandedType === type.id
                                        ? <ChevronUp className="h-4 w-4"/>
                                        : <ChevronDown className="h-4 w-4"/>}
                                    {type.name}
                                    <span className="text-xs text-slate-500">({type.fields.length} fields)</span>
                                </button>
                                <button onClick={() => handleDeleteTicketType(type.id)}
                                        className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>

                            {expandedType === type.id && (
                                <div className="mt-4">
                                    {type.fields.length === 0 && (
                                        <p className="text-sm text-slate-500 mb-3">No fields yet.</p>
                                    )}
                                    <div className="flex flex-col gap-2 mb-4">
                                        {type.fields.map((field) => (
                                            <div key={field.id}
                                                 className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                                                <div>
                                                    <span className="font-medium">{field.name}</span>
                                                    <span className="ml-2 text-slate-500">({field.field_type})</span>
                                                    {field.is_required &&
                                                        <span className="ml-2 text-red-500 text-xs">required</span>}
                                                    {field.placeholder &&
                                                        <span
                                                            className="ml-2 text-slate-400 text-xs">placeholder: "{field.placeholder}"</span>}
                                                </div>
                                                <button onClick={() => handleDeleteField(type.id, field.id)}
                                                        className="text-slate-400 hover:text-red-500 ml-2">
                                                    <Trash2 className="h-3.5 w-3.5"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {showNewFieldForm === type.id ? (
                                        <form onSubmit={(e) => handleAddField(e, type.id)}
                                              className="flex flex-col gap-3 border-t pt-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>Field Name</Label>
                                                    <Input value={newField.name}
                                                           onChange={(e) => setNewField({
                                                               ...newField,
                                                               name: e.target.value
                                                           })}
                                                           placeholder="e.g. Amount" className="mt-1.5" autoFocus/>
                                                </div>
                                                <div>
                                                    <Label>Field Type</Label>
                                                    <Select value={newField.field_type}
                                                            onValueChange={(v) => setNewField({
                                                                ...newField,
                                                                field_type: v
                                                            })}>
                                                        <SelectTrigger className="mt-1.5 w-full">
                                                            <SelectValue placeholder="Select type"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {FIELD_TYPES.map((ft) => (
                                                                <SelectItem key={ft.value}
                                                                            value={ft.value}>{ft.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Placeholder (optional)</Label>
                                                <Input value={newField.placeholder}
                                                       onChange={(e) => setNewField({
                                                           ...newField,
                                                           placeholder: e.target.value
                                                       })}
                                                       placeholder="e.g. Enter amount in CHF" className="mt-1.5"/>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id={`required-${type.id}`}
                                                       checked={newField.is_required}
                                                       onChange={(e) => setNewField({
                                                           ...newField,
                                                           is_required: e.target.checked
                                                       })}/>
                                                <Label htmlFor={`required-${type.id}`}>Required field</Label>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button type="submit" size="sm" disabled={submittingField}>
                                                    {submittingField && <Loader2 className="h-4 w-4 animate-spin"/>}
                                                    Add Field
                                                </Button>
                                                <Button type="button" variant="outline" size="sm"
                                                        onClick={() => {
                                                            setShowNewFieldForm(null)
                                                            setNewField({
                                                                name: '',
                                                                field_type: '',
                                                                is_required: true,
                                                                placeholder: '',
                                                                help_text: ''
                                                            })
                                                        }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <Button variant="outline" size="sm"
                                                onClick={() => setShowNewFieldForm(type.id)}
                                                className="gap-1.5">
                                            <Plus className="h-4 w-4"/>
                                            Add Field
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {ticketTypes.length === 0 && !showNewTypeForm && (
                    <div className="py-12 text-center">
                        <p className="text-slate-500">No ticket types yet. Create one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    )
}