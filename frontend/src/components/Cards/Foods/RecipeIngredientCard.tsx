import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import type { Ingredient } from "@/types/RecipeIngredient";    

interface RecipeIngredientCardProps {
    ingredient: Ingredient;
    isAdded: boolean;
    onAdd: (ingredient: Ingredient) => void;
}

export function RecipeIngredientCard({
    ingredient,
    isAdded,
    onAdd,
}: RecipeIngredientCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className={`transition-all ${isAdded
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
                    : "cursor-pointer hover:shadow-md hover:bg-muted/30"
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h4 className="font-semibold">{ingredient.name}</h4>
                        <div className="text-xs text-muted-foreground">
                            Per 100g: {ingredient.kcal_per_100g}kcal, P:{ingredient.protein_per_100g}g,
                            C:{ingredient.carbs_per_100g}g, F:{ingredient.fat_per_100g}g
                        </div>
                        {ingredient.serving_description && (
                            <div className="text-xs text-muted-foreground">
                                {ingredient.serving_description} ({ingredient.serving_size_g}g): ~
                                {ingredient.kcal_per_serving}kcal
                            </div>
                        )}
                        {isAdded && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                                ✓ Added to recipe
                            </div>
                        )}
                    </div>

                    {!isAdded && (isHovered || !isHovered) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="transition-all hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAdd(ingredient);
                            }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}