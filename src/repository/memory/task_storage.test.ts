import { beforeEach, describe, expect, test } from "bun:test";
import { MemoryTaskStorage } from "./task_storage";

describe("MemoryTaskStorage", () => {
	let storage: MemoryTaskStorage;

	beforeEach(() => {
		storage = new MemoryTaskStorage();
	});

	test("creates a task with an id, created_at, and null updated_at", async () => {
		const task = await storage.createTask({ title: "Write docs", description: "desc", priority: "high", status: "todo" });

		expect(task.id).toBeTruthy();
		expect(task.created_at).toBeInstanceOf(Date);
		expect(task.updated_at).toBeNull();
	});

	test("getTask returns the stored task, or null when missing", async () => {
		const created = await storage.createTask({ title: "a", description: "", priority: "low", status: "todo" });

		expect(await storage.getTask(created.id)).toEqual(created);
		expect(await storage.getTask("00000000-0000-0000-0000-000000000000")).toBeNull();
	});

	test("getTasks filters by priority and status together", async () => {
		await storage.createTask({ title: "a", description: "", priority: "high", status: "todo" });
		await storage.createTask({ title: "b", description: "", priority: "high", status: "done" });
		await storage.createTask({ title: "c", description: "", priority: "low", status: "todo" });

		const tasks = await storage.getTasks({ priority: "high", status: "todo" });
		expect(tasks).toHaveLength(1);
		expect(tasks[0]?.title).toBe("a");
	});

	test("updateTask applies a partial update and bumps updated_at, or returns false when missing", async () => {
		const created = await storage.createTask({ title: "Write docs", description: "desc", priority: "high", status: "todo" });

		expect(await storage.updateTask(created.id, { status: "done" })).toBe(true);
		const task = await storage.getTask(created.id);
		expect(task?.status).toBe("done");
		expect(task?.title).toBe("Write docs");
		expect(task?.updated_at).toBeInstanceOf(Date);

		expect(await storage.updateTask("00000000-0000-0000-0000-000000000000", { status: "done" })).toBe(false);
	});

	test("deleteTask removes a task and is idempotent", async () => {
		const created = await storage.createTask({ title: "Write docs", description: "desc", priority: "high", status: "todo" });

		expect(await storage.deleteTask(created.id)).toBe(true);
		expect(await storage.getTask(created.id)).toBeNull();
		expect(await storage.deleteTask(created.id)).toBe(false);
	});
});
