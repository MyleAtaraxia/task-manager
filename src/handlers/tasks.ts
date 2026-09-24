import type { Context, Hono } from "hono";
import { isTaskId, validateCreateTask, validateTaskFilter, validateTaskUpdate } from "../validation/task";

type AppEnv = { Variables: { storage: TaskStorage } };
type App = Hono<AppEnv>;
type ListContext = Context<AppEnv, "/tasks">;
type IdContext = Context<AppEnv, "/tasks/:id">;

export function registerHandlers(app: App): void {
	app.post("/tasks", createTask);
	app.get("/tasks", getTasks);
	app.get("/tasks/:id", getTask);
	app.patch("/tasks/:id", updateTask);
	app.delete("/tasks/:id", deleteTask);
}

async function createTask(c: ListContext) {
	const body = await c.req.json().catch(() => null);
	const result = validateCreateTask(body);
	if (!result.valid) {
		return c.json({ error: result.error }, 400);
	}

	const task = await c.get("storage").createTask(result.data);
	return c.json(task, 201);
}

async function getTasks(c: ListContext) {
	const result = validateTaskFilter({
		priority: c.req.query("priority"),
		status: c.req.query("status"),
	});
	if (!result.valid) {
		return c.json({ error: result.error }, 400);
	}

	const tasks = await c.get("storage").getTasks(result.data);
	return c.json(tasks);
}

async function getTask(c: IdContext) {
	const id = c.req.param("id");
	if (!isTaskId(id)) {
		return c.json({ error: "Invalid task id" }, 400);
	}

	const task = await c.get("storage").getTask(id);
	if (!task) {
		return c.json({ error: "Task not found" }, 404);
	}

	return c.json(task);
}

async function updateTask(c: IdContext) {
	const id = c.req.param("id");
	if (!isTaskId(id)) {
		return c.json({ error: "Invalid task id" }, 400);
	}

	const body = await c.req.json().catch(() => null);
	const result = validateTaskUpdate(body);
	if (!result.valid) {
		return c.json({ error: result.error }, 400);
	}

	const storage = c.get("storage");
	const updated = await storage.updateTask(id, result.data);
	if (!updated) {
		return c.json({ error: "Task not found" }, 404);
	}

	const task = await storage.getTask(id);
	return c.json(task);
}

async function deleteTask(c: IdContext) {
	const id = c.req.param("id");
	if (!isTaskId(id)) {
		return c.json({ error: "Invalid task id" }, 400);
	}

	const deleted = await c.get("storage").deleteTask(id);
	if (!deleted) {
		return c.json({ error: "Task not found" }, 404);
	}

	return c.body(null, 204);
}
