import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, X } from 'lucide-react'
import type { Ingredient, Recipe } from '@/types/RecipeIngredient'

interface DiaryEntryBuilderProps {
    onClose: () => void
    onSave: () => void
    selectedIngredient?: Ingredient | null
    selectedRecipe?: Recipe | null
    date: string
}

export function DiaryEntryBuilder({
    onClose,
    onSave,
    selectedIngredient,
    selectedRecipe,
    date,
}: DiaryEntryBuilderProps) {
    const [amount, setAmount] = useState<string>("")
    const [usePortions, setUsePortions] = useState(false)

const nutrition = useMemo(() => {
    if (selectedIngredient) {
        const grams = usePortions
            ? (parseFloat(amount) || 0) * (selectedIngredient.serving_size_g || 0)
            : parseFloat(amount) || 0
        const factor = grams / 100
        return {
            kcal: selectedIngredient.kcal_per_100g * factor,
            protein: selectedIngredient.protein_per_100g * factor,
            carbs: selectedIngredient.carbs_per_100g * factor,
            fat: selectedIngredient.fat_per_100g * factor,
            grams,
        }
    }

    if (selectedRecipe) {
        const portions = parseFloat(amount) || 0
        const totals = selectedRecipe.ingredients?.reduce(
            (acc, ri) => {
                const factor = ri.amount_g / 100
                return {
                    kcal: acc.kcal + (ri.ingredient?.kcal_per_100g || 0) * factor,
                    protein: acc.protein + (ri.ingredient?.protein_per_100g || 0) * factor,
                    carbs: acc.carbs + (ri.ingredient?.carbs_per_100g || 0) * factor,
                    fat: acc.fat + (ri.ingredient?.fat_per_100g || 0) * factor,
                }
            },
            { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        ) || { kcal: 0, protein: 0, carbs: 0, fat: 0 }

        const perPortion = {
            kcal: totals.kcal / selectedRecipe.servings,
            protein: totals.protein / selectedRecipe.servings,
            carbs: totals.carbs / selectedRecipe.servings,
            fat: totals.fat / selectedRecipe.servings,
        }

        return {
            kcal: perPortion.kcal * portions,
            protein: perPortion.protein * portions,
            carbs: perPortion.carbs * portions,
            fat: perPortion.fat * portions,
            grams: null,
        }
    }

    return null
}, [amount, usePortions, selectedIngredient, selectedRecipe])

    const handleSave = async () => {
        if (!nutrition) return

        await fetch(`http://localhost:4000/api/food_diary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                ingredient_id: selectedIngredient?.id || null,
                recipe_id: selectedRecipe?.id || null,
                grams: nutrition.grams,
                kcal: nutrition.kcal,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fat: nutrition.fat,
            }),
        })

        onSave()
        onClose()
    }

    return (
        <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Add Diary Entry
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent>
                {!selectedIngredient && !selectedRecipe && (
                    <div className="text-muted-foreground text-sm">
                        Select an ingredient or recipe from the right.
                    </div>
                )}

                {(selectedIngredient || selectedRecipe) && (
                    <>
                        <div className="mb-4">
                            <h3 className="font-semibold">
                                {selectedIngredient?.name || selectedRecipe?.name}
                            </h3>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <Input
                                type="number"
                                placeholder={selectedIngredient ? "Grams or portions" : "Servings"}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            {selectedIngredient && selectedIngredient.serving_size_g && (
                                <Button
                                    type="button"
                                    variant={usePortions ? "default" : "outline"}
                                    onClick={() => setUsePortions(!usePortions)}
                                >
                                    {usePortions ? "Using portions" : "Using grams"}
                                </Button>
                            )}
                        </div>

                        {nutrition && (
                            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 mb-4">
                                <CardContent className="p-3 text-sm">
                                    <div className="font-medium mb-1">Entry Nutrition:</div>
                                    <div>{nutrition.kcal.toFixed(0)} kcal</div>
                                    <div>P: {nutrition.protein.toFixed(1)}g</div>
                                    <div>C: {nutrition.carbs.toFixed(1)}g</div>
                                    <div>F: {nutrition.fat.toFixed(1)}g</div>
                                    {nutrition.grams && <div>{nutrition.grams} g</div>}
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={!nutrition}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Entry
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
