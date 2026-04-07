import { Button, Result } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ERoutes } from '@/routes';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Result
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
      status="404"
      title="404"
      subTitle={t('common.notFound')}
      extra={
        <Button type="primary" onClick={() => void navigate({ to: ERoutes.HOME })}>
          {t('common.back')}
        </Button>
      }
    />
  );
}
