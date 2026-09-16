import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import PharmacyClient from "./_components/PharmacyClient";
import { getAllProducts } from "@/features/products/routes";
import { getAllCategories } from "@/features/productCategory/routes";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pharmacy | Rosewood Apothecary",
  description:
    "Browse our complete collection of healthcare and wellness products, carefully curated for your modern lifestyle.",
};

async function getPharmacyData() {
  try {
    // Fetch all active categories (no pagination needed — all at once)
    const catReq = new NextRequest(
      "http://localhost/api/product-categories?isActive=true&limit=100",
      { method: "GET" }
    );
    const catRes  = await getAllCategories(catReq);
    const catData = await catRes.json();
    const categories = catData.success ? (catData.data ?? []) : [];

    // Fetch all active products (up to 500 for pharmacy listing)
    const prodReq = new NextRequest(
      "http://localhost/api/products?isActive=true&limit=500",
      { method: "GET" }
    );
    const prodRes  = await getAllProducts(prodReq);
    const prodData = await prodRes.json();
    const products = prodData.success ? (prodData.data ?? []) : [];

    return { categories, products };
  } catch (err) {
    console.error("PharmacyPage — data fetch failed:", err);
    return { categories: [], products: [] };
  }
}

export default async function PharmacyPage() {
  const { categories, products } = await getPharmacyData();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <Navbar />
      <PharmacyClient categories={categories} products={products} />
      <Footer />
    </div>
  );
}
