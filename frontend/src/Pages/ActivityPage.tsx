import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingPage } from '@/components/Loading'
import { ChevronDown, ChevronUp, Flame, Footprints, MapPin, Clock, Activity, TrendingUp, AlertCircle } from 'lucide-react'

interface PolarActivity {
  id?: number
  user_id?: number
  activity_date?: string
  calories?: number | null
  active_calories?: number | null
  steps?: number | null
  active_duration?: string | null
  inactive_duration?: string | null
  daily_activity?: number | null
  inactivity_alert_count?: number | null
  distance_from_steps?: number | null
  start_time?: string | null
  end_time?: string | null
  raw?: any
  created_at?: string
}

const mockActivities: PolarActivity[] = [
  {
    id: 1,
    user_id: 1,
    activity_date: '2025-10-04',
    calories: 2456,
    active_calories: 856,
    steps: 12543,
    active_duration: '02:45:30',
    inactive_duration: '18:30:15',
    daily_activity: 85,
    inactivity_alert_count: 3,
    distance_from_steps: 9.2,
    start_time: '06:30:00',
    end_time: '22:45:00',
    created_at: '2025-10-04T22:50:00Z'
  },
  {
    id: 2,
    user_id: 1,
    activity_date: '2025-10-03',
    calories: 2201,
    active_calories: 601,
    steps: 8234,
    active_duration: '01:52:15',
    inactive_duration: '19:45:30',
    daily_activity: 62,
    inactivity_alert_count: 5,
    distance_from_steps: 6.1,
    start_time: '07:15:00',
    end_time: '23:00:00',
    created_at: '2025-10-03T23:05:00Z'
  },
  {
    id: 3,
    user_id: 1,
    activity_date: '2025-10-02',
    calories: 2678,
    active_calories: 1078,
    steps: 15782,
    active_duration: '03:28:45',
    inactive_duration: '17:15:00',
    daily_activity: 92,
    inactivity_alert_count: 2,
    distance_from_steps: 11.5,
    start_time: '06:00:00',
    end_time: '22:30:00',
    created_at: '2025-10-02T22:35:00Z'
  }
]

export function ActivityPage() {
  const [activities, setActivities] = useState<PolarActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setActivities(mockActivities)

        // TODO: Replace with actual API call
        // const response = await fetch('http://localhost:4000/api/polar-activities')
        // if (!response.ok) throw new Error('Failed to fetch activities')
        // const data = await response.json()
        // setActivities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date)
  }

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDuration = (duration: string | null) => {
    if (!duration) return 'N/A'
    const parts = duration.split(':')
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDistance = (km: number | null) => {
    if (!km) return 'N/A'
    return `${km.toFixed(1)} km`
  }

  const toggleExpanded = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  const getActivityLevel = (score: number | null) => {
    if (!score) return { label: 'Unknown', color: 'text-muted-foreground' }
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500' }
    if (score >= 60) return { label: 'Good', color: 'text-blue-500' }
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-500' }
    return { label: 'Low', color: 'text-orange-500' }
  }

  if (loading) {
    return <LoadingPage message="Loading activities..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="p-6">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <p>Error loading activities: {error}</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Daily Activity</h1>
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No activities yet</p>
                <p className="text-sm mt-2">Connect your Polar device to start tracking</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Daily Activity</h1>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => {
              const isExpanded = expandedDates.has(activity.activity_date || '')
              const activityLevel = getActivityLevel(activity.daily_activity)

              return (
                <Card
                  key={activity.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleExpanded(activity.activity_date || '')}
                      className="w-full p-4 text-left transition-colors rounded-t-lg hover:cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3">
                            <span className="text-xl font-bold">
                              {activity.calories || 0} kcal
                            </span>
                            {activity.daily_activity !== null && (
                              <span className={`text-sm font-medium ${activityLevel.color}`}>
                                Score: {activity.daily_activity}/100
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm mt-1">
                            {formatDate(activity.activity_date || '')}
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="text-right text-xs text-muted-foreground">
                            <div>Synced</div>
                            <div>{activity.created_at ? formatCreatedDate(activity.created_at) : 'N/A'}</div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Footprints className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{activity.steps?.toLocaleString() || 0}</span>
                          <span className="text-muted-foreground text-xs">steps</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{formatDistance(activity.distance_from_steps)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{formatDuration(activity.active_duration)}</span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          {activity.active_calories !== null && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                                <Flame className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Active Calories</div>
                                <div className="text-lg font-bold">{activity.active_calories}</div>
                              </div>
                            </div>
                          )}

                          {activity.active_duration && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Active Time</div>
                                <div className="text-lg font-bold">{formatDuration(activity.active_duration)}</div>
                              </div>
                            </div>
                          )}

                          {activity.inactive_duration && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Inactive Time</div>
                                <div className="text-lg font-bold">{formatDuration(activity.inactive_duration)}</div>
                              </div>
                            </div>
                          )}

                          {activity.inactivity_alert_count !== null && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10">
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Inactivity Alerts</div>
                                <div className="text-lg font-bold">{activity.inactivity_alert_count}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ActivityPage