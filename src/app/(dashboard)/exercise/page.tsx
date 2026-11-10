"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dumbbell,
  Flame,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Activity,
  Timer,
  Footprints,
  X,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DateSelector } from "@/components/DateSelector";
import type { ExerciseLog, ExerciseType } from "@/types/database";

const CARDIO_TYPES = [
  "Đi bộ nhanh",
  "Chạy bộ ngoài trời",
  "Chạy máy (Treadmill)",
  "Đạp xe đạp",
  "Bơi lội",
  "Nhảy dây",
  "Chèo thuyền (Rowing)",
  "Leo cầu thang",
  "HIIT",
];

export default function ExercisePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiTextModalOpen, setAiTextModalOpen] = useState(false);
  const [userWeight, setUserWeight] = useState<number>(70);

  // Form states
  const [activeTab, setActiveTab] = useState<ExerciseType>("gym");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<number | "">(4);
  const [reps, setReps] = useState<number | "">(10);
  const [weightKg, setWeightKg] = useState<number | "">(60);
  const [durationMin, setDurationMin] = useState<number | "">(45);
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [caloriesBurned, setCaloriesBurned] = useState<number | "">("");
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch user weight from latest weight_log or profile
      const { data: weightData } = await supabase
        .from("weight_logs")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weightData?.weight_kg) {
        setUserWeight(Number(weightData.weight_kg));
      }

      // 2. Fetch exercise logs for selected date
      const { data: logsData } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .order("created_at", { ascending: true });

      if (logsData) {
        setExerciseLogs(logsData);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tập luyện:", err);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // AI Estimate Calories Burned
  const handleEstimateCalories = async () => {
    if (!exerciseName) {
      alert("Vui lòng nhập tên bài tập hoặc môn thể thao!");
      return;
    }

    setEstimating(true);
    setExplanation(null);

    try {
      const res = await fetch("/api/estimate-calories-burned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_type: activeTab,
          exercise_name: exerciseName,
          duration_min: Number(durationMin) || 30,
          weight_kg: userWeight,
          sets: sets ? Number(sets) : undefined,
          reps: reps ? Number(reps) : undefined,
          exercise_weight_kg: weightKg ? Number(weightKg) : undefined,
          distance_km: distanceKm ? Number(distanceKm) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể ước tính calo");
      }

      setCaloriesBurned(Math.round(data.calories_burned));
      if (data.explanation) setExplanation(data.explanation);
    } catch (err: any) {
      alert(err.message || "Lỗi khi gọi AI");
    } finally {
      setEstimating(false);
    }
  };

  // Submit Log
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName) {
      alert("Vui lòng nhập tên bài tập!");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Chưa đăng nhập");

      const finalCalories =
        caloriesBurned !== ""
          ? Number(caloriesBurned)
          : activeTab === "gym"
          ? (Number(durationMin) || 45) * 5
          : (Number(durationMin) || 30) * 8;

      const { error } = await supabase.from("exercise_logs").insert({
        user_id: user.id,
        date: dateStr,
        exercise_type: activeTab,
        exercise_name: exerciseName,
        duration_min: durationMin ? Number(durationMin) : null,
        sets: activeTab === "gym" && sets ? Number(sets) : null,
        reps: activeTab === "gym" && reps ? Number(reps) : null,
        weight_kg: activeTab === "gym" && weightKg ? Number(weightKg) : null,
        distance_km: activeTab === "cardio" && distanceKm ? Number(distanceKm) : null,
        calories_burned: finalCalories,
      });

      if (error) throw error;

      // Reset form
      setExerciseName("");
      setCaloriesBurned("");
      setExplanation(null);
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu bài tập");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Log
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá bài tập này?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("exercise_logs").delete().eq("id", id);
      if (error) throw error;
      setExerciseLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xoá");
    }
  };

  const totalCaloriesBurned = exerciseLogs.reduce(
    (sum, log) => sum + Number(log.calories_burned),
    0
  );
  const totalDuration = exerciseLogs.reduce(
    (sum, log) => sum + (Number(log.duration_min) || 0),
    0
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Date Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Nhật ký tập luyện 🏋️
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Ghi lại bài tập Gym, Cardio & tính toán calo tiêu thụ bằng AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAiTextModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#a3e635] text-black font-bold text-sm hover:opacity-95 transition-all shadow-md shadow-[#a3e635]/20"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Ghi cả buổi tập (AI)</span>
          </button>
          <button
            onClick={() => {
              setModalOpen(true);
              setExerciseName("");
              setCaloriesBurned("");
              setExplanation(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e2a] border border-[#27272f] text-white font-medium text-sm hover:bg-[#27272f] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm từng bài</span>
          </button>
        </div>
      </div>

      {/* Date selector */}
      <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Daily Exercise Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#ef4444]/10 text-[#ef4444]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#71717a] font-medium uppercase tracking-wider">
              Tổng calo tiêu thụ
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">
              {Math.round(totalCaloriesBurned)}{" "}
              <span className="text-xs font-normal text-[#71717a]">kcal</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#71717a] font-medium uppercase tracking-wider">
              Thời gian vận động
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">
              {totalDuration}{" "}
              <span className="text-xs font-normal text-[#71717a]">phút</span>
            </h3>
          </div>
        </div>

        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#71717a] font-medium uppercase tracking-wider">
              Số bài tập / môn
            </p>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">
              {exerciseLogs.length}{" "}
              <span className="text-xs font-normal text-[#71717a]">mục</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Exercise Logs List */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-5 md:p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#a3e635]" />
          Danh sách tập luyện ngày{" "}
          {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 text-[#a3e635] animate-spin" />
          </div>
        ) : exerciseLogs.length === 0 ? (
          <div className="text-center py-12 text-[#71717a]">
            <p className="text-sm">Chưa có bài tập nào được ghi trong ngày này.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-xs text-[#a3e635] hover:underline font-semibold"
            >
              + Ghi nhận bài tập đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exerciseLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#27272f] gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-[#27272f] text-white shrink-0 mt-0.5">
                    {log.exercise_type === "gym" ? (
                      <Dumbbell className="w-5 h-5 text-[#a3e635]" />
                    ) : (
                      <Footprints className="w-5 h-5 text-[#3b82f6]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-base">
                        {log.exercise_name}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#27272f] text-[#a3e635]">
                        {log.exercise_type === "gym" ? "Gym" : "Cardio"}
                      </span>
                    </div>

                    <div className="text-xs text-[#71717a] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {log.duration_min && (
                        <span>⏱️ {log.duration_min} phút</span>
                      )}
                      {log.exercise_type === "gym" && (
                        <>
                          {log.sets && log.reps && (
                            <span>
                              🔁 {log.sets} hiệp × {log.reps} lần
                            </span>
                          )}
                          {log.weight_kg !== null && (
                            <span>⚖️ {log.weight_kg} kg</span>
                          )}
                        </>
                      )}
                      {log.exercise_type === "cardio" && log.distance_km && (
                        <span>📍 {log.distance_km} km</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#27272f]">
                  <div className="text-right">
                    <span className="text-base font-bold text-[#ef4444]">
                      -{Math.round(log.calories_burned)} kcal
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-[#71717a] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#ef4444]/10"
                    title="Xoá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add Exercise */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#13131a] border border-[#27272f] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#a3e635]" />
              Ghi nhận tập luyện
            </h3>

            {/* Type Tabs */}
            <div className="flex rounded-xl bg-[#1a1a24] p-1 mb-5 border border-[#27272f]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("gym");
                  setExerciseName("");
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "gym"
                    ? "bg-[#a3e635] text-black shadow-sm"
                    : "text-[#71717a] hover:text-white"
                }`}
              >
                🏋️ Kháng lực (Gym)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("cardio");
                  setExerciseName(CARDIO_TYPES[0]);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "cardio"
                    ? "bg-[#3b82f6] text-white shadow-sm"
                    : "text-[#71717a] hover:text-white"
                }`}
              >
                🏃 Cardio / Thể thao
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                  Tên bài tập / Hoạt động
                </label>
                {activeTab === "cardio" ? (
                  <select
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b82f6]"
                  >
                    {CARDIO_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="VD: Bench Press, Squat, Kéo xà, Barbell Curl..."
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                    />
                    <div className="mt-2">
                      <span className="text-[11px] text-[#71717a] block mb-1">
                        Gợi ý bài tập nhanh:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Bench Press",
                          "Squat",
                          "Deadlift",
                          "Kéo xà (Pull-up)",
                          "Đẩy vai (OHP)",
                          "Barbell Row",
                          "Leg Press",
                          "Gập bụng",
                        ].map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setExerciseName(name)}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-[#13131a] hover:bg-[#27272f] border border-[#27272f] text-[#71717a] hover:text-[#a3e635] transition-colors"
                          >
                            + {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Gym Specific Fields */}
              {activeTab === "gym" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#71717a] mb-1">Số hiệp (Sets)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="4"
                      value={sets}
                      onChange={(e) => setSets(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#71717a] mb-1">Số lần (Reps)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={reps}
                      onChange={(e) => setReps(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#71717a] mb-1">Mức tạ (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="60"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Cardio & Common Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={durationMin}
                    onChange={(e) =>
                      setDurationMin(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
                {activeTab === "cardio" && (
                  <div>
                    <label className="block text-xs text-[#71717a] mb-1">
                      Quãng đường (km - tuỳ chọn)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="5.0"
                      value={distanceKm}
                      onChange={(e) =>
                        setDistanceKm(e.target.value ? Number(e.target.value) : "")
                      }
                      className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm"
                    />
                  </div>
                )}
              </div>

              {/* AI Calorie Estimation */}
              <div className="p-4 rounded-xl bg-[#1a1a24] border border-[#27272f] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#a3e635]" />
                    AI Ước tính Calo tiêu hao
                  </span>
                  <button
                    type="button"
                    onClick={handleEstimateCalories}
                    disabled={estimating || !exerciseName}
                    className="px-3 py-1.5 rounded-lg bg-[#27272f] text-xs font-semibold text-[#a3e635] hover:bg-[#a3e635] hover:text-black transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    {estimating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tính...
                      </>
                    ) : (
                      "AI Tính Calo"
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Calo tiêu thụ (kcal)"
                    value={caloriesBurned}
                    onChange={(e) =>
                      setCaloriesBurned(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="flex-1 bg-[#13131a] border border-[#27272f] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#ef4444]"
                  />
                  <span className="text-xs text-[#71717a]">kcal</span>
                </div>

                {explanation && (
                  <p className="text-xs text-[#a3e635] italic bg-[#a3e635]/5 p-2 rounded-lg border border-[#a3e635]/20">
                    💡 {explanation}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-[#71717a] hover:text-white font-medium text-sm transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#a3e635] text-black font-semibold text-sm hover:bg-[#84cc16] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Lưu bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Smart Workout Text Parser Modal */}
      {aiTextModalOpen && (
        <AiParseExerciseModal
          open={aiTextModalOpen}
          onClose={() => setAiTextModalOpen(false)}
          onSaved={loadData}
          selectedDate={selectedDate}
          userWeight={userWeight}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Component: AI Parse Exercise Text Modal
// ──────────────────────────────────────────────
interface ParsedExercise {
  exercise_type: ExerciseType;
  exercise_name: string;
  duration_min: number | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  distance_km: number | null;
  calories_burned: number;
}

function AiParseExerciseModal({
  open,
  onClose,
  onSaved,
  selectedDate,
  userWeight,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  selectedDate: Date;
  userWeight: number;
}) {
  const supabase = createClient();
  const [inputText, setInputText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedExercise[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [savingAll, setSavingAll] = useState(false);

  if (!open) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError("Vui lòng nhập đoạn văn miêu tả buổi tập.");
      return;
    }
    setError("");
    setParsing(true);
    setParsedItems([]);
    setSummary("");

    try {
      const res = await fetch("/api/parse-exercise-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          user_weight_kg: userWeight,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể phân tích");

      setParsedItems(data.exercises || []);
      setSummary(data.summary || "");
    } catch (err: any) {
      setError(err.message || "Không thể bóc tách buổi tập. Vui lòng thử lại.");
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (parsedItems.length === 0) return;
    setSavingAll(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const inserts = parsedItems.map((item) => ({
        user_id: user.id,
        date: dateStr,
        exercise_type: item.exercise_type,
        exercise_name: item.exercise_name,
        duration_min: item.duration_min,
        sets: item.sets,
        reps: item.reps,
        weight_kg: item.weight_kg,
        distance_km: item.distance_km,
        calories_burned: Math.round(item.calories_burned),
      }));

      const { error: insertErr } = await supabase
        .from("exercise_logs")
        .insert(inserts);
      if (insertErr) throw insertErr;

      setInputText("");
      setParsedItems([]);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Không thể lưu các bài tập.");
    } finally {
      setSavingAll(false);
    }
  };

  const totalCalories = parsedItems.reduce((s, i) => s + i.calories_burned, 0);
  const totalMins = parsedItems.reduce(
    (s, i) => s + (i.duration_min || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-[scale-in_0.2s_ease-out] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272f]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                AI Tự Bóc Tách Buổi Tập Tự Nhiên
              </h2>
              <p className="text-xs text-[#71717a] mt-1">
                Gõ hoặc dán nguyên đoạn văn bản miêu tả cả buổi tập gym và cardio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1e1e2a] text-[#71717a] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#71717a] uppercase tracking-wider">
            Đoạn văn miêu tả buổi tập của bạn:
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ví dụ: Hôm nay tập ngực bench press 4 hiệp 10 lần 70kg, incline dumbbell press 3 hiệp 12 lần tạ 22kg, hít đất 3 hiệp 15 cái. Sau đó chạy bộ máy 25 phút được 3.5km..."
            className="w-full bg-[#1a1a24] border border-[#27272f] text-white placeholder:text-[#71717a] rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635] focus:border-transparent resize-none leading-relaxed"
          />

          {/* Quick Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-[#71717a]">Thử mẫu nhanh:</span>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  "Hôm nay tập ngực & tay sau: Bench Press 4 hiệp 10 lần 70kg, Incline Dumbbell Press 3 hiệp 12 lần 20kg mỗi bên, hít đất 3 hiệp 15 lần. Cuối buổi chạy máy 20 phút."
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1a24] hover:bg-[#27272f] text-[#a3e635] border border-[#27272f] transition-all"
            >
              🏋️ Buổi tập Ngực + Chạy nhẹ
            </button>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  "Sáng nay chạy bộ công viên 40 phút được 5.2km, sau đó nhảy dây 10 phút."
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1a24] hover:bg-[#27272f] text-[#3b82f6] border border-[#27272f] transition-all"
            >
              🏃 Buổi Cardio Chạy bộ + Nhảy dây
            </button>
          </div>
        </div>

        {/* Parse Button */}
        <button
          onClick={handleParse}
          disabled={parsing || !inputText.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md",
            parsing || !inputText.trim()
              ? "bg-[#1e1e2a] text-[#71717a] cursor-not-allowed"
              : "bg-gradient-to-r from-[#84cc16] to-[#a3e635] text-black hover:opacity-95 shadow-[#a3e635]/20"
          )}
        >
          {parsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI Đang phân tích bài tập & tính calo đốt cháy...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Phân Tích Buổi Tập Bằng AI</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
            {error}
          </p>
        )}

        {/* Results Preview */}
        {parsedItems.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#27272f] animate-[fade-in_0.3s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30">
              <div>
                <p className="text-xs font-semibold text-[#a3e635]">
                  {summary || `Đã bóc tách thành công ${parsedItems.length} bài tập:`}
                </p>
                <p className="text-[11px] text-white mt-0.5">
                  Tổng calo tiêu thụ:{" "}
                  <strong className="text-[#ef4444]">
                    -{Math.round(totalCalories)} kcal
                  </strong>{" "}
                  {totalMins > 0 && `• Thời lượng: ~${totalMins} phút`}
                </p>
              </div>
              <span className="text-xs bg-[#a3e635] text-black font-bold px-2.5 py-1 rounded-lg shrink-0">
                {parsedItems.length} bài
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a24] border border-[#27272f] hover:border-[#a3e635]/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase shrink-0 ${
                        item.exercise_type === "gym"
                          ? "bg-[#27272f] text-[#a3e635]"
                          : "bg-[#27272f] text-[#3b82f6]"
                      }`}
                    >
                      {item.exercise_type === "gym" ? "Gym" : "Cardio"}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-white truncate text-sm">
                        {item.exercise_name}
                      </p>
                      <p className="text-[#71717a] text-[11px] mt-0.5 flex flex-wrap gap-2">
                        {item.sets && item.reps && (
                          <span>
                            {item.sets} hiệp × {item.reps} lần
                          </span>
                        )}
                        {item.weight_kg !== null && (
                          <span>{item.weight_kg} kg</span>
                        )}
                        {item.duration_min && (
                          <span>{item.duration_min} phút</span>
                        )}
                        {item.distance_km && (
                          <span>{item.distance_km} km</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-[#ef4444] text-sm">
                      -{Math.round(item.calories_burned)} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-[#71717a] hover:text-red-400 rounded transition-colors"
                      title="Xoá bài này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save All Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-[#71717a] hover:text-white font-medium text-sm transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={savingAll || parsedItems.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-[#a3e635] text-black font-bold text-sm hover:bg-[#84cc16] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#a3e635]/25 disabled:opacity-50"
              >
                {savingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Lưu tất cả {parsedItems.length} bài tập vào nhật ký
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
