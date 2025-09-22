import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { Card, CardContent } from "../../ui/card";

interface Ingredient {
    id: number;
    name: string;
    kcal_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    serving_size_g: number | null;
    serving_description: string | null;
    kcal_per_serving: number | null;
    protein_per_serving: number | null;
    carbs_per_serving: number | null;
    fat_per_serving: number | null;
}

interface RecipeIngredientCardProps {
    ingredient: Ingredient;
    isAdded: boolean;
    onToggleAdd: (ingredient: Ingredient) => void;
}

export function RecipeIngredientCard({
    ingredient,
    isAdded,
    onToggleAdd,
}: RecipeIngredientCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className={`transition-all cursor-pointer ${isAdded
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                    : 'hover:shadow-md hover:bg-muted/30'
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onToggleAdd(ingredient)}
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

                    <div className="flex items-center gap-2">
                        {(isHovered || isAdded) && (
                            <Button
                                variant={isAdded ? "default" : "outline"}
                                size="sm"
                                className={`transition-all ${isAdded
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'hover:bg-primary hover:text-primary-foreground'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAdd(ingredient);
                                }}
                            >
                                {isAdded ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}