CREATE TABLE IF NOT EXISTS tasks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
	status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ
)
