import fs from 'node:fs';
import path from 'node:path';

const appApiDir = path.resolve('app/api');
const srcApiDir = path.resolve('src/pages/api');

function walk(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const routeFiles = walk(appApiDir);

for (const routeFile of routeFiles) {
  const relPath = path.relative(appApiDir, path.dirname(routeFile));
  const targetDir = path.join(srcApiDir, relPath);
  fs.mkdirSync(targetDir, { recursive: true });

  const targetFile = path.join(targetDir, 'index.ts');
  const importRel = `@/app/api/${relPath ? relPath + '/' : ''}route`;

  const content = `import * as route from '${importRel}';
import { createAstroEndpoint } from '@/src/lib/astro-api-adapter';

export const ALL = createAstroEndpoint(route);
`;

  fs.writeFileSync(targetFile, content);
  console.log(`Generated: ${path.relative(process.cwd(), targetFile)} -> ${importRel}`);
}

console.log(`Successfully generated ${routeFiles.length} Astro API endpoints.`);
