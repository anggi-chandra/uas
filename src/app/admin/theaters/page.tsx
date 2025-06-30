'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';
import Image from 'next/image';

type Theater = {
  id: string;
  name: string;
  address: string;
  city: string;
  image: string;
  facilities: string[];
  created_at: string;
  updated_at: string;
};

export default function AdminTheatersPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadTheaters = async () => {
      try {
        setLoading(true);
        
        // Check if user is an admin
        const { data, error } = await supabase
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

        // Fetch theaters
        const { data: theatersData, error: theatersError } = await supabase
          .from('theaters')
          .select('*')
          .order('name');

        if (theatersError) throw theatersError;
        setTheaters(theatersData || []);
      } catch (err) {
        console.error('Error loading admin theaters page:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadTheaters();
  }, [user, router]);

  const handleDeleteTheater = async (id: string) => {
    if (!confirm('Are you sure you want to delete this theater? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if theater has any showtimes
      const { count, error: countError } = await supabase
        .from('showtimes')
        .select('*', { count: 'exact', head: true })
        .eq('theater_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        alert(`Cannot delete this theater because it has ${count} showtimes scheduled. Remove the showtimes first.`);
        return;
      }

      // Delete the theater
      const { error } = await supabase
        .from('theaters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the theaters list
      setTheaters(theaters.filter(theater => theater.id !== id));
      alert('Theater deleted successfully');
    } catch (err) {
      console.error('Error deleting theater:', err);
      alert('Failed to delete theater. Please try again.');
    }
  };

  const filteredTheaters = theaters.filter(theater => {
    return theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           theater.city.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Theaters</h1>
            <Link href="/admin/theaters/new">
              <Button>Add New Theater</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {filteredTheaters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No theaters found. Add a new theater to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left">Theater</th>
                      <th className="py-3 px-4 text-left">City</th>
                      <th className="py-3 px-4 text-left">Address</th>
                      <th className="py-3 px-4 text-left">Facilities</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTheaters.map((theater) => (
                      <tr key={theater.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted relative">
                              {theater.image && (
                                <Image 
                                  src={theater.image} 
                                  alt={theater.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <span className="font-medium">{theater.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{theater.city}</td>
                        <td className="py-4 px-4">{theater.address}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {theater.facilities.map((facility, index) => (
                              <span 
                                key={index} 
                                className="inline-block px-2 py-1 text-xs rounded-full bg-muted"
                              >
                                {facility}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/theaters/edit/${theater.id}`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteTheater(theater.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}