const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3000;
const dbPath = path.join(__dirname, "todos.db");

app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error("Database connection failed:", error.message);
    return;
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      dueDate TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0
    )
  `);

  console.log("Database ready.");
});

function normalizeTodo(row) {
  return {
    id: row.id,
    text: row.text,
    dueDate: row.dueDate || "",
    priority: row.priority || "medium",
    completed: Boolean(row.completed)
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM todos ORDER BY id ASC", (error, rows) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(rows.map(normalizeTodo));
  });
});

app.post("/api/tasks", (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  const dueDate = req.body?.dueDate ?? "";
  const priority = req.body?.priority ?? "medium";

  if (!text) {
    return res.status(400).json({ error: "Task text is required." });
  }

  db.run(
    "INSERT INTO todos (text, dueDate, priority, completed) VALUES (?, ?, ?, 0)",
    [text, dueDate || "", priority || "medium"],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(201).json({
        id: this.lastID,
        text,
        dueDate: dueDate || "",
        priority: priority || "medium",
        completed: false
      });
    }
  );
});

app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const updates = [];
  const values = [];

  if (req.body.text !== undefined) {
    const text = String(req.body.text).trim();
    updates.push("text = ?");
    values.push(text);
  }

  if (req.body.dueDate !== undefined) {
    updates.push("dueDate = ?");
    values.push(req.body.dueDate || "");
  }

  if (req.body.priority !== undefined) {
    updates.push("priority = ?");
    values.push(req.body.priority || "medium");
  }

  if (req.body.completed !== undefined) {
    updates.push("completed = ?");
    values.push(req.body.completed ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No task fields were provided." });
  }

  values.push(id);

  db.run(
    `UPDATE todos SET ${updates.join(", ")} WHERE id = ?`,
    values,
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      db.get("SELECT * FROM todos WHERE id = ?", [id], (readError, row) => {
        if (readError) {
          return res.status(500).json({ error: readError.message });
        }

        if (!row) {
          return res.status(404).json({ error: "Task not found." });
        }

        res.json(normalizeTodo(row));
      });
    }
  );
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM todos WHERE id = ?", [id], function (error) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ deleted: this.changes > 0, id });
  });
});

app.post("/api/tasks/clear-completed", (req, res) => {
  db.run("DELETE FROM todos WHERE completed = 1", function (error) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    db.all("SELECT * FROM todos ORDER BY id ASC", (readError, rows) => {
      if (readError) {
        return res.status(500).json({ error: readError.message });
      }

      res.json(rows.map(normalizeTodo));
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
