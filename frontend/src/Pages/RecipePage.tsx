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
    const [sortBy, setSortBy] = useState<'alphabetical' | 'recent'>('alphabetical')

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
    const [recipeIngredients, setRecipeIngredients] = useState<{ ingredient: Ingredient, amount: string, note: string }[]>([])

    useEffect(() => {
        fetchRecipesAndIngredients()
    }, [])

    const fetchRecipesAndIngredients = async () => {
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

            console.log('Submitting ingredient:', payload)
            const url = editingIngredient
                ? `http://localhost:4000/api/ingredients/${editingIngredient}`
                : 'http://localhost:4000/api/ingredients'

            const response = await fetch(url, {
                method: editingIngredient ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to save ingredient')

            await fetchRecipesAndIngredients()
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

            await fetchRecipesAndIngredients()
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
            await fetchRecipesAndIngredients()
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
            await fetchRecipesAndIngredients()
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
            amount: '100',
            note: ''
        }])
    }

    const filteredIngredients = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'alphabetical') {
            return a.name.localeCompare(b.name)
        }
        return b.id - a.id // recent first
    })

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'alphabetical') {
            return a.name.localeCompare(b.name)
        }
        return b.id - a.id // recent first
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

                    {/* Ingredients Column */}
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
            </div>
        </div>
    )
}

export default RecipePage;