import type { LayoutNode } from '@/layout/types';
import type { IUser, ProfileRecord, IEntityMeta } from '@idevconn/supabase';

export type { IUser, ProfileRecord, IEntityMeta };

export type LayoutStatus = 'draft' | 'published' | 'deleted';

export type LayoutRecord = IEntityMeta & {
  id: string;
  user_id: IUser['id'];
  version: number;
  status: LayoutStatus;
  data: LayoutNode;
  is_private: boolean;
  mode: import('@/layout/types').LayoutMode;
};

// ─── Widget enums ─────────────────────────────────────────────────────────────

export const EWidgetCategory = {
  MEDIA: 'media',
  DATA: 'data',
  CONTENT: 'content',
  EMBED: 'embed',
  UTILITY: 'utility',
} as const;
export type EWidgetCategory =
  (typeof EWidgetCategory)[keyof typeof EWidgetCategory];

export const EWidgetResource = {
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  IFRAME: 'iframe',
  COMPONENT: 'component',
  EMPTY: 'empty',
} as const;
export type EWidgetResource =
  (typeof EWidgetResource)[keyof typeof EWidgetResource];

// ─── Widget types ─────────────────────────────────────────────────────────────

export type WidgetContent = {
  value: string;
};

export type WidgetConfig = {
  isEditable: boolean;
  isClonable: boolean;
  css?: import('@/layout/types').WidgetBounds;
};

export type WidgetRecord = IEntityMeta & {
  id: string;
  user_id: IUser['id'];
  name: string;
  description: string;
  thumbnail: string | null;
  content: WidgetContent;
  category: EWidgetCategory;
  resource: EWidgetResource;
  config: WidgetConfig;
  tags: string[];
  status: LayoutStatus;
  is_public: boolean;
};
