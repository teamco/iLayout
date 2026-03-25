// src/App.tsx
import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { LayoutRenderer } from './layout/components/LayoutRenderer';

export default function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ width: '100vw', height: '100vh', background: '#0d0d0d' }}>
        <LayoutRenderer />
      </div>
    </ConfigProvider>
  );
}
