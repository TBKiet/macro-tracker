"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Flame,
  Zap,
  TrendingUp,
  Plus,
  Utensils,
  Dumbbell,
  Scale,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  FoodLog,
  ExerciseLog,
  WeightLog,
  NutritionGoal,
} from "@/types/database";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<NutritionGoal | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [todayStr] = useState(format(new Date(), "yyyy-MM-dd"));

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch Goals
      const { data: goalsData } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalsData) setGoals(goalsData);

      // 2. Fetch Today's Food Logs
      const { data: foodsData } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr);

      if (foodsData) setFoodLogs(foodsData);

      // 3. Fetch Today's Exercise Logs
      const { data: exercisesData } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr);

      if (exercisesData) setExerciseLogs(exercisesData);

      // 4. Fetch Weight Logs
      const { data: weightsData } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .limit(10);

      if (weightsData) setWeightLogs(weightsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calcs
  const caloriesIn = foodLogs.reduce((sum, log) => sum + Number(log.calories), 0);
  const proteinIn = foodLogs.reduce((sum, log) => sum + Number(log.protein_g), 0);
  const carbsIn = foodLogs.reduce((sum, log) => sum + Number(log.carbs_g), 0);
  const fatIn = foodLogs.reduce((sum, log) => sum + Number(log.fat_g), 0);

  const caloriesOut = exerciseLogs.reduce(
    (sum, log) => sum + Number(log.calories_burned),
    0
  );
  const netCalories = caloriesIn - caloriesOut;

  const targetCalories = goals?.calories || 2200;
  const targetProtein = goals?.protein_g || 140;
  const targetCarbs = goals?.carbs_g || 250;
  const targetFat = goals?.fat_g || 70;

  const calProgress = Math.min(Math.round((caloriesIn / targetCalories) * 100), 100);
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : null;
  const targetWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].target_weight_kg : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Tổng quan hôm nay ⚡
          </h1>
          <p className="text-sm text-[#71717a] mt-1 capitalize">
            {format(new Date(), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/food"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#a3e635] text-black font-semibold text-sm hover:bg-[#84cc16] transition-all shadow-md shadow-[#a3e635]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm món</span>
          </Link>
          <Link
            href="/exercise"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e1e2a] text-white font-medium text-sm hover:bg-[#27272f] border border-[#27272f] transition-all"
          >
            <Dumbbell className="w-4 h-4 text-[#a3e635]" />
            <span>Tập luyện</span>
          </Link>
          <Link
            href="/weight"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e1e2a] text-white font-medium text-sm hover:bg-[#27272f] border border-[#27272f] transition-all"
          >
            <Scale className="w-4 h-4 text-[#3b82f6]" />
            <span>Cân nặng</span>
          </Link>
        </div>
      </div>

      {/* Setup Goal Banner if not set */}
      {!goals && !loading && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#a3e635]/10 via-[#13131a] to-[#13131a] border border-[#a3e635]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a3e635]/20 flex items-center justify-center text-[#a3e635]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Chưa thiết lập mục tiêu calo & macro</h4>
              <p className="text-xs text-[#71717a]">
                Dùng AI tính toán macro tối ưu theo thể trạng hoặc cài đặt thủ công.
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-xl bg-[#a3e635] text-black font-semibold text-xs hover:bg-[#84cc16] transition-all whitespace-nowrap"
          >
            Tính macro với AI ngay
          </Link>
        </div>
      )}

      {/* Row 1: Energy & Calorie Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Calories In */}
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
              Calo Đã Nạp
            </span>
            <div className="p-2 rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {Math.round(caloriesIn)}
            </span>
            <span className="text-sm text-[#71717a]">/ {targetCalories} kcal</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1a1a24] h-2.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-[#a3e635] h-full rounded-full transition-all duration-500"
              style={{ width: `${calProgress}%` }}
            />
          </div>
          <p className="text-xs text-[#71717a] mt-2 flex justify-between">
            <span>Đã nạp {calProgress}%</span>
            <span>Còn lại: {Math.max(0, targetCalories - Math.round(caloriesIn))} kcal</span>
          </p>
        </div>

        {/* Calories Burned */}
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
              Calo Tiêu Thụ
            </span>
            <div className="p-2 rounded-xl bg-[#ef4444]/10 text-[#ef4444]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {Math.round(caloriesOut)}
            </span>
            <span className="text-sm text-[#71717a]">kcal</span>
          </div>
          <p className="text-xs text-[#71717a] mt-4 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
            <span>{exerciseLogs.length} bài tập đã ghi nhận hôm nay</span>
          </p>
        </div>

        {/* Net Calories */}
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
              Calo Ròng (Net)
            </span>
            <div className="p-2 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl font-extrabold",
                netCalories <= targetCalories ? "text-white" : "text-[#ef4444]"
              )}
            >
              {Math.round(netCalories)}
            </span>
            <span className="text-sm text-[#71717a]">kcal</span>
          </div>
          <p className="text-xs text-[#71717a] mt-4">
            (Nạp {Math.round(caloriesIn)} - Đốt {Math.round(caloriesOut)})
          </p>
        </div>
      </div>

      {/* Row 2: Macro Breakdown */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-white">Chỉ số Macro hôm nay</h3>
            <p className="text-xs text-[#71717a] mt-0.5">
              Tỷ lệ nạp đạm, tinh bột và chất béo
            </p>
          </div>
          <Link
            href="/food"
            className="text-xs font-medium text-[#a3e635] hover:underline flex items-center gap-1"
          >
            Chi tiết nhật ký <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                Protein (Đạm)
              </span>
              <span className="text-xs text-[#71717a]">
                {Math.round(proteinIn)}g / {targetProtein}g
              </span>
            </div>
            <div className="w-full bg-[#1a1a24] h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#ef4444] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round((proteinIn / targetProtein) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#71717a]">
              <span>{Math.round(proteinIn * 4)} kcal</span>
              <span>{Math.round((proteinIn / targetProtein) * 100)}%</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                Carbs (Tinh bột)
              </span>
              <span className="text-xs text-[#71717a]">
                {Math.round(carbsIn)}g / {targetCarbs}g
              </span>
            </div>
            <div className="w-full bg-[#1a1a24] h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#3b82f6] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round((carbsIn / targetCarbs) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#71717a]">
              <span>{Math.round(carbsIn * 4)} kcal</span>
              <span>{Math.round((carbsIn / targetCarbs) * 100)}%</span>
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                Fat (Chất béo)
              </span>
              <span className="text-xs text-[#71717a]">
                {Math.round(fatIn)}g / {targetFat}g
              </span>
            </div>
            <div className="w-full bg-[#1a1a24] h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#f59e0b] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round((fatIn / targetFat) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#71717a]">
              <span>{Math.round(fatIn * 9)} kcal</span>
              <span>{Math.round((fatIn / targetFat) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Meals Logged & Weight Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meals Quick List */}
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#a3e635]" />
              Món ăn hôm nay
            </h3>
            <Link
              href="/food"
              className="text-xs text-[#a3e635] hover:underline flex items-center gap-1"
            >
              Thêm món <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {foodLogs.length === 0 ? (
            <div className="text-center py-10 text-[#71717a]">
              <p className="text-sm">Chưa có bữa ăn nào được ghi lại hôm nay.</p>
              <Link
                href="/food"
                className="inline-block mt-3 text-xs text-[#a3e635] hover:underline font-semibold"
              >
                + Bắt đầu ghi nhật ký ăn uống
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {foodLogs.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a24] border border-[#27272f]"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-white">{item.food_name}</h5>
                    <p className="text-xs text-[#71717a]">
                      {item.quantity_g}g • P: {item.protein_g}g • C: {item.carbs_g}g • F: {item.fat_g}g
                    </p>
                  </div>
                  <span className="font-bold text-sm text-[#a3e635]">
                    {item.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weight Tracker Mini Chart */}
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#3b82f6]" />
                Tiến trình cân nặng
              </h3>
              {currentWeight && (
                <p className="text-xs text-[#71717a] mt-0.5">
                  Hiện tại: <strong className="text-white">{currentWeight} kg</strong>
                  {targetWeight && ` • Mục tiêu: ${targetWeight} kg`}
                </p>
              )}
            </div>
            <Link
              href="/weight"
              className="text-xs text-[#a3e635] hover:underline flex items-center gap-1"
            >
              Cập nhật <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {weightLogs.length === 0 ? (
            <div className="text-center py-10 text-[#71717a]">
              <p className="text-sm">Chưa có dữ liệu theo dõi cân nặng.</p>
              <Link
                href="/weight"
                className="inline-block mt-3 text-xs text-[#3b82f6] hover:underline font-semibold"
              >
                + Cân lần đầu ngay
              </Link>
            </div>
          ) : (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightLogs}>
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(d) => format(new Date(d), "dd/MM")}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    domain={["dataMin - 1", "dataMax + 1"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#13131a",
                      borderColor: "#27272f",
                      borderRadius: "0.5rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val} kg`, "Cân nặng"]}
                  />
                  {targetWeight && (
                    <ReferenceLine
                      y={targetWeight}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: "Mục tiêu",
                        fill: "#ef4444",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight_kg"
                    stroke="#a3e635"
                    strokeWidth={2.5}
                    dot={{ fill: "#a3e635", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
