-- courses: SIT course catalog
create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  credits int not null,
  campus text check (campus in ('Toyosu', 'Omiya')),
  day_of_week text,
  period int,
  koma_su int default 1,
  created_at timestamptz default now()
);

-- schedules: saved course selections per user per semester
create table schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  semester text not null,
  course_ids uuid[] not null default '{}',
  ai_suggestion text,
  created_at timestamptz default now()
);

-- reviews: course ratings from students
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

-- RLS policies
alter table courses enable row level security;
alter table schedules enable row level security;
alter table reviews enable row level security;

create policy "courses are public" on courses for select using (true);

create policy "users manage own schedules" on schedules
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews are public" on reviews for select using (true);
create policy "users manage own reviews" on reviews
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- seed: sample courses
insert into courses (code, name, credits, campus, day_of_week, period) values
  ('CS101', 'Introduction to Programming', 2, 'Toyosu', 'Monday', 1),
  ('CS201', 'Data Structures', 2, 'Toyosu', 'Tuesday', 2),
  ('CS301', 'Algorithms', 2, 'Toyosu', 'Wednesday', 3),
  ('EE101', 'Circuit Theory', 2, 'Omiya', 'Thursday', 1),
  ('MATH101', 'Calculus I', 2, 'Toyosu', 'Friday', 2),
  ('CS401', 'Machine Learning', 2, 'Toyosu', 'Monday', 3),
  ('CS202', 'Database Systems', 2, 'Omiya', 'Tuesday', 1);
