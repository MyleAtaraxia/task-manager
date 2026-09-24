import { Hono } from "hono";
import { MemoryTaskStorage } from "./repository/memory/task_storage";
import { SqlTaskStorage } from "./repository/sql/task_storage";

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

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
