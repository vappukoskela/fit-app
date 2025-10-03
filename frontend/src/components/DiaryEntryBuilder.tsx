import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'
import type { Ingredient, Recipe } from '@/types/recipeIngredientTypes'

interface DiaryEntryBuilderProps {
    onClose: () => void
    onSave: () => void
    selectedIngredient?: Ingredient | null
    selectedRecipe?: Recipe | null
}

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

export function DiaryEntryBuilder({
    onClose,
    onSave,
    selectedIngredient,
    selectedRecipe,
}: DiaryEntryBuilderProps) {

    const [date, setDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
    const [baseGramsPerPortion, setBaseGramsPerPortion] = useState(100);
    const [portions, setPortions] = useState("1");
    const [grams, setGrams] = useState("100");
    const [meal, setMeal] = useState<string>("");

    const [description, setDescription] = useState<string>("")

    useEffect(() => {
        if (selectedIngredient) {
            setDescription(selectedIngredient.name);
            setPortions("1");
            const base = selectedIngredient.serving_size_g ?? 100;
            setGrams(base.toString());
            setBaseGramsPerPortion(base);
        }

        else if (selectedRecipe) {
            setDescription(selectedRecipe.name);
            setPortions("1");
        }
    }, [selectedIngredient, selectedRecipe]);


    const handlePortionsChange = (value: string) => {
        setPortions(value);
        const p = parseFloat(value) || 0;
        setGrams((baseGramsPerPortion * p).toFixed(0))
    };

    const handleGramsChange = (value: string) => {
        setGrams(value);
        const g = parseFloat(value) || 0;
        setPortions((g / baseGramsPerPortion).toFixed(1));
    };

    const nutrition = useMemo(() => {
        if (selectedIngredient) {
            const gramsNum = parseFloat(grams) || 0
            const factor = gramsNum / 100
            return {
                kcal: selectedIngredient.kcal_per_100g * factor,
                protein: selectedIngredient.protein_per_100g * factor,
                carbs: selectedIngredient.carbs_per_100g * factor,
                fat: selectedIngredient.fat_per_100g * factor,
                grams: gramsNum,
            }
        }

        if (selectedRecipe) {
            const portionsNum = parseFloat(portions) || 0
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
                kcal: perPortion.kcal * portionsNum,
                protein: perPortion.protein * portionsNum,
                carbs: perPortion.carbs * portionsNum,
                fat: perPortion.fat * portionsNum,
                grams: null,
            }
        }

        return null
    }, [grams, portions, selectedIngredient, selectedRecipe])

    const handleSave = async () => {
        console.log("Saving entry with:", { date, meal, description, grams, portions, nutrition, selectedIngredient, selectedRecipe });
        if (!nutrition || !meal || !date) return

        try {
            const response = await fetch(`http://localhost:4000/api/diary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 1,
                    log_date: date,
                    meal: meal,
                    description: description,
                    ingredient_id: selectedIngredient?.id || null,
                    recipe_id: selectedRecipe?.id || null,
                    portion_size: parseFloat(grams) || parseFloat(portions) || 1,
                    kcal: nutrition.kcal,
                    protein: nutrition.protein,
                    carbs: nutrition.carbs,
                    fat: nutrition.fat,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save entry')
            }

            onSave()
            onClose()
        } catch (err) {
            console.error('Error saving entry:', err)
        }
    }

    return (
        <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Add Diary Entry
                </CardTitle>
            </CardHeader>

            <CardContent>


                <Label htmlFor='date' className="mb-2">Date</Label>
                <Input
                    id="date"
                    type="date"
                    className="mb-4"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <div className='space-y-2'>
                    <Label htmlFor="meal">Meal </Label>
                    <Select value={meal} onValueChange={setMeal}>
                        <SelectTrigger id="meal">
                            <SelectValue placeholder="Select meal" />
                        </SelectTrigger>
                        <SelectContent>
                            {MEAL_OPTIONS.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedIngredient && (
                    <>
                        <div className="mb-4">
                            <h3 className="font-semibold text-lg">
                                {selectedIngredient.name}
                            </h3>
                            {selectedIngredient.serving_size_g && (
                                <p className="text-sm text-muted-foreground">
                                    Serving size: {selectedIngredient.serving_size_g}g
                                </p>
                            )}
                        </div>

                        <div className="space-y-4 mb-4 ">


                            <div className='space-y-2'>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional notes..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="grams">Grams</Label>
                                <Input
                                    id="grams"
                                    type="number"
                                    step="0.1"
                                    placeholder="Enter grams"
                                    value={grams}
                                    onChange={(e) => handleGramsChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portions">Portions</Label>
                                <Input
                                    id="portions"
                                    type="number"
                                    step="0.1"
                                    placeholder="Enter portions"
                                    value={portions}
                                    onChange={(e) => handlePortionsChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {nutrition && (
                            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 mb-4">
                                <CardContent className="p-4 text-sm space-y-2">
                                    <div className="font-semibold text-base mb-2">Entry Nutrition:</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Calories:</span>
                                            <span className="font-medium">{nutrition.kcal.toFixed(0)} kcal</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Protein:</span>
                                            <span className="font-medium">{nutrition.protein.toFixed(1)}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Carbs:</span>
                                            <span className="font-medium">{nutrition.carbs.toFixed(1)}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fat:</span>
                                            <span className="font-medium">{nutrition.fat.toFixed(1)}g</span>
                                        </div>
                                    </div>
                                    {nutrition.grams && (
                                        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Total weight:</span>
                                                <span className="font-medium">{nutrition.grams.toFixed(1)}g</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={!nutrition || !grams || !meal}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Entry
                            </Button>
                        </div>
                    </>
                )}

                {selectedRecipe && (
                    <>
                        <div className="mb-4">
                            <h3 className="font-semibold text-lg">
                                {selectedRecipe.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Recipe serves: {selectedRecipe.servings}
                            </p>
                        </div>

                        <div className="space-y-4 mb-4">
                            <div>
                                <Label htmlFor="meal-recipe">Meal *</Label>
                                <Select value={meal} onValueChange={setMeal}>
                                    <SelectTrigger id="meal-recipe">
                                        <SelectValue placeholder="Select meal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEAL_OPTIONS.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="description-recipe">Description</Label>
                                <Textarea
                                    id="description-recipe"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional notes..."
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label htmlFor="recipe-portions">Servings</Label>
                                <Input
                                    id="recipe-portions"
                                    type="number"
                                    step="0.1"
                                    placeholder="Enter number of servings"
                                    value={portions}
                                    onChange={(e) => setPortions(e.target.value)}
                                />
                            </div>
                        </div>

                        {nutrition && (
                            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 mb-4">
                                <CardContent className="p-4 text-sm space-y-2">
                                    <div className="font-semibold text-base mb-2">Entry Nutrition:</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Calories:</span>
                                            <span className="font-medium">{nutrition.kcal.toFixed(0)} kcal</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Protein:</span>
                                            <span className="font-medium">{nutrition.protein.toFixed(1)}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Carbs:</span>
                                            <span className="font-medium">{nutrition.carbs.toFixed(1)}g</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fat:</span>
                                            <span className="font-medium">{nutrition.fat.toFixed(1)}g</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={!nutrition || !portions || !date}>
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