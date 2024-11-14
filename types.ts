import { Database } from './types_db';

export type Sore = Database['public']['Tables']['sores']['Row'];

export type SoreUpdate = Database['public']['Tables']['sore_updates']['Row'];

export type User = Database['public']['Tables']['users']['Row'];
