import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Transactions() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                <p className="text-muted-foreground">
                    View and manage all your transactions
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction List</CardTitle>
                    <CardDescription>Search, filter, and export your transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Transaction list coming soon... Upload statements to see data here.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Transactions
