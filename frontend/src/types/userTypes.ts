export interface UserProfile {
    id: number;
    name: string;
    email: string;
    birth_date?: string;
    sex?: string;
    height_cm?: number;
    weight_goal_kg?: number;
    hr_max?: number;
    hr_rest?: number;
    hr_min?: number;
    vo2max?: number;
    created_at: string;
    updated_at: string;
}

export interface UserProfileState {
    user: UserProfile | null;
    loading: boolean;
    editing: boolean;
    saving: boolean;
    editForm: Partial<UserProfile>;
    error?: string;
}