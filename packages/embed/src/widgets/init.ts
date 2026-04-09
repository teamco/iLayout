// packages/embed/src/widgets/init.ts
import { registerWidget } from './registry';
import { YouTubeWidget } from './YouTubeWidget';
import { ImageWidget } from './ImageWidget';
import { EmptyWidget } from './EmptyWidget';

registerWidget({ resource: 'youtube', label: 'YouTube', component: YouTubeWidget });
registerWidget({ resource: 'image', label: 'Image', component: ImageWidget });
registerWidget({ resource: 'empty', label: 'Empty', component: EmptyWidget });
