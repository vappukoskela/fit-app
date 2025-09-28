import type { Ingredient } from "@/types/RecipeIngredient"

export type IngredientsState = {
  ingredients: Ingredient[]
  ingredientFavourites: number[]
  loading: boolean
  error: string | null
}

export type IngredientsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Ingredient[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "FAVOURITES_SUCCESS"; payload: number[] }
  | { type: "TOGGLE_FAVOURITE"; payload: number }

export function ingredientsReducer(
  state: IngredientsState,
  action: IngredientsAction
): IngredientsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCESS":
      return { ...state, ingredients: action.payload, loading: false }
    case "FETCH_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "FAVOURITES_SUCCESS":
      return { ...state, ingredientFavourites: action.payload }
    case "TOGGLE_FAVOURITE":
      return state.ingredientFavourites.includes(action.payload)
        ? {
            ...state,
            ingredientFavourites: state.ingredientFavourites.filter(
              id => id !== action.payload
            ),
          }
        : {
            ...state,
            ingredientFavourites: [...state.ingredientFavourites, action.payload],
          }
    default:
      return state
  }
}

export const initialIngredientsState: IngredientsState = {
  ingredients: [],
  ingredientFavourites: [],
  loading: true,
  error: null,
}
