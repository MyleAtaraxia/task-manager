interface CreateTask {
	title: string;
	description: string;
	priority: Priority;
	status: Status;
}

interface Task extends CreateTask {
	id: string;
	created_at: Date;
	updated_at: Date | null;
}

interface TaskFilter {
	priority?: Priority;
	status?: Status;
}

type Priority = "low" | "medium" | "high";

type Status = "todo" | "in_progress" | "done";
