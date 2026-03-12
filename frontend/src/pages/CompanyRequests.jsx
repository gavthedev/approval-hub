import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import client from "../api/client";
import Button from "../components/Buttons.jsx"

export default function CompanyRequests() {
    const {slug} = useParams();
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("other");
    // const [severity, setSeverity] = useState("medium");
    const [description, setDescription] = useState("");

    useEffect(() => {
        client.get(`/companies/${slug}/requests/`).then((res) => {
            setRequests(res.data);
        });
    }, [slug]);

    const handleCreate = async (e) => {
        e.preventDefault();
        const res = await client.post(`/companies/${slug}/requests/`, {
            title,
            category,
            // severity,
            description,
        });
        setRequests([res.data, ...requests]);
        setShowForm(false);
        setTitle("");
        setDescription("");
    };

    const handleApprove = async (requestId) => {
        await client.post(`/companies/${slug}/requests/${requestId}/approve/`, {
            decision: "approved",
            comment: "",
        });
        const res = await client.get(`/companies/${slug}/requests/`);
        setRequests(res.data)
    };

    const handleReject = async (requestId) => {
        await client.post(`/companies/${slug}/requests/${requestId}/reject/`, {
            decision: "rejected",
            comment: "",
        });
        const res = await client.get(`/companies/${slug}/requests/`)
        setRequests(res.data)
    }

    const handleReview = async (requestId) => {
        await client.post(`/companies/${slug}/requests/${requestId}/review/`);
        const res = await client.get(`/companies/${slug}/requests/`)
        setRequests(res.data)
    }

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-2xl m-2">Requests</h1>
            <button onClick={() => setShowForm(!showForm)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mb-4">
                {showForm ? "Cancel" : "New Request"}
            </button>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow mb-6 w-full max-w-2xl">
                    <input className="w-full p-2 border rounded mb-4"
                           placeholder="Title"
                           value={title}
                           onChange={(e) => setTitle(e.target.value)}
                    />
                    <select className="w-full p-2 border rounded mb-4" value={category}
                            onChange={(e) => setCategory(e.target.value)}>
                        <option value="freezer">Freezer</option>
                        <option value="pos">POS</option>
                        <option value="oven">Oven</option>
                        <option value="uniform">Uniform</option>
                        <option value="laptop">Laptop</option>
                        <option value="other">Other</option>
                    </select>
                    {/*<br />*/}
                    {/*<select value={severity} onChange={(e) => setSeverity(e.target.value)}>*/}
                    {/*    <option value="low">Low</option>*/}
                    {/*    <option value="medium">Medium</option>*/}
                    {/*    <option value="high">High</option>*/}
                    {/*</select>*/}
                    <textarea className="w-full p-2 border rounded mb-4"
                              placeholder="Description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit
                    </button>
                </form>
            )}

            {requests.length === 0 && <p>No requests yet.</p>}
            {requests.map((req) => (
                <div key={req.id} className="bg-white p-4 rounded shadow mb-4 w-full max-w-2xl">
                    <h3 className="text-lg font-semibold">{req.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                        Status: {req.status} | Category: {req.category}
                    </p>
                    <p className="text-gray-700 mb-3">{req.description}</p>

                    {req.status === "submitted" &&
                        <Button variant={'warning'} onClick={() => handleReview(req.id)}>Review</Button>}

                    {req.status === "in_review" && (
                        <>
                            <Button variant={'primary'} onClick={() => handleApprove(req.id)}>Accept</Button>
                            <Button variant={'danger'} onClick={() => handleReject(req.id)}>Reject</Button>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}