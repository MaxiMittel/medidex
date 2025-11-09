import { login } from "../../lib/api/authApi";
import { getPersonsForStudy } from "../../lib/api/studiesApi"; 
import apiClient from "../../lib/api/apiClient";

async function getTestData() {

  const TEST_STUDY_ID = 28914;

  const username = process.env.MEERKAT_USERNAME;
  const password = process.env.MEERKAT_PASSWORD;

  if (!username || !password) {
    console.error("MEERKAT credentials not set in .env.local");
    return { success: false, data: [], error: "MEERKAT credentials not set." };
  }

  try {
    const tokenData = await login(username, password);
    const token = tokenData.access_token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const persons: string[] = await getPersonsForStudy(TEST_STUDY_ID);

    return { success: true, data: persons, error: null };

  } catch (error: any) {
    console.error("API Test Failed:", error.message);
    return { success: false, data: [], error: error.message };
  }
}

export default async function ApiTestPage() {
  

  const result = await getTestData();
  const persons = result.data; 
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>API Call Test: GET /studies/{'{study_id}'}/persons</h1>
      
      {result.success ? (
        <div>
          <h2>✅ Test Succeeded!</h2>
          <p>Found {persons.length} persons for study {28914}.</p>
          
          <ul style={{ listStyleType: 'disc', paddingLeft: '40px' }}>
            {persons.map((person, index) => (
              <li key={index} style={{ padding: '2px' }}>
                {person}
              </li>
            ))}
          </ul>

        </div>
      ) : (
        <div>
          <h2>❌ Test Failed</h2>
          <p style={{ color: 'red' }}>{result.error || 'An unknown error occurred.'}</p>
        </div>
      )}
    </div>
  );
}