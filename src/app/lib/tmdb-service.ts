
/**
 * @fileOverview A mock service simulating TMDB API responses.
 * In a real-world scenario, this would use fetch() with a TMDB API key.
 */

import { Movie } from './types';
import { MOCK_MOVIES } from './mock-data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchMovies(query: string): Promise<Movie[]> {
  await delay(500);
  if (!query) return MOCK_MOVIES.map(adaptMockToMovie);
  
  return MOCK_MOVIES
    .filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    .map(adaptMockToMovie);
}

export async function getTrendingMovies(): Promise<Movie[]> {
  await delay(300);
  return MOCK_MOVIES.map(adaptMockToMovie);
}

export async function getMoviesByGenre(genre: string): Promise<Movie[]> {
  await delay(400);
  return MOCK_MOVIES
    .filter(m => m.genres.includes(genre))
    .map(adaptMockToMovie);
}

function adaptMockToMovie(m: any): Movie {
  return {
    id: m.id,
    tmdbId: m.id,
    title: m.title,
    genres: m.genres,
    tmdbRating: m.tmdbRating || 0,
    releaseDate: m.releaseDate,
    overview: m.overview,
    posterUrl: m.posterUrl,
    backdropUrl: `https://picsum.photos/seed/${m.id}bg/1280/720`,
    runtime: m.runtime || 120,
    cast: m.cast || ["Lead Actor", "Supporting Actor"],
    director: m.director || "Famous Director"
  };
}
