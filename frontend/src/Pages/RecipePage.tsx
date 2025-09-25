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
import type { Recipe, Ingredient } from '@/types/RecipeIngredient'
import { LoadingPage } from '@/components/Loading'

interface RecipeBuilderIngredient {
    ingredient: Ingredient
    amount_g: string
    note: string
}

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

    const handleIngredientUpdate = () => {
        fetchIngredients()
    }

    const handleAddIngredientInRecipe = (ingredient: Ingredient) => {
        const isAdded = recipeIngredients.some(ri => ri.ingredient.id === ingredient.id)
        if (isAdded) {
            setRecipeIngredients(prev => prev.filter(ri => ri.ingredient.id !== ingredient.id))
        } else {
            setRecipeIngredients(prev => [...prev, {
                ingredient,
                amount_g: '100',
                note: ''
            }])
        }
    }

    const filteredIngredients = ingredients.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
           <LoadingPage />
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

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search ingredients and recipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {isBuilding && selectedRecipe ? (
                            <RecipeBuilder
                                recipe={selectedRecipe}
                                onClose={handleRecipeBuilderClose}
                                onUpdate={handleRecipeUpdate}
                                fetchRecipeIngredients={fetchRecipeIngredients}
                                onToggleIngredient={handleAddIngredientInRecipe}
                                recipeIngredients={recipeIngredients}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ChefHat className="h-5 w-5" />
                                        Recipes
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
                                        {filteredIngredients.map(ingredient => (
                                            <RecipeIngredientCard
                                                key={ingredient.id}
                                                ingredient={ingredient}
                                                isAdded={recipeIngredients.some(ri => ri.ingredient.id === ingredient.id)}
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
                                        onIngredientUpdate={handleIngredientUpdate}
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