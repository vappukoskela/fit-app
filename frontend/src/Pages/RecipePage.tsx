import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ChefHat, Apple } from 'lucide-react'
import { useIngredients } from '@/hooks/useIngredients'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeList } from '@/components/Lists/RecipeList'
import { IngredientList } from '@/components/Lists/IngredientList'
import { RecipeBuilder } from '@/components/RecipeBuilder'
import { RecipeIngredientCard } from '@/components/Cards/Foods/RecipeIngredientCard'
import type { Recipe, Ingredient, RecipeBuilderIngredient } from '@/types/recipeIngredientTypes'
import { LoadingPage } from '@/components/Loading'

export function RecipePage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [isBuilding, setIsBuilding] = useState(false)
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeBuilderIngredient[]>([])

    const {
        ingredients,
        ingredientFavourites,
        loading: ingredientsLoading,
        error: ingredientsError,
        fetchIngredients,
        toggleIngredientFavourite
    } = useIngredients()

    const {
        recipes,
        recipeFavourites,
        loading: recipesLoading,
        error: recipesError,
        fetchRecipes,
        toggleRecipeFavourite,
        fetchRecipeIngredients
    } = useRecipes()

    const error = ingredientsError || recipesError
    const loading = ingredientsLoading || recipesLoading

    const handleRecipeSelect = async (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setIsBuilding(true)
        try {
            const data = await fetchRecipeIngredients(recipe.id)
            const formatted = data.map(ri => ({
                ingredient: ri.ingredient!,
                amount_g: ri.amount_g.toString(),
                note: ri.note || ''
            }))
            setRecipeIngredients(formatted)
        } catch (err) {
            console.error('Failed to load recipe ingredients:', err)
            setRecipeIngredients([])
        }
    }

    const handleRecipeBuilderClose = () => {
        setIsBuilding(false)
        setSelectedRecipe(null)
        setRecipeIngredients([])
    }

    const handleRecipeUpdate = () => {
        fetchRecipes()
        fetchIngredients()
    }

    const handleAddIngredientInRecipe = (ingredient: Ingredient) => {
        const exists = recipeIngredients.some(ri => ri.ingredient.id === ingredient.id)
        if (exists) {
            setRecipeIngredients(prev => prev.filter(ri => ri.ingredient.id !== ingredient.id))
        } else {
            setRecipeIngredients(prev => [...prev, { ingredient, amount_g: '100', note: '' }])
        }
    }

    const handleUpdateIngredient = (index: number, field: 'amount_g' | 'note', value: string) => {
        setRecipeIngredients(prev => prev.map((ri, i) => i === index ? { ...ri, [field]: value } : ri))
    }

    const handleRemoveIngredient = (index: number) => {
        setRecipeIngredients(prev => prev.filter((_, i) => i !== index))
    }

    const handleSaveSuccess = () => {
        handleRecipeUpdate()
        handleRecipeBuilderClose()
    }

    const filteredIngredients = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading) return <LoadingPage />

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Recipe & Ingredient Manager</h1>

                {error && (
                    <Card className="mb-6 border-destructive">
                        <CardContent className="p-4 text-destructive">{error}</CardContent>
                    </Card>
                )}

                <div className="mb-6 relative max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search ingredients and recipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {isBuilding && selectedRecipe ? (
                            <RecipeBuilder
                                recipe={selectedRecipe}
                                recipeIngredients={recipeIngredients}
                                onUpdateIngredient={handleUpdateIngredient}
                                onRemoveIngredient={handleRemoveIngredient}
                                onClose={handleRecipeBuilderClose}
                                onSaveSuccess={handleSaveSuccess}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ChefHat className="h-5 w-5" /> Recipes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RecipeList
                                        recipes={filteredRecipes}
                                        favourites={recipeFavourites}
                                        onToggleFavourite={toggleRecipeFavourite}
                                        onRecipeUpdate={handleRecipeUpdate}
                                        onRecipeSelect={handleRecipeSelect}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Apple className="h-5 w-5" />
                                    Ingredients
                                    {isBuilding && (
                                        <span className="text-sm text-blue-600 font-normal">
                                            (Click to add/remove from recipe)
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isBuilding ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredIngredients.map(i => (
                                            <RecipeIngredientCard
                                                key={i.id}
                                                ingredient={i}
                                                isAdded={recipeIngredients.some(ri => ri.ingredient.id === i.id)}
                                                onAdd={handleAddIngredientInRecipe}
                                            />
                                        ))}
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm text-blue-700 dark:text-blue-300">
                                            Click ingredients to add/remove them from your recipe
                                        </div>
                                    </div>
                                ) : (
                                    <IngredientList
                                        ingredients={filteredIngredients}
                                        favourites={ingredientFavourites}
                                        onToggleFavourite={toggleIngredientFavourite}
                                        onIngredientUpdate={fetchIngredients}
                                        isRecipeBuilding={false}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecipePage
