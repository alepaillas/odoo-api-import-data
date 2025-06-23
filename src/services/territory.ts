import { readFileSync } from 'fs';
import * as path from "path";
import { fileURLToPath } from 'url';
import type { Region } from './interfaces/territory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../assets/territoriochile.json");
const regionsData: Region[] = JSON.parse(readFileSync(filePath, 'utf-8'));

function removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export const findRegionByCommune = (communeName: string): string | null => {
    const normalizedCommuneName = removeAccents(communeName.toLowerCase());

    for (const region of regionsData) {
        for (const province of region.provincias) {
            for (const commune of province.comunas) {
                const normalizedCurrentCommune = removeAccents(commune.nombre.toLowerCase());
                if (normalizedCurrentCommune === normalizedCommuneName) {
                    return region.nombre;
                }
            }
        }
    }
    return null;
}

// Example usage
// const communeName = "Arica";
// const region = findRegionByCommune(communeName);

// if (region) {
//     console.log(`The commune ${communeName} belongs to the region ${region}.`);
// } else {
//     console.log(`The commune ${communeName} was not found.`);
// }