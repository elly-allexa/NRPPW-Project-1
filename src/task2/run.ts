import { getToken, issuePass } from "./automat.js";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const token = await getToken(
    requiredEnv("AUTOMAT_AUTHORITY"),
    requiredEnv("AUTOMAT_AUDIENCE"),
    requiredEnv("AUTOMAT_CLIENT_ID"),
    requiredEnv("AUTOMAT_CLIENT_SECRET"),
    "read:passes create:passes"
  );

  console.log("Access token received.");

  await issuePass(
    requiredEnv("AUTOMAT_URL"),
    token,
    "Automat Demo Visitor",
    "AUTOMAT-001"
  );

  console.log(`QR saved in: ${process.cwd()}`);
}

void main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error("Error:", error.message);

    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  } else {
    console.error("Automat failed");
  }

  process.exitCode = 1;
});