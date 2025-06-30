import React from 'react';
import { MovieCard } from '@/components/molecules/MovieCard';

interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: string;
  duration: string;
  releaseDate: string;
  isNowShowing?: boolean;
  isComingSoon?: boolean;
}

interface MovieGridProps {
  movies: Movie[];
  title?: string;
}

export function MovieGrid({ movies, title }: MovieGridProps) {
  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold mb-4 text-secondary">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
}