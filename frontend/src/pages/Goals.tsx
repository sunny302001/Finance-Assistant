import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Goals() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Budget Goals</h1>
                <p className="text-muted-foreground">
                    Track and manage your financial goals
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Goals</CardTitle>
                    <CardDescription>Create and track progress on your savings goals</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Goals management coming soon...
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Goals
