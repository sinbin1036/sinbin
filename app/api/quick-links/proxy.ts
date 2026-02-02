import { NextResponse } from "next/server";

const backendOrigin =
  process.env.BACKEND_ORIGIN?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

function configError() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "config_missing",
        message: "BACKEND_ORIGIN 또는 NEXT_PUBLIC_API_URL 환경 변수가 필요합니다.",
      },
    },
    { status: 500 }
  );
}

export async function proxyQuickLinks(request: Request, extraPath = ""): Promise<Response> {
  if (!backendOrigin) {
    return configError();
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`/quick-links${extraPath}`, backendOrigin);
  targetUrl.search = sourceUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) responseHeaders.set("content-type", responseContentType);
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "bad_gateway",
          message: "백엔드 요청에 실패했습니다.",
        },
      },
      { status: 502 }
    );
  }
}
