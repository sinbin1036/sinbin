import { proxyQuickLinks } from "../proxy";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  return proxyQuickLinks(request, `/${context.params.id}`);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxyQuickLinks(request, `/${context.params.id}`);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyQuickLinks(request, `/${context.params.id}`);
}
