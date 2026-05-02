import {useState} from "react";
import {useNavigate} from "react-router-dom";
import client from "../api/client";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();
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
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {message && <p className="text-green-500 mb-4">{message}</p>}
                <input className="w-full p-2 border rounded mb-4"
                       type="email"
                       placeholder="Email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                />
                <input className="w-full p-2 border rounded mb-4"
                       type="password"
                       placeholder="Password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                />
                <input className="w-full p-2 border rounded mb-4"
                       type="password"
                       placeholder="Confirm Password"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="submit" disabled={loading}
                        className={`w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {loading ? 'Creating account...' : 'Register'}
                </button>
                <div className="flex justify-center mt-4">
                    <a href="/login" className="hover:underline text-sm text-gray-600">
                        Already have an account? Login
                    </a>
                </div>
            </form>
        </div>
    );
}