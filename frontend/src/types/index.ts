export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string
}

export interface Company {
    id: number;
    name: string;
    slug: stringl
    created_by: number;
    created_at: string;
}

export interface Request {
    id: number;
    title: string;
    category: string;
    severity: string;
    location: string;
    description: string;
    status: string;
    company: number;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface Approval {
    id: number;
    decision: "approved" | "rejected";
    comment: string;
    created_at: string;
}
