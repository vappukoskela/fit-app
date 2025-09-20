import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";

export function WorkoutCard() {
  const weeklyProgress = (40 / 50) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Weekly km</span>
            <span>40 / 50</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Last run:</span>
          <span className="font-medium">12.3 km</span>
        </div>
      </CardContent>
    </Card>
  );
}