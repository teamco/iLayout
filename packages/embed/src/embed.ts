// packages/embed/src/embed.ts
import { mount, scanAndMount } from './mount';

// Expose global API
(window as Record<string, unknown>).AntHillLayout = { mount };

// Auto-mount on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanAndMount);
} else {
  scanAndMount();
}
