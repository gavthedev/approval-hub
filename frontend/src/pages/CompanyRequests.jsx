import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";

export default function CompanyRequests() {
    const { slug } = useParams();
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

    return (
        <div>
            <h1>Requests</h1>
            <button onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "New Request"}
            </button>

            {showForm && (
                <form onSubmit={handleCreate} style={{ margin: "10px 0" }}>
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <br />
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
                    <br />
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <br />
                    <button type="submit">Submit</button>
                </form>
            )}

            {requests.length === 0 && <p>No requests yet.</p>}
            {requests.map((req) => (
                <div key={req.id} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0" }}>
                    <h3>{req.title}</h3>
                    <p>Status: {req.status} | Category: {req.category} | Description: {req.description} </p>
                </div>
            ))}
        </div>
    );
}