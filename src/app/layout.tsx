
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/navbar';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import ReleaseNotificationListener from '@/components/release-notification-listener';

export const metadata: Metadata = {
  title: 'CineTrack | Your Personal Cinema Journey',
  description: 'Track, analyze, and discover movies with AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen overflow-x-hidden">
        <FirebaseClientProvider>
          <Navbar />
          <ReleaseNotificationListener />
          <main className="relative z-0">
            {children}
          </main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
