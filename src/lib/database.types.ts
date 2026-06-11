// Generated via `supabase gen types typescript` (MCP) for project iafmiiuxygvsulohmrqz.
// Regenerate after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: { data: Json; id: number; kind: string; position: number; section: string; site_slug: string | null }
        Insert: { data: Json; id?: never; kind: string; position: number; section: string; site_slug?: string | null }
        Update: { data?: Json; id?: never; kind?: string; position?: number; section?: string; site_slug?: string | null }
        Relationships: [{ foreignKeyName: "blocks_site_slug_fkey"; columns: ["site_slug"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["slug"] }]
      }
      books: {
        Row: { author: string | null; id: number; lang: string | null; note: string | null; pos: number; position: number | null; register: string | null; title: string | null }
        Insert: { author?: string | null; id?: number; lang?: string | null; note?: string | null; pos: number; position?: number | null; register?: string | null; title?: string | null }
        Update: { author?: string | null; id?: number; lang?: string | null; note?: string | null; pos?: number; position?: number | null; register?: string | null; title?: string | null }
        Relationships: []
      }
      chapters: {
        Row: { code: string | null; dateline: string | null; id: number; position: number | null; sealed: boolean | null; title: string | null }
        Insert: { code?: string | null; dateline?: string | null; id?: number; position?: number | null; sealed?: boolean | null; title?: string | null }
        Update: { code?: string | null; dateline?: string | null; id?: number; position?: number | null; sealed?: boolean | null; title?: string | null }
        Relationships: []
      }
      dossiers: {
        Row: { blurb: string | null; id: number; name: string | null; position: number | null; role: string | null; tiers: Json | null }
        Insert: { blurb?: string | null; id?: number; name?: string | null; position?: number | null; role?: string | null; tiers?: Json | null }
        Update: { blurb?: string | null; id?: number; name?: string | null; position?: number | null; role?: string | null; tiers?: Json | null }
        Relationships: []
      }
      leads: {
        Row: { created_at: string | null; email: string; id: number; source: string | null }
        Insert: { created_at?: string | null; email: string; id?: never; source?: string | null }
        Update: { created_at?: string | null; email?: string; id?: never; source?: string | null }
        Relationships: []
      }
      listen_proofs: {
        Row: { claim: string | null; id: number; n: string | null; name: string | null; position: number | null; voices: Json }
        Insert: { claim?: string | null; id?: number; n?: string | null; name?: string | null; position?: number | null; voices: Json }
        Update: { claim?: string | null; id?: number; n?: string | null; name?: string | null; position?: number | null; voices?: Json }
        Relationships: []
      }
      listen_tracks: {
        Row: { artist: string | null; id: number; position: number | null; proof_id: number | null; title: string | null; why: string | null }
        Insert: { artist?: string | null; id?: number; position?: number | null; proof_id?: number | null; title?: string | null; why?: string | null }
        Update: { artist?: string | null; id?: number; position?: number | null; proof_id?: number | null; title?: string | null; why?: string | null }
        Relationships: [{ foreignKeyName: "listen_tracks_proof_id_fkey"; columns: ["proof_id"]; isOneToOne: false; referencedRelation: "listen_proofs"; referencedColumns: ["id"] }]
      }
      sims: {
        Row: { blurb: string | null; grammar: string | null; id: number; name: string | null; position: number | null; slug: string | null }
        Insert: { blurb?: string | null; grammar?: string | null; id?: number; name?: string | null; position?: number | null; slug?: string | null }
        Update: { blurb?: string | null; grammar?: string | null; id?: number; name?: string | null; position?: number | null; slug?: string | null }
        Relationships: []
      }
      sites: {
        Row: { accent: string; description: string; host: string; nav_order: number; og_image: string | null; slug: string; title: string }
        Insert: { accent: string; description: string; host: string; nav_order: number; og_image?: string | null; slug: string; title: string }
        Update: { accent?: string; description?: string; host?: string; nav_order?: number; og_image?: string | null; slug?: string; title?: string }
        Relationships: []
      }
      story_shorts: {
        Row: { body: Json | null; featured: boolean | null; id: number; position: number | null; status: string | null; title: string | null }
        Insert: { body?: Json | null; featured?: boolean | null; id?: number; position?: number | null; status?: string | null; title?: string | null }
        Update: { body?: Json | null; featured?: boolean | null; id?: number; position?: number | null; status?: string | null; title?: string | null }
        Relationships: []
      }
      watch_channels: {
        Row: { id: number; n: string | null; name: string | null; position: number | null; tagline: string | null }
        Insert: { id?: number; n?: string | null; name?: string | null; position?: number | null; tagline?: string | null }
        Update: { id?: number; n?: string | null; name?: string | null; position?: number | null; tagline?: string | null }
        Relationships: []
      }
      watch_titles: {
        Row: { channel_id: number | null; id: number; match: number | null; platform: string | null; position: number | null; title: string | null; why: string | null }
        Insert: { channel_id?: number | null; id?: number; match?: number | null; platform?: string | null; position?: number | null; title?: string | null; why?: string | null }
        Update: { channel_id?: number | null; id?: number; match?: number | null; platform?: string | null; position?: number | null; title?: string | null; why?: string | null }
        Relationships: [{ foreignKeyName: "watch_titles_channel_id_fkey"; columns: ["channel_id"]; isOneToOne: false; referencedRelation: "watch_channels"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
