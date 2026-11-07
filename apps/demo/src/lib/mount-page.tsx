import { startLivePreviewReceiver } from '@bezel-labs/crystal';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import { type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../bezel/variables.css';
import '../styles.css';

/** Everything an HTML entry needs: fonts, styles, the Bezel live preview, and the React root. */
export function mountPage(page: ReactNode) {
  const receiver = startLivePreviewReceiver({
    allowedOrigins: ['https://app.bezel.new'],
    // The page CSP does not allow Google Fonts, so the token fonts are self-hosted above.
    loadGoogleFonts: false,
  });
  import.meta.hot?.dispose(() => receiver.stop());

  const root = document.getElementById('root');
  if (root) createRoot(root).render(<StrictMode>{page}</StrictMode>);
}
