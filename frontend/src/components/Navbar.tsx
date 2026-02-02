import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useState, useEffect } from 'react'

export function Navbar() {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        // Check for saved preference or system preference
        const isDark = localStorage.getItem('darkMode') === 'true' ||
            (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)

        setDarkMode(isDark)
        document.documentElement.classList.toggle('dark', isDark)
    }, [])

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        localStorage.setItem('darkMode', String(newMode))
        document.documentElement.classList.toggle('dark', newMode)
    }

    return (
        <div className="flex h-16 items-center justify-between border-b bg-card px-6">
            <div>
                <h2 className="text-lg font-semibold">Personal Finance Dashboard</h2>
                <p className="text-sm text-muted-foreground">Track, analyze, and optimize your spending</p>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </div>
    )
}
