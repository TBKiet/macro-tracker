import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseType } from "@/types/database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedExerciseItem {
  exercise_type: ExerciseType;
  exercise_name: string;
  duration_min: number | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  distance_km: number | null;
  calories_burned: number;
}

export interface ParseExerciseTextResponse {
  exercises: ParsedExerciseItem[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, user_weight_kg = 70 } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập đoạn văn bản mô tả buổi tập." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are an expert strength & conditioning coach and sports scientist.
The user will provide a freeform paragraph describing their workout session (which can include multiple strength training exercises and/or cardio activities).
User weight is: ${user_weight_kg} kg.

Your task:
1. Parse the text and split it into individual exercises.
2. For each exercise, identify:
   - "exercise_type": "gym" for resistance/weightlifting/calisthenics, OR "cardio" for running, walking, cycling, swimming, jump rope, HIIT, rowing, etc.
   - "exercise_name": Standardized name in Vietnamese or common gym term (e.g., "Bench Press", "Squat", "Chạy bộ ngoài trời", "Hít đất", "Nhảy dây").
   - "sets": number of sets (null for cardio)
   - "reps": number of repetitions per set (null for cardio)
   - "weight_kg": weight used in kg (null for bodyweight or cardio)
   - "duration_min": estimated or stated duration in minutes. If not stated for gym, estimate ~10-15 mins per exercise.
   - "distance_km": distance in km if cardio and mentioned (null otherwise).
   - "calories_burned": estimate scientifically based on MET formula (Calories = MET * Weight(kg) * Time(hours)).
     * Heavy resistance training: MET ~5-6
     * Moderate cardio (jogging): MET ~7-9
     * Walking: MET ~3.5
     * Jump rope / HIIT: MET ~10-12
     Round calories_burned to an integer.

Return a JSON object with this exact structure:
{
  "exercises": [
    {
      "exercise_type": "gym" | "cardio",
      "exercise_name": string,
      "duration_min": number | null,
      "sets": number | null,
      "reps": number | null,
      "weight_kg": number | null,
      "distance_km": number | null,
      "calories_burned": number
    }
  ],
  "summary": string (A concise summary in Vietnamese, e.g. "Đã nhận diện 3 bài gym và 1 buổi cardio, ước tính đốt cháy 350 kcal")
}`,
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "AI không thể phân tích văn bản tập luyện." },
        { status: 502 }
      );
    }

    const result: ParseExerciseTextResponse = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/parse-exercise-text:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý AI hoặc không thể phân tích buổi tập." },
      { status: 500 }
    );
  }
}

