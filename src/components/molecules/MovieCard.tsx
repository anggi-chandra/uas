import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  rating: string;
  duration: string;
  releaseDate: string;
  isNowShowing?: boolean;
  isComingSoon?: boolean;
}

export function MovieCard({
  id,
  title,
  poster,
  rating,
  duration,
  releaseDate,
  isNowShowing = false,
  isComingSoon = false,
}: MovieCardProps) {
  return (
    <Link href={`/movies/${id}`} className="block w-full cursor-pointer">
      <Card className="w-full max-w-[240px] h-[420px] flex flex-col transition-transform hover:scale-[1.02] hover:shadow-lg">
        <div className="relative h-[320px] w-full">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {isNowShowing && <Badge variant="now">Now Showing</Badge>}
            {isComingSoon && <Badge variant="soon">Coming Soon</Badge>}
            <Badge variant="age">{rating}</Badge>
          </div>
        </div>
        <CardContent className="flex-1 p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-1 text-black">{title}</h3>
          <div className="flex items-center text-xs text-gray-500 gap-3">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{releaseDate}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Button className="w-full" size="sm">
            {isNowShowing ? 'Buy Ticket' : 'Remind Me'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}