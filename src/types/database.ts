export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type ExerciseType = "gym" | "cardio";

export interface Profile {
  id: string;
  full_name: string | null;
  gender: Gender | null;
  birth_date: string | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_ai_generated: boolean;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  date: string;
  exercise_type: ExerciseType;
  exercise_name: string;
  duration_min: number | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  distance_km: number | null;
  calories_burned: number;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  target_weight_kg: number | null;
  note: string | null;
  created_at: string;
}

// Form types for AI
export interface MacroCalculationRequest {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: "lose" | "maintain" | "gain";
}

export interface FoodAnalysisRequest {
  food_name: string;
  quantity_g: number;
}

export interface FoodAnalysisResponse {
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

