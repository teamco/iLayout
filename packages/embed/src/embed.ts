// packages/embed/src/embed.ts
import { mount, scanAndMount } from './mount';

// Expose global API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).AntHillLayout = { mount };

// Auto-mount on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanAndMount);
} else {
  scanAndMount();
}
