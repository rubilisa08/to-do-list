// Supabase 클라이언트 생성 — 이 client 객체로 DB에 있는 "todos" 테이블에 접근합니다.
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const daySelect = document.getElementById("day-select");
const searchInput = document.getElementById("search-input");
const grid = document.getElementById("week-grid");
const heading = document.getElementById("week-heading");

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// 검색은 매번 DB에 물어보지 않고, 마지막으로 불러온 목록을 그대로 필터링
let currentTodos = [];
let weekDates = []; // 이번 주 월~일, "YYYY-MM-DD" 문자열 7개

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 오늘 기준 이번 주 월요일~일요일 날짜를 계산
function getWeekDates() {
  const today = new Date();
  const diffToMonday = (today.getDay() + 6) % 7; // 일=0 ... 토=6 → 월요일까지 거리
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toISODate(d));
  }
  return dates;
}

// 화면에 쓸 "9/8" 같은 짧은 날짜 라벨
function shortLabel(isoDate) {
  const [, m, d] = isoDate.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function setupWeek() {
  weekDates = getWeekDates();
  heading.textContent = `주간 목록 (${shortLabel(weekDates[0])} ~ ${shortLabel(weekDates[6])})`;

  daySelect.innerHTML = weekDates
    .map((iso, i) => `<option value="${iso}">${DAY_LABELS[i]} ${shortLabel(iso)}</option>`)
    .join("");

  const today = toISODate(new Date());
  if (weekDates.includes(today)) daySelect.value = today;

  grid.innerHTML = weekDates
    .map(
      (iso, i) => `
      <section class="day-col" data-date="${iso}">
        <header class="day-col-header${iso === today ? " today" : ""}">
          <span class="day-name">${DAY_LABELS[i]}</span>
          <span class="day-date">${shortLabel(iso)}</span>
        </header>
        <ul class="day-list" data-date="${iso}"></ul>
      </section>`
    )
    .join("");
}

// 1) 읽기(Read): 이번 주(월~일) 범위의 행만 가져옴
async function loadTodos() {
  const { data, error } = await client
    .from("todos")
    .select("*")
    .gte("task_date", weekDates[0])
    .lte("task_date", weekDates[6])
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }
  currentTodos = data;
  renderTodos(filterTodos(currentTodos, searchInput.value));
}

function filterTodos(todos, keyword) {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return todos;
  return todos.filter((todo) => todo.task.toLowerCase().includes(trimmed));
}

function renderTodos(todos) {
  const byDate = new Map(weekDates.map((iso) => [iso, []]));
  for (const todo of todos) {
    if (byDate.has(todo.task_date)) byDate.get(todo.task_date).push(todo);
  }

  for (const iso of weekDates) {
    const listEl = grid.querySelector(`.day-list[data-date="${iso}"]`);
    listEl.innerHTML = "";

    const items = byDate.get(iso);
    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = searchInput.value.trim() ? "검색 결과 없음" : "-";
      listEl.appendChild(empty);
      continue;
    }

    for (const todo of items) {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.is_complete ? " done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.is_complete;
      checkbox.addEventListener("change", () => toggleComplete(todo.id, checkbox.checked));

      const span = document.createElement("span");
      span.textContent = todo.task;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    }
  }
}

// 2) 쓰기(Create): 선택한 날짜에 새 행을 삽입
async function addTodo(task, taskDate) {
  const { error } = await client.from("todos").insert({ task, task_date: taskDate });
  if (error) {
    console.error(error);
    return;
  }
  await loadTodos();
}

// 3) 수정(Update): 완료 여부를 토글
async function toggleComplete(id, isComplete) {
  const { error } = await client
    .from("todos")
    .update({ is_complete: isComplete })
    .eq("id", id);

  if (error) console.error(error);
  await loadTodos();
}

// 4) 삭제(Delete): 행을 하나 지움
async function deleteTodo(id) {
  const { error } = await client.from("todos").delete().eq("id", id);
  if (error) console.error(error);
  await loadTodos();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const task = input.value.trim();
  if (!task) return;
  input.value = "";
  await addTodo(task, daySelect.value);
});

searchInput.addEventListener("input", () => {
  renderTodos(filterTodos(currentTodos, searchInput.value));
});

setupWeek();
loadTodos();
