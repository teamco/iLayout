import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  App as AntApp,
  Card,
  Input,
  Button,
  Tabs,
  Divider,
  Typography,
  Space,
} from 'antd';
import {
  GoogleOutlined,
  GithubOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { supabase } from '@/lib/supabase';

const { Text } = Typography;

function EmailPasswordTab() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleSignUp() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      message.success(t('auth.checkEmail'));
    }
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Input
        size="large"
        prefix={<MailOutlined />}
        placeholder={t('auth.email')}
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onPressEnter={handleSignIn}
        styles={{ prefix: { marginInlineEnd: 8 } }}
      />
      <Input.Password
        size="large"
        prefix={<LockOutlined />}
        placeholder={t('auth.password')}
        autoComplete="off"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={handleSignIn}
        styles={{ prefix: { marginInlineEnd: 8 } }}
      />
      {error && <Text type="danger">{error}</Text>}
      <Space>
        <Button
          size="large"
          type="primary"
          loading={loading}
          onClick={handleSignIn}
        >
          {t('common.signIn')}
        </Button>
        <Button size="large" loading={loading} onClick={handleSignUp}>
          {t('common.signUp')}
        </Button>
      </Space>
    </Space>
  );
}

function MagicLinkTab() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return <Text type="success">{t('auth.magicLinkSent')}</Text>;
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Input
        size="large"
        prefix={<MailOutlined />}
        placeholder={t('auth.email')}
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onPressEnter={handleSend}
        styles={{ prefix: { marginInlineEnd: 8 } }}
      />
      {error && <Text type="danger">{error}</Text>}
      <Button
        size="large"
        type="primary"
        loading={loading}
        onClick={handleSend}
      >
        {t('auth.sendMagicLink')}
      </Button>
    </Space>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();

  async function handleOAuth(provider: 'google' | 'github') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
    if (error) message.error(error.message);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}
    >
      <Card title={t('common.signIn')} style={{ width: 400 }}>
        <Tabs
          items={[
            {
              key: 'email',
              label: t('auth.email'),
              children: <EmailPasswordTab />,
            },
            {
              key: 'magic',
              label: t('auth.sendMagicLink'),
              children: <MagicLinkTab />,
            },
          ]}
        />
        <Divider>{t('common.or')}</Divider>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button
            size="large"
            block
            icon={<GoogleOutlined />}
            onClick={() => handleOAuth('google')}
          >
            {t('auth.continueWithGoogle')}
          </Button>
          <Button
            size="large"
            block
            icon={<GithubOutlined />}
            onClick={() => handleOAuth('github')}
          >
            {t('auth.continueWithGithub')}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
