import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Edit2, Save, X, Trash2, ChefHat, Star } from 'lucide-react'
import type { Recipe } from '@/types/recipeIngredientTypes'

interface RecipeForm {
    name: string
    description: string
    servings: string
}

interface RecipeListProps {
    recipes: Recipe[]
    favourites: number[]
    onToggleFavourite: (recipeId: number) => void
    onRecipeUpdate: () => void
    onRecipeSelect: (recipe: Recipe) => void
}

export function RecipeList({
    recipes,
    favourites,
    onToggleFavourite,
    onRecipeUpdate,
    onRecipeSelect
}: RecipeListProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState<RecipeForm>({
        name: '',
        description: '',
        servings: '1'
    })

    const handleSubmit = async () => {
        try {
            const payload = {
                name: form.name,
                description: form.description || null,
                servings: parseInt(form.servings)
            }

            const url = editingId
                ? `http://localhost:4000/api/recipes/${editingId}`
                : 'http://localhost:4000/api/recipes'

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to save recipe')

            onRecipeUpdate()
            resetForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save recipe')
        }
    }

    const handleEdit = (recipe: Recipe) => {
        setForm({
            name: recipe.name,
            description: recipe.description || '',
            servings: recipe.servings.toString()
        })
        setEditingId(recipe.id)
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this recipe?')) return

        try {
            const response = await fetch(`http://localhost:4000/api/recipes/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete recipe')
            onRecipeUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete recipe')
        }
    }

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            servings: '1'
        })
        setShowForm(false)
        setEditingId(null)
        setError(null)
    }

    return (
        <div className="space-y-4">
            <Button
                onClick={() => setShowForm(true)}
                className="w-full"
                variant="default"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
            </Button>

            {error && (
                <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                    {error}
                </div>
            )}

            {showForm && (
                <Card className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="recipe-name" className="text-sm font-medium">
                                    Recipe Name
                                </Label>
                                <Input
                                    id="recipe-name"
                                    placeholder='e.g. "Spag Bol with Carrots"'
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="servings" className="text-sm font-medium">
                                    Servings
                                </Label>
                                <Input
                                    id="servings"
                                    type="number"
                                    min="1"
                                    value={form.servings}
                                    onChange={(e) => setForm(prev => ({ ...prev, servings: e.target.value }))}
                                    className="text-center font-medium text-muted-foreground"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder='Description or cooking instructions'
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSubmit} className="flex-1"disabled={!form.name.trim()}>
                                <Save className="h-4 w-4 mr-2" />
                                {editingId ? 'Update' : 'Save'} Recipe
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {recipes.map(recipe => (
                    <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-semibold">{recipe.name}</h4>
                                    {recipe.description && (
                                        <p className="text-sm text-muted-foreground">{recipe.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {recipe.servings} servings - {recipe.kcal_per_portion} kcal/portion
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onToggleFavourite(recipe.id)}
                                    >
                                        {favourites.includes(recipe.id) ? (
                                            <Star fill="yellow" className="h-4 w-4 text-yellow-400" />
                                        ) : (
                                            <Star className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRecipeSelect(recipe)}
                                        className="text-blue-600 hover:text-blue-600"
                                    >
                                        <ChefHat className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(recipe)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(recipe.id)}
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
        </div>
    )
}