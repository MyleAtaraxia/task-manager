import { badRequest, validationError } from "../errors/api_error";

const TASK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTaskId(value: string): boolean {
	return TASK_ID_PATTERN.test(value);
}

function isPriority(value: unknown): value is Priority {
	return value === "low" || value === "medium" || value === "high";
}

function isStatus(value: unknown): value is Status {
	return value === "todo" || value === "in_progress" || value === "done";
}

export function validateCreateTask(body: unknown): CreateTask {
	if (typeof body !== "object" || body === null) {
		throw badRequest("Request body must be a JSON object");
	}

	const { title, description, priority, status } = body as Record<string, unknown>;

	if (typeof title !== "string" || title.trim().length === 0) {
		throw validationError("title is required and must be a non-empty string", "title");
	}
	if (description !== null && description !== undefined && typeof description !== "string") {
		throw validationError("description must be a string or null", "description");
	}
	if (!isPriority(priority)) {
		throw validationError("priority must be one of: low, medium, high", "priority");
	}
	if (!isStatus(status)) {
		throw validationError("status must be one of: todo, in_progress, done", "status");
	}

	return { title, description: description ?? "", priority, status };
}

export function validateTaskUpdate(body: unknown): Partial<CreateTask> {
	if (typeof body !== "object" || body === null) {
		throw badRequest("Request body must be a JSON object");
	}

	const { title, description, priority, status } = body as Record<string, unknown>;
	const data: Partial<CreateTask> = {};

	if (title !== undefined) {
		if (typeof title !== "string" || title.trim().length === 0) {
			throw validationError("title must be a non-empty string", "title");
		}
		data.title = title;
	}

	if (description !== undefined) {
		if (description !== null && typeof description !== "string") {
			throw validationError("description must be a string or null", "description");
		}
		data.description = description ?? "";
	}

	if (priority !== undefined) {
		if (!isPriority(priority)) {
			throw validationError("priority must be one of: low, medium, high", "priority");
		}
		data.priority = priority;
	}

	if (status !== undefined) {
		if (!isStatus(status)) {
			throw validationError("status must be one of: todo, in_progress, done", "status");
		}
		data.status = status;
	}

	if (Object.keys(data).length === 0) {
		throw validationError("At least one field must be provided");
	}

	return data;
}

export function validateTaskFilter(query: { priority?: string; status?: string }): TaskFilter {
	const filter: TaskFilter = {};

	if (query.priority !== undefined) {
		if (!isPriority(query.priority)) {
			throw validationError("priority must be one of: low, medium, high", "priority");
		}
		filter.priority = query.priority;
	}

	if (query.status !== undefined) {
		if (!isStatus(query.status)) {
			throw validationError("status must be one of: todo, in_progress, done", "status");
		}
		filter.status = query.status;
	}

	return filter;
}
