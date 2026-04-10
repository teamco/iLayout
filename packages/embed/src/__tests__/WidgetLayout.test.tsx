import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WidgetLayout } from '../WidgetLayout';
import type { LayoutNode } from '../types';
import '../widgets/init';

const mockLeaf: LayoutNode = {
  id: 'l1',
  type: 'leaf',
  widget: {
    widgetId: 'w1',
    resource: 'empty',
    content: { value: 'Test Widget' },
    config: {},
  },
};

describe('WidgetLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders inline layout immediately', async () => {
    render(<WidgetLayout layout={mockLeaf} />);
    await waitFor(() => {
      expect(screen.getByText('Test Widget')).toBeDefined();
    });
  });

  it('applies al-root class', () => {
    const { container } = render(<WidgetLayout layout={mockLeaf} />);
    expect(container.querySelector('.al-root')).not.toBeNull();
  });

  it('applies full-page class when fullPage is true', () => {
    const { container } = render(<WidgetLayout layout={mockLeaf} fullPage />);
    expect(container.querySelector('.al-root--full-page')).not.toBeNull();
  });

  it('applies theme as CSS variables', () => {
    const { container } = render(
      <WidgetLayout layout={mockLeaf} theme={{ colorPrimary: '#ff0000' }} />,
    );
    const root = container.querySelector('.al-root') as HTMLElement;
    expect(root.style.getPropertyValue('--al-color-primary')).toBe('#ff0000');
  });

  it('shows loading state when fetching', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(
      <WidgetLayout layoutUrl="https://example.com/a.json" />,
    );
    expect(container.querySelector('.al-loading')).not.toBeNull();
  });

  it('shows error state on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );
    render(<WidgetLayout layoutUrl="https://example.com/missing.json" />);
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeDefined();
    });
  });

  it('calls onLoad after successful render', async () => {
    const onLoad = vi.fn();
    render(<WidgetLayout layout={mockLeaf} onLoad={onLoad} />);
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('calls onError on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );
    const onError = vi.fn();
    render(
      <WidgetLayout layoutUrl="https://example.com/x.json" onError={onError} />,
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
