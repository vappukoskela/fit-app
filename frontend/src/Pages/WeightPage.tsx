import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface WeightEntry {
  log_date: string
  weight_kg: string
  created_at: string
}

export function WeightPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/weights')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setWeights(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weights')
      } finally {
        setLoading(false)
      }
    }
    fetchWeights()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getWeightChange = (currentWeight: string, previousWeight?: string) => {
    if (!previousWeight) return null
    const change = parseFloat(currentWeight) - parseFloat(previousWeight)
    return change
  }

  if (loading) {
    return (
      <div className=" bg-background text-foreground">
        <header className="flex justify-between items-center p-4 border-b bg-card">
          <h1 className="text-xl font-bold">Weight History</h1>
        </header>
        <main className="p-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-muted-foreground">Loading weights...</div>
          </div>
        </main>
      </div>
    )
  }
  else if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="flex justify-between items-center p-4 border-b bg-card">
          <h1 className="text-xl font-bold">Weight History</h1>
        </header>
        <main className="p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <p>Error loading weights: {error}</p>
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
          {weights.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No weight entries found
              </CardContent>
            </Card>
          ) : (
            weights.map((entry, index) => {
              const weightChange = getWeightChange(
                entry.weight_kg,
                weights[index + 1]?.weight_kg
              )

              return (
                <Card key={`${entry.log_date}-${entry.created_at}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold">
                            {parseFloat(entry.weight_kg).toFixed(1)} kg
                          </span>
                          {weightChange !== null && (
                            <span className={`text-sm font-medium ${weightChange > 0
                                ? 'text-red-600'
                                : weightChange < 0
                                  ? 'text-green-600'
                                  : 'text-muted-foreground'
                              }`}>
                              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm mt-1">
                          {formatDate(entry.log_date)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>Logged</div>
                        <div>{formatCreatedDate(entry.created_at)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default WeightPage;