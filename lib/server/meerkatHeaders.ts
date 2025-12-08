import { headers } from "next/headers";
import { auth } from "../auth";

export async function getMeerkatHeaders(accept: string = "application/json") {
  const requestHeaders = await headers();
  const token = await auth.api.getToken({
    headers: requestHeaders,
  });
  const apiKey = process.env.MEERKAT_API_KEY;

  if (!apiKey) {
    throw new Error("MEERKAT_API_KEY is not configured on the server.");
  }

  return {
    "X-API-Key": apiKey,
    // TODO: Uncomment this when the token is working
    // Authorization: `Bearer ${token.token}`,
    Accept: accept,
  } as const;
}
