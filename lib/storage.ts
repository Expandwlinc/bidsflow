import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";

// Abstracción de almacenamiento de documentos. Por defecto guarda en disco
// local bajo /uploads (funciona en desarrollo, pero NO persiste en el
// filesystem efímero de Vercel). Cuando el equipo esté listo, activa el
// driver de Vercel Blob con la variable de entorno STORAGE_DRIVER=vercel-blob
// (requiere conectar Blob storage al proyecto en Vercel, que inyecta
// automáticamente BLOB_READ_WRITE_TOKEN) — no hace falta tocar el resto del
// código, ambos drivers implementan la misma interfaz.
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

// El storageKey guardado es la URL del blob. read() la vuelve a descargar en
// el servidor en vez de devolverla al cliente, para mantener el mismo
// control de acceso que el driver local (todo pasa por /api/documents/[id],
// que ya valida la sesión antes de servir el archivo).
class VercelBlobStorageDriver implements StorageDriver {
  async save(fileName: string, data: Buffer): Promise<string> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`documentos/${randomUUID()}-${safeName}`, data, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  async read(storageKey: string): Promise<Buffer> {
    const res = await fetch(storageKey);
    if (!res.ok) throw new Error(`No se pudo leer el documento (HTTP ${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }

  async remove(storageKey: string): Promise<void> {
    await del(storageKey).catch(() => {});
  }
}

export const storage: StorageDriver =
  process.env.STORAGE_DRIVER === "vercel-blob" ? new VercelBlobStorageDriver() : new LocalStorageDriver();
