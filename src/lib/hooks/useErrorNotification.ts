import { useEffect, useRef } from 'react';
import { App } from 'antd';

export function useErrorNotification(
  error: Error | null | undefined,
  fallbackMsg: string,
) {
  const { notification } = App.useApp();
  const lastShownMsg = useRef<string | null>(null);

  useEffect(() => {
    if (error && error.message !== lastShownMsg.current) {
      lastShownMsg.current = error.message;

      notification.error({
        title: error.name || fallbackMsg,
        description: error.message,
        duration: 5,
      });
    }

    if (!error) {
      lastShownMsg.current = null;
    }
  }, [error, fallbackMsg, notification]);
}
