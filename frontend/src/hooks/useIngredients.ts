import { useReducer, useEffect } from "react"
import {
    ingredientsReducer,
    initialIngredientsState,
} from "@/reducers/ingredientsReducer"
import type { Ingredient } from "@/types/recipeIngredientTypes"

export const useIngredients = () => {
    const [state, dispatch] = useReducer(
        ingredientsReducer,
        initialIngredientsState
    )

    useEffect(() => {
        fetchIngredients()
        fetchIngredientFavourites()
    }, [])

    const fetchIngredients = async () => {
        try {
            dispatch({ type: "FETCH_START" })
            const res = await fetch("http://localhost:4000/api/ingredients")
            if (!res.ok) throw new Error("Failed to fetch ingredients")
            const data: Ingredient[] = await res.json()
            dispatch({ type: "FETCH_SUCCESS", payload: data })
        } catch (err) {
            dispatch({
                type: "FETCH_ERROR",
                payload: err instanceof Error ? err.message : "Unknown error",
            })
        }
    }

    const fetchIngredientFavourites = async () => {
        try {
            const res = await fetch(
                "http://localhost:4000/api/ingredients/favorites"
            )
            if (!res.ok) throw new Error("Failed to fetch ingredient favourites")
            const data: number[] = await res.json()
            dispatch({ type: "FAVOURITES_SUCCESS", payload: data })
        } catch (err) {
            console.error(err)
        }
    }

    const toggleIngredientFavourite = async (ingredientId: number) => {
        try {
            if (state.ingredientFavourites.includes(ingredientId)) {
                const res = await fetch(
                    `http://localhost:4000/api/ingredients/${ingredientId}/favorite`,
                    { method: "DELETE" }
                )
                if (!res.ok) throw new Error("Failed to remove favourite")
            } else {
                const res = await fetch(
                    `http://localhost:4000/api/ingredients/${ingredientId}/favorite`,
                    { method: "POST" }
                )
                if (!res.ok) throw new Error("Failed to add favourite")
            }
            dispatch({ type: "TOGGLE_FAVOURITE", payload: ingredientId })
        } catch (err) {
            console.error(err)
        }
    }

    return {
        ...state,
        fetchIngredients,
        toggleIngredientFavourite,
    }
}
