export function getMeerkatHeaders(accept: string = "application/json") {
  const apiKey = process.env.MEERKAT_API_KEY;

  if (!apiKey) {
    throw new Error("MEERKAT_API_KEY is not configured on the server.");
  }

  return {
    "X-API-Key": apiKey,
    Accept: accept,
  } as const;
}
