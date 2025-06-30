'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

export default function NewTheaterPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [facilityInput, setFacilityInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Check if user is an admin using supabaseAdmin to bypass RLS
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (!data || data.role !== 'admin') {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const handleAddFacility = () => {
    if (facilityInput.trim() !== '' && !facilities.includes(facilityInput.trim())) {
      setFacilities([...facilities, facilityInput.trim()]);
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !address || !city) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let finalImageUrl = imageUrl;

      // Upload image if a file was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `theaters/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('images')
          .upload(filePath, imageFile, {
            upsert: true,
            contentType: imageFile.type,
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = supabaseAdmin.storage
          .from('images')
          .getPublicUrl(filePath);

        finalImageUrl = data.publicUrl;
      }

      // Insert the new theater using supabaseAdmin to bypass RLS
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('theaters')
        .insert([
          {
            name,
            address,
            city,
            image: finalImageUrl,
            facilities,
            created_at: now,
            updated_at: now
          },
        ],
        { returning: 'minimal' }); // Prevent automatic SELECT after INSERT to avoid RLS issues

      if (error) throw error;

      // Redirect to theaters management page
      router.push('/admin/theaters');
    } catch (err: any) {
      console.error('Error creating theater:', err);
      setError(err.message || 'An error occurred while creating the theater.');
    } finally {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add New Theater</h1>
            <Link href="/admin/theaters">
              <Button variant="outline">Back to Theaters</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Theater Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium mb-2">
                    Theater Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="px-4 py-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                      Choose File
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {imageFile ? imageFile.name : 'No file chosen'}
                    </span>
                  </div>
                  {imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="h-40 w-full max-w-md rounded-md overflow-hidden bg-muted relative">
                        <img
                          src={imageUrl}
                          alt="Theater preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Facilities
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      placeholder="e.g. IMAX, Dolby Atmos, VIP Seats"
                      className="flex-grow px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFacility();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddFacility}
                    >
                      Add
                    </Button>
                  </div>
                  {facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {facilities.map((facility, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 px-3 py-1 bg-muted rounded-full"
                        >
                          <span className="text-sm">{facility}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFacility(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex justify-end space-x-4">
                  <Link href="/admin/theaters">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Theater'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}