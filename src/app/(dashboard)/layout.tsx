"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Flame,
  ArrowLeft,
  Home,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/food", label: "Ăn uống & Macro", icon: UtensilsCrossed },
  { href: "/exercise", label: "Tập luyện & Cardio", icon: Dumbbell },
  { href: "/weight", label: "Theo dõi cân nặng", icon: Scale },
  { href: "/settings", label: "Cài đặt & AI Macro", icon: Settings },
];

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Bảng tổng quan",
  "/food": "Nhật ký dinh dưỡng",
  "/exercise": "Nhật ký tập luyện",
  "/weight": "Tiến trình cân nặng",
  "/settings": "Cài đặt & Cá nhân hoá",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Gymer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserName(
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Gymer"
        );
      }
    }
    getUser();
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const currentPageTitle = PAGE_NAMES[pathname] || "Macro Tracker";
  const isDashboardRoot = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col md:flex-row text-[#e8e8ed]">
      {/* ─────────────────────────────────────────────────────────────
          1. Desktop Sidebar (Cố định, luôn hiện trên TẤT CẢ các tab)
         ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#13131a]/90 backdrop-blur-xl border-r border-[#27272f] p-5 shrink-0 justify-between sticky top-0 h-screen z-30">
        <div>
          {/* Logo & Main Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 mb-6 px-2 group cursor-pointer"
            title="Về Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#84cc16] to-[#a3e635] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#a3e635]/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-black" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wide text-gradient block leading-none">
                MACRO TRACKER
              </span>
              <span className="text-[10px] tracking-widest text-[#71717a] font-semibold">
                FITNESS & DIET
              </span>
            </div>
          </Link>

          {/* Quick Home / Landing Link */}
          <div className="mb-4 px-2 flex items-center justify-between text-xs text-[#71717a]">
            <span className="uppercase tracking-wider font-semibold text-[10px]">
              Menu chính
            </span>
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#a3e635] transition-colors"
              title="Về trang giới thiệu"
            >
              <span>Trang chủ</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-[#a3e635] text-black shadow-md shadow-[#a3e635]/20 font-semibold"
                      : "text-[#71717a] hover:text-white hover:bg-[#1e1e2a]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform group-hover:scale-110",
                      isActive ? "stroke-[2.5]" : ""
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Button */}
        <div className="pt-4 border-t border-[#27272f]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1a1a24] mb-3">
            <div className="w-9 h-9 rounded-full bg-[#27272f] flex items-center justify-center text-[#a3e635] font-semibold text-sm shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-[11px] text-[#71717a]">Gymer Pro</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. Mobile Top Navigation Header
         ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#13131a] border-b border-[#27272f] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {!isDashboardRoot && (
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1 text-[#71717a] hover:text-white rounded-lg hover:bg-[#1e1e2a]"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635] flex items-center justify-center text-black font-black text-lg">
              M
            </div>
            <span className="font-bold text-base tracking-wider text-gradient">
              MACRO TRACKER
            </span>
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#71717a] hover:text-white rounded-lg hover:bg-[#1e1e2a]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#27272f]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#a3e635] flex items-center justify-center text-black font-black">
                  <Flame className="w-5 h-5 fill-black" />
                </div>
                <span className="font-bold text-lg text-white">MACRO TRACKER</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#71717a] hover:text-white rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-white hover:bg-[#1e1e2a]"
              >
                <Home className="w-5 h-5 text-[#a3e635]" />
                <span>Trang chính (Dashboard)</span>
              </Link>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                      isActive
                        ? "bg-[#a3e635] text-black font-semibold"
                        : "text-[#71717a] hover:text-white hover:bg-[#1e1e2a]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-[#27272f] space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1e1e2a] text-sm text-[#71717a] hover:text-white"
            >
              <span>Về Landing Page</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-[#ef4444] bg-[#ef4444]/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Main Content Wrapper With Global Action / Navigation Bar
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Control Bar with Back Button & Breadcrumbs */}
        <div className="border-b border-[#27272f] bg-[#13131a]/50 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 md:top-0 z-20">
          {/* Left: Back Button & Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            {/* Nút Quay Lại Trang Trước */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a24] hover:bg-[#27272f] border border-[#27272f] text-xs font-medium text-[#e8e8ed] hover:text-[#a3e635] transition-all shadow-sm"
              title="Quay lại trang trước"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            {/* Nút Về Main Menu (Dashboard) */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm",
                isDashboardRoot
                  ? "bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635]"
                  : "bg-[#1a1a24] hover:bg-[#27272f] border-[#27272f] text-[#71717a] hover:text-white"
              )}
              title="Về Bảng điều khiển chính"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </Link>

            {/* Breadcrumb path */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#71717a] pl-2 border-l border-[#27272f]">
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Trang chủ
              </Link>
              {!isDashboardRoot && (
                <>
                  <ChevronRight className="w-3 h-3 text-[#71717a]" />
                  <span className="text-[#a3e635] font-semibold">
                    {currentPageTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Active Page Badge & Quick Action */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1a1a24] border border-[#27272f] text-[#a3e635]">
              {currentPageTitle}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Mobile Bottom Quick Nav
         ───────────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#13131a]/95 backdrop-blur-lg border-t border-[#27272f] flex justify-around p-2 z-40">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors",
                isActive
                  ? "text-[#a3e635] font-semibold"
                  : "text-[#71717a] hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
