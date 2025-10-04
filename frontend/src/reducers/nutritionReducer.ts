import type { Ingredient, Recipe } from "@/types/recipeIngredientTypes"

export interface FoodEntry {
    id: number
    user_id: number
    log_date: string
    recipe_id: number | null
    meal: string
    description: string
    portion_size: number
    kcal: number
    protein: number
    carbs: number
    fat: number
    created_at: string
}

export type NutritionState = {
    entries: FoodEntry[]
    ingredients: Ingredient[]
    recipes: Recipe[]
    ingredientFavourites: number[]
    recipeFavourites: number[]
    loading: boolean
    error: string | null
    showAddForm: boolean
    selectedIngredient: Ingredient | null
    selectedRecipe: Recipe | null
    expandedRecipeIngredients: Array<{ ingredient: Ingredient; amount_g: number }> | null
    editingEntry: {
        id: number
        form: Partial<FoodEntry>
        originalGrams: number
        originalNutrition: {
            kcal: number
            protein: number
            carbs: number
            fat: number
        }
    } | null
}

export type NutritionAction =
    | { type: "FETCH_START" }
    | { type: "FETCH_SUCCESS"; payload: { entries: FoodEntry[]; ingredients: Ingredient[]; recipes: Recipe[] } }
    | { type: "FETCH_ERROR"; payload: string }
    | { type: "SET_FAVOURITES"; payload: { ingredients: number[]; recipes: number[] } }
    | { type: "TOGGLE_ADD_FORM" }
    | { type: "SELECT_INGREDIENT"; payload: Ingredient }
    | { type: "SELECT_RECIPE"; payload: Recipe }
    | { type: "EXPAND_RECIPE"; payload: Array<{ ingredient: Ingredient; amount_g: number }> }
    | { type: "CLEAR_SELECTION" }
    | { type: "START_EDIT"; payload: FoodEntry }
    | { type: "UPDATE_EDIT_FORM"; payload: Partial<FoodEntry> }
    | { type: "UPDATE_EDIT_GRAMS"; payload: number }
    | { type: "CANCEL_EDIT" }
    | { type: "TOGGLE_INGREDIENT_FAVOURITE"; payload: number }
    | { type: "TOGGLE_RECIPE_FAVOURITE"; payload: number }
    | { type: "SAVE_ENTRY"; payload: FoodEntry }
    | { type: "DELETE_ENTRY"; payload: number }


export function nutritionReducer(state: NutritionState, action: NutritionAction): NutritionState {
    console.log('Action dispatched:', action)
    console.log('Current state:', state)
    switch (action.type) {
        case "FETCH_START":
            return { ...state, loading: true, error: null }

        case "FETCH_SUCCESS":
            return {
                ...state,
                entries: action.payload.entries,
                ingredients: action.payload.ingredients,
                recipes: action.payload.recipes,
                loading: false,
                error: null
            }

        case "FETCH_ERROR":
            return { ...state, loading: false, error: action.payload }

        case "SET_FAVOURITES":
            return {
                ...state,
                ingredientFavourites: action.payload.ingredients,
                recipeFavourites: action.payload.recipes
            }

        case "TOGGLE_ADD_FORM":
            return {
                ...state,
                showAddForm: !state.showAddForm,
                selectedIngredient: null,
                selectedRecipe: null,
                expandedRecipeIngredients: null
            }

        case "SELECT_INGREDIENT":
            return {
                ...state,
                selectedIngredient: action.payload,
                selectedRecipe: null,
                expandedRecipeIngredients: null
            }

        case "SELECT_RECIPE":
            return {
                ...state,
                selectedRecipe: action.payload,
                selectedIngredient: null,
                expandedRecipeIngredients: null
            }

        case "EXPAND_RECIPE":
            return {
                ...state,
                expandedRecipeIngredients: action.payload,
                selectedRecipe: null,
                selectedIngredient: null
            }

        case "CLEAR_SELECTION":
            return {
                ...state,
                selectedIngredient: null,
                selectedRecipe: null,
                expandedRecipeIngredients: null,
                showAddForm: false
            }

        case "START_EDIT":
            {
                const dateOnly = action.payload.log_date.includes('T')
                    ? action.payload.log_date.split('T')[0]
                    : action.payload.log_date
                return {
                    ...state,
                    editingEntry: {
                        id: action.payload.id,
                        form: {
                            ...action.payload,
                            kcal: action.payload.kcal != null ? Number(action.payload.kcal) : undefined,
                            protein: action.payload.protein != null ? Number(action.payload.protein) : undefined,
                            carbs: action.payload.carbs != null ? Number(action.payload.carbs) : undefined,
                            fat: action.payload.fat != null ? Number(action.payload.fat) : undefined,
                            log_date: dateOnly,
                        },
                        originalGrams: action.payload.portion_size,
                        originalNutrition: {
                            kcal: action.payload.kcal,
                            protein: action.payload.protein,
                            carbs: action.payload.carbs,
                            fat: action.payload.fat
                        }
                    }
                }
            }

        case "UPDATE_EDIT_FORM":
            if (!state.editingEntry) return state
            return {
                ...state,
                editingEntry: {
                    ...state.editingEntry,
                    form: { ...state.editingEntry.form, ...action.payload }
                }
            }

        case "UPDATE_EDIT_GRAMS":
            {
                if (!state.editingEntry) return state
                const originalGrams = state.editingEntry.originalGrams || 1
                const originalNutrition = state.editingEntry.originalNutrition
                const ratio = action.payload / originalGrams

                return {
                    ...state,
                    editingEntry: {
                        ...state.editingEntry,
                        form: {
                            ...state.editingEntry.form,
                            portion_size: action.payload,
                            kcal: originalNutrition.kcal * ratio,
                            protein: originalNutrition.protein * ratio,
                            carbs: originalNutrition.carbs * ratio,
                            fat: originalNutrition.fat * ratio
                        }
                    }
                }
            }

        case "CANCEL_EDIT":
            return { ...state, editingEntry: null }

        case "TOGGLE_INGREDIENT_FAVOURITE":
            return {
                ...state,
                ingredientFavourites: state.ingredientFavourites.includes(action.payload)
                    ? state.ingredientFavourites.filter(id => id !== action.payload)
                    : [...state.ingredientFavourites, action.payload]
            }

        case "TOGGLE_RECIPE_FAVOURITE":
            return {
                ...state,
                recipeFavourites: state.recipeFavourites.includes(action.payload)
                    ? state.recipeFavourites.filter(id => id !== action.payload)
                    : [...state.recipeFavourites, action.payload]
            }
        case "SAVE_ENTRY":
            return {
                ...state,
                entries: [...state.entries, action.payload],
                showAddForm: false,
                selectedIngredient: null,
                selectedRecipe: null,
                expandedRecipeIngredients: null,
            }

        case "DELETE_ENTRY":
            return {
                ...state,
                entries: state.entries.filter(e => e.id !== action.payload),
            }

        default:
            return state
    }
}

export const initialNutritionState: NutritionState = {
    entries: [],
    ingredients: [],
    recipes: [],
    ingredientFavourites: [],
    recipeFavourites: [],
    loading: true,
    error: null,
    showAddForm: false,
    selectedIngredient: null,
    selectedRecipe: null,
    expandedRecipeIngredients: null,
    editingEntry: null
}