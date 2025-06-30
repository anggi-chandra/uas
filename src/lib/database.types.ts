export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          created_at: string
          updated_at: string
          role: 'admin' | 'user'
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user'
        }
      }
      movies: {
        Row: {
          id: string
          title: string
          description: string
          poster: string
          backdrop: string
          rating: string
          duration: string
          release_date: string
          is_now_showing: boolean
          is_coming_soon: boolean
          genre: string[]
          director: string
          cast: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          poster: string
          backdrop: string
          rating: string
          duration: string
          release_date: string
          is_now_showing: boolean
          is_coming_soon: boolean
          genre: string[]
          director: string
          cast: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          poster?: string
          backdrop?: string
          rating?: string
          duration?: string
          release_date?: string
          is_now_showing?: boolean
          is_coming_soon?: boolean
          genre?: string[]
          director?: string
          cast?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      theaters: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          image: string
          facilities: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          image: string
          facilities: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          image?: string
          facilities?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      showtimes: {
        Row: {
          id: string
          movie_id: string
          theater_id: string
          date: string
          time: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          movie_id: string
          theater_id: string
          date: string
          time: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          theater_id?: string
          date?: string
          time?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      seats: {
        Row: {
          id: string
          theater_id: string
          row: string
          number: number
          type: 'standard' | 'premium' | 'vip'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          theater_id: string
          row: string
          number: number
          type: 'standard' | 'premium' | 'vip'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theater_id?: string
          row?: string
          number?: number
          type?: 'standard' | 'premium' | 'vip'
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          showtime_id: string
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          showtime_id: string
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          showtime_id?: string
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      booking_seats: {
        Row: {
          id: string
          booking_id: string
          seat_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          seat_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          seat_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          payment_method: 'credit_card' | 'debit_card' | 'e_wallet'
          status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          payment_method: 'credit_card' | 'debit_card' | 'e_wallet'
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          payment_method?: 'credit_card' | 'debit_card' | 'e_wallet'
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}