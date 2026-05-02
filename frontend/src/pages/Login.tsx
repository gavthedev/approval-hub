import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import client from "../api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e: typeof errors = {}
        if (!email) e.email = 'Email is required'
        else if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address'
        if (!password) e.password = 'Password is required'
        return e
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const v = validate()
        if (Object.keys(v).length) {
            setErrors(v);
            return
        }
        setLoading(true);
        setServerError('');
        try {
            const res = await client.post("/token/", {email, password});
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            navigate("/");
        } catch (_err) {
            setServerError("Wrong email or password");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                {serverError && <p className="text-red-500 mb-4 text-sm">{serverError}</p>}
                <div className="mb-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email}
                           onChange={(e) => {
                               setEmail(e.target.value);
                               setErrors(p => ({...p, email: undefined}))
                           }}
                           className="mt-1.5" autoFocus/>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div className="mb-6">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password}
                           onChange={(e) => {
                               setPassword(e.target.value);
                               setErrors(p => ({...p, password: undefined}))
                           }}
                           className="mt-1.5"/>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
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
