// One small helper for every call to the server.
export const tokenKey = (role) => `ubvote-${role}-token`;

export async function api(path, { method = "GET", body, role } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = role && sessionStorage.getItem(tokenKey(role));
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}
