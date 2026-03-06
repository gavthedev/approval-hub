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
        <div>
            <h1>My Companies</h1>
            {companies.map((company) => (
                <div key={company.id}>
                    <a href={`/company/${company.slug}`}>{company.name}</a>
                </div>
            ))}
        </div>
    );
}