import {useState} from "react";
import {useParams} from "react-router-dom";
import client from "../api/client";

export default function InviteClaim() {
    const {token} = useParams();
    const [step, setStep] = useState(1);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleClaim = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await client.post(`/invite/${token}/claim/`, {
                date_of_birth: dateOfBirth,
                password,
            });
            setSuccess(res.data.message);
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Something went wrong.");
            setStep(1);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleClaim} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && (
                    <>
                        <p className="text-green-500 mb-2">{success}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                    </>
                )}

                {!success && step === 1 && (
                    <>
                        <p className="text-gray-600 mb-4 text-sm">Please confirm your date of birth to continue.</p>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            Continue
                        </button>
                    </>
                )}

                {!success && step === 2 && (
                    <>
                        <p className="text-gray-600 mb-4 text-sm">Set your password to complete setup.</p>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            className="w-full p-2 border rounded mb-4"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            Activate Account
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}