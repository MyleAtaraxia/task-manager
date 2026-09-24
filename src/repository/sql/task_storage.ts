import { sql } from "bun";

export class SqlTaskStorage implements TaskStorage {
	async init(): Promise<void> {
		await sql.file(`${import.meta.dir}/schema.sql`);
	}

	async createTask(task: CreateTask): Promise<Task> {
		const [row] = await sql`
			INSERT INTO tasks ${sql(task)}
			RETURNING *
		`;
		return row as Task;
	}

	async getTask(id: string): Promise<Task | null> {
		const [row] = await sql`SELECT * FROM tasks WHERE id = ${id}`;
		return (row as Task) ?? null;
	}

	async getTasks(filter: TaskFilter): Promise<Task[]> {
		return sql`
			SELECT * FROM tasks
			WHERE 1 = 1
			${filter.priority ? sql`AND priority = ${filter.priority}` : sql``}
			${filter.status ? sql`AND status = ${filter.status}` : sql``}
		`;
	}

	async updateTask(id: string, task: Partial<CreateTask>): Promise<boolean> {
		const rows = await sql`
			UPDATE tasks SET ${sql(task)}, updated_at = now()
			WHERE id = ${id}
			RETURNING id
		`;
		return rows.length > 0;
	}

	async deleteTask(id: string): Promise<boolean> {
		const rows = await sql`DELETE FROM tasks WHERE id = ${id} RETURNING id`;
		return rows.length > 0;
	}
}
