"use client";

import { useState } from "react";
import {
  Home,
  Info,
  Phone,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";

// ── CMS section components ────────────────────────────────────────────────────
import HeroSection          from "@/components/publicPages/HomePage/heroSection";
import OurProductCollection from "@/components/publicPages/HomePage/ourProductCollection";
import OurProductContent    from "@/components/publicPages/HomePage/ourProductContent";
import TestimonialsSection  from "@/components/publicPages/HomePage/testimonialSection";
import AboutSection         from "@/components/publicPages/aboutPage/aboutSection";
import OurStorySection      from "@/components/publicPages/aboutPage/ourStory";
import MissionSection       from "@/components/publicPages/aboutPage/ourMission";
import ValuesSection        from "@/components/publicPages/aboutPage/ourValues";
import ContactInfoSection   from "@/components/publicPages/contactPage/contactInfo";
import ContactMessages      from "@/components/publicPages/contactPage/contactForm";

// ─── Collapsible section wrapper ──────────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1c1c1c, #141414)" }}
          >
            <Icon className="w-4 h-4" style={{ color: "#D4AF37" }} />
          </div>
          <span className="font-heading text-base text-gray-900">{title}</span>
          {badge && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(212,175,55,0.12)",
                color: "#b8952e",
                border: "1px solid rgba(212,175,55,0.3)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div
          className="border-t"
          style={{ borderColor: "rgba(212,175,55,0.15)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: "home"    as const, label: "Home Page",    icon: Home  },
  { id: "about"   as const, label: "About Page",   icon: Info  },
  { id: "contact" as const, label: "Contact Page", icon: Phone },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Main component ───────────────────────────────────────────────────────────
export default function SiteContentClient() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* ── Tab selector ── */}
      <div className="flex items-center gap-1 mb-6 bg-white border border-gray-200 rounded-sm p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all duration-200",
                active ? "text-black" : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, #D4AF37 0%, #ffe87c 50%, #b8952e 100%)",
                      boxShadow: "0 2px 8px rgba(212,175,55,0.4)",
                    }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HOME PAGE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "home" && (
        <div className="space-y-4">

          {/* Hero Slides ---------------------------------------------------- */}
          <Section title="Hero Slides" icon={Home} badge="Carousel" defaultOpen>
            <HeroSection />
          </Section>

          {/* Product Collection — Categories -------------------------------- */}
          <Section title="Product Collection — Categories" icon={Home} badge="Tabs">
            <OurProductCollection />
          </Section>

          {/* Product Collection — Items ------------------------------------- */}
          <Section title="Product Collection — Items" icon={Home} badge="Cards">
            <OurProductContent />
          </Section>

          {/* Testimonials --------------------------------------------------- */}
          <Section title="Testimonials" icon={Home} badge="Reviews">
            <TestimonialsSection />
          </Section>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABOUT PAGE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "about" && (
        <div className="space-y-4">

          {/* About Us — Head description ------------------------------------ */}
          <Section title="About Us — Page Description" icon={Info} defaultOpen>
            <AboutSection />
          </Section>

          {/* Our Story ------------------------------------------------------ */}
          <Section title="Our Story" icon={Info}>
            <OurStorySection />
          </Section>

          {/* Our Mission ---------------------------------------------------- */}
          <Section title="Our Mission" icon={Info}>
            <MissionSection />
          </Section>

          {/* Our Values ----------------------------------------------------- */}
          <Section title="Our Values" icon={Info} badge="Cards">
            <ValuesSection />
          </Section>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT PAGE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "contact" && (
        <div className="space-y-4">

          {/* Contact Info --------------------------------------------------- */}
          <Section title="Contact Information" icon={Phone} defaultOpen>
            <ContactInfoSection />
          </Section>

          {/* Contact Messages inbox ----------------------------------------- */}
          <Section title="Contact Messages" icon={Phone} badge="Inbox">
            <ContactMessages />
          </Section>

        </div>
      )}

      {/* ── Footer bar ── */}
      <div className="mt-8 flex items-center justify-between bg-white border border-gray-200 rounded-sm px-6 py-4">
        <p className="text-sm text-gray-500 font-sans">
          All changes save directly to the database via each section above.
        </p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-sm text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Site
        </a>
      </div>

    </div>
  );
}
