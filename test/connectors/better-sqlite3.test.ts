import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";
import { describe, expect, it } from "vitest";
import connector from "../../src/connectors/better-sqlite3";
import { createDatabase } from "../../src";
import { testConnector } from "./_tests";

describe("connectors: better-sqlite3", () => {
  testConnector({
    dialect: "sqlite",
    connector: connector({
      name: ":memory:",
    }),
  });
});

// `run()` resolves with the statement's outcome, not with whether it happened
// to touch a row. DDL and any statement matching no rows are successful with
// `changes === 0`, and every other sqlite connector reports them as such.
describe("connectors: better-sqlite3 run() success", () => {
  it("reports success for statements that change no rows", async () => {
    const db = createDatabase(
      connector({
        name: ":memory:",
      }),
    );
    await db.exec("CREATE TABLE t (id TEXT PRIMARY KEY, v TEXT)");

    const created = await db.prepare("CREATE TABLE t2 (id TEXT)").run();
    expect(created.success).toBe(true);

    const updated = await db
      .prepare("UPDATE t SET v = ? WHERE id = ?")
      .run("x", "absent");
    expect(updated.success).toBe(true);
    expect(updated.changes).toBe(0);

    const ignored = await db
      .prepare("INSERT OR IGNORE INTO t (id, v) VALUES (?, ?)")
      .run("id1", "first");
    expect(ignored.success).toBe(true);
    const duplicate = await db
      .prepare("INSERT OR IGNORE INTO t (id, v) VALUES (?, ?)")
      .run("id1", "second");
    expect(duplicate.success).toBe(true);
    expect(duplicate.changes).toBe(0);

    await db.dispose?.();
  });
});
