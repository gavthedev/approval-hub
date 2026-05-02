import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import client from "../api/client";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await client.post("/token/", {email, password});
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            navigate("/");
        } catch (_err) {
            setError("Wrong email or password");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                <div className="mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="mt-1.5" autoFocus/>
                </div>
                <div className="mb-6">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="mt-1.5"/>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
                <div className="flex justify-center mt-4">
                    <a className="hover:underline text-sm text-gray-600" href="/register">
                        Don't have an account? Register
                    </a>
                </div>
            </form>
        </div>
    );
}
