import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { EmptyWidget } from './EmptyWidget';
