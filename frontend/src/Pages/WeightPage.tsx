import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/Loading'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface WeightEntry {
  log_date: string
  weight_kg: string
  created_at: string
}

interface EditingEntry {
  log_date: string
  weight_kg: string
}

export function WeightPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingWeight, setIsAddingWeight] = useState(false)
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null)

  const [newWeight, setNewWeight] = useState('')
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('en-CA'))

  useEffect(() => {
    fetchWeights()
  }, [])

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

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeight.trim() || !newDate) return

    try {
      const response = await fetch('http://localhost:4000/api/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          log_date: newDate,
          weight_kg: parseFloat(newWeight)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add weight')
      }
      setNewWeight('')
      setNewDate(new Date().toLocaleDateString('en-CA'))
      setIsAddingWeight(false)

      await fetchWeights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add weight')
    }
  }

  const handleEditWeight = async (log_date: string) => {
    if (!editingEntry) return

    try {
      const response = await fetch(`http://localhost:4000/api/weights/${log_date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight_kg: parseFloat(editingEntry.weight_kg)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update weight')
      }

      setEditingEntry(null)
      await fetchWeights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update weight')
    }
  }

  const handleDeleteWeight = async (log_date: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return

    try {
      const response = await fetch(`http://localhost:4000/api/weights/${log_date}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete weight')
      }

      await fetchWeights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete weight')
    }
  }

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
    return <LoadingPage message="Loading weights..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="p-6">
          <Card className="border-destructive">
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Weight Tracker
            </h1>
            <Button
              onClick={() => setIsAddingWeight(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Weight
            </Button>
          </div>

          <div className="space-y-4">
            {isAddingWeight && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg">Add New Weight Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddWeight} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Weight (kg)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder={
                            weights.length > 0
                              ? parseFloat(weights[0].weight_kg).toFixed(1)
                              : "70.5"}
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Entry
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddingWeight(false)
                          setNewWeight('')
                          setNewDate(new Date().toLocaleDateString('en-CA'))
                        }}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {weights.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No weights logged
                </CardContent>
              </Card>
            ) : (
              weights.map((entry, index) => {
                const weightChange = getWeightChange(
                  entry.weight_kg,
                  weights[index + 1]?.weight_kg
                )
                const isEditing = editingEntry?.log_date === entry.log_date

                return (
                  <Card key={`${entry.log_date}-${entry.created_at}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={editingEntry.weight_kg}
                                  onChange={(e) => setEditingEntry({
                                    ...editingEntry,
                                    weight_kg: e.target.value
                                  })}
                                  className="w-32"
                                />
                                <span className="text-sm text-muted-foreground">kg</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditWeight(entry.log_date)}
                                  className="flex items-center gap-1"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingEntry(null)}
                                  className="flex items-center gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right text-xs text-muted-foreground">
                            <div>Logged</div>
                            <div>{formatCreatedDate(entry.created_at)}</div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEntry({
                                  log_date: entry.log_date,
                                  weight_kg: entry.weight_kg
                                })}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteWeight(entry.log_date)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default WeightPage