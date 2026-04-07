import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { ImageWidget } from './ImageWidget';
export { ImageEditor } from './ImageEditor';
