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
