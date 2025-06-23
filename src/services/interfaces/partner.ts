export interface CreatePartnerType {
    name: string;
    l10n_latam_identification_type_id?: number;
    company_type: string;
    city?: string;
    country_id?: number;
    state_id?: number | boolean;
    street?: string;
    street2?: string;
    l10n_cl_activity_description?: string;
    l10n_cl_sii_taxpayer_type: string;
    vat?: string;
    function?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    comment?: string;
    property_payment_term_id?: number;
    child_ids?: number[];
}