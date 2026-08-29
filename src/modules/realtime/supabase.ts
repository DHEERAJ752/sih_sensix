import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const STORAGE_KEYS = {
  SUPABASE_URL: 'ucop_supabase_url',
  SUPABASE_KEY: 'ucop_supabase_anon_key',
  USER_SESSION: 'ucop_user_session',
  ACTIVE_GROUP: 'ucop_active_group',
  SAVED_TRIPS: 'ucop_saved_trips',
  SAVED_ALERTS: 'ucop_saved_alerts',
  APP_SETTINGS: 'ucop_app_settings',
};

export function getStoredCredentials(): { url: string; key: string } {
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  return { url, key };
}

export function saveStoredCredentials(url: string, key: string): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
  localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getStoredCredentials();
  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
