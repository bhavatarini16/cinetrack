
export interface Movie {
  id: string;
  tmdbId: string;
  title: string;
  genres: string[];
  tmdbRating: number;
  releaseDate: string;
  overview: string;
  posterUrl: string;
  backdropUrl?: string;
  runtime?: number;
  cast?: string[];
  director?: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  movieId: string;
  movieData: Movie; // Denormalized for easy listing
  addedDate: string;
  isWatched: boolean;
  watchDate?: string;
  personalRating?: number;
  notes?: string;
  rewatchCount: number;
}

export interface CinemaPersonality {
  type: string;
  description: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  dateJoined: string;
  personality?: CinemaPersonality;
  favoriteGenreIds?: string[];
}
