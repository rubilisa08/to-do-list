# 할 일 목록 (Todo List) — Supabase 백엔드 튜토리얼

Supabase(Postgres + 자동 REST API)를 백엔드로 사용하는 순수 HTML/JS 할 일 목록 앱입니다.

## 사용 기술
- 프론트엔드: HTML / CSS / JavaScript (빌드 도구 없음)
- 백엔드: [Supabase](https://supabase.com) — DB, 인증, API를 무료로 제공하는 서비스
- 배포: GitHub Pages

## 로컬에서 실행하기
1. Supabase 프로젝트를 만들고 `setup.sql`을 SQL Editor에서 실행합니다.
2. `config.js`에 내 프로젝트의 Project URL과 anon public key를 채워 넣습니다.
3. `index.html`을 브라우저로 엽니다 (별도 서버 불필요).

## 개선한 부분
- 튜토리얼 기본 기능(추가/조회/완료 체크)에 더해 **삭제**와 **키워드 검색**을 직접 추가했습니다. 검색은 매 입력마다 DB를 다시 조회하지 않고, 이미 불러온 목록을 클라이언트에서 필터링하도록 구현했습니다.

## 배포 링크
- https://rubilisa08.github.io/to-do-list/

## 보안 체크
- **비밀값을 코드에 직접 안 적었는가?** `config.js`에 있는 값은 Supabase의 **anon public key**로, 애초에 브라우저에 노출되도록 설계된 키입니다 (실제 접근 제어는 키가 아니라 아래 RLS 정책이 담당). 진짜 비밀 키인 **service_role key**는 이 정도 권한을 우회할 수 있어서 절대 프론트엔드 코드에 넣지 않았습니다 — 필요했다면 Supabase Edge Function 같은 서버 쪽 코드에서만 써야 합니다.
- **검증을 백엔드에서 하는가?** `setup.sql`의 `check (char_length(trim(task)) > 0 and char_length(task) <= 200)` 제약으로, 브라우저의 `required` 속성을 우회해서 API를 직접 호출해도 빈 값이나 너무 긴 값은 DB가 거부합니다.
- **RLS를 켜고 정책을 넣었는가?** `alter table todos enable row level security`로 켜고, `anon` 역할에 대해 select/insert/update/delete를 명시적으로 허용하는 정책 4개를 넣었습니다. RLS를 안 켜면 anon key만으로 테이블 전체를 무제한 접근할 수 있어 위험합니다.
- **로그인 데이터에 인가가 들어가는가?** 이 앱은 로그인 없이 누구나 같은 목록을 보고 고치는 공개 데모라서 사용자별 인가는 적용하지 않았습니다 (의도적 범위 제한이지, 빠뜨린 게 아닙니다). 사용자별 할 일 목록으로 확장하려면 Supabase Auth로 로그인을 추가하고, `todos`에 `user_id` 컬럼을 두고 정책을 `using (auth.uid() = user_id)`로 바꾸면 됩니다.
- **무료 티어 한도를 아는가?** Supabase 무료 플랜은 프로젝트당 DB 500MB, 월 5GB 대역폭이 한도이고, 카드 등록 없이 시작하면 자동 과금 위험이 없습니다. 다만 무료 프로젝트는 1주일 이상 활동이 없으면 자동 일시정지되니, 오래 방치하면 다시 Resume 해줘야 합니다.
