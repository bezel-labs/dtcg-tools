import { Button } from '@base-ui/react/button';
import { Tabs } from '@base-ui/react/tabs';
import { useEffect, useState } from 'react';

const COMMANDS = [
  { runner: 'npm', command: 'npx open-design-tokens tokens.json' },
  { runner: 'pnpm', command: 'pnpm dlx open-design-tokens tokens.json' },
  { runner: 'Yarn', command: 'yarn dlx open-design-tokens tokens.json' },
  { runner: 'Bun', command: 'bunx open-design-tokens tokens.json' },
];

const COPIED_MS = 1500;

function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const handle = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(handle);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      // The browser refused. The command is still on screen to select by hand.
    }
  };

  return (
    <div className="command-line">
      <code className="command-text">
        <span aria-hidden="true">$ </span>
        {command}
      </code>
      <Button className="command-copy" onClick={copy}>
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
  );
}

/** The one command to run, for each package runner. */
export function CommandTabs() {
  return (
    <Tabs.Root className="command" defaultValue="npm">
      <Tabs.List className="command-tabs" aria-label="Package runner">
        {COMMANDS.map(({ runner }) => (
          <Tabs.Tab key={runner} className="tab" value={runner}>
            {runner}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {COMMANDS.map(({ runner, command }) => (
        <Tabs.Panel key={runner} value={runner} tabIndex={-1}>
          <CommandLine command={command} />
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
