const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const priorityInput = document.getElementById("todo-priority");
const list = document.getElementById("todo-list");
const count = document.getElementById("task-count");
const completedCount = document.getElementById("completed-count");
const clearCompletedButton = document.getElementById("clear-completed");
const themeButton = document.getElementById("theme-button");
const filterButtons = document.querySelectorAll(".filter-button");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const completionMessage = document.getElementById("completion-message");
const sortTasksSelect = document.getElementById("sort-tasks");

let todos = loadTodos();
let currentFilter = "all";
let currentSort = "manual";

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem("todos"));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function getPriorityValue(priority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function sortTodos(taskList) {
  const sorted = [...taskList];

  if (currentSort === "due-date") {
    return sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  if (currentSort === "priority") {
    return sorted.sort((a, b) => {
      return getPriorityValue(b.priority) - getPriorityValue(a.priority);
    });
  }

  return sorted;
}

function updateProgress() {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  progressBar.parentElement.setAttribute("aria-valuenow", String(percent));

  if (total === 0) {
    completionMessage.textContent = "You’ve got this!";
    return;
  }

  if (completed === total) {
    completionMessage.textContent = "Everything is done!";
  } else {
    completionMessage.textContent = "You’ve got this!";
  }
}

function renderTodos() {
  list.replaceChildren();

  const filteredTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.completed;
    if (currentFilter === "completed") return todo.completed;
    return true;
  });

  const visibleTodos = sortTodos(filteredTodos);

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const doneCount = todos.filter((todo) => todo.completed).length;

  count.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"} left`;
  completedCount.textContent = `${doneCount} completed`;

  if (visibleTodos.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-message";
    message.textContent =
      todos.length === 0
        ? "No tasks yet. Add one above!"
        : "No tasks in this view.";
    list.appendChild(message);
    updateProgress();
    return;
  }

  visibleTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";

    if (todo.completed) {
      item.classList.add("completed");
    }

    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (todo.dueDate && !todo.completed && todo.dueDate < todayString) {
      item.classList.add("overdue");
    }

    if (todo.dueDate && !todo.completed && todo.dueDate === todayString) {
      item.classList.add("due-today");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.addEventListener("change", () => {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const details = document.createElement("div");
    details.className = "todo-details";

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const meta = document.createElement("div");
    meta.className = "todo-meta";

    if (todo.dueDate) {
      const dueDate = document.createElement("span");
      dueDate.className = "due-date";

      const [year, month, day] = todo.dueDate.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      if (!todo.completed && todo.dueDate < todayString) {
        dueDate.textContent = `Overdue · ${date.toLocaleDateString()}`;
      } else if (!todo.completed && todo.dueDate === todayString) {
        dueDate.textContent = "Due today";
      } else {
        dueDate.textContent = `Due ${date.toLocaleDateString()}`;
      }

      meta.appendChild(dueDate);
    }

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${todo.priority || "medium"}`;
    priorityBadge.textContent =
      todo.priority === "high"
        ? "High"
        : todo.priority === "low"
          ? "Low"
          : "Medium";

    meta.appendChild(priorityBadge);

    details.append(text, meta);

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      const updatedText = window.prompt("Edit task:", todo.text);

      if (updatedText === null) return;

      const trimmed = updatedText.trim();
      if (!trimmed) return;

      todo.text = trimmed;
      saveTodos();
      renderTodos();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      todos = todos.filter((task) => task.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    actions.append(editButton, deleteButton);

    item.append(checkbox, details, actions);
    list.appendChild(item);
  });

  updateProgress();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const newTodo = {
    id: `${Date.now()}-${Math.random()}`,
    text,
    dueDate: dateInput.value || "",
    priority: priorityInput.value || "medium",
    completed: false
  };

  todos.push(newTodo);
  saveTodos();
  renderTodos();

  input.value = "";
  dateInput.value = "";
  priorityInput.value = "medium";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
    });

    renderTodos();
  });
});

clearCompletedButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
});

sortTasksSelect.addEventListener("change", (event) => {
  currentSort = event.target.value;
  renderTodos();
});

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("todo-theme", theme);
  themeButton.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
}

themeButton.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

const savedTheme = localStorage.getItem("todo-theme");
setTheme(savedTheme === "dark" ? "dark" : "light");

renderTodos();