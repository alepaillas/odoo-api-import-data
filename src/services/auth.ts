// src/services/auth.ts
import { ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD } from '../utils/env.ts';

if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_PASSWORD) {
    throw new Error('Missing environment variables');
}

interface AuthSession {
    sessionId: string;
    userId: number;
    isAuthenticated: boolean;
}

let currentSession: AuthSession | null = null;

export const authenticate = async (): Promise<AuthSession> => {
    // Return existing session if still valid
    if (currentSession?.isAuthenticated) {
        return currentSession;
    }

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

    if (!authResponse.ok || authData.error) {
        throw new Error('Authentication failed: ' + JSON.stringify(authData.error));
    }

    const userId: number = authData.result.uid;
    if (!userId) {
        throw new Error('No user ID found in the response');
    }

    // Extract session ID from the response headers
    const setCookieHeader = authResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
        throw new Error('No session ID found in the response headers');
    }

    const sessionId = setCookieHeader.split(';')[0].split('=')[1];
    if (!sessionId) {
        throw new Error('Failed to extract session ID');
    }

    // Cache the session
    currentSession = {
        sessionId,
        userId,
        isAuthenticated: true
    };

    return currentSession;
};

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (data: any) => {
    const session = await authenticate();

    const response = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `session_id=${session.sessionId}`,
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    // Handle session expiry
    if (result.error && result.error.code === 100) {
        console.log('Session expired, re-authenticating...');
        currentSession = null; // Clear expired session
        return makeAuthenticatedRequest(data); // Retry with new session
    }

    if (result.error) {
        throw new Error(`API Error: ${result.error.data?.message || result.error.message}`);
    }

    return result;
};

// Logout function
export const logout = async () => {
    if (currentSession) {
        try {
            await fetch(`${ODOO_URL}/web/session/destroy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `session_id=${currentSession.sessionId}`,
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    params: {},
                }),
            });
        } catch (error) {
            console.warn('Error during logout:', error);
        }
    }
    currentSession = null;
};