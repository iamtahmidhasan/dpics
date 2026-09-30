import "server-only"

import { NextResponse } from "next/server"

export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

/**
 * Error carrying an HTTP status so route handlers never leak raw exceptions
 * (and their internals) back to the client.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message)
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError(403, "FORBIDDEN", message)
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, "BAD_REQUEST", message)
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message)
  }
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    )
  }

  console.error("[api] unhandled error", error)

  return NextResponse.json(
    { error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" } },
    { status: 500 }
  )
}
