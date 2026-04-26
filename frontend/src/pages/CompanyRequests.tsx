import {useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {ArrowLeft, Check, Plus, UserPlus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {cn} from '@/lib/utils'

type RequestStatus = 'submitted' | 'in_review' | 'approved' | 'rejected'

interface Request {
    id: string
    title: string
    status: RequestStatus
    category: string
    description: string
}

interface Company {
    id: string
    name: string
    isAdmin: boolean
    requests: Request[]
}

const companiesData: Record<string, Company> = {
    '1': {
        id: '1',
        name: 'Acme Corporation',
        isAdmin: true,
        requests: [
            {
                id: '1',
                title: 'Budget Approval Q2',
                status: 'submitted',
                category: 'Finance',
                description: 'Requesting approval for Q2 marketing budget allocation.'
            },
            {
                id: '2',
                title: 'Vendor Contract Review',
                status: 'in_review',
                category: 'Legal',
                description: 'Review and approval of new vendor service agreement.'
            },
            {
                id: '3',
                title: 'Office Expansion',
                status: 'approved',
                category: 'Operations',
                description: 'Approved expansion of office space in building B.'
            },
            {
                id: '4',
                title: 'Software License',
                status: 'rejected',
                category: 'IT',
                description: 'Request for additional software licenses was not approved.'
            },
        ],
    },
    '2': {
        id: '2',
        name: 'TechStart Inc',
        isAdmin: false,
        requests: [
            {
                id: '5',
                title: 'Equipment Purchase',
                status: 'submitted',
                category: 'IT',
                description: 'Request for new development laptops.'
            },
        ],
    },
    '3': {
        id: '3',
        name: 'Global Solutions',
        isAdmin: true,
        requests: [],
    },
}

const categories = ['Finance', 'Legal', 'Operations', 'IT', 'HR', 'Marketing']
const roles = ['Admin', 'Approver', 'Submitter', 'Viewer']

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
    submitted: {label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-200'},
    in_review: {label: 'In Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-200'},
    approved: {label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200'},
    rejected: {label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200'},
}

export function CompanyRequests() {
    const {companyId} = useParams<{ companyId: string }>()
    const navigate = useNavigate()

    const [company, setCompany] = useState<Company | null>(
        companyId ? companiesData[companyId] || null : null
    )
    const [showNewRequestForm, setShowNewRequestForm] = useState(false)
    const [showInviteForm, setShowInviteForm] = useState(false)

    // New Request Form State
    const [newRequest, setNewRequest] = useState({
        title: '',
        category: '',
        description: '',
    })

    // Invite Member Form State
    const [inviteForm, setInviteForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        dateOfBirth: '',
    })

    if (!company) {
        return (
            <div className="mx-auto max-w-3xl py-12 text-center">
                <h2 className="text-lg font-medium text-slate-900">Company not found</h2>
                <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    const handleAddRequest = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newRequest.title.trim() || !newRequest.category) return

        const request: Request = {
            id: Date.now().toString(),
            title: newRequest.title.trim(),
            status: 'submitted',
            category: newRequest.category,
            description: newRequest.description.trim(),
        }

        setCompany({
            ...company,
            requests: [...company.requests, request],
        })
        setNewRequest({title: '', category: '', description: ''})
        setShowNewRequestForm(false)
    }

    const handleInviteMember = (e: React.FormEvent) => {
        e.preventDefault()
        // In production, this would send an invitation
        console.log('Inviting member:', inviteForm)
        setInviteForm({email: '', firstName: '', lastName: '', role: '', dateOfBirth: ''})
        setShowInviteForm(false)
    }

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        setCompany({
            ...company,
            requests: company.requests.map((req) =>
                req.id === requestId ? {...req, status: newStatus} : req
            ),
        })
    }

    return (
        <div className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="mb-4 flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Back to Companies
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>

                    <div className="flex gap-2">
                        {!showNewRequestForm && !showInviteForm && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowNewRequestForm(true)}
                                    className="gap-1.5 flex-1 sm:flex-initial"
                                >
                                    <Plus className="h-4 w-4"/>
                                    New Request
                                </Button>
                                {company.isAdmin && (
                                    <Button
                                        size="sm"
                                        onClick={() => setShowInviteForm(true)}
                                        className="gap-1.5 bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                                    >
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

            {/* New Request Form */}
            {showNewRequestForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">New Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddRequest} className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="requestTitle" className="text-slate-700">Title</Label>
                                <Input
                                    id="requestTitle"
                                    value={newRequest.title}
                                    onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                                    placeholder="Enter request title"
                                    className="mt-1.5"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="requestCategory" className="text-slate-700">Category</Label>
                                <Select
                                    value={newRequest.category}
                                    onValueChange={(value) => setNewRequest({...newRequest, category: value})}
                                >
                                    <SelectTrigger id="requestCategory" className="mt-1.5 w-full">
                                        <SelectValue placeholder="Select category"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="requestDescription" className="text-slate-700">Description</Label>
                                <Textarea
                                    id="requestDescription"
                                    value={newRequest.description}
                                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                                    placeholder="Describe your request"
                                    className="mt-1.5"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                                <Button type="submit" size="sm" className="flex-1 sm:flex-initial">
                                    Submit Request
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowNewRequestForm(false)
                                        setNewRequest({title: '', category: '', description: ''})
                                    }}
                                    className="flex-1 sm:flex-initial"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Invite Member Form */}
            {showInviteForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Invite Member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInviteMember} className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="memberEmail" className="text-slate-700">Email</Label>
                                <Input
                                    id="memberEmail"
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                    placeholder="email@example.com"
                                    className="mt-1.5"
                                    autoFocus
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={inviteForm.firstName}
                                        onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
                                        placeholder="John"
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={inviteForm.lastName}
                                        onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
                                        placeholder="Doe"
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="memberRole" className="text-slate-700">Role</Label>
                                    <Select
                                        value={inviteForm.role}
                                        onValueChange={(value) => setInviteForm({...inviteForm, role: value})}
                                    >
                                        <SelectTrigger id="memberRole" className="mt-1.5 w-full">
                                            <SelectValue placeholder="Select role"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="dateOfBirth" className="text-slate-700">Date of Birth</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={inviteForm.dateOfBirth}
                                        onChange={(e) => setInviteForm({...inviteForm, dateOfBirth: e.target.value})}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                                <Button type="submit" size="sm"
                                        className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700">
                                    Send Invitation
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowInviteForm(false)
                                        setInviteForm({
                                            email: '',
                                            firstName: '',
                                            lastName: '',
                                            role: '',
                                            dateOfBirth: ''
                                        })
                                    }}
                                    className="flex-1 sm:flex-initial"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Request Cards */}
            <div className="flex flex-col gap-3">
                {company.requests.map((request) => (
                    <Card key={request.id} className="border-slate-200 bg-white shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-slate-900">{request.title}</h3>
                                        <Badge
                                            variant="outline"
                                            className={cn('text-xs', statusConfig[request.status].className)}
                                        >
                                            {statusConfig[request.status].label}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{request.category}</p>
                                    {request.description && (
                                        <p className="mt-2 text-sm text-slate-600">{request.description}</p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-shrink-0 gap-2">
                                    {request.status === 'submitted' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleStatusChange(request.id, 'in_review')}
                                            className="gap-1.5 border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                                        >
                                            Review
                                        </Button>
                                    )}
                                    {request.status === 'in_review' && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleStatusChange(request.id, 'approved')}
                                                className="gap-1.5 bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="h-4 w-4"/>
                                                <span className="hidden sm:inline">Approve</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleStatusChange(request.id, 'rejected')}
                                                className="gap-1.5"
                                            >
                                                <X className="h-4 w-4"/>
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {company.requests.length === 0 && !showNewRequestForm && (
                <div className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Plus className="h-6 w-6 text-slate-400"/>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No requests yet</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Create your first request to get started.
                    </p>
                </div>
            )}
        </div>
    )
}
