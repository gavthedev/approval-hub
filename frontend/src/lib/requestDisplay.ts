import type {Request, RequestStatus} from '@/types'

export const statusConfig: Record<RequestStatus, {label: string; className: string}> = {
    draft: {label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200'},
    submitted: {label: 'Submitted', className: 'bg-blue-100 text-blue-800 border-blue-200'},
    in_review: {label: 'In Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-200'},
    approved: {label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200'},
    rejected: {label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200'},
    cancelled: {label: 'Cancelled', className: 'bg-slate-100 text-slate-500 border-slate-200'},
}

export function apiError(err: unknown): string {
    const data = (err as {response?: {data?: Record<string, unknown>}})?.response?.data
    if (data) {
        const first = Object.values(data)[0]
        if (typeof first === 'string') return first
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    }
    return 'Something went wrong. Please try again.'
}

export function getDataEntries(request: Pick<Request, 'schema_snapshot' | 'data'>): [string, string][] {
    const fileFieldNames = new Set(
        (request.schema_snapshot as {name: string; field_type: string}[])
            .filter(f => f.field_type === 'file')
            .map(f => f.name)
    )
    return Object.entries(request.data).filter(
        ([key, value]) => !fileFieldNames.has(key) && typeof value === 'string' && value !== ''
    ) as [string, string][]
}
