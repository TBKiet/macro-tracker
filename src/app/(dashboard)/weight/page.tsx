"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isMonday, parseISO, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Target,
  Loader2,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import type { WeightLog } from "@/types/database";

export default function WeightPage() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [weightInput, setWeightInput] = useState<number | "">("");
  const [targetWeightInput, setTargetWeightInput] = useState<number | "">("");
  const [dateInput, setDateInput] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (data) {
        setWeightLogs(data);
        if (data.length > 0) {
          const latest = data[data.length - 1];
          if (latest.target_weight_kg) {
            setTargetWeightInput(latest.target_weight_kg);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử cân nặng:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit new weight
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightInput) {
      alert("Vui lòng nhập cân nặng!");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Chưa đăng nhập");

      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        date: dateInput,
        weight_kg: Number(weightInput),
        target_weight_kg: targetWeightInput ? Number(targetWeightInput) : null,
        note: noteInput || null,
      });

      if (error) throw error;

      setWeightInput("");
      setNoteInput("");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu cân nặng");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete weight log
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá bản ghi này?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("weight_logs").delete().eq("id", id);
      if (error) throw error;
      setWeightLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Không thể xoá");
    }
  };

  // Check if weighed this week
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const hasWeighedThisWeek = weightLogs.some((l) => l.date >= weekStart);

  // Statistics
  const latestWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : null;
  const initialWeight =
    weightLogs.length > 0 ? weightLogs[0].weight_kg : null;
  const targetWeight =
    weightLogs.length > 0
      ? weightLogs[weightLogs.length - 1].target_weight_kg
      : targetWeightInput || null;

  const totalChange =
    latestWeight && initialWeight
      ? Number((latestWeight - initialWeight).toFixed(1))
      : 0;

  const remainingToTarget =
    latestWeight && targetWeight
      ? Number((latestWeight - Number(targetWeight)).toFixed(1))
      : null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Theo dõi cân nặng ⚖️
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Kiểm tra cân nặng mỗi đầu tuần (Thứ Hai) để đánh giá hiệu quả chế độ ăn
          </p>
        </div>

        <button
          onClick={() => {
            setModalOpen(true);
            setWeightInput(latestWeight || "");
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#a3e635] text-black font-semibold text-sm hover:bg-[#84cc16] transition-all shadow-md shadow-[#a3e635]/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ghi nhận cân nặng</span>
        </button>
      </div>

      {/* Weekly weigh-in reminder banner */}
      {!hasWeighedThisWeek && !loading && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">
                Nhắc nhở cân đầu tuần!
              </h4>
              <p className="text-xs text-[#71717a]">
                Bạn chưa ghi nhận cân nặng cho tuần này. Cân vào buổi sáng sau khi thức dậy và đi vệ sinh để có kết quả chính xác nhất.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-all whitespace-nowrap"
          >
            Cân ngay
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-4">
          <p className="text-xs text-[#71717a] font-medium uppercase">
            Cân nặng hiện tại
          </p>
          <h3 className="text-2xl font-extrabold text-white mt-1">
            {latestWeight !== null ? `${latestWeight} kg` : "--"}
          </h3>
          <p className="text-[11px] text-[#71717a] mt-1">
            {weightLogs.length > 0
              ? format(new Date(weightLogs[weightLogs.length - 1].date), "dd/MM/yyyy")
              : "Chưa có dữ liệu"}
          </p>
        </div>

        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-4">
          <p className="text-xs text-[#71717a] font-medium uppercase">
            Mục tiêu
          </p>
          <h3 className="text-2xl font-extrabold text-[#a3e635] mt-1">
            {targetWeight ? `${targetWeight} kg` : "--"}
          </h3>
          <p className="text-[11px] text-[#71717a] mt-1">
            {remainingToTarget !== null
              ? remainingToTarget > 0
                ? `Cần giảm ${remainingToTarget} kg`
                : `Cần tăng ${Math.abs(remainingToTarget)} kg`
              : "Chưa đặt mục tiêu"}
          </p>
        </div>

        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-4">
          <p className="text-xs text-[#71717a] font-medium uppercase">
            Thay đổi tổng thể
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h3
              className={`text-2xl font-extrabold ${
                totalChange < 0
                  ? "text-[#a3e635]"
                  : totalChange > 0
                  ? "text-[#3b82f6]"
                  : "text-white"
              }`}
            >
              {totalChange > 0 ? `+${totalChange}` : totalChange} kg
            </h3>
          </div>
          <p className="text-[11px] text-[#71717a] mt-1">
            So với lần cân đầu tiên
          </p>
        </div>

        <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-4">
          <p className="text-xs text-[#71717a] font-medium uppercase">
            Số lần ghi nhận
          </p>
          <h3 className="text-2xl font-extrabold text-white mt-1">
            {weightLogs.length}{" "}
            <span className="text-xs font-normal text-[#71717a]">tuần/lần</span>
          </h3>
          <p className="text-[11px] text-[#71717a] mt-1">
            Dữ liệu theo thời gian
          </p>
        </div>
      </div>

      {/* Weight Chart */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#a3e635]" />
          Biểu đồ diễn biến cân nặng
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 text-[#a3e635] animate-spin" />
          </div>
        ) : weightLogs.length === 0 ? (
          <div className="text-center py-16 text-[#71717a]">
            <p className="text-sm">Chưa có đủ dữ liệu để vẽ biểu đồ.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-xs text-[#a3e635] hover:underline font-semibold"
            >
              + Nhập số cân đầu tiên
            </button>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightLogs} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272f" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={12}
                  tickFormatter={(d) => format(new Date(d), "dd/MM")}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#13131a",
                    borderColor: "#27272f",
                    borderRadius: "0.75rem",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                  formatter={(val) => [`${val} kg`, "Cân nặng"]}
                  labelFormatter={(lbl) =>
                    lbl ? `Ngày ${format(new Date(String(lbl)), "dd/MM/yyyy")}` : ""
                  }
                />
                {targetWeight && (
                  <ReferenceLine
                    y={Number(targetWeight)}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Mục tiêu: ${targetWeight}kg`,
                      fill: "#ef4444",
                      fontSize: 11,
                      position: "insideTopRight",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="#a3e635"
                  strokeWidth={3}
                  dot={{ fill: "#a3e635", r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weight History Table */}
      <div className="bg-[#13131a] border border-[#27272f] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#3b82f6]" />
          Lịch sử các lần cân
        </h3>

        {weightLogs.length === 0 ? (
          <p className="text-sm text-[#71717a] text-center py-6">
            Chưa có lịch sử cân nặng.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[#71717a] border-b border-[#27272f]">
                <tr>
                  <th className="py-3 px-4">Ngày ghi nhận</th>
                  <th className="py-3 px-4">Cân nặng</th>
                  <th className="py-3 px-4">Biến động</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272f]">
                {[...weightLogs].reverse().map((log, index, arr) => {
                  const prev = arr[index + 1];
                  const diff = prev
                    ? Number((log.weight_kg - prev.weight_kg).toFixed(1))
                    : 0;

                  return (
                    <tr key={log.id} className="hover:bg-[#1a1a24]/50">
                      <td className="py-3 px-4 font-medium text-white">
                        {format(new Date(log.date), "dd/MM/yyyy (EEEE)", {
                          locale: vi,
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {log.weight_kg} kg
                      </td>
                      <td className="py-3 px-4">
                        {prev ? (
                          <span
                            className={`flex items-center gap-1 text-xs font-semibold ${
                              diff < 0
                                ? "text-[#a3e635]"
                                : diff > 0
                                ? "text-[#ef4444]"
                                : "text-[#71717a]"
                            }`}
                          >
                            {diff < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : diff > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                            {diff > 0 ? `+${diff}` : diff} kg
                          </span>
                        ) : (
                          <span className="text-xs text-[#71717a]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#71717a]">
                        {log.note || "--"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 text-[#71717a] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#ef4444]/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Weight */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#13131a] border border-[#27272f] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[#71717a] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#a3e635]" />
              Ghi nhận cân nặng mới
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                  Ngày cân
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="VD: 72.5"
                  value={weightInput}
                  onChange={(e) =>
                    setWeightInput(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                  Mục tiêu cân nặng (kg - tuỳ chọn)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="VD: 68.0"
                  value={targetWeightInput}
                  onChange={(e) =>
                    setTargetWeightInput(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase">
                  Ghi chú
                </label>
                <input
                  type="text"
                  placeholder="VD: Cân sáng sau khi thức dậy, tuần thứ 2 cut"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-[#27272f] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#a3e635]"
                />
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
                  Lưu cân nặng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
