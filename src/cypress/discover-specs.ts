import { readdir } from 'node:fs/promises';
import { join, parse, posix } from 'node:path';

export interface DiscoveredSpec {
  path: string;
  name: string;
  screenDirectory: string | null;
  screenName: string | null;
}

const specPattern = /\.cy\.(?:js|jsx|ts|tsx)$/i;

function label(value: string): string {
  return value.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ')
    .trim().replace(/^./u, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

export async function discoverSpecs(root: string): Promise<DiscoveredSpec[]> {
  const base = 'cypress/e2e';
  const specs: DiscoveredSpec[] = [];

  async function scan(directory: string): Promise<void> {
    const entries = await readdir(join(root, directory), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const path = posix.join(directory, entry.name);
      if (entry.isDirectory()) {
        await scan(path);
      } else if (entry.isFile() && specPattern.test(entry.name)) {
        const branches = posix.relative(base, directory).split('/').filter(Boolean);
        const screen = branches.length > 0 && !/(?:^api$|[-_]api$)/i.test(branches[0]);
        specs.push({
          path,
          name: (label(parse(entry.name).name.replace(/\.cy$/i, '')) || 'Spec Cypress').slice(0, 120),
          screenDirectory: screen ? directory : null,
          screenName: screen ? (label(branches.at(-1)!) || 'Tela').slice(0, 120) : null,
        });
      }
    }
  }

  await scan(base);
  return specs.sort((first, second) => first.path.localeCompare(second.path, 'pt-BR'));
}
