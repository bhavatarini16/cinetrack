
"use client";

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { WatchlistEntry, Movie, UserProfile } from '@/app/lib/types';
import { getTrendingMovies, getMoviesByGenre } from '@/app/lib/tmdb-service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, RefreshCw, PlayCircle, Film, Info } from 'lucide-react';
import MovieCard from './movie-card';
import { useToast } from '@/hooks/use-toast';
import MovieDetailsDialog from './movie-details-dialog';

export default function RandomMoviePicker() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pickedMovie, setPickedMovie] = useState<Movie | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch unwatched movies from watchlist
  const watchlistQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("isWatched", "==", false)
    );
  }, [user, firestore]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistQuery);

  // Fetch user profile for favorite genres
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const handleSurpriseMe = async () => {
    setIsOpen(true);
    setIsPicking(true);
    setPickedMovie(null);

    // Artificial delay for "suspense"
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      let candidatePool: Movie[] = [];

      // 1. Prioritize Unwatched Movies from Watchlist
      if (watchlistEntries && watchlistEntries.length > 0) {
        candidatePool = watchlistEntries.map(e => e.movieData);
      } 
      
      // 2. If watchlist is thin, add movies from favorite genres
      if (candidatePool.length < 5 && profile?.favoriteGenreIds && profile.favoriteGenreIds.length > 0) {
        const genreMovies = await getMoviesByGenre(profile.favoriteGenreIds[0]);
        candidatePool = [...candidatePool, ...genreMovies];
      }

      // 3. Last resort: Trending movies
      if (candidatePool.length === 0) {
        candidatePool = await getTrendingMovies();
      }

      // Pick random
      if (candidatePool.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidatePool.length);
        setPickedMovie(candidatePool[randomIndex]);
      } else {
        toast({ title: "Archives unreachable", description: "Couldn't find any movies to suggest right now." });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Randomizer Failed", description: "The engine stalled. Please try again." });
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleSurpriseMe}
        className="fixed bottom-8 right-8 z-50 rounded-full h-16 px-8 bg-primary hover:bg-primary/80 shadow-2xl shadow-primary/40 group animate-bounce hover:animate-none"
      >
        <Sparkles className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
        <span className="font-headline font-bold uppercase tracking-widest">Surprise Me</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-dark border-white/10 sm:max-w-md text-white rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse" />
          
          <DialogHeader className="pt-6">
            <DialogTitle className="text-center font-headline text-2xl uppercase tracking-tighter">
              {isPicking ? "Consulting the Archives..." : "Your Destiny Awaits"}
            </DialogTitle>
            <DialogDescription className="text-center text-white/40">
              The AI has calculated your next cinematic experience.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {isPicking ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-bold text-primary animate-pulse tracking-[0.2em] uppercase">Analyzing Pulse...</p>
              </div>
            ) : pickedMovie ? (
              <div className="w-full animate-in zoom-in-95 duration-500 space-y-6">
                <div className="relative aspect-[2/3] w-48 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black">
                   <img src={pickedMovie.posterUrl} alt={pickedMovie.title} className="object-cover w-full h-full" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                   <div className="absolute bottom-4 left-0 w-full text-center">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">{pickedMovie.genres[0]}</p>
                   </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-headline font-bold line-clamp-1">{pickedMovie.title}</h3>
                  <div className="flex items-center justify-center gap-4 text-xs text-white/40 font-bold uppercase tracking-widest">
                    <span>{pickedMovie.releaseDate.split('-')[0]}</span>
                    <span>•</span>
                    <span className="text-primary">{pickedMovie.tmdbRating} Stars</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                   <Button 
                    className="w-full bg-primary h-12 rounded-xl font-bold uppercase tracking-widest"
                    onClick={() => {
                      setIsOpen(false);
                      setDetailsOpen(true);
                    }}
                   >
                     <Info className="w-4 h-4 mr-2" /> View Details
                   </Button>
                   <Button 
                    variant="ghost" 
                    className="w-full text-white/40 hover:text-white h-12"
                    onClick={handleSurpriseMe}
                   >
                     <RefreshCw className="w-4 h-4 mr-2" /> Not feeling it. Try again.
                   </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {pickedMovie && (
        <MovieDetailsDialog 
          movie={pickedMovie} 
          isOpen={detailsOpen} 
          onClose={() => setDetailsOpen(false)} 
        />
      )}
    </>
  );
}
