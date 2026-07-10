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
  description text,
  learning_goals text[] default '{}',
  prerequisites text[] default '{}',
  assessment jsonb,
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
-- user_id is set to null (not deleted) when the account is removed,
-- so reviews remain visible to other students anonymously.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  course_id uuid references courses(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

-- completed_courses: a student's taken courses, with grade/semester for GPA tracking
create table completed_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  grade text,
  semester text,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

-- RLS policies
alter table courses enable row level security;
alter table schedules enable row level security;
alter table reviews enable row level security;
alter table completed_courses enable row level security;

create policy "courses are public" on courses for select using (true);

create policy "users manage own schedules" on schedules
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews are public" on reviews for select using (true);
create policy "users manage own reviews" on reviews
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own completed courses" on completed_courses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- seed: sample courses with detailed syllabus
insert into courses (code, name, credits, campus, day_of_week, period, description, learning_goals, prerequisites, assessment) values
  ('CS101', 'Introduction to Programming', 2, 'Toyosu', 'Monday', 1, 
   'Foundations of programming using Python. Covers variables, loops, functions, and basic data structures.', 
   ARRAY['Understand basic programming logic', 'Write Python scripts', 'Debug simple programs'], 
   ARRAY[]::text[], 
   '{"exam": 60, "assignments": 40}'),
  
  ('CS201', 'Data Structures', 2, 'Toyosu', 'Tuesday', 2, 
   'Study of fundamental data structures including lists, stacks, queues, trees, and graphs.', 
   ARRAY['Implement linked lists and binary trees', 'Understand time complexity (Big O)', 'Select appropriate data structures for problems'], 
   ARRAY['CS101'], 
   '{"exam": 50, "projects": 50}'),
  
  ('CS301', 'Algorithms', 2, 'Toyosu', 'Wednesday', 3, 
   'Analysis and design of efficient algorithms. Sorting, searching, and dynamic programming.', 
   ARRAY['Analyze algorithm efficiency', 'Implement sorting algorithms', 'Apply dynamic programming to problems'], 
   ARRAY['CS201'], 
   '{"exam": 70, "quizzes": 30}'),
  
  ('CS401', 'Machine Learning', 2, 'Toyosu', 'Monday', 3, 
   'Introduction to supervised and unsupervised learning algorithms.', 
   ARRAY['Implement linear regression', 'Understand neural networks', 'Evaluate model performance'], 
   ARRAY['CS301', 'MATH101'], 
   '{"exam": 40, "projects": 60}'),

  ('MATH101', 'Calculus I', 2, 'Toyosu', 'Friday', 2, 
   'Basic differential and integral calculus.', 
   ARRAY['Calculate derivatives', 'Understand limits', 'Solve integration problems'], 
   ARRAY[]::text[], 
   '{"exam": 80, "homework": 20}'),

  ('EE101', 'Circuit Theory', 2, 'Omiya', 'Thursday', 1,
   'Introduction to electrical circuits and network analysis.',
   ARRAY['Apply circuit laws', 'Analyze basic electrical networks'],
   ARRAY[]::text[],
   '{"exam": 70, "assignments": 30}'),

  ('CS202', 'Database Systems', 2, 'Omiya', 'Tuesday', 1,
   'Foundations of relational databases, SQL, and data modeling.',
   ARRAY['Design relational schemas', 'Write SQL queries', 'Understand transactions'],
   ARRAY['CS101'],
   '{"exam": 50, "projects": 50}');
