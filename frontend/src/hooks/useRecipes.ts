import { useState, useEffect } from 'react'
import type { Recipe, RecipeIngredient, RawRecipeIngredient } from '@/types/RecipeIngredient'

export const useRecipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [recipeFavourites, setRecipeFavourites] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchRecipes()
        fetchRecipeFavourites()
    }, [])

    const fetchRecipes = async () => {
        try {
            setLoading(true)
            const res = await fetch('http://localhost:4000/api/recipes')
            if (!res.ok) throw new Error('Failed to fetch recipes')
            const data: Recipe[] = await res.json()
            setRecipes(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const fetchRecipeFavourites = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/recipes/favorites')
            if (!res.ok) throw new Error('Failed to fetch recipe favourites')
            const data: number[] = await res.json()
            setRecipeFavourites(data)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleRecipeFavourite = async (recipeId: number) => {
        try {
            if (recipeFavourites.includes(recipeId)) {
                const res = await fetch(`http://localhost:4000/api/recipes/${recipeId}/favorite`, { method: 'DELETE' })
                if (!res.ok) throw new Error('Failed to remove favourite')
                setRecipeFavourites(prev => prev.filter(id => id !== recipeId))
            } else {
                const res = await fetch(`http://localhost:4000/api/recipes/${recipeId}/favorite`, { method: 'POST' })
                if (!res.ok) throw new Error('Failed to add favourite')
                setRecipeFavourites(prev => [...prev, recipeId])
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchRecipeIngredients = async (recipeId: number) => {
        try {
            const res = await fetch(`http://localhost:4000/api/recipes/${recipeId}/ingredients`)
            if (!res.ok) throw new Error('Failed to fetch recipe ingredients')
            const data: RawRecipeIngredient[] = await res.json()
            const formatted: RecipeIngredient[] = data.map(ri => ({
                id: ri.id,
                recipe_id: ri.recipe_id,
                ingredient_id: ri.ingredient_id,
                amount_g: parseFloat(ri.amount_g),
                note: ri.note,
                ingredient: {
                    id: ri.ingredient_id,
                    name: ri.name,
                    kcal_per_100g: parseFloat(ri.kcal_per_100g),
                    protein_per_100g: parseFloat(ri.protein_per_100g),
                    carbs_per_100g: parseFloat(ri.carbs_per_100g),
                    fat_per_100g: parseFloat(ri.fat_per_100g),
                    serving_size_g: ri.serving_size_g ? parseFloat(ri.serving_size_g) : null,
                    serving_description: ri.serving_description,
                    kcal_per_serving: ri.kcal_per_serving ? parseFloat(ri.kcal_per_serving) : null,
                    protein_per_serving: ri.protein_per_serving ? parseFloat(ri.protein_per_serving) : null,
                    carbs_per_serving: ri.carbs_per_serving ? parseFloat(ri.carbs_per_serving) : null,
                    fat_per_serving: ri.fat_per_serving ? parseFloat(ri.fat_per_serving) : null
                }
            }))
            return formatted
        } catch (err) {
            console.error(err)
            return []
        }
    }

    return {
        recipes,
        recipeFavourites,
        loading,
        error,
        fetchRecipes,
        toggleRecipeFavourite,
        fetchRecipeIngredients
    }
}
