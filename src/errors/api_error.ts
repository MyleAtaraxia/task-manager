export type ErrorCode =
	"BAD_REQUEST" | "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR";

export interface ApiErrorBody {
	error: {
		code: ErrorCode;
		message: string;
		field?: string;
	};
}

export class ApiError extends Error {
	readonly status: 400 | 404 | 422 | 500;
	readonly code: ErrorCode;
	readonly field?: string;

	constructor(
		status: 400 | 404 | 422 | 500,
		code: ErrorCode,
		message: string,
		field?: string,
	) {
		super(message);
		this.status = status;
		this.code = code;
		this.field = field;
	}

	toBody(): ApiErrorBody {
		return {
			error: {
				code: this.code,
				message: this.message,
				...(this.field ? { field: this.field } : {}),
			},
		};
	}
}

export function badRequest(message: string, field?: string): ApiError {
	return new ApiError(400, "BAD_REQUEST", message, field);
}

export function validationError(message: string, field?: string): ApiError {
	return new ApiError(422, "VALIDATION_ERROR", message, field);
}

export function notFound(message: string): ApiError {
	return new ApiError(404, "NOT_FOUND", message);
}

export function internalError(): ApiError {
	return new ApiError(
		500,
		"INTERNAL_SERVER_ERROR",
		"An unexpected error occurred",
	);
}
