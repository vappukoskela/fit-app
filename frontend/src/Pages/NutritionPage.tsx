import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Save, X, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/shadcn-io/spinner'

interface FoodEntry {
    id: number
    user_id: number
    log_date: string
    recipe_id: number | null
    meal: string
    description: string
    portion_size: number
    kcal: number
    protein: number
    carbs: number
    fat: number
    created_at: string
}

interface NewEntryForm {
    log_date: string
    meal: string
    description: string
    kcal: string
    protein: string
    carbs: string
    fat: string
}

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export function NutritionPage() {
    const [entries, setEntries] = useState<FoodEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<FoodEntry>>({})
    const [showAddForm, setShowAddForm] = useState<string | null>(null)
    const [newEntryForm, setNewEntryForm] = useState<NewEntryForm>({
        log_date: '',
        meal: '',
        description: '',
        kcal: '',
        protein: '',
        carbs: '',
        fat: ''
    })

    useEffect(() => {
        fetchEntries()
    }, [])

    const fetchEntries = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost:4000/api/diary')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setEntries(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch food diary')
        } finally {
              setLoading(false)
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

    const groupEntriesByDate = (entries: FoodEntry[]) => {
        const grouped: { [key: string]: FoodEntry[] } = {}
        entries.forEach(entry => {
            const date = entry.log_date
            if (!grouped[date]) {
                grouped[date] = []
            }
            grouped[date].push(entry)
        })
        return grouped
    }

    const calculateDayTotals = (dayEntries: FoodEntry[]) => {
        return dayEntries.reduce(
            (totals, entry) => ({
                kcal: totals.kcal + Number(entry.kcal),
                protein: totals.protein + Number(entry.protein),
                carbs: totals.carbs + Number(entry.carbs),
                fat: totals.fat + Number(entry.fat)
            }),
            { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        )
    }

    const handleEdit = (entry: FoodEntry) => {
        setEditingId(entry.id)
        setEditForm(entry)
    }

    const handleSaveEdit = async () => {
        if (!editingId || !editForm) return

        try {
            const response = await fetch(`http://localhost:4000/api/diary/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            })

            if (!response.ok) {
                throw new Error('Failed to update entry')
            }

            await fetchEntries()
            setEditingId(null)
            setEditForm({})
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update entry')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return

        try {
            const response = await fetch(`http://localhost:4000/api/diary/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete entry')
            }

            await fetchEntries()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete entry')
        }
    }

    const handleAddEntry = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/diary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 1, // You'll want to get this from context/props
                    ...newEntryForm,
                    kcal: Number(newEntryForm.kcal) || 0,
                    protein: Number(newEntryForm.protein) || 0,
                    carbs: Number(newEntryForm.carbs) || 0,
                    fat: Number(newEntryForm.fat) || 0,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to add entry')
            }

            await fetchEntries()
            setShowAddForm(null)
            setNewEntryForm({
                log_date: '',
                meal: '',
                description: '',
                kcal: '',
                protein: '',
                carbs: '',
                fat: ''
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add entry')
        }
    }

    if (loading) {
        return (
            <div className="bg-background text-foreground">
                <main className="p-6">
                    <div className="flex flex-col justify-center items-center min-h-96 gap-4">
                        <Spinner variant="ring" />
                        <div>Loading user...</div>
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex justify-between items-center p-4 border-b bg-card">
                    <h1 className="text-xl font-bold">Nutrition Diary</h1>
                </header>
                <main className="p-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center text-destructive">
                                <p>Error loading food diary: {error}</p>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    const groupedEntries = groupEntriesByDate(entries)
    const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {sortedDates.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                No food entries found
                            </CardContent>
                        </Card>
                    ) : (
                        sortedDates.map(date => {
                            const dayEntries = groupedEntries[date]
                            const dayTotals = calculateDayTotals(dayEntries)

                            return (
                                <div key={date} className="space-y-3">
                                    {/* Date Header with Totals */}
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                        <span>Total: {dayTotals.kcal.toFixed(0)} kcal</span>
                                                        <span>P: {dayTotals.protein.toFixed(1)}g</span>
                                                        <span>C: {dayTotals.carbs.toFixed(1)}g</span>
                                                        <span>F: {dayTotals.fat.toFixed(1)}g</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowAddForm(date)
                                                        setNewEntryForm(prev => ({ ...prev, log_date: date }))
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Entry
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Add Entry Form */}
                                    {showAddForm === date && (
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Select
                                                            value={newEntryForm.meal}
                                                            onValueChange={(value: string) => setNewEntryForm(prev => ({ ...prev, meal: value }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select meal" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MEAL_OPTIONS.map(meal => (
                                                                    <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Textarea
                                                            placeholder="Food description"
                                                            value={newEntryForm.description}
                                                            onChange={(e) => setNewEntryForm(prev => ({ ...prev, description: e.target.value }))}
                                                            className="min-h-20"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="Calories"
                                                                value={newEntryForm.kcal}
                                                                onChange={(e) => setNewEntryForm(prev => ({ ...prev, kcal: e.target.value }))}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Protein (g)"
                                                                value={newEntryForm.protein}
                                                                onChange={(e) => setNewEntryForm(prev => ({ ...prev, protein: e.target.value }))}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Carbs (g)"
                                                                value={newEntryForm.carbs}
                                                                onChange={(e) => setNewEntryForm(prev => ({ ...prev, carbs: e.target.value }))}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Fat (g)"
                                                                value={newEntryForm.fat}
                                                                onChange={(e) => setNewEntryForm(prev => ({ ...prev, fat: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleAddEntry} className="flex-1">
                                                                <Save className="h-4 w-4 mr-1" />
                                                                Save Entry
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setShowAddForm(null)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {dayEntries.map(entry => (
                                        <Card key={entry.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                {editingId === entry.id ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-3">
                                                            <Select
                                                                value={editForm.meal || ''}
                                                                onValueChange={(value: string) => setEditForm(prev => ({ ...prev, meal: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {MEAL_OPTIONS.map(meal => (
                                                                        <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Textarea
                                                                value={editForm.description || ''}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                                className="min-h-20"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.kcal || ''}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, kcal: Number(e.target.value) }))}
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.protein || ''}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, protein: Number(e.target.value) }))}
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.carbs || ''}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.fat || ''}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, fat: Number(e.target.value) }))}
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                                                                    <Save className="h-4 w-4 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setEditingId(null)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                                                                    {entry.meal}
                                                                </span>
                                                                <span className="text-lg font-semibold">
                                                                    {Number(entry.kcal).toFixed(0)} kcal
                                                                </span>
                                                            </div>
                                                            <p className="text-foreground mb-2">{entry.description}</p>
                                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                                <span>P: {Number(entry.protein).toFixed(1)}g</span>
                                                                <span>C: {Number(entry.carbs).toFixed(1)}g</span>
                                                                <span>F: {Number(entry.fat).toFixed(1)}g</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <div className="text-right text-xs text-muted-foreground mb-2">
                                                                <div>Logged</div>
                                                                <div>{formatCreatedDate(entry.created_at)}</div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(entry)}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )
                        })
                    )}
                </div>
            </main>
        </div>
    )
}