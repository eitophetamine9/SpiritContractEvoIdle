-- =========================================================================
-- Dev & Admin Account Provisioning Script
-- Email: admin@email.com
-- Password: x@DM1N
-- Safe to re-run multiple times (Idempotent)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  encrypted_pw TEXT;
BEGIN
  -- Generate bcrypt hash of 'x@DM1N'
  encrypted_pw := crypt('x@DM1N', gen_salt('bf'));

  -- 1. Insert or update auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    'admin@email.com',
    encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    '{"username":"AdminDev","role":"admin","isDev":true}'::jsonb,
    NOW(),
    NOW(),
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = encrypted_pw,
    email_confirmed_at = NOW(),
    raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    raw_user_meta_data = '{"username":"AdminDev","role":"admin","isDev":true}'::jsonb;

  -- 2. Insert or update auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    admin_user_id,
    format('{"sub":"%s","email":"%s"}', admin_user_id, 'admin@email.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, id) DO NOTHING;

  -- 3. Insert or update public.profiles
  INSERT INTO public.profiles (
    id,
    username,
    contractor_level,
    contractor_xp,
    avatar_emoji,
    created_at,
    last_login
  ) VALUES (
    admin_user_id,
    'AdminDev [DEV]',
    99,
    9999999,
    '⚡',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = 'AdminDev [DEV]',
    contractor_level = 99,
    avatar_emoji = '⚡',
    last_login = NOW();

  -- 4. Insert or update public.leaderboards
  INSERT INTO public.leaderboards (
    user_id,
    username,
    avatar_emoji,
    contractor_level,
    highest_stage,
    total_party_power,
    total_spirits_contracted,
    updated_at
  ) VALUES (
    admin_user_id,
    'AdminDev [DEV]',
    '⚡',
    99,
    100,
    999999,
    54,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = 'AdminDev [DEV]',
    contractor_level = 99,
    highest_stage = 100,
    total_party_power = 999999,
    total_spirits_contracted = 54,
    updated_at = NOW();

  RAISE NOTICE 'Admin Dev account (admin@email.com) created/updated successfully!';
END $$;
