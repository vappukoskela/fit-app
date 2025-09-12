import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

// This card displays weight information.

const dummyWeight = { weight: 62.8 };
// TODO: Weight trend graph

export function WeightCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weight</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center">
                    <div className="text-3xl font-bold">{dummyWeight.weight}</div>
                    <div className="text-sm text-muted-foreground">kg</div>
                </div>
            </CardContent>
        </Card>
    );
}
