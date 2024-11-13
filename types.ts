import { Database } from './types_db';

export type Sore = Database['public']['sores']['Row'];

export type SoreUpdate = Database['public']['sore_updates']['Row'];

export type User = Database['public']['users']['Row'];
