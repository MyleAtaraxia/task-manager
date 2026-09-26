import { beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { MemoryTaskStorage } from "../repository/memory/task_storage";
import { ApiError, internalError } from "../errors/api_error";
import type { ApiErrorBody } from "../errors/api_error";
import { registerHandlers } from "./tasks";

function buildApp(storage: TaskStorage) {
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
		const error = internalError();
		return c.json(error.toBody(), error.status);
	});

	return app;
}

describe("task routes", () => {
	let app: Hono<{ Variables: { storage: TaskStorage } }>;

	beforeEach(() => {
		app = buildApp(new MemoryTaskStorage());
	});

	test("POST /tasks creates a task", async () => {
		const res = await app.request("/tasks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Write docs",
				description: "desc",
				priority: "high",
				status: "todo",
			}),
		});

		expect(res.status).toBe(201);
		const body = (await res.json()) as Task;
		expect(body.title).toBe("Write docs");
		expect(body.id).toBeTruthy();
	});

	test("POST /tasks rejects invalid body with 422", async () => {
		const res = await app.request("/tasks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "" }),
		});

		expect(res.status).toBe(422);
		const body = (await res.json()) as ApiErrorBody;
		expect(body.error.field).toBe("title");
	});

	test("GET /tasks lists tasks and applies filters", async () => {
		await app.request("/tasks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "a",
				description: "",
				priority: "high",
				status: "todo",
			}),
		});
		await app.request("/tasks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "b",
				description: "",
				priority: "low",
				status: "todo",
			}),
		});

		const all = await app.request("/tasks");
		expect(all.status).toBe(200);
		expect((await all.json()) as Task[]).toHaveLength(2);

		const filtered = await app.request("/tasks?priority=high");
		const filteredBody = (await filtered.json()) as Task[];
		expect(filteredBody).toHaveLength(1);
		expect(filteredBody[0]?.title).toBe("a");
	});

	test("GET /tasks/:id returns the task or 404", async () => {
		const created = (await (
			await app.request("/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: "a",
					description: "",
					priority: "high",
					status: "todo",
				}),
			})
		).json()) as Task;

		const found = await app.request(`/tasks/${created.id}`);
		expect(found.status).toBe(200);

		const missing = await app.request(
			"/tasks/00000000-0000-0000-0000-000000000000",
		);
		expect(missing.status).toBe(404);
	});

	test("PATCH /tasks/:id updates the task, 404 when missing", async () => {
		const created = (await (
			await app.request("/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: "a",
					description: "",
					priority: "high",
					status: "todo",
				}),
			})
		).json()) as Task;

		const updated = await app.request(`/tasks/${created.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status: "done" }),
		});
		expect(updated.status).toBe(200);
		expect(((await updated.json()) as Task).status).toBe("done");

		const missing = await app.request(
			"/tasks/00000000-0000-0000-0000-000000000000",
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "done" }),
			},
		);
		expect(missing.status).toBe(404);
	});

	test("DELETE /tasks/:id removes the task and is idempotent", async () => {
		const created = (await (
			await app.request("/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: "a",
					description: "",
					priority: "high",
					status: "todo",
				}),
			})
		).json()) as Task;

		const deleted = await app.request(`/tasks/${created.id}`, {
			method: "DELETE",
		});
		expect(deleted.status).toBe(204);

		const again = await app.request(`/tasks/${created.id}`, {
			method: "DELETE",
		});
		expect(again.status).toBe(404);
	});

	test("unknown routes return a JSON 404", async () => {
		const res = await app.request("/no-such-route");
		expect(res.status).toBe(404);
		expect(res.headers.get("content-type")).toContain("application/json");
		const body = (await res.json()) as ApiErrorBody;
		expect(body.error.code).toBe("NOT_FOUND");
	});

	test("/tasks/ (trailing slash) returns a JSON 404", async () => {
		const res = await app.request("/tasks/");
		expect(res.status).toBe(404);
		const body = (await res.json()) as ApiErrorBody;
		expect(body.error.code).toBe("NOT_FOUND");
	});
});
