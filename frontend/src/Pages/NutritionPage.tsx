import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Save, X, Trash2, Apple, ChefHat, Search } from 'lucide-react'
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

interface Ingredient {
    id: number
    name: string
    kcal_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
    serving_size_g: number | null
    serving_description: string | null
    kcal_per_serving: number | null
    protein_per_serving: number | null
    carbs_per_serving: number | null
    fat_per_serving: number | null
}

interface Recipe {
    id: number
    name: string
    description: string | null
    servings: number
    total_kcal?: number
    total_protein?: number
    total_carbs?: number
    total_fat?: number
}

interface NewEntryForm {
    log_date: string
    meal: string
    description: string
    kcal: string
    protein: string
    carbs: string
    fat: string
    quantity: string
    unit: 'g' | 'serving'
}

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export function NutritionPage() {
    const [entries, setEntries] = useState<FoodEntry[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [showAddForm, setShowAddForm] = useState(false)
    const [showIngredients, setShowIngredients] = useState(false)
    const [showRecipes, setShowRecipes] = useState(false)
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Edit states
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<FoodEntry>>({})

    function getLocalDateString(date: Date): string {
        return date.toLocaleDateString('en-CA');
    }

    const [newEntryForm, setNewEntryForm] = useState<NewEntryForm>({
        log_date: getLocalDateString(new Date()),
        meal: '',
        description: '',
        kcal: '',
        protein: '',
        carbs: '',
        fat: '',
        quantity: '100',
        unit: 'g'
    })

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
        const grouped: { [key: string]: FoodEntry[] } = {};
        entries.forEach(entry => {
            const date = getLocalDateString(new Date(entry.log_date)); // local YYYY-MM-DD
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        return grouped;
    };

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

    const calculateNutritionFromIngredient = (ingredient: Ingredient, grams: number) => {
        const factor = grams / 100
        return {
            kcal: ingredient.kcal_per_100g * factor,
            protein: ingredient.protein_per_100g * factor,
            carbs: ingredient.carbs_per_100g * factor,
            fat: ingredient.fat_per_100g * factor
        }
    }

    const calculateNutritionFromRecipe = (recipe: Recipe, servings: number) => {
        return {
            kcal: (recipe.total_kcal || 0) * servings / recipe.servings,
            protein: (recipe.total_protein || 0) * servings / recipe.servings,
            carbs: (recipe.total_carbs || 0) * servings / recipe.servings,
            fat: (recipe.total_fat || 0) * servings / recipe.servings
        }
    }

    const selectIngredient = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient)
        setSelectedRecipe(null)

        const grams = ingredient.serving_size_g ? ingredient.serving_size_g : 100

        const nutrition = calculateNutritionFromIngredient(ingredient, grams)

        setNewEntryForm(prev => ({
            ...prev,
            description: ingredient.name,
            quantity: grams.toString(),
            kcal: nutrition.kcal.toFixed(1),
            protein: nutrition.protein.toFixed(1),
            carbs: nutrition.carbs.toFixed(1),
            fat: nutrition.fat.toFixed(1)
        }))
    }

    const selectRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setSelectedIngredient(null)

        setNewEntryForm(prev => ({
            ...prev,
            description: recipe.name,
            unit: 'serving',
            quantity: '1'
        }))

        const nutrition = calculateNutritionFromRecipe(recipe, 1)

        setNewEntryForm(prev => ({
            ...prev,
            kcal: nutrition.kcal.toFixed(1),
            protein: nutrition.protein.toFixed(1),
            carbs: nutrition.carbs.toFixed(1),
            fat: nutrition.fat.toFixed(1)
        }))
    }

    const updateQuantity = (quantity: string, isServing = false) => {
        let grams = 0
        const qty = parseFloat(quantity) || 0
        if (selectedIngredient) {
            grams = isServing
                ? qty * (selectedIngredient.serving_size_g || 0)
                : qty
            
            const nutrition = calculateNutritionFromIngredient(selectedIngredient, grams)
            setNewEntryForm(prev => ({
                ...prev,
                quantity: isServing ? qty.toString() : grams.toString(),
                kcal: nutrition.kcal.toFixed(1),
                protein: nutrition.protein.toFixed(1),
                carbs: nutrition.carbs.toFixed(1),
                fat: nutrition.fat.toFixed(1)
            }))
        } else if (selectedRecipe) {
            const nutrition = calculateNutritionFromRecipe(selectedRecipe, qty)
            setNewEntryForm(prev => ({
                ...prev,
                quantity: qty.toString(),
                kcal: nutrition.kcal.toFixed(1),
                protein: nutrition.protein.toFixed(1),
                carbs: nutrition.carbs.toFixed(1),
                fat: nutrition.fat.toFixed(1)
            }))
        }
    }


    const resetForm = () => {
        setNewEntryForm({
            log_date: new Date().toISOString().split('T')[0],
            meal: '',
            description: '',
            kcal: '',
            protein: '',
            carbs: '',
            fat: '',
            quantity: '100',
            unit: 'g'
        })
        setSelectedIngredient(null)
        setSelectedRecipe(null)
    }

    const handleAddEntry = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/diary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 1,
                    recipe_id: selectedRecipe?.id || null,
                    ...newEntryForm,
                    kcal: Number(newEntryForm.kcal) || 0,
                    protein: Number(newEntryForm.protein) || 0,
                    carbs: Number(newEntryForm.carbs) || 0,
                    fat: Number(newEntryForm.fat) || 0,
                    portion_size: Number(newEntryForm.quantity) || 1
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to add entry')
            }

            await fetchData()
            resetForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add entry')
        }
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

    const filteredIngredients = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name))

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name))

    if (loading) {
        return (
            <div className="bg-background text-foreground">
                <main className="p-6">
                    <div className="flex flex-col justify-center items-center min-h-96 gap-4">
                        <Spinner variant="ring" />
                        <div>Loading food diary...</div>
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground">
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
    const dateRange = generateDateRange()
    function normalizeDate(date: string | Date): string {
        return new Date(date).toISOString().split("T")[0]; // "YYYY-MM-DD"
    }

    const allDates = Array.from(new Set([
        ...dateRange.map(normalizeDate),
        ...Object.keys(groupedEntries).map(normalizeDate),
    ])).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Food Diary</h1>
                        <Button onClick={() => setShowAddForm(!showAddForm)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Entry
                        </Button>
                    </div>

                    {/* Add Entry Form */}
                    {showAddForm && (
                        <Card className="mb-6">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Main Form */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Add Food Entry</h3>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                type="date"
                                                value={newEntryForm.log_date}
                                                onChange={(e) => setNewEntryForm(prev => ({ ...prev, log_date: e.target.value }))}
                                            />
                                            <Select
                                                value={newEntryForm.meal}
                                                onValueChange={(value) => setNewEntryForm(prev => ({ ...prev, meal: value }))}
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
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant={showIngredients ? "default" : "outline"}
                                                onClick={() => {
                                                    setShowIngredients(!showIngredients)
                                                    setShowRecipes(false)
                                                    setSearchTerm('')
                                                }}
                                            >
                                                <Apple className="h-4 w-4 mr-2" />
                                                Add Ingredient
                                            </Button>
                                            <Button
                                                variant={showRecipes ? "default" : "outline"}
                                                onClick={() => {
                                                    setShowRecipes(!showRecipes)
                                                    setShowIngredients(false)
                                                    setSearchTerm('')
                                                }}
                                            >
                                                <ChefHat className="h-4 w-4 mr-2" />
                                                Add Recipe
                                            </Button>
                                        </div>

                                        <Textarea
                                            placeholder="Food description"
                                            value={newEntryForm.description}
                                            onChange={(e) => setNewEntryForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={2}
                                        />

                                        {(selectedIngredient || selectedRecipe) && (
                                            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Quantity"
                                                        value={newEntryForm.quantity}
                                                        onChange={(e) => {
                                                            const qty = e.target.value
                                                            if (selectedIngredient) {
                                                                if (newEntryForm.unit === "serving") {
                                                                    updateQuantity(qty, true)   // convert servings → grams internally
                                                                } else {
                                                                    updateQuantity(qty, false)  // grams directly
                                                                }
                                                            } else if (selectedRecipe) {
                                                                updateQuantity(qty, false)    // recipes stay in servings
                                                            }
                                                        }}
                                                        className="w-24"
                                                    />
                                                    <span className="text-sm">
                                                        {selectedIngredient
                                                            ? newEntryForm.unit === "serving"
                                                                ? `${selectedIngredient.serving_description} (${selectedIngredient.serving_size_g}g each)`
                                                                : "grams"
                                                            : "servings"}
                                                    </span>
                                                    {selectedIngredient?.serving_size_g && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const newUnit = newEntryForm.unit === "g" ? "serving" : "g"
                                                                setNewEntryForm(prev => ({
                                                                    ...prev,
                                                                    unit: newUnit,
                                                                    quantity: newUnit === "serving"
                                                                        ? "1" // show 1 serving in the box
                                                                        : selectedIngredient.serving_size_g!.toString() // switch back to grams for 1 serving
                                                                }))
                                                                updateQuantity(
                                                                    newUnit === "serving" ? "1" : selectedIngredient.serving_size_g!.toString(),
                                                                    newUnit === "serving"
                                                                )
                                                            }}
                                                        >
                                                            Switch to {newEntryForm.unit === "g" ? "servings" : "grams"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

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
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Entry
                                            </Button>
                                            <Button variant="outline" onClick={resetForm}>
                                                Clear
                                            </Button>
                                            <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Ingredients/Recipes Sidebar */}
                                    {(showIngredients || showRecipes) && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold">
                                                    {showIngredients ? 'Select Ingredient' : 'Select Recipe'}
                                                </h3>
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder={`Search ${showIngredients ? 'ingredients' : 'recipes'}...`}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {showIngredients && filteredIngredients.map(ingredient => (
                                                    <Card
                                                        key={ingredient.id}
                                                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedIngredient?.id === ingredient.id ? 'bg-primary/10 border-primary' : ''
                                                            }`}
                                                        onClick={() => selectIngredient(ingredient)}
                                                    >
                                                        <CardContent className="p-3">
                                                            <h4 className="font-medium">{ingredient.name}</h4>
                                                            <div className="text-xs text-muted-foreground">
                                                                Per 100g: {ingredient.kcal_per_100g}kcal, P:{ingredient.protein_per_100g}g, C:{ingredient.carbs_per_100g}g, F:{ingredient.fat_per_100g}g
                                                            </div>
                                                            {ingredient.serving_description && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {ingredient.serving_description} ({ingredient.serving_size_g}g): ~{ingredient.kcal_per_serving}kcal
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                {showRecipes && filteredRecipes.map(recipe => (
                                                    <Card
                                                        key={recipe.id}
                                                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedRecipe?.id === recipe.id ? 'bg-primary/10 border-primary' : ''
                                                            }`}
                                                        onClick={() => selectRecipe(recipe)}
                                                    >
                                                        <CardContent className="p-3">
                                                            <h4 className="font-medium">{recipe.name}</h4>
                                                            {recipe.description && (
                                                                <p className="text-sm text-muted-foreground">{recipe.description}</p>
                                                            )}
                                                            <div className="text-xs text-muted-foreground">
                                                                {recipe.servings} servings
                                                                {recipe.total_kcal && ` • ~${Math.round(recipe.total_kcal / recipe.servings)}kcal per serving`}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-6">
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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-3">
                                                            <Select
                                                                value={editForm.meal || ''}
                                                                onValueChange={(value) => setEditForm(prev => ({ ...prev, meal: value }))}
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
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}