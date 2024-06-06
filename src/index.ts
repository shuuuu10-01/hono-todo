import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

type Bindings = {
  DB: D1Database;
};

type Todo = {
  title: string;
  id: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title FROM todo;`
  ).all<Todo>();
  return c.json({ todo: results });
});

app.post(
  "/todo",
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
    c.status(200);
    return c.body(null);
  }
);

app.delete("/todo/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM todo WHERE id = ?;`).bind(id).run();
  c.status(200);
  return c.body(null);
});

export default app;
