import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, X, Trash2 } from 'lucide-react'
import type { Recipe, Ingredient, RecipeIngredient } from '@/types/RecipeIngredient'
import { LoadingPage } from './Loading'

interface RecipeBuilderIngredient {
    ingredient: Ingredient
    amount_g: string
    note: string
}

interface RecipeBuilderProps {
    recipe: Recipe
    onClose: () => void
    onUpdate: () => void
    fetchRecipeIngredients: (recipeId: number) => Promise<RecipeIngredient[]>
    onToggleIngredient: (ingredient: Ingredient) => void
    recipeIngredients: RecipeBuilderIngredient[]
}

// TODO: Ingredient render optimization w React.memo? Or smth else?
// TODO: Ingredient portion handling where applicable

export function RecipeBuilder({
    recipe,
    onClose,
    onUpdate,
    fetchRecipeIngredients,
    onToggleIngredient,
    recipeIngredients
}: RecipeBuilderProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [localRecipeIngredients, setLocalRecipeIngredients] = useState<RecipeBuilderIngredient[]>([])

    const loadRecipeIngredients = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchRecipeIngredients(recipe.id)
            const formatted = data.map(ri => ({
                ingredient: ri.ingredient!,
                amount_g: ri.amount_g.toString(),
                note: ri.note || '',
            }))
            setLocalRecipeIngredients(formatted)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recipe ingredients')
        } finally {
            setLoading(false)
        }
    }, [fetchRecipeIngredients, recipe.id])

    useEffect(() => {
        if (recipeIngredients.length > 0) {
            setLocalRecipeIngredients(prev => {
                const existingIds = prev.map(ri => ri.ingredient.id)
                const newIngredients = recipeIngredients.filter(ri => !existingIds.includes(ri.ingredient.id))
                return [...prev, ...newIngredients]
            })
        } else {
            loadRecipeIngredients()
        }
    }, [recipe.id, recipeIngredients, loadRecipeIngredients])

    const updateRecipeIngredient = (index: number, field: 'amount_g' | 'note', value: string) => {
        setLocalRecipeIngredients(prev => prev.map((ri, i) =>
            i === index ? { ...ri, [field]: value } : ri
        ))
    }

    const removeRecipeIngredient = (index: number) => {
        const ingredient = localRecipeIngredients[index].ingredient
        setLocalRecipeIngredients(prev => prev.filter((_, i) => i !== index))
        onToggleIngredient(ingredient)
    }

    const saveRecipeIngredients = async () => {
        setLoading(true)
        try {
            await fetch(`http://localhost:4000/api/recipes/${recipe.id}/ingredients`, {
                method: 'DELETE'
            })

            for (const ri of localRecipeIngredients) {
                await fetch(`http://localhost:4000/api/recipes/${recipe.id}/ingredients`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ingredient_id: ri.ingredient.id,
                        amount_g: parseFloat(ri.amount_g),
                        note: ri.note || null
                    })
                })
            }

            onUpdate()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe ingredients')
        } finally {
            setLoading(false)
        }
    }

    const calculateRecipeNutrition = useCallback(() => {
        if (localRecipeIngredients.length === 0) return null

        const totals = localRecipeIngredients.reduce((acc, ri) => {
            const amount = parseFloat(ri.amount_g) || 0
            const factor = amount / 100

            return {
                kcal: acc.kcal + (ri.ingredient.kcal_per_100g * factor),
                protein: acc.protein + (ri.ingredient.protein_per_100g * factor),
                carbs: acc.carbs + (ri.ingredient.carbs_per_100g * factor),
                fat: acc.fat + (ri.ingredient.fat_per_100g * factor),
            }
        }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })

        const perServing = {
            kcal: totals.kcal / recipe.servings,
            protein: totals.protein / recipe.servings,
            carbs: totals.carbs / recipe.servings,
            fat: totals.fat / recipe.servings,
        }

        return { totals, perServing }
    }, [localRecipeIngredients, recipe.servings])

    const nutrition = useMemo(() => calculateRecipeNutrition(), [calculateRecipeNutrition])

    return (
        <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        Recipe Builder: {recipe.name}
                        <span className="text-sm font-normal text-muted-foreground">
                            ({localRecipeIngredients.length} ingredients)
                        </span>
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="text-destructive text-sm p-2 bg-destructive/10 rounded mb-4">
                        {error}
                    </div>
                )}
                {loading && (
                    <LoadingPage message="Loading recipe ingredients..." />
                )}

                <>
                    {!loading && (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Recipe Ingredients</h3>
                                {localRecipeIngredients.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No ingredients added yet.</p>
                                        <p className="text-sm">Select ingredients from the right to add them to the recipe.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {localRecipeIngredients.map((ri, index) => {
                                            const amount = parseFloat(ri.amount_g) || 0
                                            const factor = amount / 100
                                            const kcal = ri.ingredient.kcal_per_100g * factor
                                            return (
                                                <Card key={`${ri.ingredient.id}-${index}`} className="bg-muted/30">
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
                            </div>

                            {nutrition && (
                                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 mb-6">
                                    <CardContent className="p-4">
                                        <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Recipe Nutrition</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="font-medium text-green-700 dark:text-green-300">Total Recipe:</div>
                                                <div>{nutrition.totals.kcal.toFixed(0)} kcal</div>
                                                <div>P: {nutrition.totals.protein.toFixed(1)}g</div>
                                                <div>C: {nutrition.totals.carbs.toFixed(1)}g</div>
                                                <div>F: {nutrition.totals.fat.toFixed(1)}g</div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-green-700 dark:text-green-300">Per Serving ({recipe.servings} servings):</div>
                                                <div>{nutrition.perServing.kcal.toFixed(0)} kcal</div>
                                                <div>P: {nutrition.perServing.protein.toFixed(1)}g</div>
                                                <div>C: {nutrition.perServing.carbs.toFixed(1)}g</div>
                                                <div>F: {nutrition.perServing.fat.toFixed(1)}g</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={saveRecipeIngredients} disabled={loading}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Recipe
                                </Button>
                            </div>
                        </>
                    )}
                </>
            </CardContent>
        </Card >
    )
}