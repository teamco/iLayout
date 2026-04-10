import type { LayoutNode } from '@/layout/types';

export interface IUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface IEntityMeta {
  created_at: string;
  created_by: IUser['id'];
  updated_at: string;
  updated_by: IUser['id'];
}

export interface ProfileRecord {
  id: IUser['id'];
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  is_online: boolean;
  is_blocked: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

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
