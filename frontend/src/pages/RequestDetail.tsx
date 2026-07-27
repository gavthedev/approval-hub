import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {ArrowLeft, Check, Loader2, Paperclip, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/lib/utils'
import {apiError, getDataEntries, statusConfig} from '@/lib/requestDisplay'
import {useNotification} from '@/hooks/useNotification'
import client from '@/api/client'
import type {Request} from '@/types'

export default function RequestDetail() {
    const {slug, id} = useParams<{slug: string; id: string}>()
    const navigate = useNavigate()

    const [request, setRequest] = useState<Request | null>(null)
    const [companyName, setCompanyName] = useState('')
    const [myRole, setMyRole] = useState('')
    const [comment, setComment] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [actioning, setActioning] = useState<'review' | 'approve' | 'reject' | null>(null)
    const {notification, notify, dismiss} = useNotification()

    const refresh = () =>
        client.get(`/companies/${slug}/requests/${id}/`).then(res => setRequest(res.data))


    useEffect(() => {
        Promise.all([
            client.get(`/companies/${slug}/requests/${id}/`),
            client.get(`/companies/${slug}/my-role/`),
            client.get(`/companies/${slug}/`),
        ]).then(([reqRes, roleRes, companyRes]) => {
            setRequest(reqRes.data)
            setMyRole(roleRes.data.role)
            setCompanyName(companyRes.data.name)
        }).catch(() => navigate(`/company/${slug}`))
    }, [slug, id, navigate])

    const handleAction = async (action: 'review' | 'approve' | 'reject') => {
        setActioning(action)
        try {
            const body = action !== 'review'
                ? {decision: action === 'approve' ? 'approved' : 'rejected', comment: ''}
                : undefined
            await client.post(`/companies/${slug}/requests/${id}/${action}/`, body)
            await refresh()
            const label = action === 'review' ? 'moved to review' : action === 'approve' ? 'approved' : 'rejected'
            notify('success', `Request ${label}.`)
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setActioning(null)
        }
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return
        setSubmittingComment(true)
        try {
            await client.post(`/companies/${slug}/requests/${id}/comments/`, {text: comment})
            await refresh()
            setComment('')
        } catch (err) {
            notify('error', apiError(err))
        } finally {
            setSubmittingComment(false)
        }
    }

    if (!request) return null

    const config = statusConfig[request.status] ?? {label: request.status, className: 'bg-slate-100 text-slate-700 border-slate-200'}
    const isApprover = myRole === 'admin' || myRole === 'approver'
    const dataEntries = getDataEntries(request)

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString('en-CH', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })

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
                    <button onClick={dismiss} className="ml-4 shrink-0 opacity-60 hover:opacity-100">
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
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {request.title || request.ticket_type_name}
                    </h1>
                    <Badge variant="outline" className={cn('text-xs', config.className)}>
                        {config.label}
                    </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                    {request.created_by_name} · {formatDateTime(request.created_at)}
                </p>
            </div>

            {isApprover && (request.status === 'submitted' || request.status === 'in_review') && (
                <div className="mb-4 flex gap-2">
                    {request.status === 'submitted' && (
                        <Button size="sm" variant="outline" onClick={() => handleAction('review')}
                                disabled={!!actioning}
                                className="border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                            {actioning === 'review' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Move to Review'}
                        </Button>
                    )}
                    {request.status === 'in_review' && (
                        <>
                            <Button size="sm" onClick={() => handleAction('approve')} disabled={!!actioning}
                                    className="bg-green-600 hover:bg-green-700">
                                {actioning === 'approve'
                                    ? <Loader2 className="h-4 w-4 animate-spin"/>
                                    : <Check className="h-4 w-4"/>}
                                <span className="ml-1">Approve</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAction('reject')}
                                    disabled={!!actioning}>
                                {actioning === 'reject'
                                    ? <Loader2 className="h-4 w-4 animate-spin"/>
                                    : <X className="h-4 w-4"/>}
                                <span className="ml-1">Reject</span>
                            </Button>
                        </>
                    )}
                </div>
            )}

            <Card className="mb-4 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {dataEntries.length === 0 ? (
                        <p className="text-sm text-slate-500">No field data.</p>
                    ) : (
                        <dl className="flex flex-col gap-4">
                            {dataEntries.map(([key, value]) => (
                                <div key={key}>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        {key.replace(/_/g, ' ')}
                                    </dt>
                                    <dd className="mt-0.5 text-sm text-slate-900 whitespace-pre-wrap">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </CardContent>
            </Card>

            {request.status_history.length > 0 && (
                <Card className="mb-4 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="flex flex-col gap-3">
                            {request.status_history.map((h) => (
                                <li key={h.id} className="flex items-start gap-3 text-sm">
                                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300"/>
                                    <div>
                                        <span className="font-medium text-slate-900 capitalize">
                                            {h.from_status
                                                ? `${h.from_status.replace(/_/g, ' ')} → `
                                                : ''}
                                            {h.to_status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="ml-2 text-slate-500">by {h.changed_by_email}</span>
                                        <div className="text-xs text-slate-400">{formatDateTime(h.created_at)}</div>
                                        {h.comment && (
                                            <p className="mt-0.5 text-slate-600">{h.comment}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            )}

            {request.attachments.length > 0 && (
                <Card className="mb-4 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="flex flex-col gap-2">
                            {request.attachments.map((att) => (
                                <li key={att.id}>
                                    <a
                                        href={att.file_url}
                                        download={att.filename}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        <Paperclip className="h-4 w-4 shrink-0 text-slate-400"/>
                                        <span className="flex-1 truncate text-slate-900">{att.filename}</span>
                                        <span className="shrink-0 text-xs text-slate-400">{formatBytes(att.file_size)}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Comments</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {request.comments.length === 0 && (
                        <p className="text-sm text-slate-500">No comments yet.</p>
                    )}
                    {request.comments.map((c) => (
                        <div key={c.id} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-medium text-slate-700">{c.author_email}</span>
                                <span aria-hidden>·</span>
                                <span>{formatDateTime(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-900 whitespace-pre-wrap">{c.text}</p>
                        </div>
                    ))}
                    <form onSubmit={handleAddComment} className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                        <Textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={2}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" size="sm" disabled={submittingComment || !comment.trim()}>
                                {submittingComment && <Loader2 className="mr-1 h-4 w-4 animate-spin"/>}
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
