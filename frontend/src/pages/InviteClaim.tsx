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
    const [errors, setErrors] = useState<{ dateOfBirth?: string; password?: string }>({})
    const [message, setMessage] = useState('')
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)
    const isLoggedIn = !!localStorage.getItem('access_token')

    const validate = () => {
        const e: typeof errors = {}
        if (!dateOfBirth) e.dateOfBirth = 'Date of birth is required'
        else if (new Date(dateOfBirth) >= new Date()) e.dateOfBirth = 'Date of birth must be in the past'
        if (!password) e.password = 'Password is required'
        else if (password.length < 8) e.password = 'Password must be at least 8 characters'
        return e
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const v = validate()
        if (Object.keys(v).length) {
            setErrors(v);
            return
        }
        setLoading(true)
        setServerError('')
        try {
            const res = await client.post(`/invite/${token}/claim/`, {
                password,
                date_of_birth: dateOfBirth,
            })
            const companySlug = res.data.company_slug
            setMessage(res.data.message)
            setTimeout(() => {
                if (isLoggedIn && companySlug) {
                    navigate(`/company/${companySlug}`)
                } else {
                    navigate('/login')
                }
            }, 2000)
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            setServerError(msg || 'Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-2">Accept Invitation</h1>
                <p className="text-gray-500 text-sm mb-6">Set your password to activate your account.</p>
                {serverError && <p className="text-red-500 mb-4 text-sm">{serverError}</p>}
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
                                   onChange={(e) => {
                                       setDateOfBirth(e.target.value);
                                       setErrors(p => ({...p, dateOfBirth: undefined}))
                                   }}
                                   className="mt-1.5"/>
                            {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
                        </div>
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" placeholder="Choose a password"
                                   value={password}
                                   onChange={(e) => {
                                       setPassword(e.target.value);
                                       setErrors(p => ({...p, password: undefined}))
                                   }}
                                   className="mt-1.5"/>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
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
