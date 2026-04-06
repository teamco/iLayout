import type { LayoutNode } from '@/layout/types';

export type LayoutStatus = 'draft' | 'published' | 'deleted';

export type LayoutRecord = {
  id: string;
  user_id: string;
  version: number;
  status: LayoutStatus;
  data: LayoutNode;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};
