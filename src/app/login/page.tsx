"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Dumbbell, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "Email hoặc mật khẩu không đúng"
          : error.message
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-pattern px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">MACRO TRACKER</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi dinh dưỡng & tập luyện
          </p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Đăng nhập
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-xl",
                    "bg-secondary border border-border",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-xl",
                    "bg-secondary border border-border",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-xl font-semibold text-sm",
                "bg-primary text-primary-foreground",
                "hover:brightness-110 active:scale-[0.98]",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
