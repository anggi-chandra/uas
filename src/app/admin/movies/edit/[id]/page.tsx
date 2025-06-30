'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

type Movie = {
  id: string;
  title: string;
    description: string;
  poster: string;
  backdrop: string;
  duration: string;
  release_date: string;
  genre: string[];
  rating: string;
  director: string;
  cast: string[];
  is_now_showing: boolean;
  is_coming_soon: boolean;
  created_at: string;
  updated_at: string;
};

export default function EditMoviePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [backdropUrl, setBackdropUrl] = useState('');
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [duration, setDuration] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [rating, setRating] = useState('');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState<string[]>([]);
  const [castInput, setCastInput] = useState('');
  const [isNowShowing, setIsNowShowing] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadMovie = async () => {
      try {
        setLoading(true);
        
        // Check if user is an admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        
        if (!userData || userData.role !== 'admin') {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        setIsAdmin(true);

        // Fetch movie data
        const { data: movieData, error: movieError } = await supabase
          .from('movies')
          .select('*')
          .eq('id', params.id)
          .single();

        if (movieError) {
          if (movieError.code === 'PGRST116') {
            // Movie not found
            router.push('/admin/movies');
            return;
          }
          throw movieError;
        }

        setMovie(movieData);
        
        // Set form values
        setTitle(movieData.title);
        setDescription(movieData.description);
        setPosterUrl(movieData.poster);
        setBackdropUrl(movieData.backdrop);
        setDuration(movieData.duration);
        setReleaseDate(movieData.release_date);
        setGenre(movieData.genre || []);
        setRating(movieData.rating);
        setDirector(movieData.director);
        setCast(movieData.cast || []);
        setIsNowShowing(movieData.is_now_showing);
        setIsComingSoon(movieData.is_coming_soon);
      } catch (err) {
        console.error('Error loading movie data:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadMovie();
  }, [user, router, params.id]);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackdropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackdropFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackdropUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddGenre = () => {
    if (genreInput.trim() && !genre.includes(genreInput.trim())) {
      setGenre([...genre, genreInput.trim()]);
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (index: number) => {
    setGenre(genre.filter((_, i) => i !== index));
  };

  const handleAddCast = () => {
    if (castInput.trim() && !cast.includes(castInput.trim())) {
      setCast([...cast, castInput.trim()]);
      setCastInput('');
    }
  };

  const handleRemoveCast = (index: number) => {
    setCast(cast.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Check if the 'images' bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      // Create the 'images' bucket with public access
      const { error: createBucketError } = await supabase.storage.createBucket('images', {
        public: true, // Make bucket public so files are accessible without authentication
      });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
      }
    }

    // Now upload the file to the bucket
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate form
      if (!title || !description || !duration || !releaseDate || genre.length === 0 || !rating || !director || cast.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      if (!posterUrl && !posterFile) {
        throw new Error('Please provide a movie poster image');
      }

      if (!backdropUrl && !backdropFile) {
        throw new Error('Please provide a movie backdrop image');
      }

      // Upload images if new ones were provided
      let finalPosterUrl = posterUrl;
      if (posterFile) {
        finalPosterUrl = await uploadImage(posterFile, 'movie-posters');
      }

      let finalBackdropUrl = backdropUrl;
      if (backdropFile) {
        finalBackdropUrl = await uploadImage(backdropFile, 'movie-backdrops');
      }

      // Update movie in database
      const { error } = await supabase
        .from('movies')
        .update({
          title,
          description,
          poster: finalPosterUrl,
          backdrop: finalBackdropUrl,
          duration,
          release_date: releaseDate,
          genre,
          rating,
          director,
          cast,
          is_now_showing: isNowShowing,
          is_coming_soon: isComingSoon
        })
        .eq('id', params.id);

      if (error) throw error;

      // Redirect to movies admin page
      router.push('/admin/movies');
    } catch (err: any) {
      console.error('Error updating movie:', err);
      setError(err.message || 'Failed to update movie');
      setSubmitting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Movie not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Edit Movie: {movie.title}</h1>
            <Link href="/admin/movies">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">
                      Movie Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Genre *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {genre.map((g, index) => (
                        <div key={index} className="bg-primary/10 px-2 py-1 rounded-md flex items-center">
                          <span>{g}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveGenre(index)}
                            className="ml-2 text-xs text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        id="genreInput"
                        type="text"
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        placeholder="Add a genre"
                        className="flex-1 px-3 py-2 border border-input rounded-l-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddGenre}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-r-md"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium mb-1">
                        Duration (minutes) *
                      </label>
                      <input
                        id="duration"
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium mb-1">
                        Rating (0-10) *
                      </label>
                      <input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="releaseDate" className="block text-sm font-medium mb-1">
                      Release Date *
                    </label>
                    <input
                      id="releaseDate"
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status *
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="isNowShowing"
                          type="checkbox"
                          checked={isNowShowing}
                          onChange={(e) => setIsNowShowing(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="isNowShowing">Now Showing</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="isComingSoon"
                          type="checkbox"
                          checked={isComingSoon}
                          onChange={(e) => setIsComingSoon(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="isComingSoon">Coming Soon</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="poster" className="block text-sm font-medium mb-1">
                      Movie Poster *
                    </label>
                    <div className="border-2 border-dashed border-input rounded-md p-4 text-center">
                      {posterUrl && (
                        <div className="relative mx-auto w-32 h-48 mb-4 overflow-hidden rounded">
                          <img 
                            src={posterUrl} 
                            alt="Movie poster preview" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <input
                        id="poster"
                        type="file"
                        accept="image/*"
                        onChange={handlePosterChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="poster"
                        className="inline-block px-4 py-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        {posterUrl ? 'Change Poster' : 'Upload Poster'}
                      </label>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Recommended size: 500x750 pixels (2:3 ratio)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="backdrop" className="block text-sm font-medium mb-1">
                      Movie Backdrop *
                    </label>
                    <div className="border-2 border-dashed border-input rounded-md p-4 text-center">
                      {backdropUrl && (
                        <div className="relative mx-auto w-full h-32 mb-4 overflow-hidden rounded">
                          <img 
                            src={backdropUrl} 
                            alt="Movie backdrop preview" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <input
                        id="backdrop"
                        type="file"
                        accept="image/*"
                        onChange={handleBackdropChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="backdrop"
                        className="inline-block px-4 py-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        {backdropUrl ? 'Change Backdrop' : 'Upload Backdrop'}
                      </label>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Recommended size: 1920x1080 pixels (16:9 ratio)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="director" className="block text-sm font-medium mb-1">
                      Director *
                    </label>
                    <input
                      id="director"
                      type="text"
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      placeholder="Movie director"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cast *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {cast.map((actor, index) => (
                        <div key={index} className="bg-primary/10 px-2 py-1 rounded-md flex items-center">
                          <span>{actor}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCast(index)}
                            className="ml-2 text-xs text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        id="castInput"
                        type="text"
                        value={castInput}
                        onChange={(e) => setCastInput(e.target.value)}
                        placeholder="Add a cast member"
                        className="flex-1 px-3 py-2 border border-input rounded-l-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddCast}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-r-md"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/admin/movies">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}