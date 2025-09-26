This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Model Context Protocol Setup

- 기본 MCP 설정은 `mcp.config.json` 파일에 정의되어 있습니다.
- `servers.project-files.root` 경로는 현재 레포지토리를 기준으로 하며, 필요 시 절대경로로 바꾸거나 포함/제외 패턴을 조정할 수 있습니다.
- MCP 클라이언트에서 이 프로젝트를 불러올 때 `contexts.default` 항목을 사용하면 프로젝트 파일과 `npm` 실행 도구가 자동으로 노출됩니다.
- 실제로 사용하는 MCP 호스트 또는 IDE 사양에 맞춰 `$schema` 경로와 속성 이름을 교체해 주세요.
- 비공개 정보나 추가 리소스가 필요하다면 `resources`와 `tools`에 새 항목을 추가하고 `contexts`에 연결하면 됩니다.
