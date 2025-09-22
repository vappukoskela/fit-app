import { Button } from "@/components/ui/button";
import { Star, Edit2, Trash2 } from "lucide-react";
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

interface IngredientCardProps {
    ingredient: Ingredient;
    isFavourite?: boolean;
    onToggleFavourite?: () => void;
    onEdit?: (ingredient: Ingredient) => void;
    onDelete?: (id: number) => void;
}

export function IngredientCard({
    ingredient,
    isFavourite = false,
    onToggleFavourite,
    onEdit,
    onDelete,
}: IngredientCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
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
                    </div>

                    {(onToggleFavourite || onEdit || onDelete) && (
                        <div className="flex gap-1">
                            {onToggleFavourite && (
                                <Button variant="ghost" size="sm" onClick={onToggleFavourite}>
                                    {isFavourite ? (
                                        <Star fill="yellow" className="h-4 w-4 text-yellow-400" />
                                    ) : (
                                        <Star className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            )}

                            {onEdit && (
                                <Button variant="ghost" size="sm" onClick={() => onEdit(ingredient)}>
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            )}

                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(ingredient.id)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}