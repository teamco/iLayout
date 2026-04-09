import { useState, useEffect, useCallback } from 'react';
import type { LayoutNode, WidgetLayoutTheme } from './types';
import { fetchLayout } from './fetcher';
import { themeToStyleVars } from './theme';
import { EmbedLayoutRenderer } from './renderer/EmbedLayoutRenderer';
import './styles.css';

export type WidgetLayoutProps = {
  layoutId?: string;
  layout?: LayoutNode;
  layoutUrl?: string;
  fullPage?: boolean;
  theme?: WidgetLayoutTheme;
  apiBase?: string;
  apiKey?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
};

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: LayoutNode }
  | { status: 'error'; error: Error };

export function WidgetLayout({
  layoutId,
  layout,
  layoutUrl,
  fullPage,
  theme,
  apiBase,
  apiKey,
  onLoad,
  onError,
}: WidgetLayoutProps) {
  const [state, setState] = useState<State>(
    layout ? { status: 'ready', data: layout } : { status: 'loading' },
  );

  const load = useCallback(() => {
    setState({ status: 'loading' });
    fetchLayout({ layout, layoutUrl, layoutId, apiBase, apiKey })
      .then((data) => {
        setState({ status: 'ready', data });
        onLoad?.();
      })
      .catch((error: Error) => {
        setState({ status: 'error', error });
        onError?.(error);
      });
  }, [layout, layoutUrl, layoutId, apiBase, apiKey, onLoad, onError]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetch on mount sets state intentionally */
  useEffect(() => {
    if (layout) {
      onLoad?.();
      return;
    }
    load();
  }, [layout, layoutUrl, layoutId, apiBase, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  const themeVars = themeToStyleVars(theme);
  const className = ['al-root', fullPage && 'al-root--full-page'].filter(Boolean).join(' ');

  return (
    <div className={className} style={themeVars}>
      {state.status === 'loading' && (
        <div className="al-loading">
          <div className="al-skeleton" />
        </div>
      )}
      {state.status === 'error' && (
        <div className="al-error">
          <span>Failed to load layout</span>
          <button className="al-error-retry" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {state.status === 'ready' && <EmbedLayoutRenderer root={state.data} />}
    </div>
  );
}
