-- Migration: Initial schema for Veeda Collective Canvas
-- Generated on 2025-04-09

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create canvases table
CREATE TABLE IF NOT EXISTS public.canvases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar NOT NULL,
  title varchar NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_id uuid NOT NULL REFERENCES public.canvases(id) ON DELETE CASCADE,
  user_id varchar NOT NULL,
  type varchar NOT NULL,
  content jsonb,
  position_x double precision NOT NULL DEFAULT 0,
  position_y double precision NOT NULL DEFAULT 0,
  width double precision NOT NULL DEFAULT 200,
  height double precision NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes text
);

-- Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  canvas_id uuid NOT NULL REFERENCES public.canvases(id) ON DELETE CASCADE,
  source_block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  target_block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  source_handle varchar,
  target_handle varchar,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Policies for canvases
CREATE POLICY "Can view own canvases" ON public.canvases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Can insert own canvases" ON public.canvases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Can update own canvases" ON public.canvases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Can delete own canvases" ON public.canvases
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for blocks
CREATE POLICY "Can view own blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Can insert own blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Can update own blocks" ON public.blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Can delete own blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for connections
CREATE POLICY "Can view own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Can insert own connections" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Can update own connections" ON public.connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Can delete own connections" ON public.connections
  FOR DELETE USING (auth.uid() = user_id);
