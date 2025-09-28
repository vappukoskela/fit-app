import { useReducer, useEffect } from "react"
import {
  recipesReducer,
  initialRecipesState,
} from "@/reducers/recipesReducer"
import type { Recipe, RawRecipeIngredient } from "@/types/RecipeIngredient"

export const useRecipes = () => {
  const [state, dispatch] = useReducer(recipesReducer, initialRecipesState)

  useEffect(() => {
    fetchRecipes()
    fetchRecipeFavourites()
  }, [])

  const fetchRecipes = async () => {
    try {
      dispatch({ type: "FETCH_START" })
      const res = await fetch("http://localhost:4000/api/recipes")
      if (!res.ok) throw new Error("Failed to fetch recipes")
      const data: Recipe[] = await res.json()
      dispatch({ type: "FETCH_SUCCESS", payload: data })
    } catch (err) {
      dispatch({
        type: "FETCH_ERROR",
        payload: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const fetchRecipeFavourites = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/recipes/favorites")
      if (!res.ok) throw new Error("Failed to fetch recipe favourites")
      const data: number[] = await res.json()
      dispatch({ type: "FAVOURITES_SUCCESS", payload: data })
    } catch (err) {
      console.error(err)
    }
  }

  const toggleRecipeFavourite = async (recipeId: number) => {
    try {
      if (state.recipeFavourites.includes(recipeId)) {
        const res = await fetch(
          `http://localhost:4000/api/recipes/${recipeId}/favorite`,
          { method: "DELETE" }
        )
        if (!res.ok) throw new Error("Failed to remove favourite")
      } else {
        const res = await fetch(
          `http://localhost:4000/api/recipes/${recipeId}/favorite`,
          { method: "POST" }
        )
        if (!res.ok) throw new Error("Failed to add favourite")
      }
      dispatch({ type: "TOGGLE_FAVOURITE", payload: recipeId })
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRecipeIngredients = async (recipeId: number) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/recipes/${recipeId}/ingredients`
      )
      if (!res.ok) throw new Error("Failed to fetch recipe ingredients")
      const data: RawRecipeIngredient[] = await res.json()
      return data.map(ri => ({
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
          fat_per_serving: ri.fat_per_serving ? parseFloat(ri.fat_per_serving) : null,
        },
      }))
    } catch (err) {
      console.error(err)
      return []
    }
  }

  return {
    ...state,
    fetchRecipes,
    toggleRecipeFavourite,
    fetchRecipeIngredients,
  }
}
