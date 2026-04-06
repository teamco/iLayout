import { Typography } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageLayout, PageTitle } from '@/components/PageLayout';

const { Text } = Typography;

export function OverviewSection() {
  const { t } = useTranslation();
  return (
    <PageLayout title={<PageTitle name={t('profile.overview')} Icon={DashboardOutlined} />}>
      <Text type="secondary">{t('profile.dashboardComingSoon')}</Text>
    </PageLayout>
  );
}
