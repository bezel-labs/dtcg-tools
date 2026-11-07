import { ScrollArea } from '@base-ui/react/scroll-area';
import type { ReactNode } from 'react';

// Base UI defaults to fit-content, which lets long JSON lines widen the panel.
const CONTENT_STYLE = { minWidth: 0 };

interface Props {
  children: ReactNode;
}

/** A vertically scrolling region that fills the rest of its pane. */
export function ScrollPanel({ children }: Props) {
  return (
    <ScrollArea.Root className="scroll-panel">
      <ScrollArea.Viewport className="scroll-panel-viewport">
        <ScrollArea.Content style={CONTENT_STYLE}>{children}</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="scroll-panel-bar" orientation="vertical">
        <ScrollArea.Thumb className="scroll-panel-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
