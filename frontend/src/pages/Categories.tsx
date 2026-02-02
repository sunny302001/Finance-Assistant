import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Categories() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground">
                    Manage your budget categories
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Budget Categories</CardTitle>
                    <CardDescription>Configure your spending categories and targets</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Category management coming soon...
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Categories
