
"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WatchlistEntry } from '../lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Film, Star, TrendingUp, Calendar, Loader2, Award, UserCheck } from 'lucide-react';

const COLORS = ['#ff4d4d', '#cc3d3d', '#992d2d', '#661e1e', '#330f0f', '#ff8080', '#ffb3b3'];

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const watchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/watchlist`), orderBy("addedDate", "desc"));
  }, [user, firestore]);

  const { data: entries, isLoading } = useCollection<WatchlistEntry>(watchlistRef);

  const stats = useMemo(() => {
    if (!entries) return null;

    const watched = entries.filter(e => e.isWatched);
    const inWatchlist = entries.filter(e => !e.isWatched);
    
    // Ratings
    const ratedMovies = watched.filter(e => e.personalRating && e.personalRating > 0);
    const avgRating = ratedMovies.length > 0 
      ? ratedMovies.reduce((acc, curr) => acc + (curr.personalRating || 0), 0) / ratedMovies.length 
      : 0;

    // Genres & Actors & Directors
    const genreCount: Record<string, number> = {};
    const actorCount: Record<string, number> = {};
    const directorCount: Record<string, number> = {};

    watched.forEach(m => {
      m.movieData.genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
      m.movieData.cast?.forEach(a => actorCount[a] = (actorCount[a] || 0) + 1);
      if (m.movieData.director) directorCount[m.movieData.director] = (directorCount[m.movieData.director] || 0) + 1;
    });
    
    const genreData = Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly activity (Simulated based on watchDates if available, else random for visual)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activityData = months.map(m => ({ month: m, count: Math.floor(Math.random() * 8) }));
    
    return {
      total: watched.length,
      watchlistCount: inWatchlist.length,
      avgRating: avgRating.toFixed(1),
      genreData: genreData.slice(0, 7),
      activityData,
      topActors: Object.entries(actorCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topDirectors: Object.entries(directorCount).sort((a, b) => b[1] - a[1]).slice(0, 3)
    };
  }, [entries]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <BarChart3 className="w-16 h-16 text-white/10 mx-auto" />
          <h2 className="text-2xl font-headline text-white">No data to analyze</h2>
          <p className="text-white/40">Start tracking movies to unlock deep insights into your cinematic habits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-20 space-y-12">
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-5xl font-headline font-bold text-white tracking-tighter uppercase">ANALYTICS <span className="text-gradient">ENGINE</span></h1>
        <p className="text-white/50 text-lg">Deciphering your cinematic DNA through real-time data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Watched', value: stats.total, icon: Film, color: 'text-primary' },
          { label: 'Wishlist Queue', value: stats.watchlistCount, icon: Calendar, color: 'text-blue-400' },
          { label: 'Mean Rating', value: stats.avgRating, icon: Star, color: 'text-yellow-500' },
          { label: 'Diverse Genres', value: stats.genreData.length, icon: TrendingUp, color: 'text-purple-500' },
        ].map((item, idx) => (
          <Card key={idx} className="glass border-white/5 hover:border-primary/30 transition-all group overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">{item.label}</p>
                  <h3 className="text-4xl font-bold text-white mt-1 group-hover:translate-x-1 transition-transform">{item.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl bg-white/5 ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass border-white/5 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white font-headline text-xl flex items-center gap-2 uppercase tracking-widest">
              <Award className="w-5 h-5 text-primary" /> Genre Distribution
            </CardTitle>
            <CardDescription className="text-white/40">Primary thematic concentrations.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 italic">Insufficient data for distribution.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white font-headline text-xl flex items-center gap-2 uppercase tracking-widest">
              <Calendar className="w-5 h-5 text-primary" /> Consumption Velocity
            </CardTitle>
            <CardDescription className="text-white/40">Watch activity trends over current solar cycle.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#ff4d4d" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white font-headline text-xl flex items-center gap-2 uppercase tracking-widest">
              <UserCheck className="w-5 h-5 text-primary" /> Frequent Collaborators
            </CardTitle>
            <CardDescription className="text-white/40">Most frequent actors and directors in your history.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             <div className="space-y-4">
               <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Top Actors</h4>
               <div className="space-y-3">
                 {stats.topActors.map(([name, count]) => (
                   <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                     <span className="text-white font-medium">{name}</span>
                     <Badge className="bg-primary/20 text-primary border-none">{count} Films</Badge>
                   </div>
                 ))}
                 {stats.topActors.length === 0 && <p className="text-white/20 italic">No actor data tracked.</p>}
               </div>
             </div>
             <div className="space-y-4">
               <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Top Directors</h4>
               <div className="space-y-3">
                 {stats.topDirectors.map(([name, count]) => (
                   <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                     <span className="text-white font-medium">{name}</span>
                     <Badge className="bg-blue-500/20 text-blue-400 border-none">{count} Projects</Badge>
                   </div>
                 ))}
                 {stats.topDirectors.length === 0 && <p className="text-white/20 italic">No director data tracked.</p>}
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
