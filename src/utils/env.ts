// src/utils/env.ts
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Env {
    ODOO_URL: string;
    ODOO_DB: string;
    ODOO_USERNAME: string;
    ODOO_PASSWORD: string;
}

const getEnv = (): Env => {
    return {
        ODOO_URL: process.env.ODOO_URL || '',
        ODOO_DB: process.env.ODOO_DB || '',
        ODOO_USERNAME: process.env.ODOO_USERNAME || '',
        ODOO_PASSWORD: process.env.ODOO_PASSWORD || '',
    };
};

const env = getEnv();

export const {
    ODOO_URL,
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_PASSWORD,
} = env;
