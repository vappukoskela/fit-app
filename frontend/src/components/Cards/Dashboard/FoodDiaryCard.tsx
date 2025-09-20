import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const dummyFoodEntries = [
  { description: "Breakfast", calories: 350 },
  { description: "Lunch", calories: 450 },
];

export function FoodDiaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dummyFoodEntries.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 rounded">
              <span className="text-sm">{entry.description}</span>
              <span className="font-medium text-sm">{entry.calories} kcal</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}