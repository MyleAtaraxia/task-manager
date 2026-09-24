class MemoryTaskStorage implements TaskStorage {
	private tasks = new Map<string, Task>();

	async createTask(task: CreateTask): Promise<Task> {
		const t: Task = {
			...task,
			id: crypto.randomUUID(),
			created_at: new Date(),
			updated_at: null,
		};
		this.tasks.set(t.id, t);
		return t;
	}

	async getTask(id: string): Promise<Task | null> {
		return this.tasks.get(id) ?? null;
	}

	async getTasks(filter: TaskFilter): Promise<Task[]> {
		if (!filter.priority && !filter.status) return [...this.tasks.values()];

		return [...this.tasks.values()].filter(
			(task) =>
				(!filter.priority || task.priority === filter.priority) &&
				(!filter.status || task.status === filter.status),
		);
	}

	async updateTask(id: string, task: CreateTask): Promise<boolean> {
		const existing = this.tasks.get(id);
		if (!existing) {
			return false;
		}

		Object.assign(existing, task, {
			updated_at: new Date(),
		});

		return true;
	}

	async deleteTask(id: string): Promise<boolean> {
		return this.tasks.delete(id);
	}
}
