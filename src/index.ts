import { Hono } from "hono";
import { MemoryTaskStorage } from "./repository/memory/task_storage";
import { SqlTaskStorage } from "./repository/sql/task_storage";
import { registerHandlers } from "./handlers/tasks";
import { ApiError, internalError } from "./errors/api_error";

let storage: TaskStorage;

if (process.env.TASK_API_STORAGE === "pgsql") {
	const sqlStorage = new SqlTaskStorage();
	await sqlStorage.init();
	storage = sqlStorage;
} else {
	storage = new MemoryTaskStorage();
}

const app = new Hono<{ Variables: { storage: TaskStorage } }>();

app.use("*", async (c, next) => {
	c.set("storage", storage);
	await next();
});

registerHandlers(app);

app.notFound((c) => {
	return c.json({ error: { code: "NOT_FOUND", message: "Not Found" } }, 404);
});

app.onError((err, c) => {
	if (err instanceof ApiError) {
		return c.json(err.toBody(), err.status);
	}

	console.error(err);
	const error = internalError();
	return c.json(error.toBody(), error.status);
});

export default app;
