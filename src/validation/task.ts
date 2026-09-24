type ValidationResult<T> = { valid: true; data: T } | { valid: false; error: string };

const TASK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTaskId(value: string): boolean {
	return TASK_ID_PATTERN.test(value);
}

function isPriority(value: unknown): value is Priority {
	return value === "low" ||
		value === "medium" ||
		value === "high";
}

function isStatus(value: unknown): value is Status {
	return value === "todo" ||
		value === "in_progress" ||
		value === "done";
}

export function validateCreateTask(body: unknown): ValidationResult<CreateTask> {
	if (typeof body !== "object" || body === null) {
		return { valid: false, error: "Request body must be an object" };
	}

	const { title, description, priority, status } = body as Record<string, unknown>;

	if (typeof title !== "string" || title.trim().length === 0) {
		return { valid: false, error: "title is required and must be a non-empty string" };
	}
	if (description !== null && description !== undefined && typeof description !== "string") {
		return { valid: false, error: "description must be a string or null" };
	}
	if (!isPriority(priority)) {
		return { valid: false, error: "priority must be one of: low, medium, high" };
	}
	if (!isStatus(status)) {
		return { valid: false, error: "status must be one of: todo, in_progress, done" };
	}

	return { valid: true, data: { title, description: description??"", priority, status } };
}

export function validateTaskUpdate(body: unknown): ValidationResult<Partial<CreateTask>> {
	if (typeof body !== "object" || body === null) {
		return { valid: false, error: "Request body must be an object" };
	}

	const { title, description, priority, status } = body as Record<string, unknown>;
	const data: Partial<CreateTask> = {};

	if (title !== undefined) {
		if (typeof title !== "string" || title.trim().length === 0) {
			return { valid: false, error: "title must be a non-empty string" };
		}
		data.title = title;
	}

	if (description !== undefined) {
		if (description !== null && typeof description !== "string") {
			return { valid: false, error: "description must be a string or null" };
		}
		data.description = description ?? "";
	}

	if (priority !== undefined) {
		if (!isPriority(priority)) {
			return { valid: false, error: "priority must be one of: low, medium, high" };
		}
		data.priority = priority;
	}

	if (status !== undefined) {
		if (!isStatus(status)) {
			return { valid: false, error: "status must be one of: todo, in_progress, done" };
		}
		data.status = status;
	}

	if (Object.keys(data).length === 0) {
		return { valid: false, error: "At least one field must be provided" };
	}

	return { valid: true, data };
}

export function validateTaskFilter(query: { priority?: string; status?: string }): ValidationResult<TaskFilter> {
	const filter: TaskFilter = {};

	if (query.priority !== undefined) {
		if (!isPriority(query.priority)) {
			return { valid: false, error: "priority must be one of: low, medium, high" };
		}
		filter.priority = query.priority;
	}

	if (query.status !== undefined) {
		if (!isStatus(query.status)) {
			return { valid: false, error: "status must be one of: todo, in_progress, done" };
		}
		filter.status = query.status;
	}

	return { valid: true, data: filter };
}
