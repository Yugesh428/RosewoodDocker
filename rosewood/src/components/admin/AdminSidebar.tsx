"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  ShoppingCart,
  Users,
  Briefcase,
  Star,
  MessageSquare,
  Settings,
  LogOut,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Globe,
  Palette,
  FileBarChart,
  LineChart,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "DASHBOARD",    href: "/admin/dashboard"    },
  { icon: Package,         label: "PRODUCTS",     href: "/admin/products"     },
  { icon: Tag,             label: "CATEGORIES",   href: "/admin/categories"   },
  { icon: Warehouse,       label: "INVENTORY",    href: "/admin/inventory"    },
  { icon: ShoppingCart,    label: "ORDERS",       href: "/admin/orders"       },
  { icon: Users,           label: "CUSTOMERS",    href: "/admin/customers"    },
  { icon: Briefcase,       label: "STAFF",        href: "/admin/staff"        },
  { icon: Star,            label: "REVIEWS",      href: "/admin/reviews"      },
  { icon: MessageSquare,   label: "FEEDBACK",     href: "/admin/feedback"       },
  { icon: FileBarChart,    label: "REPORTS",      href: "/admin/reports"        },
  { icon: LineChart,       label: "ANALYTICS",    href: "/admin/analytics"      },
  { icon: Globe,           label: "SITE CONTENT", href: "/admin/site-content"   },
  { icon: Palette,         label: "THEME",           href: "/admin/theme-settings" },
  { icon: Settings,        label: "SETTINGS",        href: "/admin/settings"       },
];

