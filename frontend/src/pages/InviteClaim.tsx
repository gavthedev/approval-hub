import {useState} from 'react'
import {useParams} from 'react-router-dom'
import client from '../api/client'

export default function InviteClaim() {
    const {token} = useParams()
    const [password, setPassword] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await client.post(`/invite/${token}/claim/`, {
                password,
                date_of_birth: dateOfBirth,
            })
            setMessage(res.data.message)
            setTimeout(() => {
                window.location.href = '/login'
            }, 2000)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            setError(msg || 'Something went wrong. Please try again.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>
                <p className="text-gray-500 text-sm mb-6">Set your password to activate your account.</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {message && (
                    <>
                        <p className="text-green-500 mb-2">{message}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                    </>
                )}
                {!message && (
                    <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            className="w-full p-2 border rounded mb-6"
                            type="password"
                            placeholder="Choose a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit"
                                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            Activate Account
                        </button>
                    </>
                )}
            </form>
        </div>
    )
}
