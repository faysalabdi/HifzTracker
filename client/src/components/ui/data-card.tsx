import { ReactNode } from "react";

interface DataCardProps {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function DataCard({
  icon,
  iconBackground,
  title,
  value,
  trend,
  subtitle
}: DataCardProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-neutral-100">
      <div className="flex items-center gap-4">
        <div className={`${iconBackground} p-3 rounded-full`}>
          {icon}
        </div>
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold">{value}</p>
            {trend && (
              <div 
                className={`text-xs px-2 py-1 rounded-full flex items-center ${
                  trend.isPositive 
                    ? "bg-success bg-opacity-10 text-success" 
                    : "bg-error bg-opacity-10 text-error"
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-3 w-3 mr-1"
                >
                  <path d={trend.isPositive 
                    ? "M18 15l-6-6-6 6" 
                    : "M6 9l6 6 6-6"} />
                </svg>
                {trend.value}%
              </div>
            )}
          </div>
          {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
