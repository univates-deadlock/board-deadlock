import app from "./app.js";
import { env } from "./config/env.js";

const port = env.PORT;

app.listen(port, () => {
  console.info(`API listening on port ${port}`);
});
