## Task Manager (PERN)

Tiny task manager: PostgreSQL + Express + React + Node, with JWT login.

## Run

1. Create a Postgres database:

   ```
   createdb taskmanager
   ```

2. Backend:

   ```
   cd server
   cp .env.example .env     # edit DATABASE_URL / JWT_SECRET if needed
   npm install
   npm start                # http://localhost:5000 (tables are created automatically)
   ```

3. Frontend (new terminal):
   ```
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```

Register an account, then add, complete (click a task), and delete tasks.

## API

| Method | Route          | Auth | Purpose                     |
| ------ | -------------- | ---- | --------------------------- |
| POST   | /api/register  | no   | Create account, returns JWT |
| POST   | /api/login     | no   | Log in, returns JWT         |
| GET    | /api/tasks     | yes  | List your tasks             |
| POST   | /api/tasks     | yes  | Add a task                  |
| PUT    | /api/tasks/:id | yes  | Toggle done                 |
| DELETE | /api/tasks/:id | yes  | Delete a task               |
