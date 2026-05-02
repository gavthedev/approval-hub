import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import client from "../api/client";

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await client.post("/register/", {email, password});
            setMessage(res.data.message);
            setTimeout(() => navigate("/login"), 2000);
        } catch (_err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Create an account</h1>
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
                <div className="mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="mt-1.5" autoFocus/>
                </div>
                <div className="mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="mt-1.5"/>
                </div>
                <div className="mb-6">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           className="mt-1.5"/>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating account...' : 'Register'}
                </Button>
                <div className="flex justify-center mt-4">
                    <a href="/login" className="hover:underline text-sm text-gray-600">
                        Already have an account? Login
                    </a>
                </div>
            </form>
        </div>
    );
}
