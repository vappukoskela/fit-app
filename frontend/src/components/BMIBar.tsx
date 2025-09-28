import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

type BMIBarProps = {
    height: number;
    currentWeight: number;
    goalWeight?: number;
};

export const BMIBar = ({ height, currentWeight, goalWeight }: BMIBarProps) => {
    if (!height || !currentWeight) return null;

    const calculateBMI = (weight: number) => {
        const heightInM = height / 100;
        return weight / (heightInM * heightInM);
    };

    const currentBMI = calculateBMI(currentWeight);
    const goalBMI = goalWeight ? calculateBMI(goalWeight) : null;

    const minBMI = 17;
    const maxBMI = 32;
    const range = maxBMI - minBMI;

    const getPosition = (bmi: number) => {
        return Math.min(Math.max((bmi - minBMI) / range * 100, 0), 100);
    };

    const currentPosition = getPosition(currentBMI);
    const goalPosition = goalBMI ? getPosition(goalBMI) : null;

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal";
        if (bmi < 30) return "Overweight";
        return "Obese";
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">BMI Analysis</span>
                <Badge variant={currentBMI < 18.5 ? "secondary" : currentBMI < 25 ? "default" : currentBMI < 30 ? "outline" : "destructive"}>
                    {currentBMI.toFixed(1)} - {getBMICategory(currentBMI)}
                </Badge>
            </div>

            <div className="relative">
                <div className="h-6 rounded-lg overflow-hidden flex shadow-sm border">
                    <div
                        className="bg-blue-400 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${getPosition(18.5)}%` }}
                    >
                    </div>
                    <div
                        className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${getPosition(25) - getPosition(18.5)}%` }}
                    >
                    </div>

                    <div
                        className="bg-yellow-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${getPosition(30) - getPosition(25)}%` }}
                    >
                    </div>

                    <div
                        className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${100 - getPosition(30)}%` }}
                    >
                    </div>
                </div>
                <div
                    className="absolute top-0 h-6 w-0.5 bg-gray-800 shadow-lg"
                    style={{ left: `${currentPosition}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                            Current
                        </div>
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 mx-auto"></div>
                    </div>
                </div>
                {goalPosition !== null && (
                    <div
                        className="absolute top-0 h-6 w-0.5 bg-blue-600 shadow-lg"
                        style={{ left: `${goalPosition}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-600 mx-auto"></div>
                            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg flex items-center gap-1">
                                <Target size={12} /><span>{goalBMI?.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};