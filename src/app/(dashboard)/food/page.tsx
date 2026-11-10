'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  Sparkles,
  Save,
  Loader2,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Cookie,
  X,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DateSelector } from '@/components/DateSelector';
import type { FoodLog, MealType, NutritionGoal } from '@/types/database';

const MEAL_TABS: { key: MealType; label: string; icon: React.ElementType }[] = [
  { key: 'breakfast', label: 'Bữa sáng', icon: Coffee },
  { key: 'lunch', label: 'Bữa trưa', icon: Sun },
  { key: 'dinner', label: 'Bữa tối', icon: Moon },
  { key: 'snack', label: 'Snack', icon: Cookie },
];

// ──────────────────────────────────────────────
// Daily Summary Bar
// ──────────────────────────────────────────────
function DailySummary({
  logs,
  goals,
}: {
  logs: FoodLog[];
  goals: NutritionGoal | null;
}) {
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein_g,
      carbs: acc.carbs + log.carbs_g,
      fat: acc.fat + log.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const items = [
    {
      label: 'Calories',
      value: Math.round(totals.calories),
      goal: goals?.calories ?? 2000,
      unit: 'kcal',
      color: '#a3e635',
      icon: Flame,
    },
    {
      label: 'Protein',
      value: Math.round(totals.protein),
      goal: goals?.protein_g ?? 150,
      unit: 'g',
      color: '#ef4444',
      icon: Beef,
    },
    {
      label: 'Carbs',
      value: Math.round(totals.carbs),
      goal: goals?.carbs_g ?? 250,
      unit: 'g',
      color: '#f59e0b',
      icon: Wheat,
    },
    {
      label: 'Fat',
      value: Math.round(totals.fat),
      goal: goals?.fat_g ?? 70,
      unit: 'g',
      color: '#3b82f6',
      icon: Droplets,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const pct = Math.min((item.value / item.goal) * 100, 100);
        return (
          <div
            key={item.label}
            className="bg-[#13131a] border border-[#27272f] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
              <span className="text-xs text-[#71717a]">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-white">
              {item.value}
              <span className="text-sm font-normal text-[#71717a] ml-1">
                / {item.goal} {item.unit}
              </span>
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-[#1e1e2a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Meal Section
// ──────────────────────────────────────────────
function MealSection({
  mealType,
  logs,
  onDelete,
  deleting,
}: {
  mealType: MealType;
  logs: FoodLog[];
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const meal = MEAL_TABS.find((m) => m.key === mealType)!;
  const mealLogs = logs.filter((l) => l.meal_type === mealType);

  const subtotal = mealLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein_g,
      carbs: acc.carbs + log.carbs_g,
      fat: acc.fat + log.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="bg-[#13131a] border border-[#27272f] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272f]">
        <div className="flex items-center gap-2">
          <meal.icon className="w-4 h-4 text-[#a3e635]" />
          <span className="font-medium text-white">{meal.label}</span>
          <span className="text-xs text-[#71717a]">({mealLogs.length} món)</span>
        </div>
        {mealLogs.length > 0 && (
          <span className="text-sm text-[#a3e635] font-medium">
            {Math.round(subtotal.calories)} kcal
          </span>
        )}
      </div>

      {/* Items */}
      {mealLogs.length === 0 ? (
        <div className="px-4 py-6 text-center text-[#71717a] text-sm">
          Chưa có món nào được ghi nhận
        </div>
      ) : (
        <div className="divide-y divide-[#27272f]">
          {mealLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a24] transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {log.food_name}
                </p>
                <p className="text-xs text-[#71717a] mt-0.5">
                  {log.quantity_g}g • {Math.round(log.calories)} kcal • P:{' '}
                  {Math.round(log.protein_g)}g • C: {Math.round(log.carbs_g)}g • F:{' '}
                  {Math.round(log.fat_g)}g
                </p>
              </div>
              <button
                onClick={() => onDelete(log.id)}
                disabled={deleting === log.id}
                className="ml-2 p-1.5 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                {deleting === log.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}

          {/* Subtotal row */}
          <div className="px-4 py-2 bg-[#0f0f17] flex items-center justify-between text-xs text-[#71717a]">
            <span>Tổng {meal.label}</span>
            <span>
              P: {Math.round(subtotal.protein)}g • C:{' '}
              {Math.round(subtotal.carbs)}g • F: {Math.round(subtotal.fat)}g
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Add Food Modal
// ──────────────────────────────────────────────
function AddFoodModal({
  open,
  onClose,
  onSaved,
  selectedDate,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  selectedDate: Date;
}) {
  const supabase = createClient();
  const [foodName, setFoodName] = useState('');
  const [quantityG, setQuantityG] = useState<number>(100);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFoodName('');
    setQuantityG(100);
    setMealType('lunch');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setAnalyzed(false);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!foodName.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: foodName, quantity_g: quantityG }),
      });
      if (!res.ok) throw new Error('Phân tích thất bại');
      const data = await res.json();
      setCalories(data.calories);
      setProtein(data.protein_g);
      setCarbs(data.carbs_g);
      setFat(data.fat_g);
      setAnalyzed(true);
    } catch {
      setError('Không thể phân tích. Vui lòng thử lại.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Vui lòng đăng nhập');
      return;
    }
    setSaving(true);
    setError('');
    const { error: insertErr } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      meal_type: mealType,
      food_name: foodName,
      quantity_g: quantityG,
      calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    });
    setSaving(false);
    if (insertErr) {
      setError('Lưu thất bại: ' + insertErr.message);
      return;
    }
    resetForm();
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#13131a] border border-[#27272f] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[scale-in_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272f]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#a3e635]" />
            Thêm món ăn
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-[#1e1e2a] text-[#71717a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Food name */}
          <div>
            <label className="block text-sm text-[#71717a] mb-1.5">Tên món ăn</label>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="VD: Ức gà áp chảo, Cơm trắng, Trứng gà, Whey..."
              className="w-full bg-[#1a1a24] border border-[#27272f] text-white placeholder:text-[#71717a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635] focus:border-transparent"
            />

            {/* Quick Gymer Staples */}
            <div className="mt-2">
              <span className="text-[11px] text-[#71717a] block mb-1">Gợi ý nhanh cho Gymer:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Ức gà luộc', g: 150 },
                  { name: 'Cơm trắng', g: 200 },
                  { name: 'Trứng luộc (2 quả)', g: 100 },
                  { name: 'Thịt bò nạc', g: 150 },
                  { name: 'Khoai lang', g: 150 },
                  { name: 'Whey Protein', g: 30 },
                  { name: 'Chuối chín', g: 120 },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setFoodName(item.name);
                      setQuantityG(item.g);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#1a1a24] hover:bg-[#27272f] border border-[#27272f] text-[#71717a] hover:text-[#a3e635] transition-colors"
                  >
                    + {item.name} ({item.g}g)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-[#71717a] mb-1.5">
              Khối lượng (gram)
            </label>
            <input
              type="number"
              value={quantityG}
              onChange={(e) => setQuantityG(Number(e.target.value))}
              min={1}
              className="w-full bg-[#1a1a24] border border-[#27272f] text-white placeholder:text-[#71717a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635] focus:border-transparent"
            />
          </div>

          {/* Meal type */}
          <div>
            <label className="block text-sm text-[#71717a] mb-1.5">Bữa ăn</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TABS.map((meal) => (
                <button
                  key={meal.key}
                  onClick={() => setMealType(meal.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-colors',
                    mealType === meal.key
                      ? 'bg-[#a3e635]/10 border-[#a3e635] text-[#a3e635]'
                      : 'bg-[#1a1a24] border-[#27272f] text-[#71717a] hover:border-[#71717a]'
                  )}
                >
                  <meal.icon className="w-4 h-4" />
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !foodName.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors',
              analyzing || !foodName.trim()
                ? 'bg-[#1e1e2a] text-[#71717a] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#a3e635] to-[#84cc16] text-black hover:shadow-lg hover:shadow-[#a3e635]/20'
            )}
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {analyzing ? 'Đang phân tích...' : 'AI phân tích'}
          </button>

          {/* Nutrition results (editable) */}
          {analyzed && (
            <div className="space-y-3 p-4 bg-[#0f0f17] rounded-lg border border-[#a3e635]/20 animate-[fade-in_0.3s_ease-out]">
              <p className="text-xs text-[#a3e635] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Kết quả AI — bạn có thể chỉnh sửa
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full bg-[#1a1a24] border border-[#27272f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full bg-[#1a1a24] border border-[#27272f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full bg-[#1a1a24] border border-[#27272f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full bg-[#1a1a24] border border-[#27272f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635]"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !foodName.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors',
              saving || !foodName.trim()
                ? 'bg-[#1e1e2a] text-[#71717a] cursor-not-allowed'
                : 'bg-[#a3e635] text-black hover:bg-[#84cc16]'
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Đang lưu...' : 'Lưu món ăn'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// AI Smart Text Parser Modal (Nhập cả đoạn văn bản)
// ──────────────────────────────────────────────
interface ParsedItem {
  meal_type: MealType;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function AiParseFoodModal({
  open,
  onClose,
  onSaved,
  selectedDate,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  selectedDate: Date;
}) {
  const supabase = createClient();
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [savingAll, setSavingAll] = useState(false);

  if (!open) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập đoạn văn bản mô tả đồ ăn.');
      return;
    }
    setError('');
    setParsing(true);
    setParsedItems([]);
    setSummary('');

    try {
      const res = await fetch('/api/parse-food-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi phân tích');

      setParsedItems(data.items || []);
      setSummary(data.summary || '');
    } catch (err: any) {
      setError(err.message || 'Không thể phân tích đoạn văn. Vui lòng thử lại.');
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
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Chưa đăng nhập');

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const inserts = parsedItems.map((item) => ({
        user_id: user.id,
        date: dateStr,
        meal_type: item.meal_type,
        food_name: item.food_name,
        quantity_g: item.quantity_g,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
      }));

      const { error: insertErr } = await supabase.from('food_logs').insert(inserts);
      if (insertErr) throw insertErr;

      setInputText('');
      setParsedItems([]);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu danh sách món.');
    } finally {
      setSavingAll(false);
    }
  };

  const totalCals = parsedItems.reduce((s, i) => s + i.calories, 0);
  const totalP = parsedItems.reduce((s, i) => s + i.protein_g, 0);
  const totalC = parsedItems.reduce((s, i) => s + i.carbs_g, 0);
  const totalF = parsedItems.reduce((s, i) => s + i.fat_g, 0);

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
                AI Tự Bóc Tách Thực Đơn Tự Nhiên
              </h2>
              <p className="text-xs text-[#71717a] mt-1">
                Gõ hoặc dán nguyên đoạn văn bản bạn đã ăn trong ngày
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
            Đoạn văn miêu tả những gì bạn đã ăn:
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ví dụ: Sáng nay ăn 2 quả trứng ốp la và 1 bánh mì. Trưa ăn 200g ức gà luộc, 1 chén cơm trắng và 1 đĩa súp lơ luộc. Bữa phụ 1 muỗng whey protein và quả chuối..."
            className="w-full bg-[#1a1a24] border border-[#27272f] text-white placeholder:text-[#71717a] rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635] focus:border-transparent resize-none leading-relaxed"
          />

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-[#71717a]">Thử mẫu nhanh:</span>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  'Sáng 2 quả trứng luộc, 1 lát bánh mì đen. Trưa 200g ức gà luộc, 1 chén cơm trắng, 100g súp lơ xanh. Chiều 1 muỗng whey protein.'
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1a24] hover:bg-[#27272f] text-[#a3e635] border border-[#27272f] transition-all"
            >
              🥗 Menu Gymer Clean
            </button>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  'Trưa nay ăn 1 tô phở bò tái chín, 2 cái quẩy. Tối ăn 150g thịt bò xào hành tây và 1 bát cơm.'
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1a24] hover:bg-[#27272f] text-[#3b82f6] border border-[#27272f] transition-all"
            >
              🍜 Phở bò & Cơm tối
            </button>
          </div>
        </div>

        {/* Parse Button */}
        <button
          onClick={handleParse}
          disabled={parsing || !inputText.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md',
            parsing || !inputText.trim()
              ? 'bg-[#1e1e2a] text-[#71717a] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#84cc16] to-[#a3e635] text-black hover:opacity-95 shadow-[#a3e635]/20'
          )}
        >
          {parsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI Đang phân tích & tính toán Macro...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Phân Tích & Bóc Tách Bằng AI</span>
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
                  {summary || `Đã bóc tách thành công ${parsedItems.length} món ăn:`}
                </p>
                <p className="text-[11px] text-white mt-0.5">
                  Tổng: <strong>{Math.round(totalCals)} kcal</strong> • P:{' '}
                  {Math.round(totalP)}g • C: {Math.round(totalC)}g • F:{' '}
                  {Math.round(totalF)}g
                </p>
              </div>
              <span className="text-xs bg-[#a3e635] text-black font-bold px-2.5 py-1 rounded-lg shrink-0">
                {parsedItems.length} món
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {parsedItems.map((item, index) => {
                const mealLabel =
                  item.meal_type === 'breakfast'
                    ? 'Sáng'
                    : item.meal_type === 'lunch'
                    ? 'Trưa'
                    : item.meal_type === 'dinner'
                    ? 'Tối'
                    : 'Snack';

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a24] border border-[#27272f] hover:border-[#a3e635]/40 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase bg-[#27272f] text-[#a3e635] shrink-0">
                        {mealLabel}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-white truncate text-sm">
                          {item.food_name}
                        </p>
                        <p className="text-[#71717a] text-[11px] mt-0.5">
                          {item.quantity_g}g • P: {item.protein_g}g • C:{' '}
                          {item.carbs_g}g • F: {item.fat_g}g
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-white text-sm">
                        {Math.round(item.calories)} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-[#71717a] hover:text-red-400 rounded transition-colors"
                        title="Xoá món này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  <Save className="w-4 h-4" />
                )}
                Lưu tất cả {parsedItems.length} món vào nhật ký
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-[#13131a] rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#13131a] rounded-xl" />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-[#13131a] rounded-xl" />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export default function FoodPage() {
  const supabase = createClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<NutritionGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiTextModal, setShowAiTextModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [logsRes, goalsRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('created_at', { ascending: true }),
      supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    setLogs((logsRes.data as FoodLog[]) ?? []);
    setGoals((goalsRes.data as NutritionGoal) ?? null);
    setLoading(false);
  }, [selectedDate, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('food_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6 max-w-4xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Page title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-[#a3e635]" />
              Nhật ký ăn uống
            </h1>
            <p className="text-xs text-[#71717a] mt-0.5">
              Theo dõi calo & macro dinh dưỡng mỗi ngày
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiTextModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#84cc16] to-[#a3e635] text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-95 shadow-md shadow-[#a3e635]/20 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Ghi đoạn văn (AI)</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#1e1e2a] border border-[#27272f] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[#27272f] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từng món</span>
            </button>
          </div>
        </div>

        {/* Date selector */}
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {/* Daily summary */}
        <DailySummary logs={logs} goals={goals} />

        {/* Meal sections */}
        {MEAL_TABS.map((meal) => (
          <MealSection
            key={meal.key}
            mealType={meal.key}
            logs={logs}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ))}

        {/* Add food modal */}
        <AddFoodModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchData}
          selectedDate={selectedDate}
        />

        {/* AI Parse Full Text Modal */}
        <AiParseFoodModal
          open={showAiTextModal}
          onClose={() => setShowAiTextModal(false)}
          onSaved={fetchData}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
