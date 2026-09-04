// Supabase 클라이언트 생성 — 이 client 객체로 DB에 있는 "todos" 테이블에 접근합니다.
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const searchInput = document.getElementById("search-input");
const list = document.getElementById("todo-list");

// 검색은 매번 DB에 물어보지 않고, 마지막으로 불러온 목록을 그대로 필터링
let currentTodos = [];

// 1) 읽기(Read): 테이블의 모든 행을 최신순으로 가져옴
async function loadTodos() {
  const { data, error } = await client
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

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
  list.innerHTML = "";

  if (todos.length === 0) {
    list.innerHTML = `<li class="empty">${
      searchInput.value.trim() ? "검색 결과가 없어요" : "아직 할 일이 없어요"
    }</li>`;
    return;
  }

  for (const todo of todos) {
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
    list.appendChild(li);
  }
}

// 2) 쓰기(Create): 새 행을 삽입
async function addTodo(task) {
  const { error } = await client.from("todos").insert({ task });
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
  await addTodo(task);
});

searchInput.addEventListener("input", () => {
  renderTodos(filterTodos(currentTodos, searchInput.value));
});

loadTodos();
