import { useEffect, useReducer, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Save, X, Trash2, Apple, ChefHat, Search } from 'lucide-react'
import { LoadingPage } from '@/components/Loading'
import { DiaryEntryBuilder } from '@/components/DiaryEntryBuilder'
import { nutritionReducer, initialNutritionState, type FoodEntry } from '../reducers/nutritionReducer'
import { useRecipes } from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Ingredient, Recipe } from '@/types/recipeIngredientTypes'

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'];

function getLocalDateString(date: Date): string {
    return date.toLocaleDateString('en-CA')
}

export function NutritionPage() {
    const [state, dispatch] = useReducer(nutritionReducer, initialNutritionState)

    const {
        ingredients,
        loading: ingredientsLoading,
        error: ingredientsError,
    } = useIngredients()

    const {
        recipes,
        loading: recipesLoading,
        error: recipesError,
    } = useRecipes()

    const [showIngredients, setShowIngredients] = useState(false)
    const [showRecipes, setShowRecipes] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedIngredient = state.selectedIngredient
    const selectedRecipe = state.selectedRecipe

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        dispatch({ type: 'FETCH_START' })
        try {
            const res = await fetch('http://localhost:4000/api/diary')
            if (!res.ok) throw new Error('Failed to fetch diary')
            const entries: FoodEntry[] = await res.json()
            dispatch({
                type: 'FETCH_SUCCESS', payload: {
                    entries,
                    ingredients: [],
                    recipes: []
                }
            })
        } catch (err) {
            dispatch({
                type: 'FETCH_ERROR',
                payload: err instanceof Error ? err.message : 'Failed to fetch diary'
            })
        }
    }

    const handleSaveEntry = () => {
        fetchData()
    }

    const handleCloseBuilder = () => {
        dispatch({ type: "CLEAR_SELECTION" })
    }

    const handleSaveEdit = async () => {
        if (!state.editingEntry) return
        try {
            const { id, form } = state.editingEntry
            const response = await fetch(`http://localhost:4000/api/diary/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!response.ok) throw new Error('Failed to update entry')
            await fetchData()
            dispatch({ type: 'CANCEL_EDIT' })
        } catch (err) {
            dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'Failed to update entry' })
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return
        try {
            const res = await fetch(`http://localhost:4000/api/diary/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            await fetchData()
        } catch {
            dispatch({ type: 'FETCH_ERROR', payload: 'Failed to delete entry' })
        }
    }

    const groupEntriesByDate = (entries: FoodEntry[]) =>
        entries.reduce<Record<string, FoodEntry[]>>((acc, entry) => {
            const date = getLocalDateString(new Date(entry.log_date))
            acc[date] = acc[date] || []
            acc[date].push(entry)
            return acc
        }, {})

    const generateDateRange = () => {
        const dates: string[] = []
        const today = new Date()
        for (let i = 0; i < 30; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() - i)
            dates.push(getLocalDateString(d))
        }
        return dates
    }

    const calculateDayTotals = (entries: FoodEntry[]) =>
        entries.reduce(
            (totals, e) => ({
                kcal: totals.kcal + Number(e.kcal),
                protein: totals.protein + Number(e.protein),
                carbs: totals.carbs + Number(e.carbs),
                fat: totals.fat + Number(e.fat),
            }),
            { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        )

    const selectIngredient = (ingredient: Ingredient) => {
        dispatch({ type: 'SELECT_INGREDIENT', payload: ingredient })
    }

    const selectRecipe = (recipe: Recipe) => {
        dispatch({ type: 'SELECT_RECIPE', payload: recipe })
    }
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date)
    }

    if (ingredientsLoading || recipesLoading) return <LoadingPage message="Loading food diary..." />

    if (ingredientsError || recipesError || state.error)
        return <div className="p-6 text-destructive">Error: {ingredientsError || recipesError || state.error}</div>

    const groupedEntries = groupEntriesByDate(state.entries)
    const dateRange = generateDateRange()
    const allDates = [...new Set([...dateRange, ...Object.keys(groupedEntries)])].sort((a, b) => b.localeCompare(a))

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="mx-auto">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">Food Diary</h1>
                    <Button onClick={() => dispatch({ type: 'TOGGLE_ADD_FORM' })}>
                        <Plus className="h-4 w-4 mr-2" /> Add Entry
                    </Button>
                </div>

                {state.showAddForm && (
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

                            {dayEntries.map(entry => (
                                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        {state.editingEntry?.id === entry.id ? (
                                            <div className="space-y-3">

                                                <div className="text-sm font-medium text-muted-foreground">
                                                    Edit Entry
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor="edit-meal" className="text-xs text-muted-foreground mb-1">Meal</Label>
                                                        <Select
                                                            value={state.editingEntry.form.meal || ''}
                                                            onValueChange={(value) => dispatch({
                                                                type: 'UPDATE_EDIT_FORM',
                                                                payload: { meal: value }
                                                            })}
                                                        >
                                                            <SelectTrigger id="edit-meal">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MEAL_OPTIONS.map(m => (
                                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-grams" className="text-xs text-muted-foreground mb-1">
                                                            Multiplier (placeholder for grams)
                                                        </Label>
                                                        <Input
                                                            id="edit-grams"
                                                            type="number"
                                                            step="0.1"
                                                            value={state.editingEntry.form.portion_size || ''}
                                                            onChange={(e) => dispatch({
                                                                type: 'UPDATE_EDIT_GRAMS',
                                                                payload: parseFloat(e.target.value) || 0
                                                            })}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="edit-description" className="text-xs text-muted-foreground mb-1">Description</Label>
                                                    <Input
                                                        id="edit-description"
                                                        value={state.editingEntry.form.description || ''}
                                                        onChange={(e) => dispatch({
                                                            type: 'UPDATE_EDIT_FORM',
                                                            payload: { description: e.target.value }
                                                        })}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1">
                                                        Nutrition (manual edit if needed)
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Calories"
                                                            value={state.editingEntry.form.kcal ? state.editingEntry.form.kcal.toFixed(0) : ""}
                                                            onChange={(e) => dispatch({
                                                                type: 'UPDATE_EDIT_FORM',
                                                                payload: { kcal: parseFloat(e.target.value) || 0 }
                                                            })}
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Protein (g)"
                                                            value={state.editingEntry.form.protein ? state.editingEntry.form.protein.toFixed(1) : ''}
                                                            onChange={(e) => dispatch({
                                                                type: 'UPDATE_EDIT_FORM',
                                                                payload: { protein: parseFloat(e.target.value) || 0 }
                                                            })}
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Carbs (g)"
                                                            value={state.editingEntry.form.carbs ? state.editingEntry.form.carbs.toFixed(1) : ''}
                                                            onChange={(e) => dispatch({
                                                                type: 'UPDATE_EDIT_FORM',
                                                                payload: { carbs: parseFloat(e.target.value) || 0 }
                                                            })}
                                                        />
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Fat (g)"
                                                            value={state.editingEntry.form.fat ? state.editingEntry.form.fat.toFixed(1) : ''}
                                                            onChange={(e) => dispatch({
                                                                type: 'UPDATE_EDIT_FORM',
                                                                payload: { fat: parseFloat(e.target.value) || 0 }
                                                            })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => dispatch({ type: 'CANCEL_EDIT' })}
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
                                                        <div>{new Date(entry.created_at).toLocaleString()}</div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => dispatch({ type: 'START_EDIT', payload: entry })}
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
