import "dotenv/config";

import { createApp } from "./app.js";
import { parseEnv } from "./env.js";

const { PORT } = parseEnv(process.env);

createApp().listen(PORT, "0.0.0.0", () => {
  console.info(`API listening on port ${PORT}`);
});
