import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import client from "../api/client";

export default function Verify() {
    const {token} = useParams();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        client.get(`/verify/${token}/`)
            .then((res) => {
                setMessage(res.data.message);
                setTimeout(() => {
                    window.location.href = "/login";
                }, 3000);
            })
            .catch((err) => {
                setError(err.response?.data?.error || "Something went wrong.");
            });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96 text-center">
                <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
                {message && (
                    <>
                        <p className="text-green-500 mb-4">{message}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                    </>
                )}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {!message && !error && <p className="text-gray-500">Verifying...</p>}
            </div>
        </div>
    );
}