interface TaskStorage {
	createTask(task: CreateTask): Promise<Task>;
	getTask(id: string): Promise<Task | null>;
	getTasks(filter: TaskFilter): Promise<Task[]>;
	updateTask(id: string, task: Partial<CreateTask>): Promise<boolean>;
	deleteTask(id: string): Promise<boolean>;
}
