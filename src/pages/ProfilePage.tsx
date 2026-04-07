import { Menu } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  LayoutOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAbility } from '@/auth/abilityContext';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { AppHeader } from '@/components/AppHeader';

const MENU_KEYS: Record<string, string> = {
  [ERoutes.PROFILE]: 'profile',
  [ERoutes.PROFILE_OVERVIEW]: 'overview',
  [ERoutes.PROFILE_LAYOUTS]: 'layouts',
  [ERoutes.PROFILE_WIDGETS]: 'widgets',
  [ERoutes.PROFILE_USERS]: 'users',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const matches = useMatches();
  const { t } = useTranslation();
  const ability = useAbility();
  const isAdmin = ability.can(EAction.MANAGE, ESubject.ALL);
  const currentPath = matches[matches.length - 1]?.fullPath ?? '';
  const selectedKey = MENU_KEYS[currentPath] ?? 'profile';

  const menuItems = [
    { key: 'back', icon: <ArrowLeftOutlined />, label: t('common.back'), onClick: () => void navigate({ to: ERoutes.HOME }) },
    { type: 'divider' as const },
    { key: 'overview', icon: <DashboardOutlined />, label: t('profile.overview'), onClick: () => void navigate({ to: ERoutes.PROFILE_OVERVIEW as string }) },
    { key: 'profile', icon: <UserOutlined />, label: t('profile.profile'), onClick: () => void navigate({ to: ERoutes.PROFILE }) },
    { key: 'layouts', icon: <LayoutOutlined />, label: t('profile.layouts'), onClick: () => void navigate({ to: ERoutes.PROFILE_LAYOUTS as string }) },
    { key: 'widgets', icon: <AppstoreOutlined />, label: t('profile.widgets'), onClick: () => void navigate({ to: ERoutes.PROFILE_WIDGETS as string }) },
    ...(isAdmin ? [
      { type: 'divider' as const },
      { key: 'users', icon: <TeamOutlined />, label: t('profile.users'), onClick: () => void navigate({ to: ERoutes.PROFILE_USERS as string }) },
    ] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, borderRight: '1px solid var(--border-dark)', display: 'flex', flexDirection: 'column' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ flex: 1, borderRight: 'none' }}
            items={menuItems}
          />
        </div>
        <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
