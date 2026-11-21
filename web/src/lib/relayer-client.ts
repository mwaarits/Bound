const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL ?? 'http://localhost:4000';

export async function relayerPost<T = unknown>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${RELAYER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function relayerGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${RELAYER_URL}${path}`);
  return res.json() as Promise<T>;
}
