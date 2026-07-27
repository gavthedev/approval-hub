import {useEffect, useState} from 'react'
import {NavLink, Outlet, useNavigate} from 'react-router-dom'
import {Building2, ChevronDown, ChevronRight, Home, LogOut, User} from 'lucide-react'
import {cn} from '@/lib/utils'
import client from '@/api/client'

interface Company {
    id: number
    name: string
    slug: string
}

interface TicketType {
    id: number
    name: string
    is_active: boolean
}

export function Layout() {
    const navigate = useNavigate()
    const [user, setUser] = useState({email: '', first_name: '', last_name: ''})
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
    const [expandedTicketSections, setExpandedTicketSections] = useState<Set<string>>(new Set())
    const [ticketTypeCache, setTicketTypeCache] = useState<Record<string, TicketType[]>>({})

    useEffect(() => {
        Promise.all([
            client.get('/me/'),
            client.get('/companies/'),
        ]).then(([meRes, companiesRes]) => {
            setUser(meRes.data)
            const data: Company[] = companiesRes.data
            setCompanies(data)
            setExpandedCompanies(new Set(data.map(c => c.slug)))
        }).catch(console.error).finally(() => setLoading(false))
    }, [])

    const toggleCompany = (slug: string) => {
        setExpandedCompanies(prev => {
            const next = new Set(prev)
            if (next.has(slug)) next.delete(slug)
            else next.add(slug)
            return next
        })
    }

    const toggleTicketSection = async (slug: string) => {
        const isExpanding = !expandedTicketSections.has(slug)
        setExpandedTicketSections(prev => {
            const next = new Set(prev)
            if (next.has(slug)) next.delete(slug)
            else next.add(slug)
            return next
        })
        if (isExpanding && !(slug in ticketTypeCache)) {
            try {
                const res = await client.get(`/companies/${slug}/ticket-types/`)
                const active: TicketType[] = res.data.filter((tt: TicketType) => tt.is_active)
                setTicketTypeCache(prev => ({...prev, [slug]: active}))
            } catch (e) {
                console.error(e)
            }
        }
    }

    const displayName = () => {
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name[0]}.`
        if (user.first_name) return user.first_name
        return user.email
    }

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside
                className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-[#0f172a] md:flex">
                <div className="flex h-16 items-center px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                            <Building2 className="h-5 w-5 text-[#0f172a]"/>
                        </div>
                        <span className="text-lg font-semibold text-white">ApprovalHub</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <NavLink
                        to="/"
                        end
                        className={({isActive}) => cn(
                            'mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        )}
                    >
                        <Home className="h-4 w-4 shrink-0"/>
                        Home
                    </NavLink>

                    <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Companies
                    </p>

                    {loading ? (
                        <div className="flex items-center gap-2 px-3 py-2">
                            <div
                                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300"/>
                            <span className="text-xs text-slate-500">Loading...</span>
                        </div>
                    ) : (
                        companies.map(company => (
                            <div key={company.slug} className="mb-0.5">
                                {/* Company row — two independent click zones */}
                                <div className="flex items-center rounded-lg">
                                    <NavLink
                                        to={`/company/${company.slug}`}
                                        className={({isActive}) => cn(
                                            'flex flex-1 items-center gap-2 rounded-l-lg px-3 py-2 text-sm font-medium transition-colors min-w-0',
                                            isActive
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        )}
                                    >
                                        <Building2 className="h-4 w-4 shrink-0"/>
                                        <span className="truncate">{company.name}</span>
                                    </NavLink>
                                    <button
                                        onClick={() => toggleCompany(company.slug)}
                                        className="shrink-0 rounded-r-lg px-2 py-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                        {expandedCompanies.has(company.slug)
                                            ? <ChevronDown className="h-4 w-4"/>
                                            : <ChevronRight className="h-4 w-4"/>}
                                    </button>
                                </div>

                                {/* Company submenu */}
                                {expandedCompanies.has(company.slug) && (
                                    <div className="mb-1 mt-0.5">
                                        <NavLink
                                            to={`/company/${company.slug}`}
                                            end
                                            className={({isActive}) => cn(
                                                'flex items-center rounded-lg py-1.5 pl-8 pr-3 text-sm transition-colors',
                                                isActive
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            )}
                                        >
                                            View Tickets
                                        </NavLink>

                                        {/* Open Ticket section */}
                                        <button
                                            onClick={() => toggleTicketSection(company.slug)}
                                            className="flex w-full items-center justify-between rounded-lg py-1.5 pl-8 pr-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                                        >
                                            <span>Open Ticket</span>
                                            {expandedTicketSections.has(company.slug)
                                                ? <ChevronDown className="h-3.5 w-3.5"/>
                                                : <ChevronRight className="h-3.5 w-3.5"/>}
                                        </button>

                                        {expandedTicketSections.has(company.slug) && (
                                            <div>
                                                {!(company.slug in ticketTypeCache) ? (
                                                    <div className="py-1.5 pl-10 text-xs text-slate-500">
                                                        Loading...
                                                    </div>
                                                ) : ticketTypeCache[company.slug].length === 0 ? (
                                                    <div className="py-1.5 pl-10 text-xs text-slate-500">
                                                        No ticket types
                                                    </div>
                                                ) : (
                                                    ticketTypeCache[company.slug].map(tt => (
                                                        <NavLink
                                                            key={tt.id}
                                                            to={`/company/${company.slug}/new-request/${tt.id}`}
                                                            className={({isActive}) => cn(
                                                                'flex items-center rounded-lg py-1.5 pl-10 pr-3 text-sm transition-colors',
                                                                isActive
                                                                    ? 'bg-white/10 text-white'
                                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                            )}
                                                        >
                                                            {tt.name}
                                                        </NavLink>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </nav>

                <div className="border-t border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-600">
                            <User className="h-5 w-5 text-white"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                                {displayName()}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                            <LogOut className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header
                className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white px-4 md:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a]">
                        <Building2 className="h-5 w-5 text-white"/>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">ApprovalHub</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="min-h-screen pb-20 pt-14 md:pb-0 md:pl-64 md:pt-0">
                <div className="p-4 md:p-8">
                    <Outlet/>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white md:hidden">
                <NavLink to="/"
                         end
                         className={({isActive}) => cn(
                             'flex h-11 w-11 flex-col items-center justify-center rounded-lg transition-colors',
                             isActive ? 'text-[#0f172a]' : 'text-slate-500'
                         )}>
                    <Home className="h-6 w-6"/>
                    <span className="mt-0.5 text-[10px] font-medium">Home</span>
                </NavLink>
                <NavLink to="/companies"
                         className={({isActive}) => cn(
                             'flex h-11 w-11 flex-col items-center justify-center rounded-lg transition-colors',
                             isActive ? 'text-[#0f172a]' : 'text-slate-500'
                         )}>
                    <Building2 className="h-6 w-6"/>
                    <span className="mt-0.5 text-[10px] font-medium">Companies</span>
                </NavLink>
                <button onClick={handleLogout}
                        className="flex h-11 w-11 flex-col items-center justify-center rounded-lg text-slate-500">
                    <LogOut className="h-6 w-6"/>
                    <span className="mt-0.5 text-[10px] font-medium">Logout</span>
                </button>
            </nav>
        </div>
    )
}