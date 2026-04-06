import { Typography, Button } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';

const { Title, Text } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
      <Title level={2}>Widgets</Title>
      <Text type="secondary">Your layout dashboard is coming soon.</Text>
      {user && (
        <Button type="primary" onClick={() => navigate({ to: '/' })}>
          Go to Dashboard
        </Button>
      )}
    </div>
  );
}
