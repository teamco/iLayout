import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import md5 from 'blueimp-md5';
import { Avatar, Button, Dropdown, Select, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  GlobalOutlined,
  LogoutOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useThemeStore } from '@/themes/themeStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { ERoutes } from '@/routes';
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  STORAGE_KEY as LANG_STORAGE_KEY,
} from '@/i18n/i18n';
import styles from './AppHeader.module.less';

type AppHeaderProps = {
  children?: React.ReactNode;
};

export function AppHeader({ children }: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const themeMode = useThemeStore((s) => s.themeMode);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
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
    ...(lastSignIn
      ? [
          {
            key: 'lastLogin',
            label: (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('profile.lastLogin') + ':'} {lastSignIn}
              </Typography.Text>
            ),
            disabled: true,
          },
        ]
      : []),
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile.profile'),
      onClick: () => void navigate({ to: ERoutes.PROFILE }),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.signOut'),
      onClick: signOut,
    },
  ];

  return (
    <div className={styles.toolbar}>
      <span className={styles.toolbarTitle}>{t('home.title')}</span>
      <div className={styles.toolbarSpacer} />
      <Select
        size="small"
        value={i18n.language}
        showSearch
        suffixIcon={<GlobalOutlined />}
        style={{ width: 80 }}
        options={LANGUAGES.map((lang) => ({
          value: lang,
          label: LANGUAGE_LABELS[lang],
        }))}
        onChange={(lang: string) => {
          void i18n.changeLanguage(lang);
          try {
            localStorage.setItem(LANG_STORAGE_KEY, lang);
          } catch {
            /* ignore */
          }
        }}
      />
      <Tooltip
        title={
          themeMode === 'light'
            ? t('theme.light')
            : themeMode === 'dark'
              ? t('theme.dark')
              : t('theme.system')
        }
      >
        <Button
          size="small"
          icon={
            themeMode === 'light' ? (
              <SunOutlined />
            ) : themeMode === 'dark' ? (
              <MoonOutlined />
            ) : (
              <DesktopOutlined />
            )
          }
          onClick={cycleTheme}
        />
      </Tooltip>
      {children}
      <Dropdown
        menu={{ items: userMenuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Avatar
          size="small"
          src={
            avatarSrc ? (
              <img
                src={avatarSrc}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : undefined
          }
          icon={!avatarSrc ? <UserOutlined /> : undefined}
          style={{ cursor: 'pointer' }}
        />
      </Dropdown>
    </div>
  );
}
