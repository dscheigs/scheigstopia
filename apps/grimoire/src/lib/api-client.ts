/** A request that came back non-2xx. `message` is safe to show to the user. */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/** The server's error message for a failed response, or a generic one. */
export async function readError(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as { error?: string };
        return body.error ?? `Request failed (${response.status}).`;
    } catch {
        return `Request failed (${response.status}).`;
    }
}

export type ApiInit = Omit<RequestInit, 'body'> & {
    /** Sent as a JSON body. */
    json?: unknown;
    /** Sent as-is, for non-JSON bodies such as a photo. */
    body?: RequestInit['body'];
};

/** Fetch and parse JSON, throwing an `ApiError` for any non-2xx response. */
export async function apiFetch<T>(
    input: string,
    { json, headers, body, ...init }: ApiInit = {}
): Promise<T> {
    const response = await fetch(input, {
        ...init,
        headers:
            json === undefined
                ? headers
                : { 'Content-Type': 'application/json', ...headers },
        body: json === undefined ? body : JSON.stringify(json),
    });
    if (!response.ok) {
        throw new ApiError(await readError(response), response.status);
    }
    return (await response.json()) as T;
}

export function isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
}
