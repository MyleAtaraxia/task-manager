import type { Context, Hono } from "hono";
import { badRequest, notFound } from "../errors/api_error";
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

function requireTaskId(c: IdContext): string {
	const id = c.req.param("id");
	if (!isTaskId(id)) {
		throw badRequest("id must be a valid task id", "id");
	}
	return id;
}

async function createTask(c: ListContext) {
	const body = await c.req.json().catch(() => null);
	const data = validateCreateTask(body);
	const task = await c.get("storage").createTask(data);
	return c.json(task, 201);
}

async function getTasks(c: ListContext) {
	const filter = validateTaskFilter({
		priority: c.req.query("priority"),
		status: c.req.query("status"),
	});
	const tasks = await c.get("storage").getTasks(filter);
	return c.json(tasks);
}

async function getTask(c: IdContext) {
	const id = requireTaskId(c);

	const task = await c.get("storage").getTask(id);
	if (!task) {
		throw notFound("Task not found");
	}

	return c.json(task);
}

async function updateTask(c: IdContext) {
	const id = requireTaskId(c);

	const body = await c.req.json().catch(() => null);
	const data = validateTaskUpdate(body);

	const storage = c.get("storage");
	const updated = await storage.updateTask(id, data);
	if (!updated) {
		throw notFound("Task not found");
	}

	const task = await storage.getTask(id);
	return c.json(task);
}

async function deleteTask(c: IdContext) {
	const id = requireTaskId(c);

	const deleted = await c.get("storage").deleteTask(id);
	if (!deleted) {
		throw notFound("Task not found");
	}

	return c.body(null, 204);
}
