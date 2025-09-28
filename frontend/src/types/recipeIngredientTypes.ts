export interface Ingredient {
    id: number
    name: string
    kcal_per_100g: number
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
    serving_size_g: number | null
    serving_description: string | null
    kcal_per_serving: number | null
    protein_per_serving: number | null
    carbs_per_serving: number | null
    fat_per_serving: number | null
    favourite?: boolean
    last_used_at?: string | null
}

export interface Recipe {
  id: number
  name: string
  description?: string
  servings: number
  total_kcal?: number
  total_protein?: number
  total_carbs?: number
  total_fat?: number
  kcal_per_portion?: number
  protein_per_portion?: number
  carbs_per_portion?: number
  fat_per_portion?: number
  favourite?: boolean
  last_used_at?: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
    id: number
    recipe_id: number
    ingredient_id: number
    amount_g: number
    note: string | null
    ingredient: Ingredient
}

export interface RawRecipeIngredient {
    id: number
    recipe_id: number
    ingredient_id: number
    amount_g: string
    note: string | null
    name: string
    kcal_per_100g: string
    protein_per_100g: string
    carbs_per_100g: string
    fat_per_100g: string
    serving_size_g: string | null
    serving_description: string | null
    kcal_per_serving: string | null
    protein_per_serving: string | null
    carbs_per_serving: string | null
    fat_per_serving: string | null
}

export interface RecipeBuilderIngredient {
    ingredient: Ingredient
    amount_g: string
    note: string
}   