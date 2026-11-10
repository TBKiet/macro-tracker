# 🏋️ MacroTracker - Web App Dinh Dưỡng & Tập Luyện Cho Gymer

Ứng dụng chuyên nghiệp theo dõi Macro, Calo và Lịch tập gym tích hợp **OpenAI GPT-4o** và **Supabase**.

---

## ✨ Tính Năng Chính

1. **🤖 AI Tính Macro & Calo Theo Cơ Thể**:
   - Nhập giới tính, tuổi, chiều cao, cân nặng, mức độ vận động và mục tiêu (Giảm mỡ / Giữ cân / Tăng cơ).
   - AI tính toán TDEE và đề xuất mức Calo + tỷ lệ Macro (Protein, Carbs, Fat) chuẩn khoa học.
   - Hỗ trợ **điều chỉnh Macro bằng tay** theo ý muốn của gymer.

2. **🍽️ Nhật Ký Ăn Uống & AI Phân Tích Thực Phẩm**:
   - Nhập tên món ăn (hỗ trợ cả tiếng Việt như "Ức gà luộc", "Cơm trắng", "Trứng ốp la") kèm khối lượng (gram).
   - AI tự động tính Calo, Đạm (Protein), Tinh bột (Carbs) và Chất béo (Fat).
   - Chia 4 bữa: Bữa sáng, Bữa trưa, Bữa tối, Snack.

3. **🏃 Theo Dõi Tập Luyện & Cardio**:
   - **Gym (Kháng lực)**: Ghi tên bài tập, số hiệp (sets), số lần (reps), mức tạ (kg).
   - **Cardio (Chạy bộ, đi bộ, bơi lội, đạp xe, nhảy dây, HIIT...)**: Ghi thời gian, cự ly (km).
   - AI ước tính Calo tiêu hao dựa trên thể trạng và bài tập để tính vào **Calo tiêu thụ**.

4. **⚖️ Theo Dõi Cân Nặng Đầu Tuần**:
   - Đặt mục tiêu cân nặng (Target Weight).
   - Banner cảnh báo nhắc nhở nếu chưa cân trong tuần.
   - Biểu đồ biến động cân nặng trực quan (Recharts) với đường mục tiêu.
   - Lịch sử biến động theo từng tuần.

5. **📊 Dashboard Tổng Quan**:
   - Calo đã nạp vs Mục tiêu (với thanh tiến trình %).
   - Calo tiêu thụ từ tập luyện.
   - Calo ròng (Net Calories = Nạp - Đốt).
   - Tỷ lệ hoàn thành 3 chỉ số Macro (Protein, Carbs, Fat) hôm nay.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend / Database**: Supabase (PostgreSQL + Row Level Security + Auth)
- **AI**: OpenAI API (`gpt-4o-mini`)
- **Giao diện**: Dark Theme thể thao gym (Điểm nhấn Lime Green `#a3e635`)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Khởi tạo Database trên Supabase
1. Vào [Supabase Dashboard](https://supabase.com/dashboard) và tạo 1 Project mới.
2. Vào mục **SQL Editor** trong dự án Supabase của bạn.
3. Mở file `supabase-schema.sql` trong mã nguồn và dán toàn bộ nội dung vào SQL Editor, sau đó nhấn **Run**.
   - Script này sẽ tự động tạo bảng: `profiles`, `nutrition_goals`, `food_logs`, `exercise_logs`, `weight_logs`.
   - Thiết lập bảo mật Row Level Security (RLS) để mỗi người dùng chỉ xem và sửa dữ liệu của chính mình.

### 2. Cấu hình biến môi trường
Mở file `.env.local` và điền các API keys của bạn:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=sk-proj-your_openai_api_key
```

### 3. Cài đặt thư viện & Khởi chạy

```bash
cd macro-tracker
npm install
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

## 📂 Cấu Trúc Dự Án

```
macro-tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-food/route.ts          # AI phân tích calo thực phẩm
│   │   │   ├── calculate-macros/route.ts      # AI tính TDEE & Macro
│   │   │   └── estimate-calories-burned/route.ts # AI tính calo tiêu hao tập luyện
│   │   ├── dashboard/                         # Bảng điều khiển tổng quan
│   │   ├── food/                              # Nhật ký dinh dưỡng & ăn uống
│   │   ├── exercise/                          # Nhật ký tập gym & cardio
│   │   ├── weight/                            # Theo dõi cân nặng đầu tuần
│   │   ├── settings/                          # Cài đặt thể trạng & chỉnh macro
│   │   ├── login/ & register/                 # Đăng nhập & Đăng ký
│   │   └── page.tsx                           # Landing page
│   ├── components/                            # UI Components tái sử dụng
│   ├── lib/                                   # Supabase clients & Utilities
│   └── types/                                 # TypeScript Database types
├── supabase-schema.sql                        # SQL Schema cho Supabase
└── .env.local                                 # Biến môi trường
```
