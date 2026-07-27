export interface Company {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    my_role: string | null;
}

export interface Request {
    id: number;
    ticket_type: number | null;
    ticket_type_name: string | null;
    title: string;
    status: RequestStatus;
    schema_snapshot: Record<string, unknown>[];
    data: Record<string, unknown>;
    created_by_email: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    comments: RequestComment[];
    status_history: RequestStatusHistory[];
    attachments: RequestAttachment[];
}

export interface RequestComment {
    id: number;
    author_email: string;
    text: string;
    created_at: string;
    updated_at: string;
}

export interface RequestStatusHistory {
    id: number;
    from_status: string | null;
    to_status: string;
    changed_by_email: string;
    comment: string;
    created_at: string;
}

export interface RequestAttachment {
    id: number;
    filename: string;
    file_size: number;
    file_url: string;
    created_at: string;
}

export type RequestStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled'

export type HomeItemType = 'shortcut' | 'pinned_request' | 'stat'

export type StatKind = 'my_open_requests' | 'pending_my_approval'

export interface PinnedRequestSummary {
    id: number;
    title: string;
    status: RequestStatus;
    ticket_type_name: string | null;
    company_slug: string;
    company_name: string;
}

export interface HomeItem {
    id: number;
    item_type: HomeItemType;
    order: number;
    label: string;
    url: string;
    company: number | null;
    company_slug: string | null;
    company_name: string | null;
    request_detail: PinnedRequestSummary | null;
    stat_kind: StatKind | '';
    value: number | null;
    created_at: string;
}