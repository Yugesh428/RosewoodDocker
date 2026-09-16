"use client";

import Navbar from "@/components/Navbar";
import HeroSectionDynamic from "@/components/home/HeroSectionDynamic";
import BestSellers from "@/components/home/BestSellers";
import ProductCollectionDynamic from "@/components/home/ProductCollectionDynamic";
import TestimonialsDynamic from "@/components/home/TestimonialsDynamic";
import Footer from "@/components/home/Footer";
import { useTheme } from "@/context/ThemeContext";

export default function HomePage() {
  const { homeBg } = useTheme();
  const bg =
    homeBg === "white" ? "#ffffff" :
    homeBg === "soft-blue" ? "#f0f8ff" :
    homeBg === "near-blue" ? "#cce8f7" :
    homeBg === "creamy-blue" ? "#e8f4f8" :
    "#dff0fb";

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: bg, margin: 0, padding: 0 }}>
      <Navbar />
      <HeroSectionDynamic />
      <BestSellers />
      <ProductCollectionDynamic />
      <TestimonialsDynamic />
      <Footer />
    </div>
  );
}
