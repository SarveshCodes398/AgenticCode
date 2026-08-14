import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { UserCircle2, Trophy, Clock, Target, ShieldCheck } from "lucide-react";
import fs from 'fs';
import path from 'path';
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const dbPath = path.join(process.cwd(), 'src', 'db', 'progress.json');
  let progress: any = null;
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(data);
    progress = db[session.userId];
  }

  if (!progress) {
    return <div className="p-8 text-center text-gray-400">Profile not found.</div>;
  }

  const totalSolved = progress.solved.Easy + progress.solved.Medium + progress.solved.Hard;
  
  // Generate Yearly Grid
  const today = new Date();
  const yearDays = Array.from({ length: 365 }).map((_, i) => subDays(today, 364 - i));
  
  // Generate Monthly Grid
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = getDay(monthStart);
  const emptyDays = Array.from({ length: firstDayOfMonth });

  const getIntensity = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const count = progress.contributionGrid[key] || 0;
    if (count === 0) return 'bg-border/30';
    if (count < 2) return 'bg-neon-blue/40';
    if (count < 4) return 'bg-neon-blue/70';
    return 'bg-neon-blue';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        
        {/* Left Sidebar - Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-border/50 overflow-hidden mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
               <UserCircle2 className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{progress.user}</h2>
            <p className="text-sm text-gray-400">Agentic Developer</p>
            
            <form action="/api/auth/logout" method="POST" className="mt-4">
              <button type="submit" className="w-full rounded-md bg-error/10 border border-error/30 py-2 text-sm font-semibold text-error hover:bg-error hover:text-white transition-colors">
                Sign Out
              </button>
            </form>
          </div>
          
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-300">Community Stats</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex justify-between"><span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Submissions</span> <span className="text-white font-medium">{progress.recentSubmissions.length}</span></div>
              <div className="flex justify-between"><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Reputation</span> <span className="text-white font-medium">0</span></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Solved Problems */}
            <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
               <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[8px] border-border shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                 <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalSolved}</div>
                    <div className="text-[10px] text-success flex justify-center items-center gap-1"><ShieldCheck className="h-3 w-3" /> Solved</div>
                 </div>
               </div>
               
               <div className="space-y-3 w-32">
                 <div className="flex flex-col bg-card-hover rounded-md p-2 border border-border/50">
                    <span className="text-xs text-gray-400">Easy</span>
                    <span className="text-sm font-bold text-success">{progress.solved.Easy}</span>
                 </div>
                 <div className="flex flex-col bg-card-hover rounded-md p-2 border border-border/50">
                    <span className="text-xs text-gray-400">Medium</span>
                    <span className="text-sm font-bold text-warning">{progress.solved.Medium}</span>
                 </div>
                 <div className="flex flex-col bg-card-hover rounded-md p-2 border border-border/50">
                    <span className="text-xs text-gray-400">Hard</span>
                    <span className="text-sm font-bold text-error">{progress.solved.Hard}</span>
                 </div>
               </div>
            </div>
            
            {/* Badges */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-300">Badges <span className="bg-border text-white px-2 py-0.5 rounded-full text-xs ml-2">{progress.badges.length}</span></h3>
              <div className="flex gap-4">
                {progress.badges.length === 0 ? <p className="text-sm text-gray-500">No badges yet. Solve problems to earn them!</p> : progress.badges.map((badge: string) => (
                  <div key={badge} className="flex flex-col items-center group cursor-pointer">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-neon-blue to-purple-600 flex items-center justify-center p-[2px] shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform">
                      <div className="h-full w-full bg-card rounded-full flex items-center justify-center">
                         <Trophy className="h-8 w-8 text-neon-blue group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-300 text-center max-w-[80px]">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Submissions & Contribution Graph */}
          <div className="rounded-xl border border-border bg-card p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-semibold text-gray-300">{totalSolved} submissions in the past year</h3>
               <div className="text-xs text-gray-400 flex gap-4">
                 <span>Total active days: <strong className="text-white">{progress.activeDays}</strong></span>
                 <span>Max streak: <strong className="text-white">{progress.maxStreak}</strong></span>
               </div>
             </div>
             
             {/* Main Contribution Grid */}
             <div className="flex overflow-x-auto pb-4 custom-scrollbar">
                <div className="grid grid-rows-7 grid-flow-col gap-1 min-w-max">
                  {yearDays.map((date, idx) => (
                    <div 
                      key={idx} 
                      className={`w-3 h-3 rounded-sm ${getIntensity(date)}`}
                      title={`${format(date, 'MMM dd, yyyy')}: ${progress.contributionGrid[format(date, 'yyyy-MM-dd')] || 0} submissions`}
                    />
                  ))}
                </div>
             </div>
          </div>
          
          {/* Monthly detailed view */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-300">Monthly Big Grid</h3>
            <div className="grid grid-cols-7 gap-2 text-center mb-2 text-sm text-gray-500">
               <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
               {emptyDays.map((_, i) => (
                 <div key={`empty-${i}`} className="aspect-square bg-card rounded-md"></div>
               ))}
               {monthDays.map(date => {
                 const key = format(date, 'yyyy-MM-dd');
                 const count = progress.contributionGrid[key] || 0;
                 return (
                   <div key={key} className={`aspect-square rounded-md flex flex-col items-center justify-center border transition-all ${count > 0 ? 'border-neon-blue bg-neon-blue/10 text-white shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'border-border/50 bg-border/10 text-gray-500 hover:border-gray-500'}`}>
                     <span className="text-lg font-bold">{format(date, 'd')}</span>
                     {count > 0 && <span className="text-xs text-neon-blue mt-1">{count} subs</span>}
                   </div>
                 );
               })}
            </div>
          </div>
          
          {/* Recent Submissions */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
             <div className="flex gap-4 border-b border-border p-4 bg-card-hover/50 text-sm font-semibold text-gray-300">
                <button className="text-white border-b-2 border-primary pb-1">Recent AC</button>
             </div>
             <div className="divide-y divide-border">
                {progress.recentSubmissions.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No recent submissions.</div>
                ) : progress.recentSubmissions.map((sub: any) => (
                  <div key={sub.id} className="flex justify-between items-center p-4 hover:bg-card-hover transition-colors">
                     <span className="text-sm font-medium text-gray-200">{sub.title}</span>
                     <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3"/> {sub.time} {sub.timeTaken ? `(${sub.timeTaken})` : ''}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
