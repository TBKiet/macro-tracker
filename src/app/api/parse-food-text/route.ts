import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/types/database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedFoodItem {
  meal_type: MealType;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParseFoodTextResponse {
  items: ParsedFoodItem[];
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
    const { text, default_meal_type = "lunch" } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Vui lòng nhập đoạn văn bản mô tả đồ ăn." },
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
          content: `You are an expert sports nutritionist and food data parser.
The user will provide a freeform paragraph (usually in Vietnamese or English) describing what they ate today, potentially across multiple meals (sáng/breakfast, trưa/lunch, chiều/tối/dinner, ăn vặt/snack).

Your task:
1. Parse the text and split it into individual food items.
2. Determine the meal_type for each item:
   - "breakfast" (bữa sáng, sáng nay, điểm tâm...)
   - "lunch" (bữa trưa, trưa nay...)
   - "dinner" (bữa tối, chiều tối, cơm tối...)
   - "snack" (bữa phụ, ăn vặt, xế, tráng miệng, pre-workout, post-workout...)
   If no specific meal is mentioned, use "${default_meal_type}".
3. Standardize the food_name in clear Vietnamese (e.g., "Ức gà luộc", "Cơm trắng", "Trứng ốp la").
4. Estimate or extract the quantity_g (weight in grams). If user mentions units like "1 bát cơm", convert to ~150-180g; "1 quả trứng" -> ~50g; "1 muỗng whey" -> ~30g; "1 ly sữa" -> ~250g, etc.
5. Accurately calculate the macro breakdown:
   - calories (kcal)
   - protein_g (grams)
   - carbs_g (grams)
   - fat_g (grams)
   Round all numeric values to 1 decimal place.

Return a JSON object with this exact structure:
{
  "items": [
    {
      "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
      "food_name": string,
      "quantity_g": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "summary": string (A concise summary in Vietnamese, e.g. "Đã nhận diện 3 món: Ức gà, Cơm trắng, Rau muống (Tổng 520 kcal)")
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
        { error: "AI không thể phân tích văn bản." },
        { status: 502 }
      );
    }

    const result: ParseFoodTextResponse = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/parse-food-text:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý AI hoặc không thể phân tích văn bản." },
      { status: 500 }
    );
  }
}

