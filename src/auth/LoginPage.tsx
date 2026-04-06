import { useState } from 'react';
import { Card, Input, Button, Tabs, Divider, Typography, message, Space } from 'antd';
import { GoogleOutlined, GithubOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '@/lib/supabase';

const { Text } = Typography;

function EmailPasswordTab() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      message.success('Check your email to confirm your account');
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Input
        prefix={<MailOutlined />}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onPressEnter={handleSignIn}
      />
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onPressEnter={handleSignIn}
      />
      {error && <Text type="danger">{error}</Text>}
      <Space>
        <Button type="primary" loading={loading} onClick={handleSignIn}>Sign In</Button>
        <Button loading={loading} onClick={handleSignUp}>Sign Up</Button>
      </Space>
    </Space>
  );
}

function MagicLinkTab() {
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
    return <Text type="success">Magic link sent! Check your email.</Text>;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Input
        prefix={<MailOutlined />}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onPressEnter={handleSend}
      />
      {error && <Text type="danger">{error}</Text>}
      <Button type="primary" loading={loading} onClick={handleSend}>Send Magic Link</Button>
    </Space>
  );
}

async function handleOAuth(provider: 'google' | 'github') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + '/auth/callback' },
  });
  if (error) message.error(error.message);
}

export function LoginPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <Card title="Sign In" style={{ width: 400 }}>
        <Tabs
          items={[
            { key: 'email', label: 'Email', children: <EmailPasswordTab /> },
            { key: 'magic', label: 'Magic Link', children: <MagicLinkTab /> },
          ]}
        />
        <Divider>or</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block icon={<GoogleOutlined />} onClick={() => handleOAuth('google')}>
            Continue with Google
          </Button>
          <Button block icon={<GithubOutlined />} onClick={() => handleOAuth('github')}>
            Continue with GitHub
          </Button>
        </Space>
      </Card>
    </div>
  );
}
