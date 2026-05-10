import {useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {ArrowLeft, Loader2, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/lib/utils'
import client from '@/api/client'

interface TicketTypeField {
    name: string
    field_type: 'text' | 'number' | 'date' | 'textarea' | 'file'
    is_required: boolean
    placeholder?: string
}

interface TicketType {
    id: number
    name: string
    is_active: boolean
    fields: TicketTypeField[]
}

export default function NewRequest() {
    const {slug, ticketTypeId} = useParams<{ slug: string; ticketTypeId: string }>()
    const navigate = useNavigate()

    const [ticketType, setTicketType] = useState<TicketType | null>(null)
    const [companyName, setCompanyName] = useState('')
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
    const [fileValues, setFileValues] = useState<Record<string, File>>({})
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const notify = (type: 'success' | 'error', message: string) => {
        if (notifTimer.current) clearTimeout(notifTimer.current)
        setNotification({type, message})
        notifTimer.current = setTimeout(() => setNotification(null), 4000)
    }

    useEffect(() => {
        Promise.all([
            client.get(`/companies/${slug}/ticket-types/`),
            client.get('/companies/'),
        ]).then(([ttRes, companiesRes]) => {
            const found = (ttRes.data as TicketType[]).find(tt => tt.id === Number(ticketTypeId))
            if (!found) {
                navigate(`/company/${slug}`)
                return
            }
            setTicketType(found)
            const company = (companiesRes.data as { slug: string; name: string }[]).find(c => c.slug === slug)
            if (company) setCompanyName(company.name)
        }).catch(() => navigate(`/company/${slug}`))
    }, [slug, ticketTypeId, navigate])

    const apiError = (err: unknown): string => {
        const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
        if (data) {
            const first = Object.values(data)[0]
            if (typeof first === 'string') return first
            if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
        }
        return 'Something went wrong. Please try again.'
    }

    const validate = (): Record<string, string> => {
        if (!ticketType) return {}
        const e: Record<string, string> = {}
        for (const field of ticketType.fields) {
            if (!field.is_required) continue
            if (field.field_type === 'file') {
                if (!fileValues[field.name]) e[field.name] = `${field.name} is required`
            } else {
                if (!fieldValues[field.name]?.trim()) e[field.name] = `${field.name} is required`
            }
        }
        return e
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ticketType) return
        const errors = validate()
        if (Object.keys(errors).length) {
            setFieldErrors(errors)
            return
        }
        setFieldErrors({})
        setSubmitting(true)
        try {
            const hasFiles = ticketType.fields.some(f => f.field_type === 'file' && fileValues[f.name])
            if (hasFiles) {
                const form = new FormData()
                form.append('ticket_type', String(ticketTypeId))
                for (const field of ticketType.fields) {
                    if (field.field_type === 'file') {
                        const file = fileValues[field.name]
                        if (file) form.append(`data.${field.name}`, file)
                    } else {
                        form.append(`data.${field.name}`, fieldValues[field.name] ?? '')
                    }
                }
                await client.post(`/companies/${slug}/requests/`, form, {
                    headers: {'Content-Type': 'multipart/form-data'},
                })
            } else {
                const data: Record<string, string> = {}
                for (const field of ticketType.fields) {
                    data[field.name] = fieldValues[field.name] ?? ''
                }
                await client.post(`/companies/${slug}/requests/`, {
                    ticket_type: Number(ticketTypeId),
                    data,
                })
            }
            navigate(`/company/${slug}`, {state: {successMessage: 'Request submitted successfully.'}})
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmitting(false)
        }
    }

    if (!ticketType) return null

    return (
        <div className="mx-auto max-w-2xl">
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
                <button
                    onClick={() => navigate(`/company/${slug}`)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Back to {companyName}
                </button>
                <h1 className="text-2xl font-semibold text-slate-900">{ticketType.name}</h1>
            </div>

            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                        {ticketType.fields.map(field => (
                            <div key={field.name}>
                                <Label htmlFor={`field-${field.name}`}>
                                    {field.name}
                                    {field.is_required && <span className="ml-0.5 text-red-500">*</span>}
                                </Label>
                                {field.field_type === 'textarea' ? (
                                    <Textarea
                                        id={`field-${field.name}`}
                                        value={fieldValues[field.name] ?? ''}
                                        onChange={e => {
                                            setFieldValues(p => ({...p, [field.name]: e.target.value}))
                                            setFieldErrors(p => ({
                                                ...p,
                                                [field.name]: undefined as unknown as string
                                            }))
                                        }}
                                        placeholder={field.placeholder}
                                        className="mt-1.5"
                                        rows={3}
                                    />
                                ) : field.field_type === 'file' ? (
                                    <Input
                                        id={`field-${field.name}`}
                                        type="file"
                                        onChange={e => {
                                            const file = e.target.files?.[0]
                                            if (file) setFileValues(p => ({...p, [field.name]: file}))
                                            setFieldErrors(p => ({
                                                ...p,
                                                [field.name]: undefined as unknown as string
                                            }))
                                        }}
                                        className="mt-1.5"
                                    />
                                ) : (
                                    <Input
                                        id={`field-${field.name}`}
                                        type={field.field_type}
                                        inputMode={field.field_type === 'number' ? 'numeric' : undefined}
                                        value={fieldValues[field.name] ?? ''}
                                        onChange={e => {
                                            setFieldValues(p => ({...p, [field.name]: e.target.value}))
                                            setFieldErrors(p => ({
                                                ...p,
                                                [field.name]: undefined as unknown as string
                                            }))
                                        }}
                                        placeholder={field.placeholder}
                                        className="mt-1.5"
                                    />
                                )}
                                {fieldErrors[field.name] && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors[field.name]}</p>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2 sm:justify-end">
                            <Button type="submit" disabled={submitting} className="flex-1 sm:flex-initial">
                                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin"/>}
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/company/${slug}`)}
                                className="flex-1 sm:flex-initial"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}