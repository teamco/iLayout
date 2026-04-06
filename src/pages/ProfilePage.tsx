import { Menu } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  LayoutOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ERoutes } from '@/routes';

const MENU_KEYS: Record<string, string> = {
  [ERoutes.PROFILE]: 'profile',
  [ERoutes.PROFILE_OVERVIEW]: 'overview',
  [ERoutes.PROFILE_LAYOUTS]: 'layouts',
  [ERoutes.PROFILE_WIDGETS]: 'widgets',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const matches = useMatches();
  const { t } = useTranslation();
  const currentPath = matches[matches.length - 1]?.fullPath ?? '';
  const selectedKey = MENU_KEYS[currentPath] ?? 'profile';

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <div style={{ width: 220, borderRight: '1px solid var(--border-dark)', display: 'flex', flexDirection: 'column' }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ flex: 1, borderRight: 'none' }}
          items={[
            { key: 'back', icon: <ArrowLeftOutlined />, label: t('common.back'), onClick: () => void navigate({ to: ERoutes.HOME }) },
            { type: 'divider' },
            { key: 'overview', icon: <DashboardOutlined />, label: t('profile.overview'), onClick: () => void navigate({ to: ERoutes.PROFILE_OVERVIEW as string }) },
            { key: 'profile', icon: <UserOutlined />, label: t('profile.profile'), onClick: () => void navigate({ to: ERoutes.PROFILE }) },
            { key: 'layouts', icon: <LayoutOutlined />, label: t('profile.layouts'), onClick: () => void navigate({ to: ERoutes.PROFILE_LAYOUTS as string }) },
            { key: 'widgets', icon: <AppstoreOutlined />, label: t('profile.widgets'), onClick: () => void navigate({ to: ERoutes.PROFILE_WIDGETS as string }) },
          ]}
        />
      </div>
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
