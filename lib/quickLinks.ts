"use client";

export const QUICK_LINK_CATEGORIES = ['AI', 'Dev', 'Web', '기타'] as const;
export type QuickLinkCategory = (typeof QUICK_LINK_CATEGORIES)[number];

export type QuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
  symbol: string;
  category: QuickLinkCategory;
};

export type QuickLinkPayload = Omit<QuickLink, "id">;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body != null;
  const headers = init?.headers ? new Headers(init.headers) : hasBody ? new Headers() : undefined;
  if (hasBody && headers && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
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
  return request<QuickLink[]>("/api/quick-links");
}

export async function createQuickLink(payload: QuickLinkPayload) {
  await request<QuickLink>("/api/quick-links", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuickLink(id: string, payload: QuickLinkPayload) {
  await request<QuickLink>(`/api/quick-links/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuickLink(id: string) {
  await request<null>(`/api/quick-links/${id}`, {
    method: "DELETE",
  });
}
