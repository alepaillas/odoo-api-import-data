// src/services/partner.ts
import { makeAuthenticatedRequest } from './auth.ts';
import type { CreatePartnerType } from './interfaces/partner.ts';

export async function findPartner(rut: string): Promise<number | null> {
    try {
        const searchData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'res.partner',
                method: 'search',
                args: [[['l10n_latam_identification_type_id', '=', rut]]],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(searchData);

        console.log('Search result:', JSON.stringify(result, null, 2));

        if (!result.result) {
            console.log('No result property found');
            return null;
        }

        if (!Array.isArray(result.result)) {
            console.log('Result is not an array:', typeof result.result);
            return null;
        }

        if (result.result.length === 0) {
            console.log('No partners found with RUT:', rut);
            return null;
        }

        return result.result[0];

    } catch (error) {
        console.error('Error finding partner:', error);
        console.error('RUT searched:', rut);
        throw error;
    }
}

export async function createPartner(partner: CreatePartnerType): Promise<number> {
    try {
        const createData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'res.partner',
                method: 'create',
                args: [{
                    name: partner.name,
                    l10n_latam_identification_type_id: partner.l10n_latam_identification_type_id,
                    company_type: partner.company_type,
                    city: partner.city,
                    country_id: partner.country_id,
                    state_id: partner.state_id,
                    street: partner.street,
                    l10n_cl_activity_description: partner.l10n_cl_activity_description,
                    l10n_cl_sii_taxpayer_type: partner.l10n_cl_sii_taxpayer_type,
                    vat: partner.vat,
                }],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(createData);
        return result.result;

    } catch (error) {
        console.error('Error creating partner:', error);
        throw error;
    }
}

export async function getPartnerDetails(partnerId: number): Promise<any> {
    try {
        const readData = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                model: 'res.partner',
                method: 'read',
                args: [partnerId, ['name', 'l10n_cl_document_number', 'email', 'phone']],
                kwargs: {},
            },
        };

        const result = await makeAuthenticatedRequest(readData);
        return result.result;

    } catch (error) {
        console.error('Error getting partner details:', error);
        throw error;
    }
}