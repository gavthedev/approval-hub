import {NavLink, Outlet} from 'react-router-dom'
import {Building2, LayoutDashboard, LogOut, User} from 'lucide-react'
import {cn} from '@/lib/utils'

const navigation = [
    {name: 'Dashboard', href: '/', icon: LayoutDashboard},
]

export function Layout() {
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

                <nav className="flex-1 px-3 py-4">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({isActive}) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                )
                            }
                        >
                            <item.icon className="h-5 w-5"/>
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600">
                            <User className="h-5 w-5 text-white"/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">John Doe</p>
                            <p className="text-xs text-slate-400">Admin</p>
                        </div>
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
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
                <NavLink
                    to="/"
                    className={({isActive}) =>
                        cn(
                            'flex h-11 w-11 flex-col items-center justify-center rounded-lg transition-colors',
                            isActive ? 'text-[#0f172a]' : 'text-slate-500'
                        )
                    }
                >
                    <Building2 className="h-6 w-6"/>
                    <span className="mt-0.5 text-[10px] font-medium">Companies</span>
                </NavLink>
                <NavLink
                    to="#profile"
                    className="flex h-11 w-11 flex-col items-center justify-center rounded-lg text-slate-500 transition-colors"
                >
                    <User className="h-6 w-6"/>
                    <span className="mt-0.5 text-[10px] font-medium">Profile</span>
                </NavLink>
            </nav>
        </div>
    )
}
