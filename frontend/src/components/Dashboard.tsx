import { Header } from './Header';
import { NutritionCard } from './Cards/NutritionCard';
import { AIAssistantCard } from './Cards/AIAssistantCard';
import { WorkoutCard } from './Cards/WorkoutCard';
import { WeightCard } from './Cards/WeightCard';
import { FoodDiaryCard } from './Cards/FoodDiaryCard';



export function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <Header />      
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:grid-rows-2">
          <AIAssistantCard />
          <NutritionCard />
          <FoodDiaryCard />
          <WeightCard />
          <WorkoutCard />
        </div>
      </main>
    </div>
  );
}