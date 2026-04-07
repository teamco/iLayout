import { Avatar, Button, Dropdown, Table, Tag, Typography } from 'antd';
import { MoreOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { TeamOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { ERoutes } from '@/routes';
import {
  useProfiles,
  useBlockUser,
  useForceLogoutUser,
} from '@/lib/hooks/useProfileQueries';
import { formatDate } from '@/lib/formatDate';
import type { ProfileRecord } from '@/lib/types';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { TableFooter } from '@/components/Table/TableFooter';
import { PageLayout, PageTitle } from '@/components/PageLayout';
import type { MenuProps } from 'antd';

export function UsersSection() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: users = [], isFetching, refetch } = useProfiles();
  const blockUser = useBlockUser();
  const forceLogout = useForceLogoutUser();

  const columns = [
    {
      title: t('profile.profile'),
      key: 'user',
      width: 250,
      render: (_: unknown, record: ProfileRecord) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            size="small"
            src={
              record.avatar_url ? (
                <img src={record.avatar_url} referrerPolicy="no-referrer" />
              ) : undefined
            }
            icon={!record.avatar_url ? <UserOutlined /> : undefined}
          />
          <span>
            <Typography.Text strong>
              {record.full_name || record.email}
            </Typography.Text>
            {record.full_name && (
              <Typography.Text
                type="secondary"
                style={{ display: 'block', fontSize: 12 }}
              >
                {record.email}
              </Typography.Text>
            )}
          </span>
        </span>
      ),
    },
    {
      title: t('profile.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
    },
    {
      title: t('common.columnStatus'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: ProfileRecord) => {
        if (record.is_blocked)
          return <Tag color="red">{t('profile.blockUser')}</Tag>;
        return record.is_online ? (
          <Tag color="green">{t('profile.online')}</Tag>
        ) : (
          <Tag>{t('profile.offline')}</Tag>
        );
      },
    },
    {
      title: t('profile.lastSignIn'),
      dataIndex: 'last_sign_in_at',
      key: 'last_sign_in_at',
      width: 180,
      render: (date: string | null) => (date ? formatDate(date) : '—'),
    },
    {
      title: t('common.columnActions'),
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: ProfileRecord) => {
        const isSelf = record.id === currentUser?.id;

        const items: MenuProps['items'] = [
          {
            key: 'profile',
            label: t('profile.viewProfile'),
            onClick: () =>
              void navigate({
                to: ERoutes.USER_PROFILE as string,
                params: { userId: record.id },
              }),
          },
        ];

        if (!isSelf) {
          items.push(
            { type: 'divider' },
            {
              key: 'block',
              label: record.is_blocked
                ? t('profile.unblockUser')
                : t('profile.blockUser'),
              danger: !record.is_blocked,
              onClick: () =>
                blockUser.mutate({
                  userId: record.id,
                  blocked: !record.is_blocked,
                }),
            },
            {
              key: 'logout',
              label: t('profile.logoutUser'),
              danger: true,
              disabled: !record.is_online,
              onClick: () => forceLogout.mutate(record.id),
            },
          );
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageLayout
      title={<PageTitle name={t('profile.users')} Icon={TeamOutlined} />}
    >
      <GridToolbar
        onRefresh={() => void refetch()}
        exportData={users}
        exportFileName="users"
      />
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={isFetching}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        footer={() => (
          <TableFooter
            computedFilteredCount={users.length}
            totalCount={users.length}
          />
        )}
      />
    </PageLayout>
  );
}
