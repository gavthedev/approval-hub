import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import client from "../api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
    const [serverError, setServerError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e: typeof errors = {}
        if (!email) e.email = 'Email is required'
        else if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address'
        if (!password) e.password = 'Password is required'
        else if (password.length < 8) e.password = 'Password must be at least 8 characters'
        if (!confirmPassword) e.confirmPassword = 'Please confirm your password'
        else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
        return e
    }

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const v = validate()
        if (Object.keys(v).length) {
            setErrors(v);
            return
        }
        setLoading(true);
        setServerError('');
        try {
            const res = await client.post("/register/", {email, password});
            setMessage(res.data.message);
            setTimeout(() => navigate("/login"), 2000);
        } catch (_err) {
            setServerError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Create an account</h1>
                {serverError && <p className="text-red-500 mb-4 text-sm">{serverError}</p>}
                {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}
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
                <div className="mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password}
                           onChange={(e) => {
                               setPassword(e.target.value);
                               setErrors(p => ({...p, password: undefined}))
                           }}
                           className="mt-1.5"/>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>
                <div className="mb-6">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword}
                           onChange={(e) => {
                               setConfirmPassword(e.target.value);
                               setErrors(p => ({...p, confirmPassword: undefined}))
                           }}
                           className="mt-1.5"/>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
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
