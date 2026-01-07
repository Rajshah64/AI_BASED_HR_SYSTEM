import { config } from "dotenv";
import { resolve } from "path";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import jobsRoutes from "./routes/jobs";
import applicationsRoutes from "./routes/applications";
import adminRoutes from "./routes/admin";

// Load .env from root directory (hr-platform/.env)
// This works whether running from apps/api or from root
const rootEnvPath = resolve(process.cwd(), ".env");
const apiEnvPath = resolve(process.cwd(), "apps/api/.env");
const parentEnvPath = resolve(process.cwd(), "../.env");

// Try loading from multiple locations
let result = config({ path: rootEnvPath });
if (result.error) {
  result = config({ path: apiEnvPath });
}
if (result.error) {
  result = config({ path: parentEnvPath });
}
if (result.error) {
  result = config(); // Fallback to default behavior
}

if (!result.error && result.parsed) {
  console.log(`✓ Loaded .env file`);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "Missing");
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing"
);
app.listen(PORT, () => {
  console.log(`API running on PORT ${PORT}`);
});
