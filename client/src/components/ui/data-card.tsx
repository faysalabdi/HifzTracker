import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DataCardProps {
  icon: React.ReactNode;
  iconBackground?: string;
  title: string;
  value: number | string;
  subtitle?: string;
  suffix?: string;
}

export function DataCard({ icon, iconBackground = "bg-primary-50", title, value, subtitle, suffix }: DataCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${iconBackground}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm text-neutral-500 font-medium">{title}</h3>
            <p className="text-2xl font-semibold mt-1">{value}{suffix && <span>{suffix}</span>}</p>
            {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}