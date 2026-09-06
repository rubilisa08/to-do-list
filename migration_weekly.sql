-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- 기존 todos 테이블에 "이 할 일이 속한 날짜" 컬럼을 추가합니다.

alter table todos
  add column task_date date not null default current_date;
