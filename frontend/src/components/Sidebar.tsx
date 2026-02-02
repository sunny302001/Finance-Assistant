import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Receipt,
    Upload,
    Target,
    FolderKanban,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Categories', href: '/categories', icon: FolderKanban },
]

export function Sidebar() {
    const location = useLocation()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-needs-500 to-wants-500 bg-clip-text text-transparent">
                    FinanceFlow
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium">🔒 Privacy First</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        All AI processing runs locally
                    </p>
                </div>
            </div>
        </div>
    )
}
