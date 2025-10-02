import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Scale, Target, Activity, Heart, Save, Edit2, Plug } from "lucide-react";
import type { UserProfileState } from "@/types/userTypes";
import { LoadingPage } from "@/components/Loading";
import { userReducer } from "@/reducers/userReducer";
import { BMIBar } from "@/components/BMIBar";

const initialState: UserProfileState = {
    user: null,
    loading: true,
    editing: false,
    saving: false,
    editForm: {},
};

export default function UserProfilePage() {
    const [state, dispatch] = React.useReducer(userReducer, initialState);

    const userId = 1;

    useEffect(() => {
        const fetchUser = async () => {
            dispatch({ type: "FETCH_START" });
            try {
                const res = await fetch(`http://localhost:4000/api/users/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    dispatch({ type: "FETCH_SUCCESS", payload: data });
                } else {
                    dispatch({ type: "FETCH_ERROR", payload: "Failed to fetch user" });
                }
            } catch (err) {
                dispatch({ type: "FETCH_ERROR", payload: "Network error" + err });
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        if (!state.editForm || !state.user) return;
        dispatch({ type: "SAVE_START" });

        try {
            const res = await fetch(`http://localhost:4000/api/users/${state.user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(state.editForm),
            });
            if (res.ok) {
                const updated = await res.json();
                dispatch({ type: "SAVE_SUCCESS", payload: updated });
            } else {
                dispatch({ type: "SAVE_ERROR", payload: "Failed to save user" });
            }
        } catch {
            dispatch({ type: "SAVE_ERROR", payload: "Network error" });
        }
    };


    const handleCancel = () => {
        dispatch({ type: "CANCEL_EDIT" });
    };

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    if (state.loading) {
        return (
            <LoadingPage message="Loading User..." />
        );
    }

    if (!state.user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-lg font-medium mb-2">Profile not found</div>
                    <div className="text-muted-foreground">Unable to load user profile</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Profile Settings</h1>
                    </div>
                    {!state.editing && (
                        <Button onClick={() => dispatch({ type: "START_EDIT" })} variant="outline">
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    {state.editing ? (
                                        <Input
                                            id="name"
                                            value={state.editForm.name || ''}
                                            onChange={(e) => dispatch({ type: "UPDATE_FORM", payload: { name: e.target.value } })}
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <div className="text-base font-medium">{state.user.name || 'Not specified'}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    {state.editing ? (
                                        <Input
                                            id="email"
                                            type="email"
                                            value={state.editForm.email || ''}
                                            onChange={(e) => dispatch({ type: "UPDATE_FORM", payload: { email: e.target.value } })}
                                            placeholder="Enter your email"
                                        />
                                    ) : (
                                        <div className="text-base">{state.user.email || 'Not specified'}</div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Date of Birth</Label>
                                    {state.editing ? (
                                        <Input
                                            id="birth_date"
                                            type="date"
                                            value={state.editForm.birth_date || ''}
                                            onChange={(e) => dispatch({ type: "UPDATE_FORM", payload: { birth_date: e.target.value } })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-base">
                                                {state.user.birth_date
                                                    ? `${new Date(state.user.birth_date).toLocaleDateString()} (${calculateAge(state.user.birth_date)} years old)`
                                                    : 'Not specified'
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sex">Sex</Label>
                                    {state.editing ? (
                                        <Select
                                            value={state.editForm.sex || ''}
                                            onValueChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { sex: value } })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select sex" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="unspecified">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-base capitalize">{state.user.sex || 'Not specified'}</div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">


                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="height_cm">Height</Label>
                                        {state.editing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="height_cm"
                                                    type="number"
                                                    value={state.editForm.height_cm || ''}
                                                    onChange={(e) => dispatch({ type: "UPDATE_FORM", payload: { height_cm: parseFloat(e.target.value) } })}
                                                    placeholder="165"
                                                    step="0.1"
                                                />
                                                <span className="text-sm text-muted-foreground">cm</span>
                                            </div>
                                        ) : (
                                            <div className="text-base font-medium">
                                                {state.user.height_cm ? `${state.user.height_cm} cm` : 'Not specified'}
                                            </div>
                                        )}
                                    </div>
                                    {/* TODO Fetch current weight */}
                                    <div className="space-y-2">
                                        <Label htmlFor="weight_goal_kg">Current Weight</Label>
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-base font-medium">
                                                {state.user.weight_goal_kg ? `${state.user.weight_goal_kg} kg` : 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight_goal_kg">Goal Weight</Label>
                                        {state.editing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="weight_goal_kg"
                                                    type="number"
                                                    value={state.editForm.weight_goal_kg || ''}
                                                    onChange={(e) => dispatch({ type: "UPDATE_FORM", payload: { weight_goal_kg: parseFloat(e.target.value) } })}
                                                    placeholder="70"
                                                    step="0.1"
                                                />
                                                <span className="text-sm text-muted-foreground">kg</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-base font-medium">
                                                    {state.user.weight_goal_kg ? `${state.user.weight_goal_kg} kg` : 'Not specified'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {state.user.height_cm && (
                                        // {state.user.height_cm && state.user.weight_goal_kg && (
                                        <div className="md:col-span-3 space-y-4">
                                            <Separator />

                                            <BMIBar
                                                height={state.user.height_cm}
                                                currentWeight={61.4} // TODO Replace with actual current weight
                                                goalWeight={state.user.weight_goal_kg}
                                            />
                                        </div>

                                    )}
                                </div>
                            </div>

                            {state.editing && (
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={state.saving} className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        {state.saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel} disabled={state.saving}>
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    Health Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {state.user.hr_max && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Max HR</span>
                                        <Badge variant="outline">{state.user.hr_max} bpm</Badge>
                                    </div>
                                )}
                                {state.user.hr_rest && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Resting HR</span>
                                        <Badge variant="outline">{state.user.hr_rest} bpm</Badge>
                                    </div>
                                )}
                                {state.user.vo2max && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">VO₂ Max</span>
                                        <Badge variant="outline">{state.user.vo2max}</Badge>
                                    </div>
                                )}

                                {!state.user.hr_max && !state.user.hr_rest && !state.user.vo2max && (
                                    <div className="text-center text-sm text-muted-foreground py-4">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        Health metrics will appear here when available from fitness trackers
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <span className="text-sm text-muted-foreground">Member since</span>
                                    <div className="font-medium">
                                        {new Date(state.user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Last updated</span>
                                    <div className="font-medium">
                                        {new Date(state.user.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plug className="h-5 w-5" />
                                Connections
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button onClick={() => { window.location.href = "http://localhost:4000/api/auth/polar/connect"; }} variant="outline">
                                    <Activity className="h-5 w-5 text-red-600" />
                                    Connect to Polar
                                </Button>

                                <Button onClick={() => dispatch({ type: "START_EDIT" })} variant="outline">
                                    <Activity className="h-5 w-5 text-orange-400" />
                                    Connect to Strava (coming soon)
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}