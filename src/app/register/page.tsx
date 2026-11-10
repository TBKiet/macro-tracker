"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Dumbbell, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background grid-pattern px-4">
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="glass rounded-2xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/20 mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Đăng ký thành công!
            </h2>
            <p className="text-muted-foreground mb-6">
              Vui lòng kiểm tra email để xác nhận tài khoản của bạn.
            </p>
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-sm",
                "bg-primary text-primary-foreground",
                "hover:brightness-110 transition-all duration-200"
              )}
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-pattern px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">MACRO TRACKER</h1>
          <p className="text-muted-foreground mt-2">
            Tạo tài khoản mới
          </p>
        </div>

        {/* Register Form */}
        <div className="glass rounded-2xl p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Đăng ký
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
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
                  minLength={6}
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
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
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
