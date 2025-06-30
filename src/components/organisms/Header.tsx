'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { useAuth } from '@/components/providers/AuthProvider';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="relative h-8 w-32">
            <span className="text-xl font-bold text-primary">CinemaTicket</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/movies" className="text-sm font-medium hover:text-primary">
            Movies
          </Link>
          <Link href="/theaters" className="text-sm font-medium hover:text-primary">
            Theaters
          </Link>
          <Link href="/promotions" className="text-sm font-medium hover:text-primary">
            Promotions
          </Link>
        </nav>

        {/* Search, Theme Toggle and Account */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies..."
              className="pl-10 pr-4 py-2 text-sm border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
            />
          </div>
          <ThemeToggle />
          
          {user ? (
            <div className="relative">
              <button 
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 border border-border">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link href="/profile">
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-muted" onClick={() => setIsProfileMenuOpen(false)}>
                      My Profile
                    </button>
                  </Link>
                  {user.user_metadata?.role === 'admin' && (
                    <Link href="/admin">
                      <button className="block w-full text-left px-4 py-2 text-sm hover:bg-muted" onClick={() => setIsProfileMenuOpen(false)}>
                        Admin Dashboard
                      </button>
                    </Link>
                  )}
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={toggleMenu}
            className="p-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/movies"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Movies
              </Link>
              <Link
                href="/theaters"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Theaters
              </Link>
              <Link
                href="/promotions"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Promotions
              </Link>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search movies..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                />
              </div>
              
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                      My Profile
                    </Button>
                  </Link>
                  {user.user_metadata?.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="w-full" onClick={() => setIsMenuOpen(false)}>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}