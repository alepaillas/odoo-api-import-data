export interface Commune {
    nombre: string;
    codigo: string;
}

export interface Province {
    nombre: string;
    codigo: string;
    capital_provincial: string;
    comunas: Commune[];
}

export interface Region {
    nombre: string;
    region_iso_3166_2: string;
    capital_regional: string;
    provincias: Province[];
}