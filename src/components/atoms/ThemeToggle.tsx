'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, systemTheme, toggleTheme, setTheme } = useTheme();
  const [isSystemTheme, setIsSystemTheme] = useState(false);

  // Check if current theme matches system theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    setIsSystemTheme(!storedTheme || theme === systemTheme);
  }, [theme, systemTheme]);

  // Toggle between light, dark, and system theme
  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      // Clear localStorage to use system theme
      localStorage.removeItem('theme');
      setTheme(systemTheme || 'dark');
      setIsSystemTheme(true);
    } else if (isSystemTheme) {
      setTheme('light');
      setIsSystemTheme(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      aria-label="Toggle theme"
      title={isSystemTheme ? 'Using system theme' : `Using ${theme} theme`}
    >
      {isSystemTheme ? (
        <Monitor className="h-5 w-5" />
      ) : theme === 'light' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}