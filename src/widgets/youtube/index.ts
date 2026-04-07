import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { YouTubeWidget } from './YouTubeWidget';
export { YouTubeEditor } from './YouTubeEditor';
