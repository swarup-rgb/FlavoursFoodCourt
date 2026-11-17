
const API_BASE_URL = "http://localhost:8080/api/auth";

export async function registerCustomer(customerData) {
  return sendRequest("/register", customerData);
}

export async function loginCustomer(credentials) {
  return sendRequest("/login", credentials);
}

async function sendRequest(endpoint, data) {
  let response;

  try {
    response = await fetch(`/api/auth${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error(
        "Cannot connect to the backend. Please ensure the Spring Boot server is running on port 8080."
      );
    }
  }

  const text = await response.text();
  let result = {};

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      result.error ||
      `Request failed: ${response.status}`
    );
  }

  return result;
}
