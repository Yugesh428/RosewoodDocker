import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import ProductDetailClient from "./_components/ProductDetailClient";
import { getProductById } from "@/features/products/routes";
import { NextRequest } from "next/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  try {
    const req = new NextRequest(`http://localhost/api/products/${id}`, { method: "GET" });
    const res  = await getProductById(req, id);
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.productName} | Rosewood Pharmacy`,
    description: product.productDescriptions?.[0]?.content ?? `Buy ${product.productName} at Rosewood Pharmacy`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div style={{ backgroundColor: "#ffffff" }} className="min-h-screen">
      <Navbar />
      <ProductDetailClient product={product} />
      <Footer />
    </div>
  );
}
