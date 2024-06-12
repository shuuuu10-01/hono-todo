import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

type Bindings = {
  DB: D1Database;
};

type Todo = {
  title: string;
  id: string;
  completed: 0 | 1;
};

const todo = new Hono<{ Bindings: Bindings }>();

/**
 * GET /
 * @summary Todoを一覧取得
 *
 * @example
 * // Request
 * GET /
 *
 * // Response
 * {
 *   todo: [
 *     {
 *       id: "1234567890",
 *       title: "sample",
 *       completed: false,
 *     },
 *     {...}
 *   ],
 * }
 */
todo.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, completed FROM todo;`
  ).all<Todo>();
  const convert = results.map((r) => {
    return { ...r, completed: !!r.completed };
  });
  return c.json({ todo: convert });
});

/**
 * POST /
 * @summary Todoを追加
 *
 * @example
 * // Request
 * POST /
 * {
 *   "title": "sample"
 * }
 */
todo.post(
  "/",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
    })
  ),
  async (c) => {
    const { title } = c.req.valid("json");
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`INSERT INTO todo(id, title) VALUES(?, ?);`)
      .bind(id, title)
      .run();
    c.status(201);
    return c.body(null);
  }
);

/**
 * PUT /:id
 * @summary Todoのタイトルを更新
 *
 * @example
 * // Request
 * PUT /1234567890
 * {
 *   "title": "sample"
 * }
 */
todo.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
    })
  ),
  async (c) => {
    const { title } = c.req.valid("json");
    const id = c.req.param("id");
    await c.env.DB.prepare(`UPDATE todo SET title = ? WHERE id = ?;`)
      .bind(title, id)
      .run();
    c.status(201);
    return c.body(null);
  }
);

/**
 * DELETE /:id
 * @summary Todoを削除
 *
 * @example
 * // Request
 * DELETE /1234567890
 */
todo.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM todo WHERE id = ?;`).bind(id).run();
  c.status(201);
  return c.body(null);
});

/**
 * PUT /:id/completed
 * @summary Todoの完了済みフラグを更新
 *
 * @example
 * // Request
 * PUT /1234567890/completed
 * {
 *   "completed": true
 * }
 */
todo.put(
  "/:id/completed",
  zValidator(
    "json",
    z.object({
      completed: z.boolean(),
    })
  ),
  async (c) => {
    const { completed } = c.req.valid("json");
    const id = c.req.param("id");
    await c.env.DB.prepare(`UPDATE todo SET completed = ? WHERE id = ?;`)
      .bind(completed ? 1 : 0, id)
      .run();
    c.status(201);
    return c.body(null);
  }
);

export default todo;
