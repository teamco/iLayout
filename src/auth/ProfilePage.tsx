import { useState } from 'react';
import { Avatar, Button, Descriptions, Menu, Popconfirm, Table, Tag, Typography } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  LayoutOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import md5 from 'blueimp-md5';
import { subject } from '@casl/ability';
import { useAuth } from '@/auth/AuthContext';
import { useAbility } from '@/auth/AbilityContext';
import { EAction, ESubject } from '@/auth/abilities';
import { useLayouts, useSetStatus } from '@/lib/hooks/useLayoutQueries';
import { formatDate } from '@/lib/formatDate';
import type { LayoutRecord } from '@/lib/types';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { TableFooter } from '@/components/Table/TableFooter';

const { Title, Text } = Typography;

type Section = 'overview' | 'profile' | 'layouts' | 'widgets';

function OverviewSection() {
  return (
    <>
      <Title level={4}>Overview</Title>
      <Text type="secondary">Dashboard metrics coming soon.</Text>
    </>
  );
}

function ProfileSection() {
  const { user } = useAuth();
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
    <>
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
        <Descriptions.Item label="Provider">{provider}</Descriptions.Item>
        <Descriptions.Item label="User ID">
          <Text copyable style={{ fontSize: 12 }}>{user.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Created">{createdAt}</Descriptions.Item>
        <Descriptions.Item label="Last sign in">{lastSignIn}</Descriptions.Item>
        {meta.preferred_username && (
          <Descriptions.Item label="Username">{meta.preferred_username}</Descriptions.Item>
        )}
      </Descriptions>
    </>
  );
}

function LayoutsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: layouts, isLoading } = useLayouts(user?.id);
  const setStatus = useSetStatus();
  const ability = useAbility();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Typography.Text copyable style={{ fontSize: 12 }}>{id.slice(0, 8)}</Typography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LayoutRecord) => {
        const layoutSubject = subject(ESubject.LAYOUT, { kind: ESubject.LAYOUT, user_id: record.user_id });
        return (
          <span style={{ display: 'flex', gap: 8 }}>
            {ability.can(EAction.EDIT, layoutSubject) && (
              <Button
                size="small"
                onClick={() => navigate({
                  to: '/users/$userId/layouts/$layoutId' as string,
                  params: { userId: user!.id, layoutId: record.id },
                })}
              >
                Edit
              </Button>
            )}
            {ability.can(EAction.PUBLISH, layoutSubject) && record.status === 'draft' && (
              <Button
                size="small"
                onClick={() => setStatus.mutate({ id: record.id, version: record.version, status: 'published' })}
              >
                Publish
              </Button>
            )}
            {ability.can(EAction.PUBLISH, layoutSubject) && record.status === 'published' && (
              <Button
                size="small"
                onClick={() => setStatus.mutate({ id: record.id, version: record.version, status: 'draft' })}
              >
                Unpublish
              </Button>
            )}
            {ability.can(EAction.DELETE, layoutSubject) && (
              <Popconfirm
                title="Delete this layout?"
                onConfirm={() => setStatus.mutate({ id: record.id, version: record.version, status: 'deleted' })}
              >
                <Button size="small" danger>Delete</Button>
              </Popconfirm>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <GridToolbar>
        <Title level={4} style={{ margin: 0 }}>Layouts</Title>
        {ability.can(EAction.CREATE, ESubject.LAYOUT) && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate({
              to: '/users/$userId/layouts/new' as string,
              params: { userId: user!.id },
            })}
          >
            New Layout
          </Button>
        )}
      </GridToolbar>
      <Table
        dataSource={layouts ?? []}
        columns={columns}
        rowKey={(r) => `${r.id}-${r.version}`}
        loading={isLoading}
        pagination={false}
        size="small"
        footer={() => <TableFooter computedFilteredCount={layouts?.length ?? 0} totalCount={layouts?.length ?? 0} />}
      />
    </>
  );
}

function WidgetsSection() {
  return (
    <>
      <Title level={4}>Widgets</Title>
      <Text type="secondary">Widget library and usage stats coming soon.</Text>
    </>
  );
}

const SECTIONS: Record<Section, () => React.ReactNode> = {
  overview: OverviewSection,
  profile: ProfileSection,
  layouts: LayoutsSection,
  widgets: WidgetsSection,
};

export function ProfilePage() {
  const [section, setSection] = useState<Section>('profile');
  const navigate = useNavigate();
  const Content = SECTIONS[section];

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <div style={{ width: 220, borderRight: '1px solid var(--border-dark)', display: 'flex', flexDirection: 'column' }}>
        <Menu
          mode="inline"
          selectedKeys={[section]}
          onClick={({ key }) => { if (key in SECTIONS) setSection(key as Section); }}
          style={{ flex: 1, borderRight: 'none' }}
          items={[
            { key: 'back', icon: <ArrowLeftOutlined />, label: 'Back to app', onClick: () => navigate({ to: '/' }) },
            { type: 'divider' },
            { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
            { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
            { key: 'layouts', icon: <LayoutOutlined />, label: 'Layouts' },
            { key: 'widgets', icon: <AppstoreOutlined />, label: 'Widgets' },
          ]}
        />
      </div>
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <Content />
      </div>
    </div>
  );
}
