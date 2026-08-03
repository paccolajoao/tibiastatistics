const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type AccessTokenGetter = () => string | null;
type OnUnauthorized = () => Promise<string | null>;

let getAccessToken: AccessTokenGetter = () => null;
let onUnauthorized: OnUnauthorized = async () => null;

export function configureApiClient(options: {
  getAccessToken: AccessTokenGetter;
  onUnauthorized: OnUnauthorized;
}) {
  getAccessToken = options.getAccessToken;
  onUnauthorized = options.onUnauthorized;
}

const AUTH_PATH_PREFIX = "/api/auth/";

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const isAuthEndpoint = path.startsWith(AUTH_PATH_PREFIX);
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const newToken = await onUnauthorized();
    if (newToken) {
      return request<T>(path, init, true);
    }
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
