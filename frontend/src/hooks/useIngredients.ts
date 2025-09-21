import { useState, useEffect } from 'react'
import type { Ingredient } from '@/types/RecipeIngredient'

export const useIngredients = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [ingredientFavourites, setIngredientFavourites] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchIngredients()
        fetchIngredientFavourites()
    }, [])

    const fetchIngredients = async () => {
        try {
            setLoading(true)
            const res = await fetch('http://localhost:4000/api/ingredients')
            if (!res.ok) throw new Error('Failed to fetch ingredients')
            const data: Ingredient[] = await res.json()
            setIngredients(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const fetchIngredientFavourites = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/ingredients/favorites')
            if (!res.ok) throw new Error('Failed to fetch ingredient favourites')
            const data: number[] = await res.json()
            setIngredientFavourites(data)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleIngredientFavourite = async (ingredientId: number) => {
        try {
            if (ingredientFavourites.includes(ingredientId)) {
                const res = await fetch(`http://localhost:4000/api/ingredients/${ingredientId}/favorite`, { method: 'DELETE' })
                if (!res.ok) throw new Error('Failed to remove favourite')
                setIngredientFavourites(prev => prev.filter(id => id !== ingredientId))
            } else {
                const res = await fetch(`http://localhost:4000/api/ingredients/${ingredientId}/favorite`, { method: 'POST' })
                if (!res.ok) throw new Error('Failed to add favourite')
                setIngredientFavourites(prev => [...prev, ingredientId])
            }
        } catch (err) {
            console.error(err)
        }
    }

    return {
        ingredients,
        ingredientFavourites,
        loading,
        error,
        fetchIngredients,
        toggleIngredientFavourite
    }
}
