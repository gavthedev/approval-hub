import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Building2, ChevronRight, Plus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {cn} from '@/lib/utils'
import client from '@/api/client'

interface Company {
    id: string
    name: string
    slug: string
}

export function Dashboard() {
    const navigate = useNavigate()
    const [companies, setCompanies] = useState<Company[]>([])
    const [showNewForm, setShowNewForm] = useState(false)
    const [newCompanyName, setNewCompanyName] = useState('')
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
            setCompanies(res.data)
        }).catch(console.error)
    }, [])

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCompanyName.trim()) return
        try {
            const res = await client.post('/companies/', {name: newCompanyName.trim()})
            setCompanies([...companies, res.data])
            setNewCompanyName('')
            setShowNewForm(false)
        } catch (err) {
            notify('error', apiError(err))
        }
    }

    const handleCompanyClick = (slug: string) => {
        navigate(`/company/${slug}`)
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
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
                {!showNewForm && (
                    <Button onClick={() => setShowNewForm(true)} size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4"/>
                        <span className="hidden sm:inline">New Company</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                )}
            </div>

            {showNewForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddCompany} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <Label htmlFor="companyName" className="text-slate-700">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                    placeholder="Enter company name"
                                    className="mt-1.5"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 sm:flex-shrink-0">
                                <Button type="submit" size="sm" className="flex-1 sm:flex-initial">Add</Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowNewForm(false);
                                            setNewCompanyName('')
                                        }}
                                        className="flex-1 sm:flex-initial">
                                    <X className="h-4 w-4 sm:mr-1.5"/>
                                    <span className="hidden sm:inline">Cancel</span>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-3">
                {companies.map((company) => (
                    <Card key={company.id}
                          onClick={() => handleCompanyClick(company.slug)}
                          className={cn('cursor-pointer border-slate-200 bg-white shadow-sm transition-all',
                              'hover:border-slate-300 hover:shadow-md')}>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                <Building2 className="h-5 w-5 text-slate-600"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate font-medium text-slate-900">{company.name}</h3>
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400"/>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {companies.length === 0 && (
                <div className="py-12 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300"/>
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No companies yet</h3>
                    <p className="mt-1 text-sm text-slate-500">Get started by adding your first company.</p>
                </div>
            )}
        </div>
    )
}