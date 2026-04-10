import { Avatar, Button, Descriptions, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import md5 from 'blueimp-md5';
import { useProfile } from '@/lib/hooks/useProfileQueries';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';
import { formatDate } from '@/lib/formatDate';
import { ERoutes } from '@/routes';
import { AppHeader } from '@/components/AppHeader';

const { Title, Text } = Typography;

export function UserProfilePage() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: profile, isLoading, error } = useProfile(userId);

  useErrorNotification(error, 'Failed to load profile');

  if (isLoading) return <Spin size="large" fullscreen />;
  if (!profile) return null;

  const gravatarUrl = profile.email
    ? `https://www.gravatar.com/avatar/${md5(profile.email.trim().toLowerCase())}?d=identicon&s=128`
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppHeader />
      <div
        style={{
          maxWidth: 600,
          margin: '32px auto',
          padding: '0 16px',
          width: '100%',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => void navigate({ to: ERoutes.PROFILE_USERS as string })}
          style={{ marginBottom: 16 }}
        >
          {t('common.back')}
        </Button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Avatar
            size={64}
            src={
              profile.avatar_url ? (
                <img src={profile.avatar_url} referrerPolicy="no-referrer" />
              ) : (
                gravatarUrl
              )
            }
            icon={
              !profile.avatar_url && !gravatarUrl ? <UserOutlined /> : undefined
            }
          />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {profile.full_name || profile.email}
            </Title>
            <Text type="secondary">{profile.email}</Text>
            <div style={{ marginTop: 4 }}>
              {profile.is_blocked ? (
                <Tag color="red">{t('profile.blockUser')}</Tag>
              ) : profile.is_online ? (
                <Tag color="green">{t('profile.online')}</Tag>
              ) : (
                <Tag>{t('profile.offline')}</Tag>
              )}
            </div>
          </div>
        </div>

        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('profile.provider')}>
            {profile.provider ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.userId')}>
            <Text copyable style={{ fontSize: 12 }}>
              {profile.id}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.created')}>
            {formatDate(profile.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.lastSignIn')}>
            {profile.last_sign_in_at
              ? formatDate(profile.last_sign_in_at)
              : '—'}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
}
