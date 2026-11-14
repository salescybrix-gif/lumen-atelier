// Deletes the JSON mock database so it is re-seeded on the next request.
import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(join(process.cwd(), ".data"), { recursive: true, force: true });
console.log("✓ Mock database cleared. It will be re-seeded on the next server request.");
