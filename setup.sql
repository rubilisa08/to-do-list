-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- 이미 todos 테이블이 있는 프로젝트라면 이 파일 대신 migration_weekly.sql만 실행하세요.

create table todos (
  id bigint generated always as identity primary key,
  task text not null check (char_length(trim(task)) > 0 and char_length(task) <= 200),
  is_complete boolean default false,
  task_date date not null default current_date,
  created_at timestamptz default now()
);

-- RLS(Row Level Security)를 켜서 "정책을 명시적으로 허용한 요청만" 통과시킵니다.
alter table todos enable row level security;

-- 이 튜토리얼은 로그인 기능이 없는 공개 데모이므로,
-- anon(비로그인) 키로도 읽기/쓰기가 가능하도록 정책을 둡니다.
-- (실제 서비스라면 auth.uid() 기반으로 "내 데이터만" 보이게 제한해야 합니다.)
create policy "anyone can read todos"
  on todos for select
  to anon
  using (true);

create policy "anyone can insert todos"
  on todos for insert
  to anon
  with check (true);

create policy "anyone can update todos"
  on todos for update
  to anon
  using (true);

create policy "anyone can delete todos"
  on todos for delete
  to anon
  using (true);
