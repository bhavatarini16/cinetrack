
"use client";

import Image from 'next/image';
import { Star, Plus, Check, Info } from 'lucide-react';
import { Movie, WatchlistEntry } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import MovieDetailsDialog from './movie-details-dialog';

interface MovieCardProps {
  movie: Movie;
  variant?: 'grid' | 'featured';
}

export default function MovieCard({ movie, variant = 'grid' }: MovieCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const watchlistRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [user, movie.tmdbId, firestore]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistRef);
  const entry = watchlistEntries?.[0];

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "You need to be signed in to add movies." });
      return;
    }
    
    if (entry) {
      toast({ title: "Already in your collection" });
      return;
    }

    addDocumentNonBlocking(collection(firestore, `users/${user.uid}/watchlist`), {
      userId: user.uid,
      movieId: movie.tmdbId,
      movieData: movie,
      addedDate: new Date().toISOString(),
      isWatched: false,
      rewatchCount: 0,
    });
    toast({ title: "Added to watchlist", description: `${movie.title} is now tracked.` });
  };

  return (
    <>
      <div 
        onClick={() => setDetailsOpen(true)}
        className={cn(
          "group relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 cursor-pointer",
          variant === 'grid' ? "aspect-[2/3]" : "aspect-[16/9]"
        )}
      >
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-primary flex items-center gap-1 font-bold">
            <Star className="w-3 h-3 fill-primary" />
            {movie.tmdbRating}
          </Badge>
          {entry?.isWatched && (
            <Badge className="bg-green-500/80 backdrop-blur-md text-white border-none font-bold">
              <Check className="w-3 h-3 mr-1" /> WATCHED
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-headline font-bold text-white mb-1 line-clamp-1">{movie.title}</h3>
          <p className="text-xs text-white/60 mb-3 line-clamp-1">
            {movie.genres.join(' • ')}
          </p>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="sm" 
              className="flex-1 bg-primary hover:bg-primary/80 h-8"
              onClick={handleAddToWatchlist}
              disabled={!!entry}
            >
              {entry ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {entry ? "Tracked" : "Watchlist"}
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="glass border-white/10 hover:bg-white/20 h-8 w-8"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <MovieDetailsDialog 
        movie={movie} 
        isOpen={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
      />
    </>
  );
}
