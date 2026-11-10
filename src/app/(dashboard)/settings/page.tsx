"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Sparkles,
  Sliders,
  User,
  CheckCircle2,
  Loader2,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  ActivityLevel,
  Gender,
  NutritionGoal,
  Profile,
} from "@/types/database";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [macroSaving, setMacroSaving] = useState(false);
  const [aiCalculating, setAiCalculating] = useState(false);

  // Tab: AI or Manual
  const [calcMode, setCalcMode] = useState<"ai" | "manual">("ai");

  // Profile Form
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState<number | "">(175);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  // AI Calculator Form
  const [currentWeight, setCurrentWeight] = useState<number | "">(70);
  const [age, setAge] = useState<number | "">(25);
  const [fitnessGoal, setFitnessGoal] = useState<"lose" | "maintain" | "gain">(
    "maintain"
  );
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Macro Target Form (Shared / Result)
  const [targetCalories, setTargetCalories] = useState<number | "">(2200);
  const [targetProtein, setTargetProtein] = useState<number | "">(150);
  const [targetCarbs, setTargetCarbs] = useState<number | "">(250);
  const [targetFat, setTargetFat] = useState<number | "">(65);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || "");
        if (profile.gender) setGender(profile.gender);
        if (profile.birth_date) {
          setBirthDate(profile.birth_date);
          const birthYear = new Date(profile.birth_date).getFullYear();
          if (!isNaN(birthYear)) {
            setAge(new Date().getFullYear() - birthYear);
          }
        }
        if (profile.height_cm) setHeightCm(profile.height_cm);
        if (profile.activity_level) setActivityLevel(profile.activity_level);
      }

      // 2. Fetch Latest Weight
      const { data: weightData } = await supabase
        .from("weight_logs")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weightData?.weight_kg) {
        setCurrentWeight(Number(weightData.weight_kg));
      }

      // 3. Fetch Nutrition Goal
      const { data: goal } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goal) {
        setTargetCalories(goal.calories);
        setTargetProtein(goal.protein_g);
        setTargetCarbs(goal.carbs_g);
        setTargetFat(goal.fat_g);
      }
    } catch (err) {
      console.error("Lỗi khi tải cài đặt:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName || null,
        gender,
        birth_date: birthDate || null,
        height_cm: heightCm ? Number(heightCm) : null,
        activity_level: activityLevel,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert("Đã cập nhật hồ sơ cá nhân thành công!");
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu hồ sơ");
    } finally {
      setProfileSaving(false);
    }
  };

  // AI Calculate Macros
  const handleCalculateAiMacros = async () => {
    if (!heightCm || !currentWeight || !age) {
      alert("Vui lòng nhập đầy đủ chiều cao, cân nặng và tuổi!");
      return;
    }

    setAiCalculating(true);
    setAiExplanation(null);

    try {
      const res = await fetch("/api/calculate-macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          age: Number(age),
          height_cm: Number(heightCm),
          weight_kg: Number(currentWeight),
          activity_level: activityLevel,
          goal: fitnessGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tính macro");
      }

      setTargetCalories(Math.round(data.calories));
      setTargetProtein(Math.round(data.protein_g));
      setTargetCarbs(Math.round(data.carbs_g));
      setTargetFat(Math.round(data.fat_g));
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err: any) {
      alert(err.message || "Lỗi khi gọi AI tính Macro");
    } finally {
      setAiCalculating(false);
    }
  };

  // Save Nutrition Goals
  const handleSaveGoals = async (isAi: boolean = false) => {
    if (!targetCalories || !targetProtein || !targetCarbs || !targetFat) {
      alert("Vui lòng điền đầy đủ các chỉ số calo & macro!");
      return;
    }

    setMacroSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const { error } = await supabase.from("nutrition_goals").insert({
        user_id: user.id,
        calories: Number(targetCalories),
        protein_g: Number(targetProtein),
        carbs_g: Number(targetCarbs),
        fat_g: Number(targetFat),
        is_ai_generated: isAi,
      });

      if (error) throw error;
      alert("Đã lưu mục tiêu dinh dưỡng & macro thành công!");
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu mục tiêu dinh dưỡng");
    } finally {
      setMacroSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-[#a3e635] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Cài đặt & Cá nhân hoá ⚙️
        </h1>
        <p className="text-sm text-[#71717a] mt-1">
          Thiết lập thể trạng, dùng AI phân tích TDEE hoặc điều chỉnh Macro bằng tay
        </p>
      </div>

      {/* Section 1: Thể trạng cá nhân */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[#a3e635]" />
          Hồ sơ thể trạng cơ thể
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                Giới tính sinh học
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                Ngày sinh
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  const yr = new Date(e.target.value).getFullYear();
                  if (!isNaN(yr)) setAge(new Date().getFullYear() - yr);
                }}
                className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                Chiều cao (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) =>
                  setHeightCm(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="175"
                className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
              Mức độ vận động hàng ngày
            </label>
            <select
              value={activityLevel}
              onChange={(e) =>
                setActivityLevel(e.target.value as ActivityLevel)
              }
              className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
            >
              <option value="sedentary">Ít vận động (làm văn phòng, ít tập)</option>
              <option value="light">Vận động nhẹ (tập 1-3 ngày/tuần)</option>
              <option value="moderate">Vận động vừa (tập 3-5 ngày/tuần)</option>
              <option value="active">Năng động (tập gym 6-7 ngày/tuần)</option>
              <option value="very_active">Cực kỳ năng động (vận động viên, ngày tập 2 buổi)</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 rounded-xl bg-[#27272f] text-white hover:bg-[#32323d] text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Cập nhật thể trạng
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Thiết lập Calo & Macro */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#a3e635]" />
              Thiết lập Calo & Tỷ lệ Macro
            </h3>
            <p className="text-xs text-[#71717a] mt-0.5">
              Chọn tính tự động bằng AI hoặc điều chỉnh thủ công bằng tay
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex rounded-xl bg-[#1a1a24] p-1 border border-[#27272f] shrink-0">
            <button
              type="button"
              onClick={() => setCalcMode("ai")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                calcMode === "ai"
                  ? "bg-[#a3e635] text-black shadow-sm"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Tính toán
            </button>
            <button
              type="button"
              onClick={() => setCalcMode("manual")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                calcMode === "manual"
                  ? "bg-[#3b82f6] text-white shadow-sm"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Chỉnh bằng tay
            </button>
          </div>
        </div>

        {/* AI Calculator View */}
        {calcMode === "ai" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#1a1a24] border border-[#27272f]">
              <div>
                <label className="block text-xs text-[#71717a] mb-1">
                  Tuổi hiện tại
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-[#71717a] mb-1">
                  Cân nặng hiện tại (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={currentWeight}
                  onChange={(e) =>
                    setCurrentWeight(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-[#71717a] mb-1">
                  Mục tiêu thể hình
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) =>
                    setFitnessGoal(e.target.value as "lose" | "maintain" | "gain")
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="lose">Giảm mỡ (Cutting / -500 kcal)</option>
                  <option value="maintain">Giữ cơ & cân nặng (Maintenance)</option>
                  <option value="gain">Tăng cơ (Bulking / +300-500 kcal)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateAiMacros}
              disabled={aiCalculating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#a3e635] text-black font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#a3e635]/20 disabled:opacity-50"
            >
              {aiCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Đang phân tích TDEE và tính Macro...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  Nhờ AI tính Macro tối ưu
                </>
              )}
            </button>

            {aiExplanation && (
              <div className="p-4 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30">
                <h5 className="font-semibold text-sm text-[#a3e635] flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Lời khuyên từ AI Chuyên gia:
                </h5>
                <p className="text-xs text-[#e8e8ed] leading-relaxed">
                  {aiExplanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results / Manual Edit Section */}
        <div className="mt-6 pt-6 border-t border-[#27272f] space-y-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
            Chỉ số mục tiêu (Target Macros mỗi ngày)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#27272f]">
              <div className="flex items-center gap-1.5 text-xs text-[#a3e635] font-semibold mb-2">
                <Flame className="w-4 h-4" />
                Mục tiêu Calo
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) =>
                    setTargetCalories(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-2.5 py-1.5 text-white font-extrabold text-lg focus:outline-none focus:border-[#a3e635]"
                />
                <span className="text-xs text-[#71717a]">kcal</span>
              </div>
            </div>

            {/* Protein */}
            <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#27272f]">
              <div className="flex items-center gap-1.5 text-xs text-[#ef4444] font-semibold mb-2">
                <Beef className="w-4 h-4" />
                Protein (Đạm)
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetProtein}
                  onChange={(e) =>
                    setTargetProtein(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-2.5 py-1.5 text-white font-extrabold text-lg focus:outline-none focus:border-[#ef4444]"
                />
                <span className="text-xs text-[#71717a]">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#27272f]">
              <div className="flex items-center gap-1.5 text-xs text-[#3b82f6] font-semibold mb-2">
                <Wheat className="w-4 h-4" />
                Carbs (Tinh bột)
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetCarbs}
                  onChange={(e) =>
                    setTargetCarbs(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-2.5 py-1.5 text-white font-extrabold text-lg focus:outline-none focus:border-[#3b82f6]"
                />
                <span className="text-xs text-[#71717a]">g</span>
              </div>
            </div>

            {/* Fat */}
            <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#27272f]">
              <div className="flex items-center gap-1.5 text-xs text-[#f59e0b] font-semibold mb-2">
                <Droplets className="w-4 h-4" />
                Fat (Chất béo)
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetFat}
                  onChange={(e) =>
                    setTargetFat(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full bg-[#13131a] border border-[#27272f] rounded-lg px-2.5 py-1.5 text-white font-extrabold text-lg focus:outline-none focus:border-[#f59e0b]"
                />
                <span className="text-xs text-[#71717a]">g</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => handleSaveGoals(calcMode === "ai")}
              disabled={macroSaving}
              className="px-6 py-2.5 rounded-xl bg-[#a3e635] text-black font-semibold text-sm hover:bg-[#84cc16] transition-all flex items-center gap-2 shadow-md shadow-[#a3e635]/20 disabled:opacity-50"
            >
              {macroSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Lưu & Áp dụng mục tiêu Macro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

