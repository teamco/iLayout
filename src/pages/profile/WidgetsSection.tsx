import { Typography } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageLayout, PageTitle } from '@/components/PageLayout';

const { Text } = Typography;

export function WidgetsSection() {
  const { t } = useTranslation();
  return (
    <PageLayout title={<PageTitle name={t('profile.widgets')} Icon={AppstoreOutlined} />}>
      <Text type="secondary">{t('profile.widgetsComingSoon')}</Text>
    </PageLayout>
  );
}
