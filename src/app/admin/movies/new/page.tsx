'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

// Fungsi untuk menambahkan delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function NewMoviePage() {
  const { user, refreshSession } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
  const [isNowShowing, setIsNowShowing] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(true);
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState<string[]>([]);
  const [castInput, setCastInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk memastikan folder uploads ada di bucket
  const ensureUploadsFolderExists = async () => {
    try {
      console.log('Ensuring uploads folder exists in storage bucket...');
      
      // Buat file placeholder untuk memastikan folder uploads ada
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      const placeholderFile = new File([placeholderContent], '.placeholder', { type: 'text/plain' });
      
      // Upload placeholder ke folder uploads menggunakan supabaseAdmin untuk bypass RLS
      const { error } = await supabaseAdmin.storage
        .from('images')
        .upload('uploads/.placeholder', placeholderFile, {
          upsert: true,
          contentType: 'text/plain',
          cacheControl: '3600'
        });
      
      if (error) {
        console.warn('Could not create uploads folder:', error);
        // Lanjutkan meskipun gagal, karena folder mungkin sudah ada
      } else {
        console.log('Uploads folder created or already exists');
      }
    } catch (err) {
      console.warn('Error ensuring uploads folder exists:', err);
      // Lanjutkan meskipun gagal
    }
  };
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Jika user belum login, tunggu sebentar sebelum redirect
        if (!user) {
          console.log('User not logged in, waiting for auth state...');
          // Tunggu 3 detik untuk memastikan auth state sudah diperbarui
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Cek lagi setelah menunggu
          if (!user) {
            console.log('Still no user after waiting, redirecting to login');
            // Tampilkan pesan error selama 2 detik sebelum redirect
            setError('Sesi login tidak ditemukan. Mengalihkan ke halaman login...');
            setLoading(false);
            setTimeout(() => {
              router.push('/login');
            }, 2000);
            return;
          }
        }

        // Pastikan user memiliki ID
        if (!user?.id) {
          console.error('User logged in but no user ID found');
          setError('ID pengguna tidak ditemukan. Silakan login kembali.');
          setLoading(false);
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          return;
        }

        console.log('Checking admin status for user:', user.id);
        
        try {
          // Refresh session terlebih dahulu untuk memastikan token valid
          // Gunakan fungsi refreshSession dari AuthProvider yang sudah dioptimalkan
          const { error: sessionError } = await refreshSession();
          
          if (sessionError) {
            console.error('Error refreshing session:', sessionError);
            // Periksa apakah error terkait dengan provider_id
            if (sessionError.message && sessionError.message.includes('provider_id')) {
              console.log('Detected provider_id constraint error, attempting workaround...');
              // Jika masih dalam batas retry, coba lagi setelah delay
              if (retryCount < 3) {
                console.log(`Retrying session refresh (attempt ${retryCount + 1}/3)...`);
                setRetryCount(retryCount + 1);
                await delay(2000); // Tunggu 2 detik sebelum mencoba lagi
                checkAdminStatus(); // Coba lagi
                return;
              }
              // Tampilkan pesan khusus untuk error ini
              setError('Terjadi masalah dengan autentikasi Supabase. Silakan coba login kembali.');
            } else if (sessionError.message && sessionError.message.includes('rate limit')) {
              console.log('Rate limit reached, waiting before retry...');
              // Jika masih dalam batas retry, coba lagi setelah delay lebih lama
              if (retryCount < 3) {
                console.log(`Retrying after rate limit (attempt ${retryCount + 1}/3)...`);
                setRetryCount(retryCount + 1);
                await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
                checkAdminStatus(); // Coba lagi
                return;
              }
              setError('Terlalu banyak permintaan ke server. Silakan tunggu beberapa saat dan coba lagi.');
            } else {
              setError(`Sesi login Anda telah kedaluwarsa. Silakan login kembali. (${sessionError.message})`);
            }
            setLoading(false);
            setTimeout(() => {
              router.push('/login');
            }, 3000);
            return;
          }
          
          // Reset retry counter jika berhasil
          setRetryCount(0);
          
          // Cek apakah user adalah admin dari database menggunakan supabaseAdmin untuk bypass RLS
          const { data, error } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
            // Jika error adalah rate limit dan masih dalam batas retry
            if (error.message && error.message.includes('rate limit') && retryCount < 3) {
              console.log(`Rate limit reached on database query, retrying (attempt ${retryCount + 1}/3)...`);
              setRetryCount(retryCount + 1);
              await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
              checkAdminStatus(); // Coba lagi
              return;
            }
            setError(`Error verifikasi status admin: ${error.message}. Silakan coba lagi.`);
            setLoading(false);
          } else if (!data) {
            console.error('No user data found in database');
            setError('Profil pengguna tidak ditemukan. Silakan hubungi administrator.');
            setLoading(false);
          } else if (data.role !== 'admin') {
            console.log('User is not an admin, role:', data.role);
            setError('Anda tidak memiliki hak akses admin.');
            // Tampilkan pesan error selama 3 detik sebelum redirect
            setTimeout(() => {
              router.push('/');
            }, 3000);
        } else {
          // Berhasil verifikasi status admin
          console.log('Admin status verified successfully, role:', data.role);
          setIsAdmin(true);
          setError(null);
          setLoading(false);
        }
        } catch (err: any) {
          console.error('Error during admin verification process:', err);
          // Periksa apakah error terkait dengan provider_id atau rate limit
          if (err.message && (err.message.includes('provider_id') || err.message.includes('rate limit'))) {
            console.log('Detected provider_id constraint error or rate limit in catch block');
            // Jika masih dalam batas retry, coba lagi setelah delay
            if (retryCount < 3) {
              console.log(`Retrying after error (attempt ${retryCount + 1}/3)...`);
              setRetryCount(retryCount + 1);
              await delay(3000); // Tunggu 3 detik sebelum mencoba lagi
              checkAdminStatus(); // Coba lagi
              return;
            }
            setError('Terjadi masalah dengan autentikasi Supabase. Silakan coba login kembali.');
          } else {
            setError(`Terjadi kesalahan saat verifikasi admin: ${err.message || 'Unknown error'}`);
          }
          setLoading(false);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err: any) {
        console.error('Unexpected error checking admin status:', err);
        // Periksa apakah error terkait dengan provider_id atau rate limit
        if (err.message && (err.message.includes('provider_id') || err.message.includes('rate limit'))) {
          // Jika masih dalam batas retry, coba lagi setelah delay
          if (retryCount < 3) {
            console.log(`Retrying after unexpected error (attempt ${retryCount + 1}/3)...`);
            setRetryCount(retryCount + 1);
            await delay(3000); // Tunggu 3 detik sebelum mencoba lagi
            checkAdminStatus(); // Coba lagi
            return;
          }
          setError('Terjadi masalah dengan autentikasi Supabase. Silakan coba login kembali.');
        } else {
          setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        }
        setLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    checkAdminStatus();
    
    // Pastikan folder uploads ada saat komponen dimuat
    if (user) {
      ensureUploadsFolderExists();
    }
  }, [user, router]);
  
  // Pastikan folder uploads ada saat user berhasil login
  useEffect(() => {
    if (isAdmin && user) {
      ensureUploadsFolderExists();
    }
  }, [isAdmin, user]);

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

  const uploadImage = async (file: File, folder: string, movieId?: string) => {
    // Add timestamp to ensure unique filenames
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${timestamp}.${fileExt}`;
    
    // If movieId is provided, create a folder structure with it
    const filePath = movieId 
      ? `${folder}/${movieId}/${fileName}` 
      : `${folder}/${fileName}`;
    
    // Simplified path for fallback (flat structure)
    const simplifiedPath = `uploads/${fileName}`;
    
    console.log('Attempting to upload file to path:', filePath);
    
    // Try the primary upload approach
    try {
      // Upload the file to the bucket with additional options to bypass RLS
      const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
        .from('images')
        .upload(filePath, file, {
          upsert: true, // Use upsert to overwrite if file exists
          contentType: file.type, // Set the content type explicitly
          cacheControl: '3600' // Add cache control header
        });
  
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // Log more detailed error information
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('violates row-level security')) {
          console.error('RLS policy violation detected. This is likely a permissions issue.');
          console.error('Details:', uploadError.details || 'No additional details');
          console.error('Hint:', uploadError.hint || 'No hint provided');
          
          // Try an alternative approach with simplified path
          console.log('Attempting alternative upload approach with simplified path:', simplifiedPath);
          
          try {
            // Try uploading to a simplified path without nested folders
            const { error: fallbackError, data: fallbackData } = await supabaseAdmin.storage
              .from('images')
              .upload(simplifiedPath, file, {
                upsert: true,
                contentType: file.type,
                cacheControl: '3600'
              });
            
            if (fallbackError) {
              console.error('Fallback upload also failed:', fallbackError);
              return { error: `Failed to upload file: ${fallbackError.message}`, url: null };
            }
            
            // Get the public URL for the fallback path
            const { data: fallbackUrlData } = supabaseAdmin.storage.from('images').getPublicUrl(simplifiedPath);
            if (!fallbackUrlData || !fallbackUrlData.publicUrl) {
              return { error: 'Failed to get public URL for uploaded file', url: null };
            }
            
            console.log('File uploaded successfully to fallback path:', simplifiedPath);
            console.log('Public URL:', fallbackUrlData.publicUrl);
            
            return { error: null, url: fallbackUrlData.publicUrl };
          } catch (fallbackError: any) {
            console.error('Fallback upload attempt failed:', fallbackError);
            return { error: `Failed to upload file: ${fallbackError.message}`, url: null };
          }
        }
        
        return { error: `Failed to upload file: ${uploadError.message}`, url: null };
      }
  
      // Get the public URL
      const { data } = supabaseAdmin.storage.from('images').getPublicUrl(filePath);
      if (!data || !data.publicUrl) {
        return { error: 'Failed to get public URL for uploaded file', url: null };
      }
      
      console.log('File uploaded successfully to:', filePath);
      console.log('Public URL:', data.publicUrl);
      
      return { error: null, url: data.publicUrl };
    } catch (error: any) {
      console.error('Storage operation failed:', error);
      
      // Try the fallback approach if the main one fails with any error
      try {
        console.log('Attempting fallback upload after exception:', simplifiedPath);
        
        const { error: fallbackError, data: fallbackData } = await supabaseAdmin.storage
          .from('images')
          .upload(simplifiedPath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600'
          });
        
        if (fallbackError) {
          console.error('Fallback upload also failed after exception:', fallbackError);
          return { error: `Failed to upload file: ${fallbackError.message}`, url: null };
        }
        
        // Get the public URL for the fallback path
        const { data: fallbackUrlData } = supabaseAdmin.storage.from('images').getPublicUrl(simplifiedPath);
        if (!fallbackUrlData || !fallbackUrlData.publicUrl) {
          return { error: 'Failed to get public URL for uploaded file', url: null };
        }
        
        console.log('File uploaded successfully to fallback path after exception:', simplifiedPath);
        console.log('Public URL:', fallbackUrlData.publicUrl);
        
        return { error: null, url: fallbackUrlData.publicUrl };
      } catch (fallbackError: any) {
        console.error('All upload attempts failed:', fallbackError);
        return { error: `Failed to upload file: ${error.message}. Fallback also failed: ${fallbackError.message}`, url: null };
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Reset retry counter for form submission
    let submissionRetryCount = 0;

    try {
      // Refresh session terlebih dahulu untuk memastikan token valid
      // Gunakan fungsi refreshSession dari AuthProvider yang sudah dioptimalkan
      const { error: sessionError } = await refreshSession();
      
      if (sessionError) {
        console.error('Error refreshing session before submission:', sessionError);
        // Periksa apakah error terkait dengan provider_id atau rate limit
        if (sessionError.message && (sessionError.message.includes('provider_id') || sessionError.message.includes('rate limit'))) {
          console.log('Detected provider_id constraint error or rate limit during form submission');
          // Coba lagi hingga 3 kali dengan delay yang meningkat
          if (submissionRetryCount < 3) {
            console.log(`Retrying form submission after auth error (attempt ${submissionRetryCount + 1}/3)...`);
            submissionRetryCount++;
            await delay(3000 * submissionRetryCount); // Tunggu dengan waktu yang meningkat
            // Coba refresh session lagi
            const { error: retryError } = await refreshSession();
            if (!retryError) {
              // Jika berhasil, lanjutkan proses
              console.log('Session refresh successful on retry, continuing submission...');
            } else {
              setError('Terjadi masalah dengan autentikasi Supabase. Silakan coba login kembali.');
              setSubmitting(false);
              setTimeout(() => {
                router.push('/login');
              }, 3000);
              return;
            }
          } else {
            setError('Terjadi masalah dengan autentikasi Supabase. Silakan coba login kembali.');
            setSubmitting(false);
            setTimeout(() => {
              router.push('/login');
            }, 3000);
            return;
          }
        } else {
          setError(`Sesi login Anda telah kedaluwarsa. Silakan login kembali. (${sessionError.message})`);
          setSubmitting(false);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }
      }
      
      // Pastikan user masih login dan memiliki ID
      if (!user || !user.id) {
        console.error('No authenticated user found during form submission');
        setError('Sesi login Anda telah berakhir. Silakan login kembali.');
        setSubmitting(false);
        
        // Tunggu 2 detik sebelum redirect ke halaman login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
      
      console.log('Submitting movie form for user:', user.id);
      
      // Verifikasi status admin dari database sebelum melanjutkan
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error verifying admin status before submission:', userError);
        setError(`Error verifikasi izin: ${userError.message}. Silakan coba lagi.`);
        setSubmitting(false);
        return;
      }
      
      if (!userData) {
        console.error('User data not found in database during form submission');
        setError('Profil pengguna tidak ditemukan. Silakan hubungi administrator.');
        setSubmitting(false);
        return;
      }
      
      if (userData.role !== 'admin') {
        console.error('Non-admin user attempting to submit movie form, role:', userData.role);
        setError('Anda tidak memiliki izin untuk melakukan tindakan ini.');
        setSubmitting(false);
        
        // Tunggu 2 detik sebelum redirect ke halaman utama
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      }
      
      // Validate form
      if (!title || !description || !duration || !releaseDate || genre.length === 0 || !rating || !director || cast.length === 0) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return; // Don't throw error, just return
      }

      if (!posterFile && !posterUrl) {
        setError('Please upload a movie poster image');
        setSubmitting(false);
        return; // Don't throw error, just return
      }

      if (!backdropFile && !backdropUrl) {
        setError('Please upload a movie backdrop image');
        setSubmitting(false);
        return; // Don't throw error, just return
      }

      // Log data yang akan dikirim ke database untuk debugging
      console.log('Sending movie data to database:', {
        title,
        description,
        duration,
        release_date: releaseDate,
        genre,
        rating,
        director,
        cast,
        is_now_showing: isNowShowing,
        is_coming_soon: isComingSoon
      });
      
      // Validasi data sebelum insert
      if (!title.trim()) {
        setError('Title is required');
        setSubmitting(false);
        return;
      }
      
      if (!description.trim()) {
        setError('Description is required');
        setSubmitting(false);
        return;
      }
      
      if (!director.trim()) {
        setError('Director is required');
        setSubmitting(false);
        return;
      }
      
      if (!rating.trim()) {
        setError('Rating is required');
        setSubmitting(false);
        return;
      }
      
      if (!duration.trim()) {
        setError('Duration is required');
        setSubmitting(false);
        return;
      }
      
      if (!releaseDate.trim()) {
        setError('Release date is required');
        setSubmitting(false);
        return;
      }
      
      // Siapkan placeholder untuk poster dan backdrop
      // Ini akan diupdate nanti setelah upload file
      const placeholderImageUrl = 'https://via.placeholder.com/500x750?text=No+Image';
      
      // First create the movie record to get an ID using supabaseAdmin to bypass RLS
      const { data: movieData, error: movieError } = await supabaseAdmin
        .from('movies')
        .insert([{
          title: title.trim(),
          description: description.trim(),
          poster: posterUrl || placeholderImageUrl, // Gunakan placeholder jika tidak ada
          backdrop: backdropUrl || placeholderImageUrl, // Gunakan placeholder jika tidak ada
          duration: duration.toString().trim(),
          release_date: releaseDate.trim(),
          genre: genre.length > 0 ? genre : ['Tidak Dikategorikan'],
          rating: rating.trim(),
          director: director.trim(),
          cast: cast.length > 0 ? cast : ['Tidak Diketahui'],
          is_now_showing: isNowShowing,
          is_coming_soon: isComingSoon
        }])
        .select()
        .single();

      if (movieError) {
        console.error('Error creating movie record:', movieError);
        // Tampilkan pesan error yang lebih detail
        let errorMessage = `Error creating movie record: ${movieError.message}`;
        
        // Cek apakah ada detail error tambahan
        if (movieError.details) {
          errorMessage += ` (Details: ${movieError.details})`;
        }
        
        // Cek apakah ada kode error
        if (movieError.code) {
          errorMessage += ` (Code: ${movieError.code})`;
        }
        
        // Cek apakah ada hint dari Supabase
        if (movieError.hint) {
          errorMessage += ` (Hint: ${movieError.hint})`;
        }
        
        setError(errorMessage);
        setSubmitting(false);
        return;
      }
      
      if (!movieData) {
        console.error('No movie data returned after insert');
        setError('Error creating movie record: No data returned');
        setSubmitting(false);
        return;
      }
      
      // Now we have the movie ID, use it to create folders when uploading images
      const movieId = movieData.id;
      
      // Create a placeholder file to ensure the movie folder exists
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      const placeholderFile = new File([placeholderContent], '.placeholder', { type: 'text/plain' });
      
      // Create movie folder in storage by uploading a placeholder file
      const placeholderResult = await uploadImage(placeholderFile, 'movies', movieId);
      if (placeholderResult.error) {
        console.warn('Error creating placeholder file:', placeholderResult.error);
        // Continue anyway, this is just a placeholder
      }
      
      // Pastikan folder uploads ada sebelum upload gambar
      await ensureUploadsFolderExists();
      
      // Upload images if provided
      let finalPosterUrl = posterUrl || placeholderImageUrl;
      let finalBackdropUrl = backdropUrl || placeholderImageUrl;
      let needsUpdate = false;
      let uploadErrors = [];
      
      if (posterFile) {
        console.log('Uploading poster image...');
        // Coba upload ke folder movie-posters terlebih dahulu
        const posterResult = await uploadImage(posterFile, 'movie-posters', movieId);
        if (posterResult.error) {
          console.error('Error uploading poster:', posterResult.error);
          uploadErrors.push(`Poster: ${posterResult.error}`);
          
          // Jika gagal, coba upload langsung ke folder uploads
          console.log('Trying alternative upload for poster...');
          const fallbackPosterResult = await uploadImage(posterFile, 'uploads', null);
          if (fallbackPosterResult.error) {
            console.error('Fallback poster upload also failed:', fallbackPosterResult.error);
            uploadErrors.push(`Fallback poster: ${fallbackPosterResult.error}`);
          } else if (fallbackPosterResult.url) {
            console.log('Poster uploaded successfully to fallback location:', fallbackPosterResult.url);
            finalPosterUrl = fallbackPosterResult.url;
            needsUpdate = true;
            // Hapus error poster karena berhasil dengan fallback
            uploadErrors = uploadErrors.filter(err => !err.startsWith('Poster:'));
          }
        } else if (posterResult.url) {
          console.log('Poster uploaded successfully:', posterResult.url);
          finalPosterUrl = posterResult.url;
          needsUpdate = true;
        }
      }

      if (backdropFile) {
        console.log('Uploading backdrop image...');
        // Coba upload ke folder movie-backdrops terlebih dahulu
        const backdropResult = await uploadImage(backdropFile, 'movie-backdrops', movieId);
        if (backdropResult.error) {
          console.error('Error uploading backdrop:', backdropResult.error);
          uploadErrors.push(`Backdrop: ${backdropResult.error}`);
          
          // Jika gagal, coba upload langsung ke folder uploads
          console.log('Trying alternative upload for backdrop...');
          const fallbackBackdropResult = await uploadImage(backdropFile, 'uploads', null);
          if (fallbackBackdropResult.error) {
            console.error('Fallback backdrop upload also failed:', fallbackBackdropResult.error);
            uploadErrors.push(`Fallback backdrop: ${fallbackBackdropResult.error}`);
          } else if (fallbackBackdropResult.url) {
            console.log('Backdrop uploaded successfully to fallback location:', fallbackBackdropResult.url);
            finalBackdropUrl = fallbackBackdropResult.url;
            needsUpdate = true;
            // Hapus error backdrop karena berhasil dengan fallback
            uploadErrors = uploadErrors.filter(err => !err.startsWith('Backdrop:'));
          }
        } else if (backdropResult.url) {
          console.log('Backdrop uploaded successfully:', backdropResult.url);
          finalBackdropUrl = backdropResult.url;
          needsUpdate = true;
        }
      }
      
      // Jika masih ada error upload setelah mencoba semua pendekatan
      if (uploadErrors.length > 0) {
        console.error('Upload errors after all attempts:', uploadErrors);
        setError(`Error uploading images: ${uploadErrors.join('; ')}`);
        setSubmitting(false);
        return;
      }
      
      // Verifikasi URL gambar
      console.log('Final image URLs:', { finalPosterUrl, finalBackdropUrl });
      
      // Pastikan kita memiliki URL yang valid
      if (!finalPosterUrl || !finalBackdropUrl) {
        console.error('Missing image URLs:', { finalPosterUrl, finalBackdropUrl });
        setError('Failed to get valid image URLs');
        setSubmitting(false);
        return;
      }

      // Hanya update jika ada file yang diupload
      if (needsUpdate) {
        // Log informasi sebelum update
        console.log('Updating movie with image URLs:', {
          movieId,
          poster: finalPosterUrl,
          backdrop: finalBackdropUrl
        });
        
        // Update the movie record with the image URLs using supabaseAdmin to bypass RLS
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('movies')
          .update({
            poster: finalPosterUrl,
            backdrop: finalBackdropUrl
          })
          .eq('id', movieId)
          .select();  // Tambahkan select() untuk mendapatkan data yang diupdate
          
        // Log hasil update
        console.log('Update result:', { updateData, updateError });
        
        if (updateError) {
          console.error('Error updating movie with image URLs:', updateError);
          
          // Tampilkan pesan error yang lebih detail
          let errorMessage = `Error updating movie with image URLs: ${updateError.message}`;
          
          // Cek apakah ada detail error tambahan
          if (updateError.details) {
            errorMessage += ` (Details: ${updateError.details})`;
          }
          
          // Cek apakah ada kode error
          if (updateError.code) {
            errorMessage += ` (Code: ${updateError.code})`;
          }
          
          // Cek apakah ada hint dari Supabase
          if (updateError.hint) {
            errorMessage += ` (Hint: ${updateError.hint})`;
          }
          
          setError(errorMessage);
          setSubmitting(false);
          return;
        }
        
        // Verifikasi bahwa data telah diupdate dengan benar
        if (!updateData || updateData.length === 0) {
          console.warn('Movie updated but no data returned');
          // Lanjutkan karena ini mungkin bukan error fatal
        } else {
          console.log('Movie successfully updated with images:', updateData);
        }
      } else {
        console.log('No image files uploaded, skipping update');
      }

      // Log sukses dan redirect ke halaman admin movies
      console.log('Movie created successfully with ID:', movieId);
      
      // Tampilkan pesan sukses (opsional)
      // setSuccess('Movie created successfully!');
      
      // Redirect to movies admin page
      router.push('/admin/movies');
    } catch (err: any) {
      console.error('Error creating movie:', err);
      
      // Tampilkan informasi error yang lebih detail
      let errorMessage = 'Failed to create movie';
      
      if (err) {
        // Jika err adalah objek dengan properti message
        if (err.message) {
          errorMessage = `Error: ${err.message}`;
        }
        
        // Jika err adalah objek dengan properti code
        if (err.code) {
          errorMessage += ` (Code: ${err.code})`;
        }
        
        // Jika err adalah objek dengan properti details
        if (err.details) {
          errorMessage += ` (Details: ${err.details})`;
        }
        
        // Jika err adalah objek dengan properti hint (Supabase specific)
        if (err.hint) {
          errorMessage += ` (Hint: ${err.hint})`;
        }
        
        // Jika err memiliki properti statusCode (HTTP errors)
        if (err.statusCode) {
          errorMessage += ` (Status: ${err.statusCode})`;
        }
        
        // Log stack trace jika tersedia
        if (err.stack) {
          console.error('Error stack:', err.stack);
        }
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Memuat Halaman Admin</h2>
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg mb-2">Sedang memverifikasi status admin...</p>
          <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold mb-1">Error:</p>
              <p>{error}</p>
              <p className="text-sm mt-2">Jika masalah berlanjut, silakan hubungi administrator.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center">Akses Ditolak</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <p className="mb-6 text-center">
            Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya dapat diakses oleh administrator.
          </p>
          <div className="flex flex-col space-y-3">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="default" className="w-full">Login Kembali</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add New Movie</h1>
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
                    <label htmlFor="genre" className="block text-sm font-medium mb-1">
                      Genre *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="genre"
                        type="text"
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        placeholder="Action, Comedy, Drama, etc."
                        className="flex-grow px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddGenre}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {genre.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {genre.map((g, index) => (
                          <div key={index} className="flex items-center bg-muted px-2 py-1 rounded-md">
                            <span>{g}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGenre(index)}
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {genre.length === 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Add at least one genre</p>
                    )}
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
                      placeholder="Director's name"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="cast" className="block text-sm font-medium mb-1">
                      Cast *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="cast"
                        type="text"
                        value={castInput}
                        onChange={(e) => setCastInput(e.target.value)}
                        placeholder="Actor's name"
                        className="flex-grow px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddCast}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {cast.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cast.map((actor, index) => (
                          <div key={index} className="flex items-center bg-muted px-2 py-1 rounded-md">
                            <span>{actor}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCast(index)}
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {cast.length === 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Add at least one cast member</p>
                    )}
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">
                      Status *
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isNowShowing"
                        type="checkbox"
                        checked={isNowShowing}
                        onChange={(e) => setIsNowShowing(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="isNowShowing" className="text-sm">
                        Now Showing
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="isComingSoon"
                        type="checkbox"
                        checked={isComingSoon}
                        onChange={(e) => setIsComingSoon(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="isComingSoon" className="text-sm">
                        Coming Soon
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="poster" className="block text-sm font-medium mb-1">
                      Movie Poster *
                    </label>
                    <div className="border-2 border-dashed border-input rounded-md p-4 text-center">
                      {posterUrl ? (
                        <div className="relative mx-auto w-32 h-48 mb-4 overflow-hidden rounded">
                          <img 
                            src={posterUrl} 
                            alt="Movie poster preview" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : null}
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
                      {backdropUrl ? (
                        <div className="relative mx-auto w-full h-32 mb-4 overflow-hidden rounded">
                          <img 
                            src={backdropUrl} 
                            alt="Movie backdrop preview" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : null}
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
                        Recommended size: 1280x720 pixels (16:9 ratio)
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
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/admin/movies">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Movie'}
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