import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";

interface WeightEntry {
  log_date: string
  weight_kg: string
  created_at: string
}
interface WeightCardProps {
  weights: WeightEntry[]
}

const dummyWeight = { weight: 62.8 };
// TODO: Weight trend graph

export function WeightCard({ weights }: WeightCardProps) { 
    const latestWeight = weights.length > 0 ? weights[0].weight_kg : dummyWeight.weight;
    console.log(weights)
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weight</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center">
                    <div className="text-3xl font-bold">{latestWeight}</div>
                    <div className="text-sm text-muted-foreground">kg</div>
                </div>
            </CardContent>
        </Card>
    );
}
