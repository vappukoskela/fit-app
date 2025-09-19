import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Save, X, Trash2, Search, ChefHat, Apple } from 'lucide-react'

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
    ingredients?: RecipeIngredient[]
}

interface RecipeIngredient {
    id: number
    recipe_id: number
    ingredient_id: number
    amount_g: number
    note: string | null
    ingredient?: Ingredient
}

interface RawRecipeIngredient {
    id: number
    recipe_id: number
    ingredient_id: number
    amount_g: string
    note: string | null
    name: string
    kcal_per_100g: string
    protein_per_100g: string
    carbs_per_100g: string
    fat_per_100g: string
    serving_size_g: string | null
    serving_description: string | null
    kcal_per_serving: string | null
    protein_per_serving: string | null
    carbs_per_serving: string | null
    fat_per_serving: string | null
}

interface IngredientForm {
    name: string
    kcal_per_100g: string
    protein_per_100g: string
    carbs_per_100g: string
    fat_per_100g: string
    serving_size_g: string
    serving_description: string
}

interface RecipeForm {
    name: string
    description: string
    servings: string
}

export function RecipePage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Search and sorting
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'alphabetical' | 'recent'>('recent')
    const [modalIngredientSearch, setModalIngredientSearch] = useState("")
    // Forms
    const [showIngredientForm, setShowIngredientForm] = useState(false)
    const [showRecipeForm, setShowRecipeForm] = useState(false)
    const [editingIngredient, setEditingIngredient] = useState<number | null>(null)
    const [editingRecipe, setEditingRecipe] = useState<number | null>(null)

    const [ingredientForm, setIngredientForm] = useState<IngredientForm>({
        name: '',
        kcal_per_100g: '',
        protein_per_100g: '',
        carbs_per_100g: '',
        fat_per_100g: '',
        serving_size_g: '',
        serving_description: ''
    })

    const [recipeForm, setRecipeForm] = useState<RecipeForm>({
        name: '',
        description: '',
        servings: '1'
    })

    // Recipe building
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [recipeIngredients, setRecipeIngredients] = useState<{ ingredient: Ingredient, amount_g: string, note: string }[]>([])
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchRecipeIngredients = async (recipeId: number) => {
        try {
            const response = await fetch(`http://localhost:4000/api/recipes/${recipeId}/ingredients`)
            if (response.ok) {
                const data = await response.json()
                console.log(data)
                const formatted = data.map((ri: RawRecipeIngredient) => ({
                    id: ri.id,
                    recipe_id: ri.recipe_id,
                    ingredient_id: ri.ingredient_id,
                    amount_g: parseFloat(ri.amount_g),
                    note: ri.note,
                    ingredient: {
                        id: ri.ingredient_id,
                        name: ri.name,
                        kcal_per_100g: ri.kcal_per_100g,
                        protein_per_100g: ri.protein_per_100g,
                        carbs_per_100g: ri.carbs_per_100g,
                        fat_per_100g: ri.fat_per_100g,
                        serving_size_g: ri.serving_size_g,
                        serving_description: ri.serving_description,
                        kcal_per_serving: ri.kcal_per_serving,
                        protein_per_serving: ri.protein_per_serving,
                        carbs_per_serving: ri.carbs_per_serving,
                        fat_per_serving: ri.fat_per_serving,
                    }
                }))
                setRecipeIngredients(formatted)
            }
        } catch (err) {
            console.error('Failed to fetch recipe ingredients:', err)
        }
    }
    const fetchData = async () => {
        try {
            setLoading(true)
            const [ingredientsRes, recipesRes] = await Promise.all([
                fetch('http://localhost:4000/api/ingredients'),
                fetch('http://localhost:4000/api/recipes')
            ])

            if (!ingredientsRes.ok || !recipesRes.ok) {
                throw new Error('Failed to fetch data')
            }

            const [ingredientsData, recipesData] = await Promise.all([
                ingredientsRes.json(),
                recipesRes.json()
            ])

            setIngredients(ingredientsData)
            setRecipes(recipesData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const calculateServingValues = (per100g: number, servingSize: number) => {
        return (per100g * servingSize / 100)
    }

    const handleIngredientSubmit = async () => {
        try {
            const servingSize = parseFloat(ingredientForm.serving_size_g)
            const kcalPer100 = parseFloat(ingredientForm.kcal_per_100g)
            const proteinPer100 = parseFloat(ingredientForm.protein_per_100g)
            const carbsPer100 = parseFloat(ingredientForm.carbs_per_100g)
            const fatPer100 = parseFloat(ingredientForm.fat_per_100g)

            const payload = {
                name: ingredientForm.name,
                kcal_per_100g: kcalPer100,
                protein_per_100g: proteinPer100,
                carbs_per_100g: carbsPer100,
                fat_per_100g: fatPer100,
                serving_size_g: servingSize || null,
                serving_description: ingredientForm.serving_description || null,
                kcal_per_serving: servingSize ? calculateServingValues(kcalPer100, servingSize) : null,
                protein_per_serving: servingSize ? calculateServingValues(proteinPer100, servingSize) : null,
                carbs_per_serving: servingSize ? calculateServingValues(carbsPer100, servingSize) : null,
                fat_per_serving: servingSize ? calculateServingValues(fatPer100, servingSize) : null
            }

            const url = editingIngredient
                ? `http://localhost:4000/api/ingredients/${editingIngredient}`
                : 'http://localhost:4000/api/ingredients'

            const response = await fetch(url, {
                method: editingIngredient ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to save ingredient')

            await fetchData()
            resetIngredientForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save ingredient')
        }
    }

    const handleRecipeSubmit = async () => {
        try {
            const payload = {
                name: recipeForm.name,
                description: recipeForm.description || null,
                servings: parseInt(recipeForm.servings)
            }

            const url = editingRecipe
                ? `http://localhost:4000/api/recipes/${editingRecipe}`
                : 'http://localhost:4000/api/recipes'

            const response = await fetch(url, {
                method: editingRecipe ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to save recipe')

            await fetchData()
            resetRecipeForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe')
        }
    }

    const deleteIngredient = async (id: number) => {
        if (!confirm('Delete this ingredient?')) return

        try {
            const response = await fetch(`http://localhost:4000/api/ingredients/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete ingredient')
            await fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete ingredient')
        }
    }

    const deleteRecipe = async (id: number) => {
        if (!confirm('Delete this recipe?')) return

        try {
            const response = await fetch(`http://localhost:4000/api/recipes/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete recipe')
            await fetchData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete recipe')
        }
    }

    const editIngredient = (ingredient: Ingredient) => {
        setIngredientForm({
            name: ingredient.name,
            kcal_per_100g: ingredient.kcal_per_100g.toString(),
            protein_per_100g: ingredient.protein_per_100g.toString(),
            carbs_per_100g: ingredient.carbs_per_100g.toString(),
            fat_per_100g: ingredient.fat_per_100g.toString(),
            serving_size_g: ingredient.serving_size_g?.toString() || '',
            serving_description: ingredient.serving_description || ''
        })
        setEditingIngredient(ingredient.id)
        setShowIngredientForm(true)
    }

    const editRecipe = (recipe: Recipe) => {
        setRecipeForm({
            name: recipe.name,
            description: recipe.description || '',
            servings: recipe.servings.toString()
        })
        setEditingRecipe(recipe.id)
        setShowRecipeForm(true)
    }

    const resetIngredientForm = () => {
        setIngredientForm({
            name: '',
            kcal_per_100g: '',
            protein_per_100g: '',
            carbs_per_100g: '',
            fat_per_100g: '',
            serving_size_g: '',
            serving_description: ''
        })
        setShowIngredientForm(false)
        setEditingIngredient(null)
    }

    const resetRecipeForm = () => {
        setRecipeForm({
            name: '',
            description: '',
            servings: '1'
        })
        setShowRecipeForm(false)
        setEditingRecipe(null)
    }

    const addIngredientToRecipe = (ingredient: Ingredient) => {
        if (recipeIngredients.some(ri => ri.ingredient.id === ingredient.id)) return

        setRecipeIngredients(prev => [...prev, {
            ingredient,
            amount_g: '100',
            note: ''
        }])
    }

    const updateRecipeIngredient = (index: number, field: 'amount_g' | 'note', value: string) => {
        setRecipeIngredients(prev => prev.map((ri, i) =>
            i === index ? { ...ri, [field]: value } : ri
        ))
    }

    const removeRecipeIngredient = (index: number) => {
        setRecipeIngredients(prev => prev.filter((_, i) => i !== index))
    }

    const saveRecipeIngredients = async () => {
        if (!selectedRecipe) return

        try {
            // Delete existing ingredients for this recipe
            await fetch(`http://localhost:4000/api/recipes/${selectedRecipe.id}/ingredients`, {
                method: 'DELETE'
            })

            // Add new ingredients
            for (const ri of recipeIngredients) {
                await fetch(`http://localhost:4000/api/recipes/${selectedRecipe.id}/ingredients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ingredient_id: ri.ingredient.id,
                        amount_g: parseFloat(ri.amount_g),
                        note: ri.note || null
                    })
                })
            }

            setShowRecipeBuilder(false)
            setSelectedRecipe(null)
            setRecipeIngredients([])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe')
        }
    }

    const openRecipeBuilder = async (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setShowRecipeBuilder(true)
        await fetchRecipeIngredients(recipe.id)
    }

    const calculateRecipeNutrition = () => {
        if (!selectedRecipe || recipeIngredients.length === 0) return null

        const totals = recipeIngredients.reduce((acc, ri) => {
            const amount = parseFloat(ri.amount_g) || 0
            const factor = amount / 100 

            return {
                kcal: acc.kcal + (ri.ingredient.kcal_per_100g * factor),
                protein: acc.protein + (ri.ingredient.protein_per_100g * factor),
                carbs: acc.carbs + (ri.ingredient.carbs_per_100g * factor),
                fat: acc.fat + (ri.ingredient.fat_per_100g * factor)
            }
        }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })

        const perServing = {
            kcal: totals.kcal / selectedRecipe.servings,
            protein: totals.protein / selectedRecipe.servings,
            carbs: totals.carbs / selectedRecipe.servings,
            fat: totals.fat / selectedRecipe.servings
        }

        return { totals, perServing }
    }

    const filteredIngredients = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'alphabetical') {
            return a.name.localeCompare(b.name)
        }
        return b.id - a.id 
    })

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'alphabetical') {
            return a.name.localeCompare(b.name)
        }
        return b.id - a.id
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground p-6">
                <div className="flex justify-center items-center min-h-96">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Recipe & Ingredient Manager</h1>

                {error && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="p-4">
                            <div className="text-destructive">{error}</div>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Sort Controls */}
                <div className="mb-6 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search ingredients and recipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={sortBy} onValueChange={(value: 'alphabetical' | 'recent') => setSortBy(value)}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="alphabetical">Alphabetical</SelectItem>
                            <SelectItem value="recent">Most Recent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recipes Column */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ChefHat className="h-5 w-5" />
                                    Recipes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => setShowRecipeForm(true)}
                                    className="w-full mb-4"
                                    variant="default"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Recipe
                                </Button>

                                {showRecipeForm && (
                                    <Card className="mb-4 border-dashed">
                                        <CardContent className="p-4 space-y-3">
                                            <Input
                                                placeholder="Recipe name"
                                                value={recipeForm.name}
                                                onChange={(e) => setRecipeForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            <Textarea
                                                placeholder="Description (optional)"
                                                value={recipeForm.description}
                                                onChange={(e) => setRecipeForm(prev => ({ ...prev, description: e.target.value }))}
                                                rows={2}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Number of servings"
                                                value={recipeForm.servings}
                                                onChange={(e) => setRecipeForm(prev => ({ ...prev, servings: e.target.value }))}
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleRecipeSubmit} className="flex-1">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {editingRecipe ? 'Update' : 'Save'} Recipe
                                                </Button>
                                                <Button variant="outline" onClick={resetRecipeForm}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredRecipes.map(recipe => (
                                        <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{recipe.name}</h4>
                                                        {recipe.description && (
                                                            <p className="text-sm text-muted-foreground">{recipe.description}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">{recipe.servings} servings</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openRecipeBuilder(recipe)}
                                                            className="text-blue-600 hover:text-blue-600"
                                                        >
                                                            <ChefHat className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editRecipe(recipe)}
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteRecipe(recipe.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Apple className="h-5 w-5" />
                                    Ingredients
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => setShowIngredientForm(true)}
                                    className="w-full mb-4"
                                    variant="default"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Ingredient
                                </Button>

                                {showIngredientForm && (
                                    <Card className="mb-4 border-dashed">
                                        <CardContent className="p-4 space-y-3">
                                            <Input
                                                placeholder="Ingredient name"
                                                value={ingredientForm.name}
                                                onChange={(e) => setIngredientForm(prev => ({ ...prev, name: e.target.value }))}
                                            />

                                            <div className="text-sm font-medium">Per 100g values:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Calories"
                                                    value={ingredientForm.kcal_per_100g}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, kcal_per_100g: e.target.value }))}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Protein (g)"
                                                    value={ingredientForm.protein_per_100g}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, protein_per_100g: e.target.value }))}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Carbs (g)"
                                                    value={ingredientForm.carbs_per_100g}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, carbs_per_100g: e.target.value }))}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Fat (g)"
                                                    value={ingredientForm.fat_per_100g}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, fat_per_100g: e.target.value }))}
                                                />
                                            </div>

                                            <div className="text-sm font-medium">Serving size (optional):</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Serving size (g)"
                                                    value={ingredientForm.serving_size_g}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, serving_size_g: e.target.value }))}
                                                />
                                                <Input
                                                    placeholder="e.g. '1 medium'"
                                                    value={ingredientForm.serving_description}
                                                    onChange={(e) => setIngredientForm(prev => ({ ...prev, serving_description: e.target.value }))}
                                                />
                                            </div>

                                            {ingredientForm.serving_size_g && ingredientForm.kcal_per_100g && (
                                                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                                                    Per serving: ~{Math.round(calculateServingValues(parseFloat(ingredientForm.kcal_per_100g), parseFloat(ingredientForm.serving_size_g)))} kcal
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button onClick={handleIngredientSubmit} className="flex-1">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {editingIngredient ? 'Update' : 'Save'} Ingredient
                                                </Button>
                                                <Button variant="outline" onClick={resetIngredientForm}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredIngredients.map(ingredient => (
                                        <Card key={ingredient.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                            onDoubleClick={() => addIngredientToRecipe(ingredient)}>
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{ingredient.name}</h4>
                                                        <div className="text-xs text-muted-foreground">
                                                            Per 100g: {ingredient.kcal_per_100g}kcal, P:{ingredient.protein_per_100g}g, C:{ingredient.carbs_per_100g}g, F:{ingredient.fat_per_100g}g
                                                        </div>
                                                        {ingredient.serving_description && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {ingredient.serving_description} ({ingredient.serving_size_g}g): ~{ingredient.kcal_per_serving}kcal
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editIngredient(ingredient)}
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteIngredient(ingredient.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {showRecipeBuilder && selectedRecipe && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold">Build Recipe: {selectedRecipe.name}</h2>
                                    <Button variant="ghost" onClick={() => setShowRecipeBuilder(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Recipe Ingredients</h3>
                                        {recipeIngredients.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">
                                                No ingredients added yet. Double-click ingredients from the right to add them.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {recipeIngredients.map((ri, index) => {
                                                    const amount = parseFloat(ri.amount_g) || 0
                                                    const factor = amount / 100
                                                    const kcal = ri.ingredient.kcal_per_100g * factor
                                                    console.log(ri)
                                                    return (
                                                        <Card key={`${ri.ingredient.id}-${index}`}>
                                                            <CardContent className="p-3">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium">{ri.ingredient.name}</h4>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeRecipeIngredient(index)}
                                                                        className="text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Amount (g)"
                                                                        value={ri.amount_g}
                                                                        onChange={(e) => updateRecipeIngredient(index, 'amount_g', e.target.value)}
                                                                    />
                                                                    <Input
                                                                        placeholder="Note (optional)"
                                                                        value={ri.note}
                                                                        onChange={(e) => updateRecipeIngredient(index, 'note', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {amount}g = {kcal.toFixed(0)} kcal,
                                                                    P: {(ri.ingredient.protein_per_100g * factor).toFixed(1)}g,
                                                                    C: {(ri.ingredient.carbs_per_100g * factor).toFixed(1)}g,
                                                                    F: {(ri.ingredient.fat_per_100g * factor).toFixed(1)}g
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {recipeIngredients.length > 0 && (() => {
                                            const nutrition = calculateRecipeNutrition()
                                            if (!nutrition) return null

                                            return (
                                                <Card className="mt-4 bg-muted/50">
                                                    <CardContent className="p-4">
                                                        <h4 className="font-semibold mb-2">Recipe Nutrition</h4>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <div className="font-medium">Total Recipe:</div>
                                                                <div>{nutrition.totals.kcal.toFixed(0)} kcal</div>
                                                                <div>P: {nutrition.totals.protein.toFixed(1)}g</div>
                                                                <div>C: {nutrition.totals.carbs.toFixed(1)}g</div>
                                                                <div>F: {nutrition.totals.fat.toFixed(1)}g</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">Per Serving ({selectedRecipe.servings} servings):</div>
                                                                <div>{nutrition.perServing.kcal.toFixed(0)} kcal</div>
                                                                <div>P: {nutrition.perServing.protein.toFixed(1)}g</div>
                                                                <div>C: {nutrition.perServing.carbs.toFixed(1)}g</div>
                                                                <div>F: {nutrition.perServing.fat.toFixed(1)}g</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })()}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Available Ingredients</h3>

                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search ingredients in this list..."
                                                value={modalIngredientSearch}
                                                onChange={(e) => setModalIngredientSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {ingredients
                                                .filter(ingredient =>
                                                    modalIngredientSearch.trim() === ""
                                                        ? true
                                                        : ingredient.name.toLowerCase().includes(modalIngredientSearch.toLowerCase())
                                                )
                                                .map(ingredient => (
                                                    <Card
                                                        key={ingredient.id}
                                                        className="hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50"
                                                        onDoubleClick={() => addIngredientToRecipe(ingredient)}
                                                    >
                                                        <CardContent className="p-2">
                                                            <div className="text-sm">
                                                                <div className="font-medium">{ingredient.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Per 100g: {ingredient.kcal_per_100g}kcal,
                                                                    P:{ingredient.protein_per_100g}g,
                                                                    C:{ingredient.carbs_per_100g}g,
                                                                    F:{ingredient.fat_per_100g}g
                                                                </div>
                                                                {recipeIngredients.some(ri => ri.ingredient.id === ingredient.id) && (
                                                                    <div className="text-xs text-green-600 font-medium">✓ Added to recipe</div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                        </div>

                                        <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
                                            💡 Double-click any ingredient to add it to your recipe
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowRecipeBuilder(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={saveRecipeIngredients}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Recipe
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RecipePage