"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  quantity: number;
  product: {
    productName: string;
    dosageForm: string;
    strength: string;
  };
}

export default function StockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch("/api/inventory?lowStock=true&page=1&limit=3");
        const data = await res.json();
        if (data.success) {
          setLowStockItems(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch low stock:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-red-200 bg-red-50/30">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-base font-heading text-gray-900">Stock Alerts</h3>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="text-center py-6">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">All stock levels are healthy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockItems.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 bg-white rounded border border-red-200 hover:border-red-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.product.productName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {item.product.strength} {item.product.dosageForm}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Low Stock: Only {item.quantity} units remaining
                  </p>
                </div>
              </div>
            </div>
          ))}

          <a
            href="/admin/inventory?lowStock=true"
            className="block text-center text-xs text-[#D4AF37] hover:underline font-sans uppercase tracking-wide mt-4"
          >
            View All Low Stock Items
          </a>
        </div>
      )}
    </Card>
  );
}
