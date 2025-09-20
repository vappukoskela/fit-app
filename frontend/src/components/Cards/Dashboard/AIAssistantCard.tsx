import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Loader2, Send, Check, X, Edit2 } from "lucide-react";
import { Input } from "../../ui/input";

// Types for the parsed food data
interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ParsedResponse {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// Mock function to simulate OpenAI API call
const parseNaturalLanguageFoodEntry = async (input: string): Promise<ParsedResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response based on input
  const mockResponse: ParsedResponse = {
    items: [
      {
        id: "1",
        name: "Bananas",
        quantity: "2 medium",
        calories: 210,
        protein: 2.6,
        carbs: 54,
        fat: 0.8
      },
      {
        id: "2",
        name: "Pasta (dry weight)",
        quantity: "80g",
        calories: 284,
        protein: 10.7,
        carbs: 57.6,
        fat: 1.8
      }
    ],
    totalCalories: 494,
    totalProtein: 13.3,
    totalCarbs: 111.6,
    totalFat: 2.6
  };

  return mockResponse;
};

// Mock function to save to database
const saveFoodEntry = async (data: ParsedResponse): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Saving to database:", data);
  return true;
};

export function AIAssistantCard() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FoodItem>>({});

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = await parseNaturalLanguageFoodEntry(input);
      setParsedData(result);
    } catch (error) {
      console.error("Error parsing food entry:", error);
      // Handle error state here
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    try {
      const success = await saveFoodEntry(parsedData);
      if (success) {
        // Reset form
        setInput("");
        setParsedData(null);
        // Show success message
      }
    } catch (error) {
      console.error("Error saving food entry:", error);
      // Handle error state here
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = () => {
    setParsedData(null);
    // Focus back on input for retry
  };

  const startEditing = (item: FoodItem) => {
    setEditingItem(item.id);
    setEditValues({
      name: item.name,
      quantity: item.quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    });
  };

  const saveEdit = () => {
    if (!parsedData || !editingItem) return;

    const updatedItems = parsedData.items.map(item =>
      item.id === editingItem
        ? { ...item, ...editValues }
        : item
    );

    // Recalculate totals
    const newTotals = updatedItems.reduce(
      (acc, item) => ({
        totalCalories: acc.totalCalories + item.calories,
        totalProtein: acc.totalProtein + item.protein,
        totalCarbs: acc.totalCarbs + item.carbs,
        totalFat: acc.totalFat + item.fat
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );

    setParsedData({
      ...parsedData,
      items: updatedItems,
      ...newTotals
    });

    setEditingItem(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  return (
    <Card className="md:row-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Clanker Nutrition Assistant</span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        {!parsedData ? (
          <><div className="mb-4 text-sm text-muted-foreground">
            Beep boop! Enter your meals and I will analyze the nutrition content for you.
          </div>
            <div className="mt-auto space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Meal description:</p>
                <Textarea
                  placeholder=""
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </>

        ) : (
          <>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Parsed Results</h4>
                <Badge variant="secondary" className="text-xs">
                  {parsedData.items.length} items
                </Badge>
              </div>
              <div className="border-t pt-3 mt-4 mt-auto">

                {parsedData.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Food name"
                            value={editValues.name || ""}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          />
                          <Input
                            placeholder="Quantity"
                            value={editValues.quantity || ""}
                            onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="number"
                            placeholder="Cal"
                            value={editValues.calories || ""}
                            onChange={(e) => setEditValues({ ...editValues, calories: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Protein"
                            value={editValues.protein || ""}
                            onChange={(e) => setEditValues({ ...editValues, protein: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Carbs"
                            value={editValues.carbs || ""}
                            onChange={(e) => setEditValues({ ...editValues, carbs: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Fat"
                            value={editValues.fat || ""}
                            onChange={(e) => setEditValues({ ...editValues, fat: Number(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline">{item.quantity}</Badge>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => startEditing(item)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{item.calories}kcal</span>
                          <span>P{item.protein}g</span>
                          <span>C{item.carbs}g</span>
                          <span>F{item.fat}g</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <div className="border-t pt-3 mt-4 mt-auto">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total:</span>
                    <div className="flex gap-4 text-sm">
                      <span>{Math.round(parsedData.totalCalories)}kcal</span>
                      <span>P{Math.round(parsedData.totalProtein * 10) / 10}g</span>
                      <span>C{Math.round(parsedData.totalCarbs * 10) / 10}g</span>
                      <span>F{Math.round(parsedData.totalFat * 10) / 10}g</span>
                    </div>
                  </div>
                </div>

              <div className="flex gap-2 pt-2 ">
                <Button
                  onClick={handleApprove}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve & Save
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>              </div>

            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}