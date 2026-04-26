import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Building2, ChevronRight, Plus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {cn} from '@/lib/utils'
import client from '@/api/client'

interface Company {
    id: string
    name: string
    slug: string
}

export function Dashboard() {
    const navigate = useNavigate()
    const [companies, setCompanies] = useState<Company[]>([])
    const [showNewForm, setShowNewForm] = useState(false)
    const [newCompanyName, setNewCompanyName] = useState('')

    useEffect(() => {
        client.get('/companies/').then((res) => {
            setCompanies(res.data)
        }).catch(console.error)
    }, [])

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCompanyName.trim()) return
        try {
            const res = await client.post('/companies/', {name: newCompanyName.trim()})
            setCompanies([...companies, res.data])
            setNewCompanyName('')
            setShowNewForm(false)
        } catch (err) {
            console.error(err)
        }
    }

    const handleCompanyClick = (slug: string) => {
        navigate(`/company/${slug}`)
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
                {!showNewForm && (
                    <Button onClick={() => setShowNewForm(true)} size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4"/>
                        <span className="hidden sm:inline">New Company</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                )}
            </div>

            {showNewForm && (
                <Card className="mb-6 border-slate-200 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={handleAddCompany} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <Label htmlFor="companyName" className="text-slate-700">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                    placeholder="Enter company name"
                                    className="mt-1.5"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 sm:flex-shrink-0">
                                <Button type="submit" size="sm" className="flex-1 sm:flex-initial">Add</Button>
                                <Button type="button" variant="outline" size="sm"
                                        onClick={() => {
                                            setShowNewForm(false);
                                            setNewCompanyName('')
                                        }}
                                        className="flex-1 sm:flex-initial">
                                    <X className="h-4 w-4 sm:mr-1.5"/>
                                    <span className="hidden sm:inline">Cancel</span>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col gap-3">
                {companies.map((company) => (
                    <Card key={company.id}
                          onClick={() => handleCompanyClick(company.slug)}
                          className={cn('cursor-pointer border-slate-200 bg-white shadow-sm transition-all',
                              'hover:border-slate-300 hover:shadow-md')}>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                <Building2 className="h-5 w-5 text-slate-600"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate font-medium text-slate-900">{company.name}</h3>
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400"/>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {companies.length === 0 && (
                <div className="py-12 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300"/>
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No companies yet</h3>
                    <p className="mt-1 text-sm text-slate-500">Get started by adding your first company.</p>
                </div>
            )}
        </div>
    )
}