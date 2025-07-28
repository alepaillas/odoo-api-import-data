// src/cache/cityCache.ts
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { City } from "../types/city.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CityCache {
    private static instance: CityCache;
    private cities: Map<number, City> = new Map();
    private initialized: boolean = false;

    private constructor() { }

    public static getInstance(): CityCache {
        if (!CityCache.instance) {
            CityCache.instance = new CityCache();
        }
        return CityCache.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Try to load from a dedicated cities file first
        const citiesFilePath = path.resolve(__dirname, "../../data/cities/all_cities.xlsx");

        if (existsSync(citiesFilePath)) {
            await this.loadFromDedicatedFile(citiesFilePath);
        } else {
            // Fallback: scan all Excel files to build the cache
            await this.buildCacheFromAllFiles();
        }

        this.initialized = true;
        console.log(`City cache initialized with ${this.cities.size} cities`);
    }

    private async loadFromDedicatedFile(filePath: string): Promise<void> {
        try {
            const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });
            const citiesSheet = workbook.Sheets["Cities"];
            const jsonCitiesSheet: unknown[] = XLSX.utils.sheet_to_json(citiesSheet);
            const cities: City[] = jsonCitiesSheet as City[];

            cities.forEach(city => {
                this.cities.set(city.id, city);
            });
        } catch (error) {
            console.error("Error loading cities from dedicated file:", error);
            throw error;
        }
    }

    private async buildCacheFromAllFiles(): Promise<void> {
        const facturesPath = path.resolve(__dirname, "../../data/dtes/facturas");
        const creditNotesPath = path.resolve(__dirname, "../../data/dtes/notas de credito");
        const { readdirSync } = await import("fs");

        try {
            // Check both directories
            const directories = [facturesPath, creditNotesPath].filter(dir => {
                try {
                    return existsSync(dir);
                } catch {
                    return false;
                }
            });

            for (const directoryPath of directories) {
                try {
                    const files = readdirSync(directoryPath);
                    const excelFiles = files.filter(file => file.endsWith('.xlsx'));

                    for (const file of excelFiles) {
                        try {
                            const filePath = path.join(directoryPath, file);
                            const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });

                            if (workbook.Sheets["Cities"]) {
                                const citiesSheet = workbook.Sheets["Cities"];
                                const jsonCitiesSheet: unknown[] = XLSX.utils.sheet_to_json(citiesSheet);
                                const cities: City[] = jsonCitiesSheet as City[];

                                cities.forEach(city => {
                                    // Only add if not already exists (avoid duplicates)
                                    if (!this.cities.has(city.id)) {
                                        this.cities.set(city.id, city);
                                    }
                                });
                            }
                        } catch (fileError) {
                            console.warn(`Error processing file ${file}:`, fileError);
                            // Continue with next file
                        }
                    }
                } catch (dirError) {
                    console.warn(`Error processing directory ${directoryPath}:`, dirError);
                    // Continue with next directory
                }
            }
        } catch (error) {
            console.error("Error building city cache:", error);
            throw error;
        }
    }

    public findById(id: number): City | undefined {
        return this.cities.get(id);
    }

    public findByName(name: string): City | undefined {
        for (const city of this.cities.values()) {
            if (city.name.toLowerCase() === name.toLowerCase()) {
                return city;
            }
        }
        return undefined;
    }

    public getAllCities(): City[] {
        return Array.from(this.cities.values());
    }

    public size(): number {
        return this.cities.size;
    }

    // Method to export all cities to a dedicated file for future use
    public async exportToFile(outputPath: string): Promise<void> {
        try {
            // Ensure the directory exists
            const { mkdirSync } = await import("fs");
            const outputDir = path.dirname(outputPath);
            mkdirSync(outputDir, { recursive: true });

            const cities = this.getAllCities();
            const worksheet = XLSX.utils.json_to_sheet(cities);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Cities");
            XLSX.writeFile(workbook, outputPath);
            console.log(`Exported ${cities.length} cities to ${outputPath}`);
        } catch (error) {
            console.error("Error exporting cities to file:", error);
            // Don't throw the error, just log it so the main process can continue
        }
    }
}

export default CityCache;