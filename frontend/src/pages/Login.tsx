import {useState} from "react";
import client from "../api/client";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await client.post("/token/", {email, password});
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            window.location.href = "/";
        } catch (err) {
            setError("Wrong email or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <input className="w-full p-2 border rounded mb-4"
                       type="email"
                       placeholder="Email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                />
                <br/>
                <input className="w-full p-2 border rounded mb-4"
                       type="password"
                       placeholder="Password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                />
                <br/>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login
                </button>
            </form>
        </div>
    );
}