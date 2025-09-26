import { useState, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Save, X, Wand2 } from 'lucide-react'
import { IngredientCard } from '@/components/Cards/Foods/IngredientCard'
import type { Ingredient } from '@/types/RecipeIngredient'

interface IngredientForm {
    name: string
    kcal_per_100g: string
    protein_per_100g: string
    carbs_per_100g: string
    fat_per_100g: string
    serving_size_g: string
    serving_description: string
}

interface IngredientListProps {
    ingredients: Ingredient[]
    favourites: number[]
    onToggleFavourite: (ingredientId: number) => void
    onIngredientUpdate: () => void
    isRecipeBuilding?: boolean
}

const ITEM_HEIGHT = 80
const CONTAINER_HEIGHT = 400

function parseNutritionText(input: string) {
    const text = input
        .toLowerCase()
        .replace(/,/g, ".")
        .replace(/\s+/g, " ");
    const findValue = (patterns: (string | RegExp)[]): number | null => {
        for (const p of patterns) {
            const regex = typeof p === "string" ? new RegExp(`${p}[^\\d]*(\\d+(?:\\.\\d+)?)`, "i") : p;
            const match = text.match(regex);
            if (match) return parseFloat(match[1]);
        }
        return null;
    };

    return {
        kcal: findValue([/\b(\d+(?:\.\d+)?)\s*(?:kcal|cal)\b/, /\bcalories[^0-9]*(\d+(?:\.\d+)?)/,]),
        protein: findValue([/\bp\s*([0-9]+(?:\.\d+)?)/, /\bprotein[^0-9]*(\d+(?:\.\d+)?)/,]),
        carbs: findValue([/\bc\s*([0-9]+(?:\.\d+)?)/, /\bcarb(?:s|ohydrates)?[^0-9]*(\d+(?:\.\d+)?)/, /\bhiilihydraat\w*[^0-9]*(\d+(?:\.\d+)?)/,]),
        fat: findValue([/\bf\s*([0-9]+(?:\.\d+)?)/, /\bfat[^0-9]*(\d+(?:\.\d+)?)/, /\brasva\w*[^0-9]*(\d+(?:\.\d+)?)/,]),
    };
}

