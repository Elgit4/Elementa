import { openDB, type DBSchema } from 'idb';
import { emptyProgress, migrate, type Progress } from '../engine/progress';

export interface ProgressStore {
  load(): Promise<Progress>;
  save(p: Progress): Promise<void>;
}

interface Schema extends DBSchema {
  kv: { key: string; value: unknown };
}

const DB_NAME = 'elementa';
const KEY = 'progress';

export class IdbProgressStore implements ProgressStore {
  private db = openDB<Schema>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('kv');
    },
  });

  async load(): Promise<Progress> {
    const db = await this.db;
    return migrate(await db.get('kv', KEY));
  }

  async save(p: Progress): Promise<void> {
    const db = await this.db;
    await db.put('kv', p, KEY);
  }
}

/** Used in tests and as an in-session fallback when IndexedDB is unavailable. */
export class MemoryProgressStore implements ProgressStore {
  private value: Progress = emptyProgress();
  async load() { return structuredClone(this.value); }
  async save(p: Progress) { this.value = structuredClone(p); }
}
