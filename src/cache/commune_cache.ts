// src/cache/communeCache.ts
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { Commune } from "../types/commune.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CommuneCache {
    private static instance: CommuneCache;
    private communes: Map<number, Commune> = new Map();
    private initialized: boolean = false;

    private constructor() { }

    public static getInstance(): CommuneCache {
        if (!CommuneCache.instance) {
            CommuneCache.instance = new CommuneCache();
        }
        return CommuneCache.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Try to load from a dedicated communes file first
        const communesFilePath = path.resolve(__dirname, "../../data/communes/all_communes.xlsx");

        if (existsSync(communesFilePath)) {
            await this.loadFromDedicatedFile(communesFilePath);
        } else {
            // Fallback: scan all Excel files to build the cache
            await this.buildCacheFromAllFiles();
        }

        this.initialized = true;
        console.log(`Commune cache initialized with ${this.communes.size} communes`);
    }

    private async loadFromDedicatedFile(filePath: string): Promise<void> {
        try {
            const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });
            const communesSheet = workbook.Sheets["Communes"];
            const jsonCommunesSheet: unknown[] = XLSX.utils.sheet_to_json(communesSheet);
            const communes: Commune[] = jsonCommunesSheet as Commune[];

            communes.forEach(commune => {
                this.communes.set(commune.id, commune);
            });
        } catch (error) {
            console.error("Error loading communes from dedicated file:", error);
            throw error;
        }
    }

    private async buildCacheFromAllFiles(): Promise<void> {
        const directoryPath = path.resolve(__dirname, "../../data/dtes/facturas");
        const { readdirSync } = await import("fs");

        try {
            const files = readdirSync(directoryPath);
            const excelFiles = files.filter(file => file.endsWith('.xlsx'));

            for (const file of excelFiles) {
                try {
                    const filePath = path.join(directoryPath, file);
                    const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });

                    if (workbook.Sheets["Communes"]) {
                        const communesSheet = workbook.Sheets["Communes"];
                        const jsonCommunesSheet: unknown[] = XLSX.utils.sheet_to_json(communesSheet);
                        const communes: Commune[] = jsonCommunesSheet as Commune[];

                        communes.forEach(commune => {
                            // Only add if not already exists (avoid duplicates)
                            if (!this.communes.has(commune.id)) {
                                this.communes.set(commune.id, commune);
                            }
                        });
                    }
                } catch (fileError) {
                    console.warn(`Error processing file ${file}:`, fileError);
                    // Continue with next file
                }
            }
        } catch (error) {
            console.error("Error building commune cache:", error);
            throw error;
        }
    }

    public findById(id: number): Commune | undefined {
        return this.communes.get(id);
    }

    public findByName(name: string): Commune | undefined {
        for (const commune of this.communes.values()) {
            if (commune.name.toLowerCase() === name.toLowerCase()) {
                return commune;
            }
        }
        return undefined;
    }

    public getAllCommunes(): Commune[] {
        return Array.from(this.communes.values());
    }

    public size(): number {
        return this.communes.size;
    }

    // Method to export all communes to a dedicated file for future use
    public async exportToFile(outputPath: string): Promise<void> {
        try {
            // Ensure the directory exists
            const { mkdirSync } = await import("fs");
            const outputDir = path.dirname(outputPath);
            mkdirSync(outputDir, { recursive: true });

            const communes = this.getAllCommunes();
            const worksheet = XLSX.utils.json_to_sheet(communes);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Communes");
            XLSX.writeFile(workbook, outputPath);
            console.log(`Exported ${communes.length} communes to ${outputPath}`);
        } catch (error) {
            console.error("Error exporting communes to file:", error);
            // Don't throw the error, just log it so the main process can continue
        }
    }
}

export default CommuneCache;