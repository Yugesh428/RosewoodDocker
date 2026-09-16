"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

// ─── Nav links ────────────────────────────────────────────────────────────────

const navLinks = [
  { label: "Home",     href: "/"         },
  { label: "Pharmacy", href: "/pharmacy" },
  { label: "About Us", href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function WishlistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  productName: string;
  productImage: string | null;
  sellingPrice: number;
  category?: { categoryName: string };
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ mobile = false }: { mobile?: boolean }) {
  const router   = useRouter();
  const wrapRef  = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/products?search=${encodeURIComponent(q)}&isActive=true&limit=6`);
      const json = await res.json();
      setResults(json.success ? (json.data ?? []) : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/pharmacy?search=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") { setOpen(false); setFocused(false); }
  };

  const handleResultClick = (id: string) => {
    setOpen(false);
    setFocused(false);
    setQuery("");
    router.push(`/pharmacy/${id}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push(`/pharmacy?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <motion.div
      ref={wrapRef}
      className="relative"
      animate={{ width: mobile ? "100%" : focused ? 320 : 200 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
        className={`w-full bg-white/10 text-xs px-4 pr-9 rounded-full focus:outline-none transition-colors duration-300 font-sans ${mobile ? "py-2" : "py-2"}`}
        style={{
          border: focused
            ? "1px solid rgba(212,175,55,0.9)"
            : "1px solid rgba(255,255,255,0.35)",
          color: "#ffffff",
          boxShadow: focused
            ? "0 0 0 3px rgba(212,175,55,0.15), 0 0 20px rgba(212,175,55,0.1)"
            : "none",
        }}
      />
      {/* Placeholder colour */}
      <style>{`.search-input::placeholder{color:rgba(255,255,255,0.45)}`}</style>

      {/* Icon */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
        style={{ color: focused ? "#D4AF37" : "rgba(255,255,255,0.5)" }}>
        {loading ? (
          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : <SearchIcon />}
      </span>

      {/* Results dropdown */}
      <AnimatePresence>
        {open && (results.length > 0 || (!loading && query.trim().length > 1)) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {results.length > 0 ? (
              <>
                <ul>
                  {results.map((product, i) => (
                    <motion.li
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleResultClick(product.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.07] transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
                          {product.productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.productImage}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                              {product.productName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate font-sans">{product.productName}</p>
                          <p className="text-[10px] text-white/40 font-sans truncate">
                            {product.category?.categoryName ?? ""}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#D4AF37] flex-shrink-0 font-sans">
                          £{Number(product.sellingPrice).toFixed(2)}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: results.length * 0.05 + 0.05 }}
                  onClick={handleViewAll}
                  className="w-full px-3 py-2.5 text-[11px] text-[#D4AF37] hover:bg-white/5 transition-colors text-center border-t border-white/10 font-sans"
                >
                  View all results for &quot;{query}&quot; →
                </motion.button>
              </>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-4 text-xs text-white/40 font-sans text-center"
              >
                No products found.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Account Dropdown ─────────────────────────────────────────────────────────

function AccountDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user;
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`hover:text-[#FFD700] transition-colors ${open ? "text-[#FFD700]" : "text-white"}`}
      >
        <UserIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-8 w-56 rounded-xl overflow-hidden z-[9999]"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
          >
            {isLoggedIn ? (
              <>
                {/* Logged-in user header */}
                <div className="px-4 pt-3 pb-2 border-b border-white/10">
                  <p className="text-[9px] tracking-[0.25em] uppercase font-sans" style={{ color: "rgba(255,255,255,0.35)" }}>Signed in as</p>
                  <p className="text-xs font-semibold truncate font-sans mt-0.5" style={{ color: "#ffffff" }}>{user?.name}</p>
                  <p className="text-[10px] truncate font-sans" style={{ color: "rgba(255,255,255,0.45)" }}>{user?.email}</p>
                </div>

                {/* ── Admin dashboard shortcut ── */}
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors font-sans"
                      style={{ color: "#D4AF37", background: "rgba(212,175,55,0.10)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.20)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,175,55,0.10)")}
                    >
                      <ShieldIcon />
                      My Dashboard
                    </Link>
                    <div className="mx-4 border-t border-white/10" />
                  </>
                )}

                {/* Customer links — only for non-admin */}
                {!isAdmin && (
                  <>
                    <Link href="/account/orders" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors font-sans"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                      My Orders
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors font-sans"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      My Wishlist
                    </Link>
                    <div className="mx-4 my-1 border-t border-white/10" />
                  </>
                )}

                <button
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 mb-1 text-xs transition-colors font-sans text-left"
                  style={{ color: "#f87171" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Guest */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[9px] tracking-[0.25em] uppercase font-sans" style={{ color: "rgba(255,255,255,0.35)" }}>Customer</p>
                </div>
                <Link href="/login" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors font-sans"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                  <UserIcon /> Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors font-sans"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Create account
                </Link>
                <div className="mx-4 my-1 border-t border-white/10" />
                <Link href="/track-order" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors font-sans"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Track Order (Guest)
                </Link>
                <div className="mx-4 my-1 border-t border-white/10" />
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[9px] tracking-[0.25em] uppercase font-sans" style={{ color: "rgba(212,175,55,0.6)" }}>Admin</p>
                </div>
                <Link href="/admin/login" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 mb-1 text-xs font-semibold transition-colors font-sans"
                  style={{ color: "#D4AF37" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.10)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                  <ShieldIcon /> Admin portal
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, isOpen: cartOpen, openCart, closeCart } = useCart();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "backdrop-blur-md shadow-lg" : ""
        }`}
        style={{ backgroundColor: "var(--color-bg-nav)" }}
      >
        <div className="w-full pl-8 pr-8 h-20 flex items-center justify-between gap-6">
          {/* Brand + Nav links together on the left */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <Link href="/" className="flex-shrink-0">
              <div className="flex flex-col items-center leading-tight">
                <span className="font-heading text-xl tracking-[0.12em] uppercase"
                  style={{ color: "var(--color-primary)" }}>
                  Rosewood
                </span>
                <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-white mt-0.5">
                  Pharmacy
                </span>
              </div>
            </Link>

            {/* Desktop nav links — right next to logo */}
            <ul className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="group relative text-white hover:text-[#FFD700] text-xs tracking-wide uppercase transition-colors duration-200 font-sans pb-0.5">
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-full h-px bg-[#FFD700] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right side: Search + icons */}
          <div className="hidden md:flex items-center gap-4 text-white">
            {/* Search */}
            <div className="flex items-center">
              <SearchBar />
            </div>

            {/* Wishlist */}
            {isLoggedIn ? (
              <Link href="/account/wishlist" aria-label="Wishlist" className="hover:text-[#FFD700] transition-colors">
                <WishlistIcon />
              </Link>
            ) : (
              <Link href="/login" aria-label="Wishlist" className="hover:text-[#FFD700] transition-colors opacity-60" title="Sign in to use wishlist">
                <WishlistIcon />
              </Link>
            )}

            {/* Cart */}
            <button aria-label="Cart" onClick={openCart} className="hover:text-[#FFD700] transition-colors relative">
              <CartIcon />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-black text-[8px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            <AccountDropdown />
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white hover:text-[#FFD700] transition-colors ml-auto"
            onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar mobile />
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-40 w-72 bg-[#000000] border-l border-white/10 flex flex-col pt-20 px-8"
          >
            <ul className="space-y-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setMobileOpen(false)}
                    className="text-white hover:text-[#FFD700] text-sm tracking-widest uppercase transition-colors font-sans">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t border-white/10 pt-8 space-y-4">
              <p className="text-[9px] tracking-[0.25em] uppercase text-white/30 font-sans">Account</p>
              {isLoggedIn ? (
                <>
                  {/* Admin dashboard shortcut in mobile */}
                  {(session?.user as { role?: string })?.role === "ADMIN" ||
                   (session?.user as { role?: string })?.role === "SUPERADMIN" ? (
                    <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-xs font-semibold transition-colors font-sans"
                      style={{ color: "#D4AF37" }}>
                      <ShieldIcon /> My Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link href="/account/orders" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 text-xs text-white hover:text-[#FFD700] transition-colors font-sans">
                        <UserIcon /> My Orders
                      </Link>
                      <Link href="/account/wishlist" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 text-xs text-white hover:text-[#FFD700] transition-colors font-sans">
                        <WishlistIcon /> My Wishlist
                      </Link>
                    </>
                  )}
                  <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors font-sans">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-xs text-white hover:text-[#FFD700] transition-colors font-sans">
                    <UserIcon /> Customer Sign in
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-xs text-white hover:text-[#FFD700] transition-colors font-sans">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Create account
                  </Link>
                  <Link href="/track-order" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors font-sans">
                    Track Order (Guest)
                  </Link>
                  <Link href="/admin/login" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-xs text-[#FFD700] hover:text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.5)] transition-colors font-sans">
                    <ShieldIcon /> Admin portal
                  </Link>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-6 text-white">
              <button aria-label="Cart" onClick={() => { setMobileOpen(false); openCart(); }}
                className="hover:text-[#FFD700] transition-colors relative">
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-black text-[8px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={closeCart} />
    </>
  );
}
