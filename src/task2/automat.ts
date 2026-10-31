import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";

export async function getToken(
  authority: string,
  audience: string,
  clientId: string,
  clientSecret: string,
  scope: string
): Promise<string> {
  const tokenURL = new URL("/oauth/token", authority);

  const response = await fetch(tokenURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      scope
    })
  });

  if (!response.ok) {
    throw new Error(
      `Getting token failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string" ||
    data.access_token.length === 0
  ) {
    throw new Error(
      `Invalid token response: HTTP ${response.status}, access_token missing`
    );
  }

  return data.access_token;
}

export async function issuePass(
  url: string,
  token: string,
  name: string,
  document: string
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      document
    })
  });

  if (!response.ok) {
    throw new Error(
      `Issuing pass failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const location = response.headers.get("Location");

  if (!location) {
    throw new Error(
      `Invalid pass response: HTTP ${response.status}, Location missing`
    );
  }

  const resourceURL = new URL(location, url);
  const id = resourceURL.pathname.split("/").filter(Boolean).pop();

  // Check that the identifier is safe for use as a filename.
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(
      `Invalid pass response: HTTP ${response.status}, invalid ID in Location`
    );
  }

  const contentType = response.headers.get("Content-Type");

  if (contentType?.split(";")[0]?.trim().toLowerCase() !== "image/png") {
    throw new Error(
      `Invalid pass response: HTTP ${response.status}, expected image/png`
    );
  }

  const image = Buffer.from(await response.arrayBuffer());

  await writeFile(`${id}.png`, image);
}
