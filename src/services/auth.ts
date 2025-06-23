// src/index.ts
import { ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD } from '../utils/env.ts';

if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
    throw new Error('Missing environment variables');
}

export const authenticate = async () => {
    const authResponse = await fetch(`${ODOO_URL}/web/session/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            params: {
                db: ODOO_DB,
                login: ODOO_USERNAME,
                password: ODOO_PASSWORD,
            },
        }),
    });

    const authData = await authResponse.json();
    //console.log('Authentication Response:', authData);
    // Check if authentication was successful
    if (!authResponse.ok || authData.error) {
        throw new Error('Authentication failed: ' + JSON.stringify(authData.error));
    }

    const userId: number = authData.result.uid
    if (!userId) {
        throw new Error('No user ID found in the response')
    }

    // Extract session ID from the response headers
    const setCookieHeader = authResponse.headers.get('set-cookie');
    //console.log('Set-Cookie Header:', setCookieHeader);
    if (!setCookieHeader) {
        throw new Error('No session ID found in the response headers');
    }

    const sessionId = setCookieHeader.split(';')[0].split('=')[1];
    //console.log('Session ID:', sessionId);
    if (!sessionId) {
        throw new Error('Failed to extract session ID');
    }

    return { sessionId: sessionId, userId: userId }
}
