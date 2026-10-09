/** The server's error message for a failed response, or a generic one. */
export async function readError(response: Response): Promise<string> {
    try {
        const body = (await response.json()) as { error?: string };
        return body.error ?? `Request failed (${response.status}).`;
    } catch {
        return `Request failed (${response.status}).`;
    }
}
