import { describe, expect, test } from "bun:test";
import { ApiError } from "../errors/api_error";
import { isTaskId, validateCreateTask, validateTaskFilter, validateTaskUpdate } from "./task";

function expectApiError(fn: () => unknown, status: 400 | 404 | 422 | 500): void {
	let caught: unknown;
	try {
		fn();
	} catch (err) {
		caught = err;
	}

	expect(caught).toBeInstanceOf(ApiError);
	expect((caught as ApiError).status).toBe(status);
}

describe("validateCreateTask", () => {
	test("accepts a well-formed task", () => {
		const data = validateCreateTask({ title: "Write docs", description: "desc", priority: "high", status: "todo" });
		expect(data).toEqual({ title: "Write docs", description: "desc", priority: "high", status: "todo" });
	});

	test("rejects a non-object body", () => {
		expectApiError(() => validateCreateTask(null), 400);
	});

	test("rejects an invalid field", () => {
		expectApiError(() => validateCreateTask({ title: "t", description: "d", priority: "urgent", status: "todo" }), 422);
	});
});

describe("validateTaskUpdate", () => {
	test("accepts a partial patch", () => {
		expect(validateTaskUpdate({ status: "done" })).toEqual({ status: "done" });
	});

	test("rejects an empty patch", () => {
		expectApiError(() => validateTaskUpdate({}), 422);
	});
});

describe("validateTaskFilter", () => {
	test("passes through a valid filter", () => {
		expect(validateTaskFilter({ priority: "high", status: "todo" })).toEqual({ priority: "high", status: "todo" });
	});

	test("rejects an invalid value", () => {
		expectApiError(() => validateTaskFilter({ priority: "urgent" }), 422);
	});
});

describe("isTaskId", () => {
	test("accepts a well-formed uuid, rejects anything else", () => {
		expect(isTaskId("1e3b41b3-e433-4317-99e9-b134b91f17a6")).toBe(true);
		expect(isTaskId("not-a-uuid")).toBe(false);
	});
});
