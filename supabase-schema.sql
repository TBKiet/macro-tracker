-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  height_cm NUMERIC,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrition goals table
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food logs table
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  quantity_g NUMERIC NOT NULL,
  calories NUMERIC NOT NULL,
  protein_g NUMERIC NOT NULL,
  carbs_g NUMERIC NOT NULL,
  fat_g NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise logs table
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('gym', 'cardio')),
  exercise_name TEXT NOT NULL,
  duration_min INTEGER,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC,
  distance_km NUMERIC,
  calories_burned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight logs table
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,
  target_weight_kg NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, date);
CREATE INDEX idx_exercise_logs_user_date ON exercise_logs(user_id, date);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX idx_nutrition_goals_user ON nutrition_goals(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Nutrition goals policies
CREATE POLICY "Users can view own goals" ON nutrition_goals
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own goals" ON nutrition_goals
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own goals" ON nutrition_goals
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own goals" ON nutrition_goals
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Food logs policies
CREATE POLICY "Users can view own food logs" ON food_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own food logs" ON food_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own food logs" ON food_logs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own food logs" ON food_logs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own exercise logs" ON exercise_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own exercise logs" ON exercise_logs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own exercise logs" ON exercise_logs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Weight logs policies
CREATE POLICY "Users can view own weight logs" ON weight_logs
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own weight logs" ON weight_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own weight logs" ON weight_logs
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own weight logs" ON weight_logs
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger: Auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger: Auto-update updated_at on profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

