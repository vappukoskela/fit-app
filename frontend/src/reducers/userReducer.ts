import type { UserProfile, UserProfileState } from "@/types/userTypes";

type Action =
    | { type: "FETCH_START" }
    | { type: "FETCH_SUCCESS"; payload: UserProfile }
    | { type: "FETCH_ERROR"; payload: string }
    | { type: "START_EDIT" }
    | { type: "CANCEL_EDIT" }
    | { type: "UPDATE_FORM"; payload: Partial<UserProfile> }
    | { type: "SAVE_START" }
    | { type: "SAVE_SUCCESS"; payload: UserProfile }
    | { type: "SAVE_ERROR"; payload: string };

export function userReducer(state: UserProfileState, action: Action): UserProfileState {
    switch (action.type) {
        case "FETCH_START":
            return { ...state, loading: true, error: undefined };
        case "FETCH_SUCCESS":
            return {
                ...state,
                loading: false,
                user: action.payload,
                editForm: action.payload,
            };
        case "FETCH_ERROR":
            return { ...state, loading: false, error: action.payload };

        case "START_EDIT":
            return { ...state, editing: true };
        case "CANCEL_EDIT":
            return { ...state, editing: false, editForm: state.user || {} };
        case "UPDATE_FORM":
            return { ...state, editForm: { ...state.editForm, ...action.payload } };
        case "SAVE_START":
            return { ...state, saving: true };
        case "SAVE_SUCCESS":
            return {
                ...state,
                saving: false,
                user: action.payload,
                editForm: action.payload,
                editing: false,
            };
        case "SAVE_ERROR":
            return { ...state, saving: false, error: action.payload };

        default:
            return state;
    }
}
