
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { WatchlistEntry } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

/**
 * A global listener that checks for movie releases in the user's watchlist.
 * It notifies the user via Toast if a tracked movie has released since the last check.
 */
export default function ReleaseNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const notifiedIds = useRef<Set<string>>(new Set());

  // Memoize query for upcoming movies with reminders enabled
  const upcomingQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/watchlist`),
      where("isWatched", "==", false),
      where("remindMe", "==", true)
    );
  }, [user, firestore]);

  const { data: entries } = useCollection<WatchlistEntry>(upcomingQuery);

  useEffect(() => {
    if (!entries || entries.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    entries.forEach(entry => {
      const releaseDate = new Date(entry.movieData.releaseDate);
      releaseDate.setHours(0, 0, 0, 0);

      // If movie is released today or was released in the past (and we haven't notified yet)
      if (releaseDate <= today && !notifiedIds.current.has(entry.id)) {
        notifiedIds.current.add(entry.id);

        toast({
          title: "Release Alert! 🎬",
          description: `Your awaited movie "${entry.movieData.title}" is now available!`,
          duration: 10000,
        });

        // Optionally disable the reminder once notified to prevent duplicate toasts in same session
        // or keep it to show again next time. For this prototype, we'll mark it as notified locally.
      }
    });
  }, [entries, toast]);

  return null;
}
