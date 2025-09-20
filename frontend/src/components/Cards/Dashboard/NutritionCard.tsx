import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";

const dummyNutrition = { intake: 2500, burned: 2000, protein: 120, carbs: 300, fat: 60 };
const proteinPercent = 25;
const carbPercent = 62.5;
const fatPercent = 12.5;
export function NutritionCard() {
    const net = dummyNutrition.intake - dummyNutrition.burned;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nutrition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                    <span>Calories In:</span>
                    <span className="font-medium">{dummyNutrition.intake}</span>
                </div>
                <div className="flex justify-between">
                    <span>Calories Out:</span>
                    <span className="font-medium">{dummyNutrition.burned}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span>Net:</span>
                    <span className={`font-medium ${net > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {net > 0 ? '+' : ''}{net}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-2 border-t">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground">Protein</div>
                        <div className="font-medium">{dummyNutrition.protein}g</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground">Carbs</div>
                        <div className="font-medium">{dummyNutrition.carbs}g</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground">Fat</div>
                        <div className="font-medium">{dummyNutrition.fat}g</div>
                    </div>
                </div>
                <div className="mt-4 pt-2">
                    <div className="w-full bg-muted rounded-full h-3 flex overflow-hidden ">
                        <div
                            className="bg-chart-1 h-full"
                            style={{ width: `${proteinPercent}%` }}
                        />
                        <div
                            className="bg-chart-2 h-full"
                            style={{ width: `${carbPercent}%` }}
                        />
                        <div
                            className="bg-chart-3 h-full"
                            style={{ width: `${fatPercent}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
