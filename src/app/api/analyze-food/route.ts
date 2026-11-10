import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnalyzeFoodRequest {
  food_name: string;
  quantity_g: number;
}

interface FoodAnalysisResponse {
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
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
    const body: AnalyzeFoodRequest = await request.json();
    const { food_name, quantity_g } = body;

    if (!food_name || typeof food_name !== "string" || food_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid food_name. Must be a non-empty string." },
        { status: 400 }
      );
    }

    if (food_name.trim().length > 200) {
      return NextResponse.json(
        { error: "food_name is too long. Maximum 200 characters." },
        { status: 400 }
      );
    }

    if (!quantity_g || typeof quantity_g !== "number" || quantity_g <= 0 || quantity_g > 10000) {
      return NextResponse.json(
        { error: "Invalid quantity_g. Must be a positive number up to 10000." },
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
          content: `You are a nutrition database expert. Analyze the given food item and provide nutritional information.

Return a JSON object with exactly these fields:
{
  "food_name": string (standardized name in Vietnamese),
  "quantity_g": number,
  "calories": number (kcal),
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number
}

Be as accurate as possible based on standard nutritional databases (USDA, etc.). If the food name is in Vietnamese, understand it and provide the standardized Vietnamese name. Round all numeric values to 1 decimal place.`,
        },
        {
          role: "user",
          content: `Analyze the following food item and provide nutritional information:
- Food: ${food_name.trim()}
- Quantity: ${quantity_g}g`,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to get a response from AI." },
        { status: 502 }
      );
    }

    const result: FoodAnalysisResponse = JSON.parse(content);

    // Validate the response has all required fields
    const requiredFields: (keyof FoodAnalysisResponse)[] = [
      "food_name",
      "quantity_g",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
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
    console.error("Error in /api/analyze-food:", error);

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
