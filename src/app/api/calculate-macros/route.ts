import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VALID_ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
const VALID_GOALS = ["lose", "maintain", "gain"] as const;
const VALID_GENDERS = ["male", "female"] as const;

interface CalculateMacrosRequest {
  gender: (typeof VALID_GENDERS)[number];
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: (typeof VALID_ACTIVITY_LEVELS)[number];
  goal: (typeof VALID_GOALS)[number];
}

interface MacrosResponse {
  tdee: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Parse and validate request body
    const body: CalculateMacrosRequest = await request.json();
    const { gender, age, height_cm, weight_kg, activity_level, goal } = body;

    if (!gender || !VALID_GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be "male" or "female".' },
        { status: 400 }
      );
    }

    if (!age || typeof age !== "number" || age < 10 || age > 120) {
      return NextResponse.json(
        { error: "Invalid age. Must be a number between 10 and 120." },
        { status: 400 }
      );
    }

    if (
      !height_cm ||
      typeof height_cm !== "number" ||
      height_cm < 50 ||
      height_cm > 300
    ) {
      return NextResponse.json(
        { error: "Invalid height. Must be between 50 and 300 cm." },
        { status: 400 }
      );
    }

    if (
      !weight_kg ||
      typeof weight_kg !== "number" ||
      weight_kg < 20 ||
      weight_kg > 500
    ) {
      return NextResponse.json(
        { error: "Invalid weight. Must be between 20 and 500 kg." },
        { status: 400 }
      );
    }

    if (!activity_level || !VALID_ACTIVITY_LEVELS.includes(activity_level)) {
      return NextResponse.json(
        {
          error: `Invalid activity level. Must be one of: ${VALID_ACTIVITY_LEVELS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!goal || !VALID_GOALS.includes(goal)) {
      return NextResponse.json(
        {
          error: `Invalid goal. Must be one of: ${VALID_GOALS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional sports nutritionist. Calculate TDEE and recommend daily macros for the given user profile.

Return a JSON object with exactly these fields:
{
  "tdee": number (total daily energy expenditure),
  "calories": number (recommended daily calories),
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "explanation": string (brief explanation in Vietnamese)
}

Use the Mifflin-St Jeor equation as base. For protein, recommend 1.6-2.2g/kg for muscle building, 1.2-1.6g/kg for maintenance. Adjust calories: -500 for lose, +300 for gain. Round all numbers to the nearest integer.`,
        },
        {
          role: "user",
          content: `Calculate TDEE and recommend daily macros for:
- Gender: ${gender}
- Age: ${age}
- Height: ${height_cm}cm
- Weight: ${weight_kg}kg
- Activity level: ${activity_level}
- Goal: ${goal} weight`,
        },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to get a response from AI." },
        { status: 502 }
      );
    }

    const result: MacrosResponse = JSON.parse(content);

    // Validate the response has all required fields
    const requiredFields: (keyof MacrosResponse)[] = [
      "tdee",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
      "explanation",
    ];
    for (const field of requiredFields) {
      if (result[field] === undefined || result[field] === null) {
        return NextResponse.json(
          { error: `AI response missing field: ${field}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/calculate-macros:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body. Must be valid JSON." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
