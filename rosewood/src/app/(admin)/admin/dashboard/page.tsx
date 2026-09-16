import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import StatsCard from "./_components/StatsCard";
import RecentOrders from "./_components/RecentOrders";
import StockAlerts from "./_components/StockAlerts";
import DashboardHeader from "./_components/DashboardHeader";
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  Clock,
  DollarSign,
  Users,
  Star,
  Briefcase
} from "lucide-react";

async function getDashboardStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const [
      productsRes,
      lowStockRes,
      ordersStatsRes,
      customersStatsRes,
      reviewsRes,
      staffRes
    ] = await Promise.all([
      fetch(`${baseUrl}/api/products?page=1&limit=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/inventory?lowStock=true&page=1&limit=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/orders/stats`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/customers/stats`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/reviews?isApproved=false&page=1&limit=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/staff?isActive=true&page=1&limit=1`, { cache: "no-store" }),
    ]);

    const products = await productsRes.json();
    const lowStock = await lowStockRes.json();
    const ordersStats = await ordersStatsRes.json();
    const customersStats = await customersStatsRes.json();
    const reviews = await reviewsRes.json();
    const staff = await staffRes.json();

    return {
      totalProducts: products.pagination?.total || 0,
      activeProducts: products.data?.filter((p: { isActive: boolean }) => p.isActive).length || 0,
      lowStockCount: lowStock.pagination?.total || 0,
      totalOrders: ordersStats.data?.total || 0,
      pendingOrders: ordersStats.data?.byStatus?.pending || 0,
      revenue: ordersStats.data?.revenue?.total || 0,
      activeCustomers: customersStats.data?.active || 0,
      pendingReviews: reviews.pagination?.total || 0,
      staffCount: staff.pagination?.total || 0,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalProducts: 0,
      activeProducts: 0,
      lowStockCount: 0,
      totalOrders: 0,
      pendingOrders: 0,
      revenue: 0,
      activeCustomers: 0,
      pendingReviews: 0,
      staffCount: 0,
    };
  }
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };

  const stats = await getDashboardStats();

  return (
    <>
      <DashboardHeader userName={user.name} />
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            subtitle={`${stats.activeProducts} Active`}
            icon={Package}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Low Stock"
            value={stats.lowStockCount}
            subtitle="Requires Attention"
            icon={AlertTriangle}
            iconColor="text-red-600"
            alert={stats.lowStockCount > 0}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle="This month"
            icon={ShoppingCart}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Pending Orders"
            value={stats.pendingOrders}
            subtitle="Awaiting Processing"
            icon={Clock}
            iconColor="text-orange-600"
            alert={stats.pendingOrders > 0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            subtitle="+12% trend"
            icon={DollarSign}
            iconColor="text-green-600"
            trend="+12%"
          />
          <StatsCard
            title="Active Customers"
            value={stats.activeCustomers}
            subtitle="Consistent Activity"
            icon={Users}
            iconColor="text-teal-600"
          />
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            subtitle="Needs Moderation"
            icon={Star}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Staff Count"
            value={stats.staffCount}
            subtitle="Active 3 shifts"
            icon={Briefcase}
            iconColor="text-indigo-600"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>

          {/* Stock Alerts - Takes 1 column */}
          <div className="lg:col-span-1">
            <StockAlerts />
          </div>
        </div>
      </div>
    </>
  );
}
