import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DataCard } from "@/components/ui/data-card";
import { User, BookOpen, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { SessionWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { data: recentSessions, isLoading: isLoadingSessions } = useQuery<SessionWithDetails[]>({
    queryKey: ["/api/sessions/recent"]
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<number>({
    queryKey: ["/api/students"],
    select: (data) => data.length
  });

  const { data: mistakeDistribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ["/api/stats/mistake-distribution"]
  });

  const { data: averageMistakes, isLoading: isLoadingAverage } = useQuery({
    queryKey: ["/api/stats/average-mistakes"]
  });

  const isLoading = isLoadingSessions || isLoadingStudents || isLoadingDistribution || isLoadingAverage;

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DataCard
          icon={<User className="text-primary-500 h-6 w-6" />}
          iconBackground="bg-primary-50"
          title="Total Students"
          value={isLoadingStudents ? "Loading..." : students || 0}
        />
        
        <DataCard
          icon={<BookOpen className="text-secondary-500 h-6 w-6" />}
          iconBackground="bg-secondary-50"
          title="Today's Sessions"
          value={isLoadingSessions ? "Loading..." : (recentSessions?.filter(s => 
            new Date(s.date).toDateString() === new Date().toDateString()).length || 0)}
        />
        
        <DataCard
          icon={<AlertTriangle className="text-accent-500 h-6 w-6" />}
          iconBackground="bg-accent-50"
          title="Today's Mistakes"
          value={isLoading ? "Loading..." : "46"}
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold mb-4">Recent Activity</h3>
        <Card>
          <CardHeader className="p-4 border-b border-neutral-100 flex justify-between items-center">
            <h4 className="font-medium">Recent Revision Sessions</h4>
            <Link href="/reports">
              <a className="text-primary-500 text-sm font-medium">View All</a>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Pages</th>
                    <th className="px-4 py-3 text-left">Mistakes</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoadingSessions ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-center">Loading sessions...</td>
                    </tr>
                  ) : recentSessions && recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <tr key={session.id} className="border-b border-neutral-100">
                        <td className="px-4 py-3">{session.student1.name}</td>
                        <td className="px-4 py-3">{session.student2.name}</td>
                        <td className="px-4 py-3">{formatDate(session.date)}</td>
                        <td className="px-4 py-3">{session.pageStart}-{session.pageEnd}</td>
                        <td className="px-4 py-3">
                          <span className={`${getMistakeCountColor(session.mistakeCount)} px-2 py-1 rounded-full text-xs font-medium`}>
                            {session.mistakeCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/sessions/${session.id}`}>
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
                      <td colSpan={6} className="px-4 py-3 text-center">No recent sessions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <img 
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
              alt="Students studying together" 
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <blockquote className="font-['Amiri'] text-center italic text-neutral-600 mb-2">
              "The best among you are those who learn the Quran and teach it."
            </blockquote>
            <p className="text-center text-neutral-500 text-sm">- Prophet Muhammad ﷺ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <h4 className="font-heading font-semibold mb-3">Common Mistake Types</h4>
            {isLoadingDistribution ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : mistakeDistribution ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tajweed Errors</span>
                    <span>{mistakeDistribution.tajweed}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div 
                      className="bg-error h-2 rounded-full" 
                      style={{ width: `${mistakeDistribution.tajweed}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Word Mistakes</span>
                    <span>{mistakeDistribution.word}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full" 
                      style={{ width: `${mistakeDistribution.word}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hesitation</span>
                    <span>{mistakeDistribution.hesitation}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div 
                      className="bg-accent-500 h-2 rounded-full" 
                      style={{ width: `${mistakeDistribution.hesitation}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Other</span>
                    <span>{mistakeDistribution.other}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${mistakeDistribution.other}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getMistakeCountColor(count: number) {
  if (count <= 5) return "bg-success bg-opacity-10 text-success";
  if (count <= 10) return "bg-warning bg-opacity-10 text-warning";
  return "bg-error bg-opacity-10 text-error";
}
