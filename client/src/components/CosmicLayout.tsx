import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BookHeart,
  BookOpen,
  Calendar,
  Clock,
  Coffee,
  History,
  Home,
  LogIn,
  LogOut,
  Menu,
  Scroll,
  Search,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CosmicBackground } from "./CosmicBackground";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/", icon: Star, label: "Início" },
  { href: "/devocional", icon: Coffee, label: "Devocional" },
  { href: "/ese", icon: Scroll, label: "ESE — Estudo" },
  { href: "/evangelho-no-lar", icon: Home, label: "Evangelho no Lar" },
  { href: "/leitura-diaria", icon: Calendar, label: "Leitura Diária" },
  { href: "/biblia", icon: BookOpen, label: "Bíblia" },
  { href: "/busca", icon: Search, label: "Busca" },
  { href: "/favoritos", icon: Star, label: "Favoritos" },
  { href: "/diario", icon: BookHeart, label: "Diário Espiritual" },
  { href: "/historico", icon: History, label: "Histórico" },
];

interface Props {
  children: React.ReactNode;
}

export function CosmicLayout({ children }: Props) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-600/20 border border-cyan-400/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ boxShadow: "0 0 15px oklch(0.75 0.18 195 / 0.3)" }} />
            </div>
            <div>
              <h1 className="font-cinzel text-sm font-bold text-white glow-cyan leading-tight">
                EVANGELHO
              </h1>
              <p className="text-xs text-cyan-400/70 font-medium tracking-widest">ESPÍRITA</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? "bg-cyan-400/10 border border-cyan-400/30 text-cyan-400"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive ? "text-cyan-400" : "text-white/40 group-hover:text-white/70"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        {loading ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-white/10 rounded animate-pulse" />
              <div className="h-2 bg-white/5 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-600/30 border border-cyan-400/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        ) : (
          <a href={getLoginUrl()}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer cosmic-btn text-center justify-center">
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">Entrar</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Star className="w-5 h-5 text-cyan-400" />
            <span className="font-cinzel font-bold text-white text-sm glow-cyan">EVANGELHO ESPÍRITA</span>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 sidebar-cosmic transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>

        {/* Footer com disclaimer */}
        <footer className="border-t border-white/5 mt-12 py-6 px-4 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-2">
            <p className="text-xs text-indigo-200/30 font-serif">
              Conteúdo inspirado nas obras de Allan Kardec, Emmanuel (psicografia de Chico Xavier) e nas palestras de Haroldo Dutra Dias.
              Interpretações geradas por IA para fins de estudo pessoal.
            </p>
            <p className="text-xs text-indigo-200/20">
              Referências: <a href="https://bibliadocaminho.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400/40 hover:text-cyan-400/70 underline transition-colors">Bíblia do Caminho</a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
