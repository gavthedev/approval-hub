import {useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {ArrowLeft, Check, Loader2, Plus, UserPlus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import client from '@/api/client'
import type {Request, RequestStatus} from '@/types'

const categories = ['freezer', 'pos', 'oven', 'uniform', 'laptop', 'other']
const roles = ['member', 'approver', 'admin']

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
    submitted: {label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-200'},
    in_review: {label: 'In Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-200'},
    approved: {label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200'},
    rejected: {label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200'},
}

export default function CompanyRequests() {
    const {slug} = useParams<{ slug: string }>()
    const navigate = useNavigate()

    const [requests, setRequests] = useState<Request[]>([])
    const [companyName, setCompanyName] = useState('')
    const [myRole, setMyRole] = useState('')
    const [showNewRequestForm, setShowNewRequestForm] = useState(false)
    const [showInviteForm, setShowInviteForm] = useState(false)
    const [newRequest, setNewRequest] = useState({title: '', category: '', description: ''})
    const [inviteForm, setInviteForm] = useState({email: '', firstName: '', lastName: '', role: '', dateOfBirth: ''})
    const [requestErrors, setRequestErrors] = useState<{ title?: string; category?: string }>({})
    const [inviteErrors, setInviteErrors] = useState<{
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        dateOfBirth?: string
    }>({})
    const [submittingRequest, setSubmittingRequest] = useState(false)
    const [submittingInvite, setSubmittingInvite] = useState(false)
    const [actioningId, setActioningId] = useState<number | null>(null)
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const notify = (type: 'success' | 'error', message: string) => {
        if (notifTimer.current) clearTimeout(notifTimer.current)
        setNotification({type, message})
        notifTimer.current = setTimeout(() => setNotification(null), 4000)
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const validateRequest = () => {
        const e: typeof requestErrors = {}
        if (!newRequest.title.trim()) e.title = 'Title is required'
        if (!newRequest.category) e.category = 'Category is required'
        return e
    }

    const validateInvite = () => {
        const e: typeof inviteErrors = {}
        if (!inviteForm.email) e.email = 'Email is required'
        else if (!EMAIL_RE.test(inviteForm.email)) e.email = 'Enter a valid email address'
        if (!inviteForm.firstName.trim()) e.firstName = 'First name is required'
        if (!inviteForm.lastName.trim()) e.lastName = 'Last name is required'
        if (!inviteForm.role) e.role = 'Role is required'
        if (!inviteForm.dateOfBirth) e.dateOfBirth = 'Date of birth is required'
        else if (new Date(inviteForm.dateOfBirth) >= new Date()) e.dateOfBirth = 'Date of birth must be in the past'
        return e
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
        client.get(`/companies/${slug}/requests/`).then((res) => {
            setRequests(res.data)
        }).catch(console.error)

        client.get(`/companies/${slug}/my-role/`).then((res) => {
            setMyRole(res.data.role)
        }).catch(console.error)

        client.get('/companies/').then((res) => {
            const company = (res.data as { slug: string; name: string }[]).find((c) => c.slug === slug)
            if (company) setCompanyName(company.name)
        }).catch(console.error)
    }, [slug])

    const handleAddRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        const v = validateRequest()
        if (Object.keys(v).length) {
            setRequestErrors(v);
            return
        }
        setRequestErrors({})
        setSubmittingRequest(true)
        try {
            const res = await client.post(`/companies/${slug}/requests/`, newRequest)
            setRequests([res.data, ...requests])
            setNewRequest({title: '', category: '', description: ''})
            setShowNewRequestForm(false)
            notify('success', 'Request submitted successfully.')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmittingRequest(false)
        }
    }

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault()
        const v = validateInvite()
        if (Object.keys(v).length) {
            setInviteErrors(v);
            return
        }
        setInviteErrors({})
        setSubmittingInvite(true)
        try {
            await client.post(`/companies/${slug}/invite/`, {
                email: inviteForm.email,
                first_name: inviteForm.firstName,
                last_name: inviteForm.lastName,
                role: inviteForm.role,
                date_of_birth: inviteForm.dateOfBirth,
            })
            setInviteForm({email: '', firstName: '', lastName: '', role: '', dateOfBirth: ''})
            setShowInviteForm(false)
            notify('success', 'Invitation sent successfully.')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmittingInvite(false)
        }
    }

    const updateRequestStatus = (requestId: number, status: RequestStatus) =>
        setRequests(prev => prev.map(r => r.id === requestId ? {...r, status} : r))

    const handleReview = async (requestId: number) => {
        setActioningId(requestId)
        try {
            await client.post(`/companies/${slug}/requests/${requestId}/review/`)
            updateRequestStatus(requestId, 'in_review')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setActioningId(null)
        }
    }

    const handleApprove = async (requestId: number) => {
        setActioningId(requestId)
        try {
            await client.post(`/companies/${slug}/requests/${requestId}/approve/`, {decision: 'approved', comment: ''})
            updateRequestStatus(requestId, 'approved')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setActioningId(null)
        }
    }

    const handleReject = async (requestId: number) => {
        setActioningId(requestId)
        try {
            await client.post(`/companies/${slug}/requests/${requestId}/reject/`, {decision: 'rejected', comment: ''})
            updateRequestStatus(requestId, 'rejected')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setActioningId(null)
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
                <button onClick={() => navigate('/')}
                        className="mb-4 flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4"/>
                    Back to Companies
                </button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">{companyName}</h1>
                    <div className="flex gap-2">
                        {!showNewRequestForm && !showInviteForm && (
                            <>
                                <Button variant="secondary" size="sm"
                                        onClick={() => setShowNewRequestForm(true)}
                                        className="gap-1.5 flex-1 sm:flex-initial">
                                    <Plus className="h-4 w-4"/>New Request
                                </Button>
                                {myRole === 'admin' && (
                                    <Button size="sm" onClick={() => setShowInviteForm(true)}
                                            className="gap-1.5 bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial">
                                        <UserPlus className="h-4 w-4"/>
                                        <span className="hidden sm:inline">Invite Member</span>
                                        <span className="sm:hidden">Invite</span>
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showNewRequestForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4"><CardTitle className="text-lg">New Request</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddRequest} noValidate className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="requestTitle">Title</Label>
                                <Input id="requestTitle" value={newRequest.title}
                                       onChange={(e) => {
                                           setNewRequest({...newRequest, title: e.target.value});
                                           setRequestErrors(p => ({...p, title: undefined}))
                                       }}
                                       placeholder="Enter request title" className="mt-1.5" autoFocus/>
                                {requestErrors.title &&
                                    <p className="mt-1 text-xs text-red-600">{requestErrors.title}</p>}
                            </div>
                            <div>
                                <Label htmlFor="requestCategory">Category</Label>
                                <Select value={newRequest.category}
                                        onValueChange={(value) => {
                                            setNewRequest({...newRequest, category: value});
                                            setRequestErrors(p => ({...p, category: undefined}))
                                        }}>
                                    <SelectTrigger className="mt-1.5 w-full">
                                        <SelectValue placeholder="Select category"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {requestErrors.category &&
                                    <p className="mt-1 text-xs text-red-600">{requestErrors.category}</p>}
                            </div>
                            <div>
                                <Label htmlFor="requestDescription">Description</Label>
                                <Textarea id="requestDescription" value={newRequest.description}
                                          onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                                          placeholder="Describe your request" className="mt-1.5" rows={3}/>
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                                <Button type="submit" size="sm" disabled={submittingRequest}
                                        className="flex-1 sm:flex-initial">
                                    {submittingRequest && <Loader2 className="h-4 w-4 animate-spin"/>}
                                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                                </Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowNewRequestForm(false)
                                            setNewRequest({title: '', category: '', description: ''})
                                            setRequestErrors({})
                                        }}
                                        className="flex-1 sm:flex-initial">Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {showInviteForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4"><CardTitle className="text-lg">Invite Member</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleInviteMember} noValidate className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="memberEmail">Email</Label>
                                <Input id="memberEmail" type="email" value={inviteForm.email}
                                       onChange={(e) => {
                                           setInviteForm({...inviteForm, email: e.target.value});
                                           setInviteErrors(p => ({...p, email: undefined}))
                                       }}
                                       placeholder="email@example.com" className="mt-1.5" autoFocus/>
                                {inviteErrors.email &&
                                    <p className="mt-1 text-xs text-red-600">{inviteErrors.email}</p>}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" value={inviteForm.firstName}
                                           onChange={(e) => {
                                               setInviteForm({...inviteForm, firstName: e.target.value});
                                               setInviteErrors(p => ({...p, firstName: undefined}))
                                           }}
                                           placeholder="Alex" className="mt-1.5"/>
                                    {inviteErrors.firstName &&
                                        <p className="mt-1 text-xs text-red-600">{inviteErrors.firstName}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" value={inviteForm.lastName}
                                           onChange={(e) => {
                                               setInviteForm({...inviteForm, lastName: e.target.value});
                                               setInviteErrors(p => ({...p, lastName: undefined}))
                                           }}
                                           placeholder="Pereira" className="mt-1.5"/>
                                    {inviteErrors.lastName &&
                                        <p className="mt-1 text-xs text-red-600">{inviteErrors.lastName}</p>}
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="memberRole">Role</Label>
                                    <Select value={inviteForm.role}
                                            onValueChange={(value) => {
                                                setInviteForm({...inviteForm, role: value});
                                                setInviteErrors(p => ({...p, role: undefined}))
                                            }}>
                                        <SelectTrigger className="mt-1.5 w-full">
                                            <SelectValue placeholder="Select role"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {inviteErrors.role &&
                                        <p className="mt-1 text-xs text-red-600">{inviteErrors.role}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input id="dateOfBirth" type="date" value={inviteForm.dateOfBirth}
                                           onChange={(e) => {
                                               setInviteForm({...inviteForm, dateOfBirth: e.target.value});
                                               setInviteErrors(p => ({...p, dateOfBirth: undefined}))
                                           }}
                                           className="mt-1.5"/>
                                    {inviteErrors.dateOfBirth &&
                                        <p className="mt-1 text-xs text-red-600">{inviteErrors.dateOfBirth}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                                <Button type="submit" size="sm" disabled={submittingInvite}
                                        className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700">
                                    {submittingInvite && <Loader2 className="h-4 w-4 animate-spin"/>}
                                    {submittingInvite ? 'Sending...' : 'Send Invitation'}
                                </Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowInviteForm(false)
                                            setInviteForm({
                                                email: '',
                                                firstName: '',
                                                lastName: '',
                                                role: '',
                                                dateOfBirth: ''
                                            })
                                            setInviteErrors({})
                                        }}
                                        className="flex-1 sm:flex-initial">Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-3">
                {requests.map((request) => (
                    <Card key={request.id} className="border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-slate-900">{request.title}</h3>
                                        <Badge variant="outline"
                                               className={cn('text-xs', statusConfig[request.status].className)}>
                                            {statusConfig[request.status].label}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{request.category}</p>
                                    {request.description && (
                                        <p className="mt-2 text-sm text-slate-600">{request.description}</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    {request.status === 'submitted' && (myRole === 'admin' || myRole === 'approver') && (
                                        <Button size="sm" variant="outline" onClick={() => handleReview(request.id)}
                                                disabled={actioningId === request.id}
                                                className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                                            {actioningId === request.id
                                                ? <Loader2 className="h-4 w-4 animate-spin"/>
                                                : 'Review'}
                                        </Button>
                                    )}
                                    {request.status === 'in_review' && (myRole === 'admin' || myRole === 'approver') && (
                                        <>
                                            <Button size="sm" onClick={() => handleApprove(request.id)}
                                                    disabled={actioningId === request.id}
                                                    className="bg-green-600 hover:bg-green-700">
                                                {actioningId === request.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin"/>
                                                    : <Check className="h-4 w-4"/>}
                                                <span className="ml-1">Approve</span>
                                            </Button>
                                            <Button size="sm" variant="destructive"
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={actioningId === request.id}>
                                                {actioningId === request.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin"/>
                                                    : <X className="h-4 w-4"/>}
                                                <span className="ml-1">Reject</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {requests.length === 0 && !showNewRequestForm && (
                <div className="py-12 text-center">
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No requests yet</h3>
                    <p className="mt-1 text-sm text-slate-500">Create your first request to get started.</p>
                </div>
            )}
        </div>
    )
}