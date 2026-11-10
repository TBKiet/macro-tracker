import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EstimateCaloriesBurnedRequest {
  exercise_type: "gym" | "cardio";
  exercise_name: string;
  duration_min: number;
  weight_kg: number;
  // for gym exercises
  sets?: number;
  reps?: number;
  exercise_weight_kg?: number;
  // for cardio exercises
  distance_km?: number;
}

interface CaloriesBurnedResponse {
  calories_burned: number;
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
    const body: EstimateCaloriesBurnedRequest = await request.json();
    const {
      exercise_type,
      exercise_name,
      duration_min,
      weight_kg,
      sets,
      reps,
      exercise_weight_kg,
      distance_km,
    } = body;

    if (!exercise_type || !["gym", "cardio"].includes(exercise_type)) {
      return NextResponse.json(
        { error: 'Invalid exercise_type. Must be "gym" or "cardio".' },
        { status: 400 }
      );
    }

    if (
      !exercise_name ||
      typeof exercise_name !== "string" ||
      exercise_name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid exercise_name. Must be a non-empty string." },
        { status: 400 }
      );
    }

    if (exercise_name.trim().length > 200) {
      return NextResponse.json(
        { error: "exercise_name is too long. Maximum 200 characters." },
        { status: 400 }
      );
    }

    if (
      !duration_min ||
      typeof duration_min !== "number" ||
      duration_min <= 0 ||
      duration_min > 600
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid duration_min. Must be a positive number up to 600 minutes.",
        },
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
        { error: "Invalid weight_kg. Must be between 20 and 500 kg." },
        { status: 400 }
      );
    }

    // Validate optional gym fields
    if (exercise_type === "gym") {
      if (sets !== undefined && (typeof sets !== "number" || sets <= 0 || sets > 100)) {
        return NextResponse.json(
          { error: "Invalid sets. Must be a positive number up to 100." },
          { status: 400 }
        );
      }
      if (reps !== undefined && (typeof reps !== "number" || reps <= 0 || reps > 200)) {
        return NextResponse.json(
          { error: "Invalid reps. Must be a positive number up to 200." },
          { status: 400 }
        );
      }
      if (
        exercise_weight_kg !== undefined &&
        (typeof exercise_weight_kg !== "number" || exercise_weight_kg < 0 || exercise_weight_kg > 1000)
      ) {
        return NextResponse.json(
          { error: "Invalid exercise_weight_kg. Must be between 0 and 1000 kg." },
          { status: 400 }
        );
      }
    }

    // Validate optional cardio fields
    if (exercise_type === "cardio") {
      if (
        distance_km !== undefined &&
        (typeof distance_km !== "number" || distance_km <= 0 || distance_km > 200)
      ) {
        return NextResponse.json(
          { error: "Invalid distance_km. Must be a positive number up to 200 km." },
          { status: 400 }
        );
      }
    }

    // Build exercise details string for the prompt
    let exerciseDetails = `- Exercise type: ${exercise_type}
- Exercise name: ${exercise_name.trim()}
- Duration: ${duration_min} minutes
- User's body weight: ${weight_kg}kg`;

    if (exercise_type === "gym") {
      if (sets !== undefined) exerciseDetails += `\n- Sets: ${sets}`;
      if (reps !== undefined) exerciseDetails += `\n- Reps per set: ${reps}`;
      if (exercise_weight_kg !== undefined)
        exerciseDetails += `\n- Weight used: ${exercise_weight_kg}kg`;
    }

    if (exercise_type === "cardio" && distance_km !== undefined) {
      exerciseDetails += `\n- Distance: ${distance_km}km`;
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an exercise physiology expert. Estimate calories burned for the given exercise based on MET (Metabolic Equivalent of Task) values and exercise science.

Return a JSON object with exactly these fields:
{
  "calories_burned": number (estimated kcal burned, rounded to nearest integer),
  "explanation": string (brief explanation in Vietnamese of how the estimate was calculated)
}

Use established MET values from the Compendium of Physical Activities. For gym/resistance training, factor in the intensity based on sets, reps, and weight used. For cardio, use distance and pace if available. Be realistic and evidence-based in your estimates.`,
        },
        {
          role: "user",
          content: `Estimate calories burned for the following exercise:\n${exerciseDetails}`,
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

    const result: CaloriesBurnedResponse = JSON.parse(content);

    // Validate the response has all required fields
    if (
      result.calories_burned === undefined ||
      result.calories_burned === null ||
      typeof result.calories_burned !== "number"
    ) {
      return NextResponse.json(
        { error: "AI response missing or invalid field: calories_burned" },
        { status: 502 }
      );
    }

    if (!result.explanation || typeof result.explanation !== "string") {
      return NextResponse.json(
        { error: "AI response missing or invalid field: explanation" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/estimate-calories-burned:", error);

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
