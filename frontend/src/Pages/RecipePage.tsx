import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/shadcn-io/spinner'


export function RecipePage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                console.log("TODO: fetch recipes");
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch recipes')
            } finally {
                setLoading(false)
            }
        }
        fetchRecipes()
    }, [])

    //   const formatDate = (dateString: string) => {
    //     const date = new Date(dateString)
    //     return new Intl.DateTimeFormat('en-US', {
    //       year: 'numeric',
    //       month: 'long',
    //       day: 'numeric'
    //     }).format(date)
    //   }

    //   const formatCreatedDate = (dateString: string) => {
    //     const date = new Date(dateString)
    //     return new Intl.DateTimeFormat('en-US', {
    //       year: 'numeric',
    //       month: 'short',
    //       day: 'numeric',
    //       hour: '2-digit',
    //       minute: '2-digit'
    //     }).format(date)
    //   }

    if (loading) {
        return (
            <div className="bg-background text-foreground">
                <main className="p-6">
                    <div className="flex flex-col justify-center items-center min-h-96 gap-4">
                        <Spinner variant="ring" />
                        <div>Loading recipes...</div>
                    </div>
                </main>
            </div>
        )
    }

    else if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <main className="p-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center text-destructive">
                                <p>Error loading recipes: {error}</p>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }
    else return (

        <div className="min-h-screen bg-background text-foreground">
            <main className="p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No recipes yet.
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default RecipePage;