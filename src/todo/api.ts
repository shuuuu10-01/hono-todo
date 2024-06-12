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

todo.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, completed FROM todo;`
  ).all<Todo>();
  const convert = results.map((r) => {
    return { ...r, completed: !!r.completed };
  });
  return c.json({ todo: convert });
});

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

todo.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`DELETE FROM todo WHERE id = ?;`).bind(id).run();
  c.status(201);
  return c.body(null);
});

export default todo;
