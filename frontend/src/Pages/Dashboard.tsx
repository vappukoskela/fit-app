import { AIAssistantCard } from "@/components/Cards/Dashboard/AIAssistantCard"
import { FoodDiaryCard } from "@/components/Cards/Dashboard/FoodDiaryCard"
import { NutritionCard } from "@/components/Cards/Dashboard/NutritionCard"
import { WeightCard } from "@/components/Cards/Dashboard/WeightCard"
import { WorkoutCard } from "@/components/Cards/Dashboard/WorkoutCard"
import { Spinner } from "@/components/ui/shadcn-io/spinner"
import { useState, useEffect } from "react"

function Dashboard() {
    const [weights, setWeights] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashBoardData = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/weights')
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setWeights(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch weights')
            } finally {
                setLoading(false)
            }
        }
        fetchDashBoardData()
    }, [])

    // TODO: Error alert or message display
    if (error) {
        console.error(error)
    }


    if (loading) {
        return (
            <div className="grid h-screen">
                <div
                    className="flex flex-col items-center justify-center gap-4">
                    <Spinner variant={'ring'} />
                    <div>Loading dashboard...</div>
                </div>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:grid-rows-2">
                    <AIAssistantCard />
                    <NutritionCard />
                    <FoodDiaryCard />
                    <WeightCard weights={weights} />
                    <WorkoutCard />
                </div>
            </main>
        </div>
    )
}

export default Dashboard;