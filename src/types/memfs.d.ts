declare module "memfs" {
  export const Volume: {
    fromJSON(json: Record<string, string | null>): unknown;
  };

  export function createFsFromVolume(volume: unknown): {
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    rmdirSync(path: string): void;
    unlinkSync(path: string): void;
    statSync(path: string): { isDirectory(): boolean };
    readFileSync(path: string): unknown;
    [key: string]: unknown;
  };
}
