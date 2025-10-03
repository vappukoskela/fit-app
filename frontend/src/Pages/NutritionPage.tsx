import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit2, Save, X, Trash2, Apple, ChefHat } from 'lucide-react'
import { LoadingPage } from '@/components/Loading'
import { DiaryEntryBuilder } from '@/components/DiaryEntryBuilder'
import type { Ingredient, Recipe } from '@/types/recipeIngredientTypes'

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

export function NutritionPage() {
    const [entries, setEntries] = useState<FoodEntry[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [showAddForm, setShowAddForm] = useState(false)
    const [showIngredients, setShowIngredients] = useState(false)
    const [showRecipes, setShowRecipes] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<FoodEntry>>({})

    function getLocalDateString(date: Date): string {
        return date.toLocaleDateString('en-CA')
    }

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [entriesRes, ingredientsRes, recipesRes] = await Promise.all([
                fetch('http://localhost:4000/api/diary'),
                fetch('http://localhost:4000/api/ingredients'),
                fetch('http://localhost:4000/api/recipes')
            ])

            if (!entriesRes.ok || !ingredientsRes.ok || !recipesRes.ok) {
                throw new Error('Failed to fetch data')
            }

            const [entriesData, ingredientsData, recipesData] = await Promise.all([
                entriesRes.json(),
                ingredientsRes.json(),
                recipesRes.json()
            ])

            setEntries(entriesData)
            setIngredients(ingredientsData)
            setRecipes(recipesData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
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
            const date = getLocalDateString(new Date(entry.log_date))
            if (!grouped[date]) {
                grouped[date] = []
            }
            grouped[date].push(entry)
        })
        return grouped
    }

    const generateDateRange = () => {
        const dates = []
        const today = new Date()
        for (let i = 0; i < 30; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() - i)
            const dateString = getLocalDateString(date)
            dates.push(dateString)
        }
        return dates
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

    const handleCloseBuilder = () => {
        setShowAddForm(false)
        setSelectedIngredient(null)
        setSelectedRecipe(null)
        setShowIngredients(false)
        setShowRecipes(false)
        setSearchTerm('')
    }

    const handleSaveEntry = () => {
        fetchData()
    }

    const handleEdit = (entry: FoodEntry) => {
        setEditingId(entry.id)
        const dateOnly = entry.log_date.includes('T')
            ? entry.log_date.split('T')[0]
            : entry.log_date

        setEditForm({
            ...entry,
            log_date: dateOnly
        })
    }

    const handleSaveEdit = async () => {
        if (!editingId || !editForm) return
        try {
            const updateData = {
                description: editForm.description,
                kcal: Number(editForm.kcal),
                protein: Number(editForm.protein),
                carbs: Number(editForm.carbs),
                fat: Number(editForm.fat),
                meal: editForm.meal,
                log_date: editForm.log_date,
                recipe_id: editForm.recipe_id || null
            }

            const response = await fetch(`http://localhost:4000/api/diary/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })

            if (!response.ok) {
                throw new Error('Failed to update entry')
            }

            await fetchData()
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

            await fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete entry')
        }
    }

    const selectIngredient = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient)
        setSelectedRecipe(null)
    }

    const selectRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setSelectedIngredient(null)
    }

    if (loading) return <LoadingPage message="Loading food diary..." />
    if (error) return <div className="p-6 text-destructive">Error: {error}</div>

    const filteredIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const groupedEntries = groupEntriesByDate(entries)
    const dateRange = generateDateRange()

    const normalizeDate = (date: string | Date): string => {
        return getLocalDateString(new Date(date))
    }

    const allDates = Array.from(new Set([
        ...dateRange.map(normalizeDate),
        ...Object.keys(groupedEntries).map(normalizeDate),
    ])).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="mx-auto">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">Food Diary</h1>
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Entry
                    </Button>
                </div>

                {showAddForm && (
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <DiaryEntryBuilder
                                        onClose={handleCloseBuilder}
                                        onSave={handleSaveEntry}
                                        selectedIngredient={selectedIngredient}
                                        selectedRecipe={selectedRecipe}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Button
                                            variant={showIngredients ? "default" : "outline"}
                                            onClick={() => {
                                                setShowIngredients(!showIngredients)
                                                setShowRecipes(false)
                                                setSearchTerm('')
                                            }}
                                            className="flex-1"
                                        >
                                            <Apple className="h-4 w-4 mr-2" />
                                            Ingredients
                                        </Button>
                                        <Button
                                            variant={showRecipes ? "default" : "outline"}
                                            onClick={() => {
                                                setShowRecipes(!showRecipes)
                                                setShowIngredients(false)
                                                setSearchTerm('')
                                            }}
                                            className="flex-1"
                                        >
                                            <ChefHat className="h-4 w-4 mr-2" />
                                            Recipes
                                        </Button>
                                    </div>

                                    {(showIngredients || showRecipes) && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Search className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={`Search ${showIngredients ? 'ingredients' : 'recipes'}...`}
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                                                {showIngredients && filteredIngredients.map(ingredient => (
                                                    <Card
                                                        key={ingredient.id}
                                                        className={`p-3 cursor-pointer transition-colors ${selectedIngredient?.id === ingredient.id
                                                                ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700'
                                                                : 'hover:bg-muted'
                                                            }`}
                                                        onClick={() => selectIngredient(ingredient)}
                                                    >
                                                        <div className="font-medium">{ingredient.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {ingredient.kcal_per_100g} kcal/100g
                                                            {ingredient.serving_size_g && ` • ${ingredient.serving_size_g}g serving`}
                                                        </div>
                                                    </Card>
                                                ))}
                                                {showRecipes && filteredRecipes.map(recipe => (
                                                    <Card
                                                        key={recipe.id}
                                                        className={`p-3 cursor-pointer transition-colors ${selectedRecipe?.id === recipe.id
                                                                ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700'
                                                                : 'hover:bg-muted'
                                                            }`}
                                                        onClick={() => selectRecipe(recipe)}
                                                    >
                                                        <div className="font-medium">{recipe.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {recipe.servings} servings
                                                            {recipe.description && ` • ${recipe.description}`}
                                                        </div>
                                                    </Card>
                                                ))}
                                                {showIngredients && filteredIngredients.length === 0 && (
                                                    <div className="text-center text-muted-foreground py-8">
                                                        No ingredients found
                                                    </div>
                                                )}
                                                {showRecipes && filteredRecipes.length === 0 && (
                                                    <div className="text-center text-muted-foreground py-8">
                                                        No recipes found
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {!showIngredients && !showRecipes && (
                                        <div className="flex items-center justify-center h-96 text-muted-foreground">
                                            <div className="text-center">
                                                <p className="mb-2">Select ingredients or recipes to add to your diary</p>
                                                <p className="text-sm">Click the buttons above to browse</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {allDates.map(date => {
                    const dayEntries = groupedEntries[date] || []
                    const dayTotals = calculateDayTotals(dayEntries)

                    return (
                        <div key={date} className="space-y-3">
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
                                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                {dayEntries.length > 0 ? (
                                                    <>
                                                        <span>Total: {dayTotals.kcal.toFixed(0)} kcal</span>
                                                        <span>P: {dayTotals.protein.toFixed(1)}g</span>
                                                        <span>C: {dayTotals.carbs.toFixed(1)}g</span>
                                                        <span>F: {dayTotals.fat.toFixed(1)}g</span>
                                                    </>
                                                ) : (
                                                    <span>No entries yet</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {dayEntries.length > 0 && dayEntries.map(entry => (
                                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        {editingId === entry.id ? (
                                            <div className="space-y-3">
                                                <div className="text-sm text-muted-foreground">
                                                    Editing mode - update values manually
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        type="number"
                                                        placeholder="Calories"
                                                        value={editForm.kcal || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, kcal: Number(e.target.value) }))}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Protein (g)"
                                                        value={editForm.protein || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, protein: Number(e.target.value) }))}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Carbs (g)"
                                                        value={editForm.carbs || ''}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Fat (g)"
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
                                        ) : (
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="bg-primary/60 text-muted-foreground/70 px-4 py-1 rounded text-sm font-medium">
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
                })}
            </div>
        </div>
    )
}
