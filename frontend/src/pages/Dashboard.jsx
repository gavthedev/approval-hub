import { useState, useEffect } from "react";
import client from "../api/client";

export default function Dashboard() {
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        client.get("/companies/").then((res) => {
            setCompanies(res.data);
        });
    }, []);

   return (
    <div className="flex flex-col bg-gray-100 p-8">
        <h1 className="text-2xl flex justify-center font-bold mb-6">My Companies</h1>
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
