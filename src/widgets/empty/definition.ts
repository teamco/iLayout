import { BorderOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { EmptyWidget } from './EmptyWidget';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.EMPTY,
  label: 'Empty',
  description: 'Empty placeholder widget',
  icon: BorderOutlined,
  component: EmptyWidget,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
