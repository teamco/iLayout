import { PictureOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { ImageWidget } from './ImageWidget';
import { ImageEditor } from './ImageEditor';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.IMAGE,
  label: 'Image',
  description: 'Display an image from URL',
  icon: PictureOutlined,
  component: ImageWidget,
  editor: ImageEditor,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
