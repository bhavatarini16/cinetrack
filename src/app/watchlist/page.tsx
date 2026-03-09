
"use client";

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import MovieCard from '@/components/movie-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { List, CheckCircle2, Clock, Loader2, PlayCircle, Sparkles, Bell } from 'lucide-react';
import { WatchlistEntry } from '../lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RandomMoviePicker from '@/components/random-movie-picker';

export default function WatchlistPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const watchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      orderBy("addedDate", "desc")
    );
  }, [user, firestore]);

  const { data: entries, isLoading: isDataLoading } = useCollection<WatchlistEntry>(watchlistRef);

  if (isUserLoading || isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md glass border-white/5 p-12 rounded-3xl">
          <PlayCircle className="w-16 h-16 text-primary mx-auto opacity-50" />
          <h1 className="text-3xl font-headline font-bold text-white">Join the Cinema</h1>
          <p className="text-white/50">Sign in to start tracking your journey through film and get personalized analytics.</p>
          <Link href="/login">
            <Button className="w-full bg-primary h-12 text-lg font-headline uppercase tracking-widest">Get Started</Button>
          </Link>
        </div>
      </div>
    );
  }

  const watchlist = entries?.filter(e => !e.isWatched && new Date(e.movieData.releaseDate) <= new Date()) || [];
  const watched = entries?.filter(e => e.isWatched) || [];
  const upcoming = entries?.filter(e => !e.isWatched && new Date(e.movieData.releaseDate) > new Date()) || [];

  return (
    <div className="pt-24 min-h-screen max-w-7xl mx-auto px-4 md:px-8 pb-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">MY <span className="text-gradient">COLLECTION</span></h1>
          <p className="text-white/60">Organize your journey through cinema.</p>
        </div>
      </div>

      <Tabs defaultValue="watchlist" className="space-y-8">
        <TabsList className="glass border-white/5 p-1 h-14 w-full md:w-auto">
          <TabsTrigger value="watchlist" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Clock className="w-4 h-4" /> 
            <span>Queue ({watchlist.length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all">
            <Bell className="w-4 h-4" /> 
            <span>Upcoming ({upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex items-center gap-2 px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <CheckCircle2 className="w-4 h-4" /> 
            <span>Watched ({watched.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watchlist.map(entry => (
                <MovieCard key={entry.id} movie={entry.movieData} />
              ))}
            </div>
          ) : (
            <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
              <List className="w-12 h-12 mb-4 opacity-20" />
              <p>Your queue is empty.</p>
              <Link href="/" className="mt-4 text-primary hover:underline not-italic font-bold uppercase tracking-widest text-xs">Go discover movies</Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {upcoming.map(entry => (
                <MovieCard key={entry.id} movie={entry.movieData} />
              ))}
            </div>
          ) : (
            <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>No upcoming releases tracked.</p>
              <p className="text-[10px] mt-2 text-white/20 uppercase tracking-widest">Add unreleased films to get notified.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watched" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           {watched.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watched.map(entry => (
                <MovieCard key={entry.id} movie={entry.movieData} />
              ))}
            </div>
          ) : (
            <div className="h-64 glass border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 italic">
              <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
              <p>You haven't marked any movies as watched yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RandomMoviePicker />
    </div>
  );
}
