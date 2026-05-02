import {useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import client from '../api/client'

export default function InviteClaim() {
    const navigate = useNavigate()
    const {token} = useParams()
    const [password, setPassword] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await client.post(`/invite/${token}/claim/`, {
                password,
                date_of_birth: dateOfBirth,
            })
            setMessage(res.data.message)
            setTimeout(() => navigate('/login'), 2000)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            setError(msg || 'Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>
                <p className="text-gray-500 text-sm mb-6">Set your password to activate your account.</p>
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                {message && (
                    <>
                        <p className="text-green-600 mb-2 text-sm">{message}</p>
                        <p className="text-gray-500 text-sm">Redirecting to login...</p>
                    </>
                )}
                {!message && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input id="dateOfBirth" type="date" value={dateOfBirth}
                                   onChange={(e) => setDateOfBirth(e.target.value)}
                                   className="mt-1.5" required/>
                        </div>
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" placeholder="Choose a password"
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                                   className="mt-1.5" required/>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Activating...' : 'Activate Account'}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    )
}
