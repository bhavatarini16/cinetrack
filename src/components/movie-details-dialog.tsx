
"use client";

import { Movie, WatchlistEntry } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Clock, User, Plus, Check, Trash2, Edit3 } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

interface MovieDetailsDialogProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieDetailsDialog({ movie, isOpen, onClose }: MovieDetailsDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [tempRating, setTempRating] = useState<number>(0);

  const watchlistRef = useMemoFirebase(() => {
    if (!user || !movie) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("movieId", "==", movie.tmdbId)
    );
  }, [user, movie, firestore]);

  const { data: watchlistEntries } = useCollection<WatchlistEntry>(watchlistRef);
  const entry = watchlistEntries?.[0];

  if (!movie) return null;

  const handleToggleWatchlist = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "You need to be signed in to manage your watchlist." });
      return;
    }

    if (entry) {
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id));
      toast({ title: "Removed from collection" });
    } else {
      addDocumentNonBlocking(collection(firestore, `users/${user.uid}/watchlist`), {
        userId: user.uid,
        movieId: movie.tmdbId,
        movieData: movie,
        addedDate: new Date().toISOString(),
        isWatched: false,
        rewatchCount: 0,
      });
      toast({ title: "Added to watchlist" });
    }
  };

  const handleMarkAsWatched = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      isWatched: !entry.isWatched,
      watchDate: !entry.isWatched ? new Date().toISOString() : null,
    });
    toast({ title: entry.isWatched ? "Marked as unwatched" : "Marked as watched" });
  };

  const handleSaveNotes = () => {
    if (!user || !entry) return;
    updateDocumentNonBlocking(doc(firestore, `users/${user.uid}/watchlist`, entry.id), {
      notes: tempNotes,
      personalRating: tempRating,
    });
    setEditingNotes(false);
    toast({ title: "Review updated" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glass border-white/10 p-0 overflow-hidden text-white">
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-end gap-6">
            <div className="relative w-32 md:w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10 shrink-0">
              <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <Badge key={g} variant="secondary" className="bg-white/10 border-white/5">{g}</Badge>
                ))}
              </div>
              <DialogTitle className="text-3xl md:text-5xl font-headline font-bold leading-tight">{movie.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {movie.releaseDate}</span>
                {movie.runtime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {movie.runtime} min</span>}
                <span className="flex items-center gap-1 text-primary"><Star className="w-4 h-4 fill-primary" /> {movie.tmdbRating}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto max-h-[50vh]">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-headline font-bold text-primary flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> OVERVIEW
              </h4>
              <p className="text-white/70 leading-relaxed text-lg">{movie.overview}</p>
            </div>

            {entry && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-headline font-bold text-primary">YOUR REVIEW</h4>
                  {!editingNotes ? (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setTempNotes(entry.notes || "");
                      setTempRating(entry.personalRating || 0);
                      setEditingNotes(true);
                    }}>
                      Edit Review
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveNotes}>Save</Button>
                    </div>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-white/50">Rating (1-10)</label>
                      <Input 
                        type="number" 
                        min="0" max="10" 
                        value={tempRating} 
                        onChange={(e) => setTempRating(Number(e.target.value))}
                        className="bg-white/5 border-white/10 max-w-[100px]"
                      />
                    </div>
                    <Textarea 
                      value={tempNotes} 
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Write your thoughts..."
                      className="bg-white/5 border-white/10 min-h-[100px]"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 space-y-2">
                    {entry.personalRating ? (
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500" /> {entry.personalRating}/10
                      </div>
                    ) : (
                      <p className="text-white/30 italic text-sm">No rating yet.</p>
                    )}
                    <p className="text-white/80">{entry.notes || "No notes added."}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Button 
                onClick={handleToggleWatchlist}
                variant={entry ? "destructive" : "default"} 
                className="w-full h-12 text-lg font-headline shadow-lg"
              >
                {entry ? <Trash2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {entry ? "Remove" : "Add to Watchlist"}
              </Button>
              {entry && (
                <Button 
                  variant="secondary" 
                  className="w-full h-12 glass border-white/10"
                  onClick={handleMarkAsWatched}
                >
                  {entry.isWatched ? <Check className="w-5 h-5 mr-2 text-green-500" /> : <Clock className="w-5 h-5 mr-2" />}
                  {entry.isWatched ? "Watched" : "Mark as Watched"}
                </Button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
              {movie.director && (
                <div>
                  <h5 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Director</h5>
                  <p className="text-sm font-medium">{movie.director}</p>
                </div>
              )}
              {movie.cast && (
                <div>
                  <h5 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Cast</h5>
                  <p className="text-sm font-medium">{movie.cast.slice(0, 5).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
