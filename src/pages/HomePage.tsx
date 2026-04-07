import { Typography, Button, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import { ERoutes } from '@/routes';
import { AppHeader } from '@/components/AppHeader';

const { Title, Text } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 16,
        }}
      >
        <Title level={2}>{t('home.title')}</Title>
        <Text type="secondary">{t('home.subtitle')}</Text>
        {user && (
          <Space.Compact>
            <Button
              type="primary"
              onClick={() => void navigate({ to: ERoutes.LAYOUT_NEW })}
            >
              {t('home.createNewLayout')}
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'viewport', label: 'Viewport' },
                  { key: 'scroll', label: 'Scroll' },
                ],
                onClick: ({ key }) =>
                  void navigate({
                    to: `${ERoutes.LAYOUT_NEW}?mode=${key}` as string,
                  }),
              }}
            >
              <Button type="primary" icon={<DownOutlined />} />
            </Dropdown>
          </Space.Compact>
        )}
      </div>
    </div>
  );
}
