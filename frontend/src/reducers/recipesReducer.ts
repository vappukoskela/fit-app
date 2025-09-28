import type { Recipe } from "@/types/RecipeIngredient"

export type RecipesState = {
  recipes: Recipe[]
  recipeFavourites: number[]
  loading: boolean
  error: string | null
}

export type RecipesAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Recipe[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "FAVOURITES_SUCCESS"; payload: number[] }
  | { type: "TOGGLE_FAVOURITE"; payload: number }

export function recipesReducer(
  state: RecipesState,
  action: RecipesAction
): RecipesState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCESS":
      return { ...state, recipes: action.payload, loading: false }
    case "FETCH_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "FAVOURITES_SUCCESS":
      return { ...state, recipeFavourites: action.payload }
    case "TOGGLE_FAVOURITE":
      return state.recipeFavourites.includes(action.payload)
        ? {
            ...state,
            recipeFavourites: state.recipeFavourites.filter(
              id => id !== action.payload
            ),
          }
        : {
            ...state,
            recipeFavourites: [...state.recipeFavourites, action.payload],
          }
    default:
      return state
  }
}

export const initialRecipesState: RecipesState = {
  recipes: [],
  recipeFavourites: [],
  loading: true,
  error: null,
}
