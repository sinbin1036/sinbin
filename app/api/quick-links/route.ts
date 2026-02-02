import { proxyQuickLinks } from "./proxy";

export async function GET(request: Request) {
  return proxyQuickLinks(request);
}

export async function POST(request: Request) {
  return proxyQuickLinks(request);
}
