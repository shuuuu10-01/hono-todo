import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
};

type Todo = {
  title: string;
  id: string;
  completed: 0 | 1;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, completed FROM todo;`
  ).all<Todo>();
  const convert = results.map((r) => {
    return { ...r, completed: !!r.completed };
  });
  return c.json({ todo: convert });
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
    c.status(201);
    return c.body(null);
  }
);

app.delete("/todo/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM todo WHERE id = ?;`).bind(id).run();
  c.status(201);
  return c.body(null);
});

export default app;
