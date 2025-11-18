import { ApiAuthInitializer } from "@/components/api-auth-initializer";
import { login } from "@/lib/api/authApi";

export default async function Home() {
  const username = process.env.MEERKAT_USERNAME;
  const password = process.env.MEERKAT_PASSWORD;

  let accessToken: string | null = null;
  if (username && password) {
    try {
      const token = await login(username, password);
      accessToken = token.access_token;
    } catch (error) {
      console.error("Failed to authenticate with Meerkat:", error);
    }
  } else {
    console.warn("MEERKAT credentials are not configured.");
  }

  return (
    <div className="p-4 md:px-8 md:py-6">
      <ApiAuthInitializer token={accessToken} />
      <h1 className="text-2xl font-bold">Search Studies</h1>
      <p className="text-sm text-gray-500">
        Welcome to the search studies page
      </p>
    </div>
  );
}
