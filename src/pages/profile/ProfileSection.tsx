import { Avatar, Descriptions, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import md5 from 'blueimp-md5';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth/AuthContext';
import { PageLayout, PageTitle } from '@/components/PageLayout';

const { Title, Text } = Typography;

export function ProfileSection() {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const email = user.email ?? '';
  const name = meta.full_name || meta.name || meta.user_name || email;
  const avatarUrl = meta.avatar_url;
  const gravatarUrl = email
    ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon&s=128`
    : undefined;

  const provider = user.app_metadata?.provider ?? 'email';
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleString() : '—';
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—';

  return (
    <PageLayout title={<PageTitle name={t('profile.profile')} Icon={UserOutlined} />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar
          size={64}
          src={avatarUrl
            ? <img src={avatarUrl} referrerPolicy="no-referrer" />
            : gravatarUrl}
          icon={!avatarUrl && !gravatarUrl ? <UserOutlined /> : undefined}
        />
        <div>
          <Title level={4} style={{ margin: 0 }}>{name}</Title>
          <Text type="secondary">{email}</Text>
        </div>
      </div>

      <Descriptions column={1} size="small">
        <Descriptions.Item label={t('profile.provider')}>{provider}</Descriptions.Item>
        <Descriptions.Item label={t('profile.userId')}>
          <Text copyable style={{ fontSize: 12 }}>{user.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('profile.created')}>{createdAt}</Descriptions.Item>
        <Descriptions.Item label={t('profile.lastSignIn')}>{lastSignIn}</Descriptions.Item>
        {meta.preferred_username && (
          <Descriptions.Item label={t('profile.username')}>{meta.preferred_username}</Descriptions.Item>
        )}
      </Descriptions>
    </PageLayout>
  );
}
