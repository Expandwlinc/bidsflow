import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Abstracción de almacenamiento de documentos. La implementación por defecto
// guarda en disco local bajo /uploads — para producción, reemplazar por un
// driver de S3 (u otro) que implemente la misma interfaz.
export interface StorageDriver {
  save(fileName: string, data: Buffer): Promise<string>; // devuelve storageKey
  read(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

class LocalStorageDriver implements StorageDriver {
  async save(fileName: string, data: Buffer): Promise<string> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeExt = path.extname(fileName).slice(0, 10);
    const storageKey = `${randomUUID()}${safeExt}`;
    await writeFile(path.join(UPLOAD_DIR, storageKey), data);
    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(path.join(UPLOAD_DIR, path.basename(storageKey)));
  }

  async remove(storageKey: string): Promise<void> {
    await unlink(path.join(UPLOAD_DIR, path.basename(storageKey))).catch(() => {});
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
