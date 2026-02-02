import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { getSpendingOverview, getBudgetAnalysis } from '@/lib/api'
import type { SpendingOverview, BudgetAnalysis } from '@/types'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'

function Dashboard() {
    const [overview, setOverview] = useState<SpendingOverview | null>(null)
    const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewData, analysisData] = await Promise.all([
                    getSpendingOverview(),
                    getBudgetAnalysis({ include_advice: true }),
                ])
                setOverview(overviewData)
                setAnalysis(analysisData)
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome to your personal finance overview
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-savings-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overview ? formatCurrency(overview.total_income) : '₹0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview?.total_transactions || 0} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-needs-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overview ? formatCurrency(overview.total_expenses) : '₹0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All categories
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                        <PiggyBank className="h-4 w-4 text-savings-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {overview ? formatCurrency(overview.net_savings) : '₹0'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview ? `${overview.savings_rate.toFixed(1)}%` : '0%'} savings rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analysis ? Object.keys(analysis.category_totals).length : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active categories
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            {analysis && Object.keys(analysis.category_totals).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Category Breakdown</CardTitle>
                        <CardDescription>Your spending by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(analysis.category_totals).map(([category, data]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{category}</span>
                                        <span className="text-muted-foreground">
                                            {formatCurrency(data.total)} ({data.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className={`h-2 rounded-full ${category === 'Needs' ? 'bg-needs-500' :
                                                    category === 'Wants' ? 'bg-wants-500' :
                                                        category === 'Savings' ? 'bg-savings-500' :
                                                            category === 'Debt' ? 'bg-debt-500' : 'bg-gray-500'
                                                }`}
                                            style={{ width: `${data.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Advice */}
            {analysis?.llm_advice && (
                <Card>
                    <CardHeader>
                        <CardTitle>💡 AI Financial Advice</CardTitle>
                        <CardDescription>Personalized insights from local AI</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed">{analysis.llm_advice}</p>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!overview || overview.total_transactions === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-lg font-medium">No transactions yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upload your first bank statement to get started
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default Dashboard
