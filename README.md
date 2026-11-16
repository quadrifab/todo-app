# Todo App with Express + SQLite

This project keeps the front-end to-do app and adds a simple backend API.

## How to run

1. Open the project folder in VS Code.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

4. Open this in your browser:

```text
http://localhost:3000
```

## What this project does

- Serves the to-do app at the root URL
- Stores tasks in a local SQLite database file called `todos.db`
- Supports:
  - read all tasks
  - add a task
  - update a task
  - delete a task
  - clear completed tasks

## API routes

- GET `/api/tasks`
- POST `/api/tasks`
- PUT `/api/tasks/:id`
- DELETE `/api/tasks/:id`
- POST `/api/tasks/clear-completed`

## Notes

The app keeps the data in a local file, so the tasks remain after restarting the server.
