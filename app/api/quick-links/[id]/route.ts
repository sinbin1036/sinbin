import { proxyQuickLinks } from "../proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getId(context: RouteContext) {
  const params = await context.params;
  return params.id;
}

export async function GET(request: Request, context: RouteContext) {
  const id = await getId(context);
  return proxyQuickLinks(request, `/${id}`);
}

export async function PUT(request: Request, context: RouteContext) {
  const id = await getId(context);
  return proxyQuickLinks(request, `/${id}`);
}

export async function DELETE(request: Request, context: RouteContext) {
  const id = await getId(context);
  return proxyQuickLinks(request, `/${id}`);
}
