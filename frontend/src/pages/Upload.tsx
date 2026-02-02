import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { uploadStatement } from '@/lib/api'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import type { UploadResponse } from '@/types'

function Upload() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<UploadResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const response = await uploadStatement(file)
            setResult(response)
            setFile(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Statement</h1>
                <p className="text-muted-foreground">
                    Upload your bank statement (PDF or CSV format)
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>File Upload</CardTitle>
                    <CardDescription>
                        Supported banks: SBI, ICICI, HDFC (PDF/CSV)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
                            <div className="text-center">
                                <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm font-medium">Choose file</p>
                                <p className="text-xs text-muted-foreground">PDF or CSV up to 10MB</p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 rounded-lg border p-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="flex-1 text-sm">{file.name}</span>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    )}

                    {uploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            Processing your statement...
                        </div>
                    )}

                    {result && (
                        <div className="rounded-lg border border-savings-200 bg-savings-50 p-4 dark:border-savings-800 dark:bg-savings-950/20">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-savings-600" />
                                <p className="font-medium text-savings-900 dark:text-savings-100">
                                    Upload Successful!
                                </p>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-savings-800 dark:text-savings-200">
                                <p>Bank: {result.bank_name}</p>
                                <p>Transactions found: {result.total_transactions}</p>
                                <p>Successfully processed: {result.processed_successfully}</p>
                                {result.failed > 0 && <p>Failed: {result.failed}</p>}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <p className="font-medium text-destructive">Upload Failed</p>
                            </div>
                            <p className="mt-1 text-sm text-destructive/80">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>⚙️ How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>1. 🏦 Your statement is parsed by bank-specific templates</p>
                    <p>2. 🔒 All PII (dates, account numbers, IDs) is removed locally</p>
                    <p>3. 💻 Ollama (local AI) identifies merchants and categorizes transactions</p>
                    <p>4. 💾 Data is saved to your local database</p>
                    <p className="pt-2 font-medium text-savings-600">
                        ✓ All processing happens on your machine - your data never leaves!
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default Upload
