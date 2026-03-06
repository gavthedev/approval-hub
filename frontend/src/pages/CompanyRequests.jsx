import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";

export default function CompanyRequests() {
    const { slug } = useParams();
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        client.get(`/companies/${slug}/requests/`).then((res) => {
            setRequests(res.data);
        });
    }, [slug]);

    return (
        <div>
            <h1>Requests</h1>
            {requests.length === 0 && <p>No requests yet.</p>}
            {requests.map((req) => (
                <div key={req.id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
                    <h3>{req.title}</h3>
                    <p>Status: {req.status} | Category: {req.category} | Severity: {req.severity}</p>
                </div>
            ))}
        </div>
    );
}