export function IngredientList({
    ingredients,
    favourites,
    onToggleFavourite,
    onIngredientUpdate,
    isRecipeBuilding
}: IngredientListProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [localSearch, setLocalSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const [form, setForm] = useState<IngredientForm>({
        name: '',
        kcal_per_100g: '',
        protein_per_100g: '',
        carbs_per_100g: '',
        fat_per_100g: '',
        serving_size_g: '',
        serving_description: ''
    })

    const [freeFormText, setFreeFormText] = useState('')

    const filteredIngredients = useMemo(() => {
        if (isRecipeBuilding && localSearch.trim()) {
            return ingredients.filter(ingredient =>
                ingredient.name.toLowerCase().includes(localSearch.toLowerCase())
            )
        }
        return ingredients
    }, [ingredients, localSearch, isRecipeBuilding])

    const { visibleItems, totalHeight, startIndex } = useMemo(() => {
        const itemCount = filteredIngredients.length
        const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 2
        const start = Math.floor(scrollTop / ITEM_HEIGHT)
        const end = Math.min(start + visibleCount, itemCount)

        return {
            visibleItems: filteredIngredients.slice(start, end),
            totalHeight: itemCount * ITEM_HEIGHT,
            startIndex: start,
            endIndex: end
        }
    }, [filteredIngredients, scrollTop])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }

    const calculateServingValues = (per100g: number, servingSize: number) => {
        return (per100g * servingSize / 100)
    }

    const handleParse = () => {
        const result = parseNutritionText(freeFormText)
        setForm(prev => ({
            ...prev,
            kcal_per_100g: result.kcal?.toString() || prev.kcal_per_100g,
            protein_per_100g: result.protein?.toString() || prev.protein_per_100g,
            carbs_per_100g: result.carbs?.toString() || prev.carbs_per_100g,
            fat_per_100g: result.fat?.toString() || prev.fat_per_100g,
        }))
    }

    const handleSubmit = async () => {
        try {
            const servingSize = parseFloat(form.serving_size_g)
            const kcalPer100 = parseFloat(form.kcal_per_100g)
            const proteinPer100 = parseFloat(form.protein_per_100g)
            const carbsPer100 = parseFloat(form.carbs_per_100g)
            const fatPer100 = parseFloat(form.fat_per_100g)

            const payload = {
                name: form.name,
                kcal_per_100g: kcalPer100,
                protein_per_100g: proteinPer100,
                carbs_per_100g: carbsPer100,
                fat_per_100g: fatPer100,
                serving_size_g: servingSize || null,
                serving_description: form.serving_description || null,
                kcal_per_serving: servingSize ? calculateServingValues(kcalPer100, servingSize) : null,
                protein_per_serving: servingSize ? calculateServingValues(proteinPer100, servingSize) : null,
                carbs_per_serving: servingSize ? calculateServingValues(carbsPer100, servingSize) : null,
                fat_per_serving: servingSize ? calculateServingValues(fatPer100, servingSize) : null
            }

            const url = editingId
                ? `http://localhost:4000/api/ingredients/${editingId}`
                : 'http://localhost:4000/api/ingredients'

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to save ingredient')

            onIngredientUpdate()
            resetForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save ingredient')
        }
    }

    const handleEdit = (ingredient: Ingredient) => {
        setForm({
            name: ingredient.name,
            kcal_per_100g: ingredient.kcal_per_100g.toString(),
            protein_per_100g: ingredient.protein_per_100g.toString(),
            carbs_per_100g: ingredient.carbs_per_100g.toString(),
            fat_per_100g: ingredient.fat_per_100g.toString(),
            serving_size_g: ingredient.serving_size_g?.toString() || '',
            serving_description: ingredient.serving_description || ''
        })
        setEditingId(ingredient.id)
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this ingredient?')) return
        try {
            const response = await fetch(`http://localhost:4000/api/ingredients/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete ingredient')
            onIngredientUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete ingredient')
        }
    }

    const resetForm = () => {
        setForm({
            name: '',
            kcal_per_100g: '',
            protein_per_100g: '',
            carbs_per_100g: '',
            fat_per_100g: '',
            serving_size_g: '',
            serving_description: ''
        })
        setFreeFormText('')
        setShowForm(false)
        setEditingId(null)
        setError(null)
    }

    return (
        <div className="space-y-4">
            {!isRecipeBuilding && (
                <Button
                    onClick={() => setShowForm(true)}
                    className="w-full"
                    variant="default"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                </Button>
            )}

            {isRecipeBuilding && (
                <Input
                    placeholder="Search ingredients in this list..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            )}

            {error && (
                <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                    {error}
                </div>
            )}

            {showForm && (
                <Card className="border-dashed">
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="ingredient-name" className="text-sm font-medium">
                                Ingredient Name
                            </Label>
                            <Input
                                id="ingredient-name"
                                placeholder='Enter ingredient name, e.g "apple"'
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                className="text-base"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Quick Parse
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste nutrition info or type: 250 kcal, 20g P, 30g C, 5g F"
                                    value={freeFormText}
                                    onChange={(e) => setFreeFormText(e.target.value)}
                                    onBlur={handleParse}
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleParse}
                                    className="px-3"
                                >
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Per 100g Values
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="calories" className="text-xs text-muted-foreground">
                                        Calories
                                    </Label>
                                    <Input
                                        id="calories"
                                        type="number"
                                        placeholder="250"
                                        value={form.kcal_per_100g}
                                        onChange={(e) => setForm(prev => ({ ...prev, kcal_per_100g: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="protein" className="text-xs text-muted-foreground">
                                        Protein (g)
                                    </Label>
                                    <Input
                                        id="protein"
                                        type="number"
                                        placeholder="20"
                                        value={form.protein_per_100g}
                                        onChange={(e) => setForm(prev => ({ ...prev, protein_per_100g: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="carbs" className="text-xs text-muted-foreground">
                                        Carbs (g)
                                    </Label>
                                    <Input
                                        id="carbs"
                                        type="number"
                                        placeholder="30"
                                        value={form.carbs_per_100g}
                                        onChange={(e) => setForm(prev => ({ ...prev, carbs_per_100g: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="fat" className="text-xs text-muted-foreground">
                                        Fat (g)
                                    </Label>
                                    <Input
                                        id="fat"
                                        type="number"
                                        placeholder="5"
                                        value={form.fat_per_100g}
                                        onChange={(e) => setForm(prev => ({ ...prev, fat_per_100g: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">
                                Serving Size <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="serving-weight" className="text-xs text-muted-foreground">
                                        Weight (g)
                                    </Label>
                                    <Input
                                        id="serving-weight"
                                        type="number"
                                        placeholder="150"
                                        value={form.serving_size_g}
                                        onChange={(e) => setForm(prev => ({ ...prev, serving_size_g: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="serving-desc" className="text-xs text-muted-foreground">
                                        Description
                                    </Label>
                                    <Input
                                        id="serving-desc"
                                        placeholder="1 medium apple"
                                        value={form.serving_description}
                                        onChange={(e) => setForm(prev => ({ ...prev, serving_description: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        {form.serving_size_g && form.kcal_per_100g && (
                            <div className="bg-muted/50 rounded-lg p-3 border">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Per Serving Preview</div>
                                <div className="text-sm">
                                    <span className="font-medium">
                                        ~{Math.round(calculateServingValues(parseFloat(form.kcal_per_100g), parseFloat(form.serving_size_g)))} kcal
                                    </span>
                                    {form.serving_description && (
                                        <span className="text-muted-foreground ml-2">
                                            ({form.serving_description})
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 h-11"
                                disabled={!form.name.trim() || !form.kcal_per_100g}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {editingId ? 'Update Ingredient' : 'Save Ingredient'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                className="h-11 px-4"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div
                ref={containerRef}
                className="overflow-y-auto"
                style={{ height: CONTAINER_HEIGHT }}
                onScroll={handleScroll}
            >
                <div style={{ height: totalHeight, position: 'relative' }}>
                    <div
                        style={{
                            transform: `translateY(${startIndex * ITEM_HEIGHT}px)`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0
                        }}
                    >
                        {visibleItems.map((ingredient) => (
                            <div
                                key={ingredient.id}
                                style={{ height: ITEM_HEIGHT }}
                                className="pb-2"
                            >
                                <IngredientCard
                                    ingredient={ingredient}
                                    isFavourite={favourites.includes(ingredient.id)}
                                    onToggleFavourite={() => onToggleFavourite(ingredient.id)}
                                    onEdit={!isRecipeBuilding ? handleEdit : undefined}
                                    onDelete={!isRecipeBuilding ? handleDelete : undefined}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {filteredIngredients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    {localSearch.trim() ? 'No ingredients found matching your search' : 'No ingredients available'}
                </div>
            )}
        </div>
    )
}