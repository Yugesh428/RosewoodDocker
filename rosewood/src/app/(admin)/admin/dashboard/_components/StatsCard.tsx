import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  alert?: boolean;
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  alert,
  iconColor = "text-gray-400"
}: StatsCardProps) {
  return (
    <Card className="p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-gray-500 font-sans mb-1">
            {title}
          </p>
        </div>
        <div className={`p-2 rounded-sm bg-gray-50 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-heading text-gray-900 mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-sm">
            {trend}
          </span>
        )}

        {alert && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-sm uppercase tracking-wide">
            Alert
          </span>
        )}
      </div>
    </Card>
  );
}
