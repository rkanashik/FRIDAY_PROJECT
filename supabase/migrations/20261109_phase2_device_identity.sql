-- Phase 2: Device Identity and Pairing
-- This migration establishes the foundation for multi-device support.

-- 1. Devices Table
-- Stores the registration and state of all authorized devices.
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'windows', 'linux', 'web')),
    os_version TEXT,
    app_version TEXT,
    last_seen TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'reconnecting')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Device Pairing Codes Table
-- Stores short-lived codes used to authorize new devices.
CREATE TABLE IF NOT EXISTS public.device_pairing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pairing_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Device Capabilities Table
-- Registers what a specific device can actually do.
CREATE TABLE IF NOT EXISTS public.device_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    capability_id TEXT NOT NULL,
    granted BOOLEAN DEFAULT false,
    requires_confirmation BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(device_id, capability_id)
);

-- 4. RLS Policies

-- Enable RLS on all new tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_capabilities ENABLE ROW LEVEL SECURITY;

-- Devices: Users can only see and update their own devices
CREATE POLICY "Users can view their own devices"
ON public.devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
ON public.devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.devices FOR UPDATE
USING (auth.uid() = user_id);

-- Pairing Codes: Users can only see/manage their own pairing codes
CREATE POLICY "Users can view their own pairing codes"
ON public.device_pairing_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pairing codes"
ON public.device_pairing_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Capabilities: Users can view capabilities of their own devices
CREATE POLICY "Users can view their own device capabilities"
ON public.device_capabilities FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE id = device_id AND user_id = auth.uid()
    )
);

-- 5. Indices for performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_code ON public.device_pairing_codes(pairing_code);
CREATE INDEX IF NOT EXISTS idx_capabilities_device_id ON public.device_capabilities(device_id);
