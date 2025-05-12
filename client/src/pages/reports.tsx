import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { DataCard } from "@/components/ui/data-card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  BarChart, 
  Calendar, 
  Clock 
} from "lucide-react";

import { StudentWithStats } from "@shared/schema";

export default function Reports() {
  const [timeFilter, setTimeFilter] = useState("this-month");

  // Fetch statistics data
  const { data: sessionCount, isLoading: isLoadingSessionCount } = useQuery({
    queryKey: ["/api/sessions"],
    select: (data) => data.length
  });

  const { data: averageMistakes, isLoading: isLoadingAverage } = useQuery({
    queryKey: ["/api/stats/average-mistakes"]
  });

  const { data: sessionsByDay, isLoading: isLoadingDays } = useQuery({
    queryKey: ["/api/stats/session-days"]
  });

  const { data: mistakeDistribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ["/api/stats/mistake-distribution"]
  });

  const { data: mistakeTrend, isLoading: isLoadingTrend } = useQuery({
    queryKey: ["/api/stats/mistake-trend", { days: 30 }]
  });

  const { data: studentsWithStats, isLoading: isLoadingStudents } = useQuery<StudentWithStats[]>({
    queryKey: ["/api/students/stats"]
  });

  // Helper to find most active day
  const getMostActiveDay = (days: Record<string, number> | undefined) => {
    if (!days) return { day: "N/A", count: 0 };
    
    let maxDay = "N/A";
    let maxCount = 0;
    
    Object.entries(days).forEach(([day, count]) => {
      if (count > maxCount) {
        maxDay = day;
        maxCount = count;
      }
    });
    
    return { day: maxDay, count: maxCount };
  };

  const mostActiveDay = getMostActiveDay(sessionsByDay);

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DataCard
          icon={<Calendar className="text-primary-500 h-6 w-6" />}
          iconBackground="bg-primary-50"
          title="Total Sessions"
          value={isLoadingSessionCount ? "Loading..." : sessionCount || 0}
          trend={{ value: 12, isPositive: true }}
          subtitle="Compared to last month"
        />
        
        <DataCard
          icon={<BarChart className="text-secondary-500 h-6 w-6" />}
          iconBackground="bg-secondary-50"
          title="Average Mistakes"
          value={isLoadingAverage ? "Loading..." : averageMistakes?.average || 0}
          trend={{ value: 3, isPositive: false }}
          subtitle="Per session this month"
        />
        
        <DataCard
          icon={<Clock className="text-accent-500 h-6 w-6" />}
          iconBackground="bg-accent-50"
          title="Most Active Day"
          value={isLoadingDays ? "Loading..." : mostActiveDay.day}
          subtitle={`${mostActiveDay.count} sessions`}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="p-4 border-b border-neutral-100">
            <h3 className="text-lg font-medium">Mistake Types Distribution</h3>
          </CardHeader>
          <CardContent className="p-5">
            {isLoadingDistribution ? (
              <div className="h-64 flex items-center justify-center">
                <p>Loading chart data...</p>
              </div>
            ) : mistakeDistribution ? (
              <div className="h-64 flex items-end justify-between gap-4 mt-6 px-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-error rounded-t-lg" style={{ height: `${mistakeDistribution.tajweed}%` }}></div>
                  <p className="text-xs mt-2 text-neutral-500">Tajweed</p>
                  <p className="font-medium text-sm">{mistakeDistribution.tajweed}%</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-warning rounded-t-lg" style={{ height: `${mistakeDistribution.word}%` }}></div>
                  <p className="text-xs mt-2 text-neutral-500">Word</p>
                  <p className="font-medium text-sm">{mistakeDistribution.word}%</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-accent-500 rounded-t-lg" style={{ height: `${mistakeDistribution.hesitation}%` }}></div>
                  <p className="text-xs mt-2 text-neutral-500">Hesitation</p>
                  <p className="font-medium text-sm">{mistakeDistribution.hesitation}%</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 bg-primary-500 rounded-t-lg" style={{ height: `${mistakeDistribution.other}%` }}></div>
                  <p className="text-xs mt-2 text-neutral-500">Other</p>
                  <p className="font-medium text-sm">{mistakeDistribution.other}%</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 border-b border-neutral-100">
            <h3 className="text-lg font-medium">Mistakes Trend (Last 30 Days)</h3>
          </CardHeader>
          <CardContent className="p-5">
            {isLoadingTrend ? (
              <div className="h-64 flex items-center justify-center">
                <p>Loading trend data...</p>
              </div>
            ) : mistakeTrend ? (
              <div className="h-64 relative">
                <div className="absolute inset-0 flex items-end">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#E4E7EB" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#E4E7EB" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#E4E7EB" strokeWidth="0.5" />
                    
                    {/* Trend line */}
                    <polyline 
                      points="0,70 5,65 10,68 15,62 20,60 25,55 30,58 35,50 40,52 45,48 50,45 55,50 60,45 65,40 70,42 75,38 80,35 85,30 90,33 95,28 100,25" 
                      fill="none" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="2" />
                    
                    {/* Area under the line */}
                    <path 
                      d="M0,70 5,65 10,68 15,62 20,60 25,55 30,58 35,50 40,52 45,48 50,45 55,50 60,45 65,40 70,42 75,38 80,35 85,30 90,33 95,28 100,25 L100,100 L0,100 Z" 
                      fill="url(#gradient)" 
                      opacity="0.2" />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute top-0 left-0 h-full flex flex-col justify-between py-2 text-xs text-neutral-500">
                  <div>15</div>
                  <div>10</div>
                  <div>5</div>
                  <div>0</div>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-neutral-500 px-6">
                  <div>30 days ago</div>
                  <div>20 days ago</div>
                  <div>10 days ago</div>
                  <div>Today</div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p>No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="text-lg font-medium">Student Performance</h3>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">All Time</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Sessions</th>
                  <th className="px-4 py-3 text-left">Avg. Mistakes</th>
                  <th className="px-4 py-3 text-left">Most Common Error</th>
                  <th className="px-4 py-3 text-left">Trending</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-center">Loading student data...</td>
                  </tr>
                ) : studentsWithStats && studentsWithStats.length > 0 ? (
                  studentsWithStats.map((student) => (
                    <tr key={student.id} className="border-b border-neutral-100">
                      <td className="px-4 py-3 font-medium">{student.name}</td>
                      <td className="px-4 py-3">{student.sessionCount}</td>
                      <td className="px-4 py-3">{student.averageMistakes.toFixed(1)}</td>
                      <td className="px-4 py-3">{formatMistakeType(student.mostCommonMistakeType)}</td>
                      <td className="px-4 py-3">
                        <TrendIndicator trend={getTrendValue(student)} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/students/${student.id}`}>
                          <button className="text-primary-500 hover:text-primary-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-center">No student data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional visualizations would go here if needed */}
    </div>
  );
}

function formatMistakeType(type: string | null) {
  if (!type) return "N/A";
  
  const types = {
    tajweed: "Tajweed",
    word: "Word Mistakes",
    hesitation: "Hesitation",
    other: "Other"
  };
  
  return types[type as keyof typeof types] || type;
}

// Generate random trend for demo purposes (in real app, would use actual data)
function getTrendValue(student: StudentWithStats) {
  // For demo purposes - in real app would use actual trend data
  const seed = student.id % 5;
  if (seed === 0) return { value: 0, isPositive: true };
  if (seed === 1) return { value: 15, isPositive: false };
  if (seed === 2) return { value: 8, isPositive: true };
  if (seed === 3) return { value: 3, isPositive: false };
  return { value: 22, isPositive: true };
}

interface TrendIndicatorProps {
  trend: { value: number; isPositive: boolean };
}

function TrendIndicator({ trend }: TrendIndicatorProps) {
  // No trend
  if (trend.value === 0) {
    return (
      <span className="text-neutral-500 flex items-center">
        <ArrowRight className="mr-1 h-4 w-4" /> 0%
      </span>
    );
  }
  
  // Positive trend (lower mistakes is positive)
  if (trend.isPositive) {
    return (
      <span className="text-success flex items-center">
        <ArrowDownRight className="mr-1 h-4 w-4" /> {trend.value}%
      </span>
    );
  }
  
  // Negative trend (higher mistakes is negative)
  return (
    <span className="text-error flex items-center">
      <ArrowUpRight className="mr-1 h-4 w-4" /> {trend.value}%
    </span>
  );
}