const STORAGE_KEY = "rosewood_sidebar_collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Always start uncollapsed on SSR to match server HTML, then apply saved preference after mount
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "true";
    setCollapsed(saved);
    setMounted(true);
  }, []);

  // Keep localStorage in sync whenever state changes (only after mount)
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, mounted]);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? "w-[68px]" : "w-64";

  return (
    <>
      {/* ── Fixed sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col ${sidebarWidth} transition-[width] duration-300 ease-in-out`}
        style={{
          background: "linear-gradient(180deg, #1c1c1c 0%, #141414 60%, #111111 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.5), inset -1px 0 0 rgba(212,175,55,0.15)",
        }}
      >
        {/* Shiny top gold line */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #D4AF37 40%, #ffe87c 60%, #D4AF37 80%, transparent 100%)",
          }}
        />

        {/* ── Logo ── */}
        <div
          className={`flex-shrink-0 border-b overflow-hidden ${collapsed ? "px-3 py-4" : "px-6 py-5"}`}
          style={{ borderColor: "rgba(212,175,55,0.2)" }}
        >
          {collapsed ? (
            <div className="flex items-center justify-center">
              <span
                className="text-xl font-heading"
                style={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                R
              </span>
            </div>
          ) : (
            <Link href="/admin/dashboard">
              <h1 className="text-2xl font-heading mb-1 leading-tight text-white">
                Rosewood
              </h1>
              <p
                className="text-[10px] tracking-[0.3em] uppercase font-sans font-semibold"
                style={{
                  background: "linear-gradient(90deg, #D4AF37 0%, #ffe87c 50%, #D4AF37 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Admin
              </p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/30 font-sans mt-0.5">
                Executive Suite
              </p>
            </Link>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className={`space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hovered = hoveredHref === item.href;
              const highlighted = active || hovered;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    onMouseEnter={() => setHoveredHref(item.href)}
                    onMouseLeave={() => setHoveredHref(null)}
                    className={[
                      "flex items-center rounded-sm transition-all duration-200 relative overflow-hidden",
                      collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                    ].join(" ")}
                    style={
                      highlighted
                        ? {
                            background:
                              "linear-gradient(90deg, rgba(255,232,124,0.15) 0%, rgba(212,175,55,0.10) 60%, rgba(212,175,55,0.04) 100%)",
                            boxShadow:
                              "inset 0 0 0 1px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,232,124,0.15)",
                          }
                        : { background: "transparent" }
                    }
                  >
                    {/* Gold left bar */}
                    {highlighted && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                        style={{
                          background:
                            "linear-gradient(180deg, #ffe87c 0%, #D4AF37 50%, #b8952e 100%)",
                          boxShadow: "0 0 8px rgba(212,175,55,0.6)",
                        }}
                      />
                    )}

                    <Icon
                      className="flex-shrink-0 w-[18px] h-[18px] transition-all duration-200"
                      style={
                        highlighted
                          ? {
                              color: "#D4AF37",
                              filter:
                                "drop-shadow(0 0 6px rgba(255,232,124,0.9)) drop-shadow(0 0 12px rgba(212,175,55,0.6))",
                            }
                          : { color: "#ffffff" }
                      }
                    />

                    {!collapsed && (
                      <>
                        <span
                          className={`tracking-[0.12em] text-[11px] uppercase ${active ? "font-bold" : "font-semibold"}`}
                          style={
                            highlighted
                              ? {
                                  background:
                                    "linear-gradient(135deg, #ffe87c 0%, #D4AF37 40%, #ffe87c 70%, #b8952e 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  filter: "drop-shadow(0 0 6px rgba(255,232,124,0.4))",
                                }
                              : {
                                  color: "#ffffff",
                                }
                          }
                        >
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span
                            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-black"
                            style={{
                              background: "linear-gradient(135deg, #ffe87c 0%, #D4AF37 100%)",
                            }}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Shiny divider */}
        <div
          className="mx-4 mb-3 h-px flex-shrink-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
          }}
        />

        {/* ── Bottom actions ── */}
        <div className={`flex-shrink-0 pb-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          {[
            { href: "/",               icon: Home,       label: "Back to Home" },
            { href: "/admin/support",  icon: HelpCircle, label: "Support"      },
          ].map(({ href, icon: Icon, label }) => {
            const hovered = hoveredHref === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
                className={[
                  "flex items-center rounded-sm transition-all duration-200 relative overflow-hidden",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                ].join(" ")}
                style={
                  hovered
                    ? {
                        background:
                          "linear-gradient(90deg, rgba(255,232,124,0.12) 0%, rgba(212,175,55,0.08) 100%)",
                        boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.25)",
                      }
                    : { background: "transparent" }
                }
              >
                <Icon
                  className="flex-shrink-0 w-[18px] h-[18px] transition-all duration-200"
                  style={
                    hovered
                      ? { color: "#D4AF37", filter: "drop-shadow(0 0 4px rgba(212,175,55,0.6))" }
                      : { color: "#ffffff" }
                  }
                />
                {!collapsed && (
                  <span
                    className="tracking-[0.12em] text-[11px] uppercase font-semibold"
                    style={
                      hovered
                        ? {
                            background:
                              "linear-gradient(135deg, #ffe87c 0%, #D4AF37 50%, #b8952e 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }
                        : { color: "#ffffff" }
                    }
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Logout */}
          {(() => {
            const hovered = hoveredHref === "__logout__";
            return (
              <button
                type="button"
                title="Logout"
                onMouseEnter={() => setHoveredHref("__logout__")}
                onMouseLeave={() => setHoveredHref(null)}
                className={[
                  "flex items-center rounded-sm transition-all duration-200 w-full relative overflow-hidden",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                ].join(" ")}
                style={
                  hovered
                    ? {
                        background: "rgba(239,68,68,0.08)",
                        boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.2)",
                      }
                    : { background: "transparent" }
                }
                onClick={() => { window.location.href = "/api/auth/signout"; }}
              >
                <LogOut
                  className="flex-shrink-0 w-[18px] h-[18px] transition-all duration-200"
                  style={hovered ? { color: "#f87171" } : { color: "#ffffff" }}
                />
                {!collapsed && (
                  <span
                    className="tracking-[0.12em] text-[11px] uppercase font-semibold"
                    style={
                      hovered
                        ? { color: "#f87171" }
                        : { color: "#ffffff" }
                    }
                  >
                    Logout
                  </span>
                )}
              </button>
            );
          })()}
        </div>

        {/* ── Collapse/expand toggle button ── */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-50 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: "linear-gradient(135deg, #1c1c1c 0%, #141414 100%)",
            border: "1px solid rgba(212,175,55,0.4)",
            boxShadow: "0 0 10px rgba(212,175,55,0.2), 0 2px 8px rgba(0,0,0,0.5)",
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight
              className="w-3.5 h-3.5"
              style={{ color: "#D4AF37", filter: "drop-shadow(0 0 4px rgba(212,175,55,0.6))" }}
            />
          ) : (
            <ChevronLeft
              className="w-3.5 h-3.5"
              style={{ color: "#D4AF37", filter: "drop-shadow(0 0 4px rgba(212,175,55,0.6))" }}
            />
          )}
        </button>
      </aside>

      {/* ── Spacer — pushes main content by sidebar width ── */}
      <div className={`flex-shrink-0 ${sidebarWidth} transition-[width] duration-300 ease-in-out`} />
    </>
  );
}
