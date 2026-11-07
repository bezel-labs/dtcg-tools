import { startLivePreviewReceiver } from '@bezel-labs/crystal';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import './bezel/variables.css';
import './styles.css';

const receiver = startLivePreviewReceiver({
  allowedOrigins: ['https://app.bezel.new'],
  // The page CSP does not allow Google Fonts, so these requests could only fail.
  loadGoogleFonts: false,
});
import.meta.hot?.dispose(() => receiver.stop());

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
