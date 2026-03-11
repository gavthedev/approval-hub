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
        <div className="min-h-screen min-w-screen flex flex-col items-center justify-center">
            <h1 className="m-4 text ">My Companies</h1>
            {companies.map((company) => (
                <div key={company.id} className="border rounded m-1">
                    <a href={`/company/${company.slug}`}>{company.name}</a>
                </div>
            ))}
        </div>
    );
}