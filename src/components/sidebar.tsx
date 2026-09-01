"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Bot,
  Lightbulb,
  Flower2,
  FileText,
  ClipboardList,
  HeartPulse,
  Cpu,
  BookOpen,
  Workflow,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

const navGroups = [
  {
    name: "Visão Geral",
    items: [
      { href: "/", label: "Painel Geral", icon: Home },
      { href: "/hermes", label: "Hermes", icon: Cpu },
      { href: "/chat", label: "Hermes Chat", icon: MessageSquare },
      { href: "/tasks", label: "Tarefas", icon: ClipboardList },
    ],
  },
  {
    name: "Operação",
    items: [
      { href: "/content-os", label: "Pipeline de Projetos", icon: Workflow },
      { href: "/articles", label: "Artigos & Conteúdos", icon: FileText },
    ],
  },
  {
    name: "Métricas",
    items: [
      { href: "/client-pulse", label: "Status de Clientes", icon: HeartPulse },
    ],
  },
  {
    name: "Sistema",
    items: [
      { href: "/agents", label: "Agentes", icon: Bot },
      { href: "/memory-wiki", label: "Base de Conhecimento", icon: BookOpen },
      //{ href: "/ideas", label: "Ideias", icon: Lightbulb },
      { href: "/garden", label: "Automações", icon: Flower2 },
    ],
  },
];

// Barra móvel inferior (5 principais abas)
const mobileTabsRaw = [
  { href: "/", label: "Painel", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/content-os", label: "Pipeline", icon: Workflow },
  { href: "/memory-wiki", label: "Base", icon: BookOpen },
  { href: "/agents", label: "Agentes", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Fecha sidebar ao mudar de rota no mobile
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  // Fecha sidebar ao redimensionar tela para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const Logo = () => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-[10px] bg-[var(--text)] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
        <span className="text-[#0a0b0d] font-bold text-[13px] tracking-tight">H</span>
      </div>
      <span className="font-semibold text-[var(--text)] tracking-[-0.01em] text-[15px]">Hermy HQ</span>
    </div>
  );

  return (
    <>
      {/* Header Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[var(--text-2)] hover:text-[var(--text)] transition-colors rounded-lg hover:bg-[var(--surface-1)]"
          aria-label="Alternar menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Barra de abas inferior Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-t border-[var(--line)] px-2 py-2 safe-area-pb">
        <nav className="flex justify-around">
          {mobileTabsRaw.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 px-3 rounded-lg transition-all ${
                  isActive
                    ? "text-[var(--text)] bg-[var(--surface-2)]"
                    : "text-[var(--text-3)] hover:text-[var(--text-2)] active:scale-95"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`
          fixed md:relative z-50 md:z-10
          w-64 md:w-[15rem] h-full
          bg-[var(--bg)] md:bg-transparent border-r border-[var(--line)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          top-0 left-0
        `}
      >
        {/* Logo */}
        <div className="hidden md:block px-5 pt-6 pb-8">
          <Logo />
        </div>

        {/* Espaçador para o header mobile */}
        <div className="h-16 md:hidden" />

        {/* Links de Navegação */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.name}>
                <h3 className="eyebrow px-3 mb-1.5 !text-[10px] !text-[var(--text-4)]">
                  {group.name}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          className={`group relative flex items-center gap-3 px-3 py-[7px] rounded-[10px] transition-all duration-150 ${
                            isActive
                              ? "bg-[var(--surface-2)] text-[var(--text)]"
                              : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-1)]"
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-[var(--accent)]" />
                          )}
                          <Icon
                            className={`w-[17px] h-[17px] shrink-0 ${
                              isActive ? "text-[var(--text)]" : "text-[var(--text-3)] group-hover:text-[var(--text-2)]"
                            }`}
                          />
                          <span className="text-[13.5px] font-medium">{item.label}</span>
                        </Link>
                        {"anchors" in group &&
                          isActive &&
                          (group as { anchors?: { href: string; label: string }[] }).anchors && (
                            <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                              {(group as { anchors: { href: string; label: string }[] }).anchors.map(
                                (a) => (
                                  <a
                                    key={a.href}
                                    href={a.href}
                                    className="block text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)] py-1 transition-colors"
                                  >
                                    {a.label}
                                  </a>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Rodapé de Status */}
        <div className="px-4 py-4 border-t border-[var(--line)]">
          <div className="flex items-center gap-2 text-[var(--text-3)] text-[11.5px]">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--up)] opacity-60 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--up)]" />
            </span>
            <span>Todos os sistemas online</span>
          </div>
        </div>
      </aside>
    </>
  );
}