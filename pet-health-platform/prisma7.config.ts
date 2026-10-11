import "dotenv/config";

import { defineConfig } from "prisma/config";
import { getMigrationDatabaseUrl } from "./lib/database-config.ts";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations-postgresql",
  },
  datasource: {
    url: getMigrationDatabaseUrl(),
  },
});
