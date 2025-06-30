import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

interface HeroProps {
  movie: {
    id: string;
    title: string;
    description: string;
    backdrop: string;
    rating: string;
    duration: string;
    releaseDate: string;
  };
}

export function Hero({ movie }: HeroProps) {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        <Image
          src={movie.backdrop}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 h-full flex items-end pb-16 relative z-10">
        <div className="max-w-2xl">
          <Badge variant="age" className="mb-4">
            {movie.rating}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {movie.title}
          </h1>
          <p className="text-gray-200 mb-6 line-clamp-3">{movie.description}</p>
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-300">
            <span>{movie.duration}</span>
            <span>•</span>
            <span>{movie.releaseDate}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="lg">Buy Tickets</Button>
            <Button variant="outline" size="lg">
              Watch Trailer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}