-- Create rooms table for chat rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text default 'SiX Room',
  creator_ip text not null,
  guest_ip text,
  status text default 'active' check (status in ('active', 'inactive', 'closed')),
  last_activity_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  closes_at timestamp with time zone default (now() + interval '6 days')
);

-- Create messages table for chat messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_ip text not null,
  content text not null,
  is_read boolean default false,
  read_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.rooms enable row level security;
alter table public.messages enable row level security;

-- RLS Policies for rooms - allow public access for MVP (anonymous users)
create policy "Allow public to create rooms" on public.rooms
  for insert with check (true);

create policy "Allow public to read rooms" on public.rooms
  for select using (true);

create policy "Allow public to update rooms" on public.rooms
  for update using (true);

-- RLS Policies for messages
create policy "Allow public to create messages" on public.messages
  for insert with check (true);

create policy "Allow public to read messages in room" on public.messages
  for select using (true);

create policy "Allow public to update messages" on public.messages
  for update using (true);

create policy "Allow public to delete expired messages" on public.messages
  for delete using (true);

-- Enable Realtime for messages table
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rooms;
