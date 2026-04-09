import {useEffect, useState} from "react";
import client from "../api/client";
import {Company} from "../types"

export default function Dashboard() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        client.get("/companies/").then((res) => {
            setCompanies(res.data);
        }).catch(console.error);
    }, []);

    const handleCreateCompany = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const res = await client.post("/companies/", {name});
        setCompanies([...companies, res.data]);
        setShowForm(false);
        setName("");
    };

    return (
        <div className="flex flex-col bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Companies</h1>
                <button onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    {showForm ? "Cancel" : "New Company"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreateCompany} className="bg-white p-6 rounded shadow mb-6 max-w-md">
                    <input className="w-full p-2 border rounded mb-4"
                           placeholder="Company name"
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Create
                    </button>
                </form>
            )}

            {companies.length === 0 && !showForm && (
                <p className="text-gray-500">No companies yet. Create one!</p>
            )}

            <div className="flex flex-col gap-4">
                {companies.map((company) => (
                    <a key={company.id} href={`/company/${company.slug}`}
                       className="bg-white p-4 flex justify-center rounded shadow hover:shadow-md transition">
                        <h2 className="text-lg font-semibold">{company.name}</h2>
                    </a>
                ))}
            </div>
        </div>
    );
}