"use client";

export type QuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
  symbol: string;
};

export type QuickLinkPayload = Omit<QuickLink, "id">;

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  } as Record<string, string>;

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  const json = await response.json();
  if (!json.ok) {
    const message = json.error?.message || "요청이 실패했습니다.";
    throw new Error(message);
  }

  return json.data as T;
}

export async function getQuickLinks(): Promise<QuickLink[]> {
  return request<QuickLink[]>("/quick-links");
}

export async function createQuickLink(payload: QuickLinkPayload) {
  await request<QuickLink>("/quick-links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  await request<QuickLink>(`/quick-links/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuickLink(id: string) {
  await request<null>(`/quick-links/${id}`, {
    method: "DELETE",
  });
}
