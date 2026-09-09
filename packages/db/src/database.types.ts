/**
 * Database types for the public schema.
 *
 * Hand-written to match supabase/migrations. Regenerate from a running local
 * stack with `pnpm supabase:types` once Docker is available; the generated
 * output has the same shape and replaces this file.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SoreSurface =
  | 'lip_upper_inner'
  | 'lip_lower_inner'
  | 'cheek_left'
  | 'cheek_right'
  | 'tongue_dorsum'
  | 'tongue_left'
  | 'tongue_right'
  | 'tongue_ventral'
  | 'floor_of_mouth'
  | 'palate_hard'
  | 'palate_soft'
  | 'gum_upper'
  | 'gum_lower'
  | 'other';

export type FactorKind =
  | 'food'
  | 'medication'
  | 'treatment'
  | 'illness'
  | 'dental'
  | 'cycle'
  | 'other';

export type PlanTier = 'free' | 'pro';

export type PricingType = 'one_time' | 'recurring';
export type PricingPlanInterval = 'day' | 'week' | 'month' | 'year';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          billing_address: Json | null;
          payment_method: Json | null;
          timezone: string;
          reminder_at: string | null;
          reminder_enabled: boolean;
          plan: PlanTier;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          timezone?: string;
          reminder_at?: string | null;
          reminder_enabled?: boolean;
          plan?: PlanTier;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          timezone?: string;
          reminder_at?: string | null;
          reminder_enabled?: boolean;
          plan?: PlanTier;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sores: {
        Row: {
          id: string;
          user_id: string;
          surface: SoreSurface;
          x: number;
          y: number;
          onset_date: string;
          healed_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          surface: SoreSurface;
          x: number;
          y: number;
          onset_date?: string;
          healed_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          surface?: SoreSurface;
          x?: number;
          y?: number;
          onset_date?: string;
          healed_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sore_logs: {
        Row: {
          id: string;
          sore_id: string;
          user_id: string;
          log_date: string;
          size_mm: number;
          pain: number;
          notes: string | null;
          logged_late: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sore_id: string;
          user_id: string;
          log_date: string;
          size_mm: number;
          pain: number;
          notes?: string | null;
          logged_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sore_id?: string;
          user_id?: string;
          log_date?: string;
          size_mm?: number;
          pain?: number;
          notes?: string | null;
          logged_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sore_logs_sore_id_fkey';
            columns: ['sore_id'];
            isOneToOne: false;
            referencedRelation: 'sores';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          stress: number | null;
          sleep_quality: number | null;
          overall_pain: number | null;
          notes: string | null;
          logged_late: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          stress?: number | null;
          sleep_quality?: number | null;
          overall_pain?: number | null;
          notes?: string | null;
          logged_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          stress?: number | null;
          sleep_quality?: number | null;
          overall_pain?: number | null;
          notes?: string | null;
          logged_late?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      factors: {
        Row: {
          id: string;
          user_id: string | null;
          kind: FactorKind;
          name: string;
          is_preset: boolean;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          kind: FactorKind;
          name: string;
          is_preset?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          kind?: FactorKind;
          name?: string;
          is_preset?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      entry_factors: {
        Row: {
          id: string;
          daily_entry_id: string;
          factor_id: string;
          user_id: string;
          sore_id: string | null;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          daily_entry_id: string;
          factor_id: string;
          user_id: string;
          sore_id?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          daily_entry_id?: string;
          factor_id?: string;
          user_id?: string;
          sore_id?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'entry_factors_daily_entry_id_fkey';
            columns: ['daily_entry_id'];
            isOneToOne: false;
            referencedRelation: 'daily_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'entry_factors_factor_id_fkey';
            columns: ['factor_id'];
            isOneToOne: false;
            referencedRelation: 'factors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'entry_factors_sore_id_fkey';
            columns: ['sore_id'];
            isOneToOne: false;
            referencedRelation: 'sores';
            referencedColumns: ['id'];
          }
        ];
      };
      sore_photos: {
        Row: {
          id: string;
          sore_id: string;
          user_id: string;
          log_date: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sore_id: string;
          user_id: string;
          log_date: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sore_id?: string;
          user_id?: string;
          log_date?: string;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sore_photos_sore_id_fkey';
            columns: ['sore_id'];
            isOneToOne: false;
            referencedRelation: 'sores';
            referencedColumns: ['id'];
          }
        ];
      };
      sores_legacy: {
        Row: {
          id: string;
          user_id: string;
          dates: string[] | null;
          size: number[] | null;
          pain: number[] | null;
          healed: string | null;
          x: number | null;
          y: number | null;
          gums: boolean;
          zone: string;
        };
        Insert: {
          id: string;
          user_id: string;
          dates?: string[] | null;
          size?: number[] | null;
          pain?: number[] | null;
          healed?: string | null;
          x?: number | null;
          y?: number | null;
          gums?: boolean;
          zone?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dates?: string[] | null;
          size?: number[] | null;
          pain?: number[] | null;
          healed?: string | null;
          x?: number | null;
          y?: number | null;
          gums?: boolean;
          zone?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: { id: string; stripe_customer_id: string | null };
        Insert: { id: string; stripe_customer_id?: string | null };
        Update: { id?: string; stripe_customer_id?: string | null };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          active: boolean | null;
          name: string | null;
          description: string | null;
          image: string | null;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          active?: boolean | null;
          name?: string | null;
          description?: string | null;
          image?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          active?: boolean | null;
          name?: string | null;
          description?: string | null;
          image?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      prices: {
        Row: {
          id: string;
          product_id: string | null;
          active: boolean | null;
          description: string | null;
          unit_amount: number | null;
          currency: string | null;
          type: PricingType | null;
          interval: PricingPlanInterval | null;
          interval_count: number | null;
          trial_period_days: number | null;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          product_id?: string | null;
          active?: boolean | null;
          description?: string | null;
          unit_amount?: number | null;
          currency?: string | null;
          type?: PricingType | null;
          interval?: PricingPlanInterval | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          active?: boolean | null;
          description?: string | null;
          unit_amount?: number | null;
          currency?: string | null;
          type?: PricingType | null;
          interval?: PricingPlanInterval | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: SubscriptionStatus | null;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          cancel_at_period_end: boolean | null;
          created: string;
          current_period_start: string;
          current_period_end: string;
          ended_at: string | null;
          cancel_at: string | null;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          status?: SubscriptionStatus | null;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          cancel_at_period_end?: boolean | null;
          created?: string;
          current_period_start?: string;
          current_period_end?: string;
          ended_at?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: SubscriptionStatus | null;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          cancel_at_period_end?: boolean | null;
          created?: string;
          current_period_start?: string;
          current_period_end?: string;
          ended_at?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      flare_ups: {
        Row: {
          user_id: string | null;
          started_on: string | null;
          ended_on: string | null;
          days: number | null;
          is_active: boolean | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      try_cast_date: {
        Args: { value: string };
        Returns: string | null;
      };
    };
    Enums: {
      sore_surface: SoreSurface;
      factor_kind: FactorKind;
      plan_tier: PlanTier;
      pricing_type: PricingType;
      pricing_plan_interval: PricingPlanInterval;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
