import Link from "next/link";
import {
  Flame,
  Sparkles,
  Dumbbell,
  Scale,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8ed] flex flex-col justify-between selection:bg-[#a3e635] selection:text-black">
      {/* Navigation */}
      <header className="border-b border-[#27272f] bg-[#13131a]/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#84cc16] to-[#a3e635] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#a3e635]/20">
              <Flame className="w-6 h-6 fill-black" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wide text-gradient block leading-none">
                MACRO TRACKER
              </span>
              <span className="text-[10px] tracking-widest text-[#71717a] font-semibold">
                FOR GYMERS & ATHLETES
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[#71717a] hover:text-white transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-[#a3e635] text-black font-semibold text-sm hover:bg-[#84cc16] transition-all shadow-md shadow-[#a3e635]/20"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 max-w-5xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/30 text-xs text-[#a3e635] font-semibold animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          Tích hợp OpenAI GPT-4o Phân tích Dinh dưỡng Thông minh
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
          Làm chủ Macro & Calo.{" "}
          <span className="text-gradient block mt-1">Bứt phá hình thể Gymer.</span>
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-[#71717a] leading-relaxed">
          Ứng dụng chuyên biệt cho dân tập gym: AI tự động tính TDEE & Macro tối ưu,
          nhận diện calo từ thực phẩm & khối lượng ăn, theo dõi tập luyện cardio
          và bám sát tiến độ cân nặng mỗi đầu tuần.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#a3e635] text-black font-extrabold text-base hover:bg-[#84cc16] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#a3e635]/25"
          >
            <span>Trải nghiệm miễn phí</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1e1e2a] hover:bg-[#27272f] border border-[#27272f] text-white font-semibold text-base transition-all"
          >
            Vào bảng điều khiển
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left w-full">
          <div className="p-6 rounded-2xl bg-[#13131a] border border-[#27272f] space-y-3 hover:border-[#a3e635]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#a3e635]/10 text-[#a3e635] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">AI Tính Calo & Macro</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Nhập tên thực phẩm kèm khối lượng (gram), AI sẽ tự động phân tích chính
              xác năng lượng, đạm (Protein), tinh bột (Carbs) và chất béo (Fat).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13131a] border border-[#27272f] space-y-3 hover:border-[#a3e635]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Theo dõi Tập & Cardio</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Ghi lại chi tiết hiệp, số lần và mức tạ tập Gym. Ghi nhận thời gian,
              cự ly chạy bộ, đi bộ để trừ vào calo tiêu thụ hàng ngày.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13131a] border border-[#27272f] space-y-3 hover:border-[#a3e635]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Cân nặng Đầu tuần</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Theo dõi biến động cân nặng hàng tuần có biểu đồ trực quan, hỗ trợ thiết
              lập mục tiêu tăng cơ (Bulking) hoặc giảm mỡ (Cutting).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272f] py-8 text-center text-xs text-[#71717a]">
        <p>© 2026 MacroTracker. Thiết kế tối ưu cho Gymers & Dân thể hình.</p>
      </footer>
    </div>
  );
}
