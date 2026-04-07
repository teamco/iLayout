import { YoutubeOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { YouTubeWidget } from './YouTubeWidget';
import { YouTubeEditor } from './YouTubeEditor';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.YOUTUBE,
  label: 'YouTube',
  description: 'Embed a YouTube video',
  icon: YoutubeOutlined,
  component: YouTubeWidget,
  editor: YouTubeEditor,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
