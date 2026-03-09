
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, List, BarChart3, Users, Sparkles, User, Search, LogIn, Tv, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, setDocNonBlocking } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import { Notification, WatchPartyMember } from '@/app/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Discovery', icon: Search },
  { href: '/watchlist', label: 'Watchlist', icon: List },
  { href: '/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/recommendations', label: 'For You', icon: Sparkles },
  { href: '/watch-parties', label: 'Parties', icon: Tv },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/quiz', label: 'Cinema Personality', icon: Film },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      where("status", "==", "pending")
    );
  }, [user, firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  const handleAcceptInvite = async (notif: Notification) => {
    if (!user || !firestore) return;

    try {
      // 1. Add user to party members
      const memberRef = doc(firestore, `watchParties/${notif.partyId}/members/${user.uid}`);
      await setDoc(memberRef, {
        id: user.uid,
        userId: user.uid,
        username: user.email?.split('@')[0].toUpperCase() || 'GUEST',
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100`,
        joinedAt: new Date().toISOString()
      } as WatchPartyMember);

      // 2. Delete notification
      deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/notifications`, notif.id));

      toast({ title: "Invite Accepted!", description: `Joining ${notif.partyTitle}...` });
      router.push(`/watch-parties/${notif.partyId}`);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Action Failed", description: "Could not join the party." });
    }
  };

  const handleDeclineInvite = (notif: Notification) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, `users/${user.uid}/notifications`, notif.id));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5 h-16 flex items-center px-4 md:px-8 justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Film className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-headline tracking-tighter text-white hidden sm:block">CINETRACK</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 h-10 px-4 transition-all hover:bg-white/10 hover:text-primary",
                  isActive ? "text-primary bg-white/5 font-semibold" : "text-white/70"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="relative text-white/70 hover:text-white">
                <Bell className="w-5 h-5" />
                {notifications && notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-primary text-[10px] border-none">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-dark border-white/10 text-white p-0 overflow-hidden">
              <DropdownMenuLabel className="p-4 font-headline uppercase tracking-widest text-xs">Pulse Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="max-h-80 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-4 border-b border-white/5 space-y-3">
                      <p className="text-sm">
                        <span className="font-bold text-primary">{notif.senderName}</span> invited you to <span className="text-white font-medium">"{notif.partyTitle}"</span>
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-primary flex-1 h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => handleAcceptInvite(notif)}>Accept</Button>
                        <Button size="sm" variant="ghost" className="flex-1 h-8 text-[10px] font-bold uppercase tracking-wider bg-white/5" onClick={() => handleDeclineInvite(notif)}>Ignore</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-2 opacity-30">
                    <Bell className="w-8 h-8 mx-auto" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">Quiet in the theater</p>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button size="icon" variant="ghost" className="text-white/70 hover:text-white md:hidden">
          <Search className="w-5 h-5" />
        </Button>
        
        {user ? (
          <Link href="/profile">
            <Button size="icon" variant="outline" className={cn(
              "rounded-full border-white/10 bg-white/5 hover:bg-primary hover:text-white transition-all overflow-hidden w-10 h-10",
              pathname === '/profile' && "border-primary text-primary"
            )}>
              <img src={`https://picsum.photos/seed/${user.uid}/100`} alt="Profile" className="w-full h-full object-cover" />
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="default" className="bg-primary hover:bg-primary/80 font-headline hidden sm:flex">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button size="icon" variant="outline" className="sm:hidden glass border-white/10">
              <LogIn className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
