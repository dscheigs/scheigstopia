import { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { BASE_PATH } from '@/lib/basePath';

/**
 * Next strips its base path from the URL it gives route handlers, but Auth.js
 * is configured with the full path (`/grimoire/api/auth`) and rejects anything
 * else as UnknownAction. Put the base path back before handing the request over.
 */
function withBasePathRestored(
    handler: (request: NextRequest) => Promise<Response>
) {
    return (request: NextRequest) => {
        const url = new URL(request.url);
        if (BASE_PATH && !url.pathname.startsWith(`${BASE_PATH}/`)) {
            url.pathname = `${BASE_PATH}${url.pathname}`;
            return handler(new NextRequest(url, request));
        }
        return handler(request);
    };
}

export const GET = withBasePathRestored(handlers.GET);
export const POST = withBasePathRestored(handlers.POST);
