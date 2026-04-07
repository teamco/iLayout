import type { ComponentType } from 'react';
import type { EWidgetResource, WidgetContent, WidgetConfig } from '@/lib/types';

export type WidgetComponentProps = {
  content: WidgetContent;
  config: WidgetConfig;
};

export type WidgetEditorProps = {
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
};

export type WidgetDefinition = {
  resource: EWidgetResource;
  label: string;
  description: string;
  icon: ComponentType;
  component: ComponentType<WidgetComponentProps>;
  editor?: ComponentType<WidgetEditorProps>;
  defaultContent: WidgetContent;
  defaultConfig: Partial<WidgetConfig>;
};
