import { writeFile, mkdir } from "node:fs/promises";
import { asyncapiToYAML, generateAsyncAPI } from "@daloyjs/core/asyncapi";
import { buildApp } from "../src/build-app.js";

// AsyncAPI 3.0 counterpart to dump-openapi.ts: documents the `app.ws()`
// channels from a fresh factory-built app, without starting a listener.

async function main() {
  const app = buildApp();
  const doc = generateAsyncAPI(app, {
    info: { title: "Bitcoin Trading Demo API", version: "0.0.1" },
    servers: { local: { host: "localhost:3000", protocol: "ws" } },
  });
  await mkdir("generated", { recursive: true });
  await writeFile("generated/asyncapi.json", JSON.stringify(doc, null, 2));
  await writeFile("generated/asyncapi.yaml", asyncapiToYAML(doc));
  console.log("wrote generated/asyncapi.json and generated/asyncapi.yaml");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
