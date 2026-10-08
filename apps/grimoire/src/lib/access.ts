/**
 * The sign-in gate: only the GitHub account whose numeric id is in
 * ALLOWED_GITHUB_ID may sign in. Fails closed: a missing or malformed
 * setting allows nobody.
 */
export function isAllowedGithubUser(
    githubId: unknown,
    allowedId: string | undefined
): boolean {
    if (!allowedId || !/^\d+$/.test(allowedId.trim())) return false;
    const allowed = Number(allowedId.trim());
    if (!Number.isSafeInteger(allowed) || allowed <= 0) return false;

    const id =
        typeof githubId === 'string' && /^\d+$/.test(githubId)
            ? Number(githubId)
            : githubId;
    return typeof id === 'number' && Number.isSafeInteger(id) && id === allowed;
}
