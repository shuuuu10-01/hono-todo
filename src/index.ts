import { Hono } from "hono";
import { cors } from "hono/cors";
import todo from "./todo/api";

const app = new Hono();

app.use("*", cors());

app.route("/v1/api/todo", todo);

export default app;
