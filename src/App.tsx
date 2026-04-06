// src/App.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import md5 from 'blueimp-md5';
import { Avatar, Button, Dropdown, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { AppstoreOutlined, CodeOutlined, LogoutOutlined, SaveOutlined, UserOutlined, SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useThemeStore } from '@/themes/themeStore';
import { useAuth } from '@/auth/AuthContext';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { initAutoSave } from '@/layout/storage/autoSave';
import { localStorageAdapter } from '@/layout/storage/localStorageAdapter';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
import styles from './App.module.less';

const LAYOUT_ID = 'default';

type AppProps = {
  layoutId?: string;
  onSave?: () => void;
  saving?: boolean;
};

export default function App({ layoutId, onSave, saving }: AppProps) {
  const { t } = useTranslation();
  const editMode = useLayoutStore(s => s.editMode);
  const setEditMode = useLayoutStore(s => s.setEditMode);
  const showGrid = useLayoutStore(s => s.showGrid);
  const toggleGrid = useLayoutStore(s => s.toggleGrid);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  const themeMode = useThemeStore(s => s.themeMode);
  const cycleTheme = useThemeStore(s => s.cycleTheme);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const userName = user?.user_metadata?.full_name || user?.email || 'User';
  const providerAvatar = user?.user_metadata?.avatar_url;
  const [avatarError, setAvatarError] = useState(false);

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=64`
    : undefined;

  const avatarSrc = avatarError ? gravatarUrl : providerAvatar;

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : undefined;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: userName,
    },
    ...(lastSignIn ? [{
      key: 'lastLogin',
      label: <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('profile.lastLogin') + ':'} {lastSignIn}</Typography.Text>,
      disabled: true,
    }] : []),
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile.profile'),
      onClick: () => navigate({ to: ERoutes.PROFILE }),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.signOut'),
      onClick: signOut,
    },
  ];

  // Only use localStorage auto-save when not in Supabase mode
  useEffect(() => {
    if (layoutId) return;
    localStorageAdapter.load(LAYOUT_ID).then(saved => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    return initAutoSave(LAYOUT_ID, localStorageAdapter);
  }, [layoutId]);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, toggleGrid, onSave]);

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Widgets</span>
        <div className={styles.toolbarSpacer} />
        <Tooltip title={themeMode === 'light' ? t('theme.light') : themeMode === 'dark' ? t('theme.dark') : t('theme.system')}>
          <Button
            size="small"
            icon={themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <DesktopOutlined />}
            onClick={cycleTheme}
          />
        </Tooltip>
        <Tooltip title={t('layout.layoutJson')}>
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={() => setJsonModalOpen(true)}
          />
        </Tooltip>
        <Can I={EAction.EDIT} a={ESubject.LAYOUT}>
          <Button
            type={editMode ? 'primary' : 'default'}
            size="small"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✏️ ' + t('layout.editModeOn') : t('layout.editMode')}
          </Button>
        </Can>
        {editMode && onSave && (
          <Tooltip title={t('common.save') + ' (Ctrl+S)'}>
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={onSave}
            />
          </Tooltip>
        )}
        {editMode && (
          <Tooltip title={t('layout.toggleGrid') + ' (Ctrl+G)'}>
            <Button
              type={showGrid ? 'primary' : 'default'}
              size="small"
              icon={<AppstoreOutlined />}
              onClick={toggleGrid}
            />
          </Tooltip>
        )}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Avatar
            size="small"
            src={avatarSrc ? <img src={avatarSrc} referrerPolicy="no-referrer" onError={() => setAvatarError(true)} /> : undefined}
            icon={!avatarSrc ? <UserOutlined /> : undefined}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </div>
      <div className={styles.canvas}>
        <GridProvider>
          <LayoutRenderer />
          {showGrid && <GridOverlay />}
        </GridProvider>
      </div>
      <LayoutJsonModal open={jsonModalOpen} onClose={() => setJsonModalOpen(false)} />
    </div>
  );
}
