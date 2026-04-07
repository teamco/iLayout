import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WidgetConfigModal } from '../WidgetConfigModal';
import type { WidgetRef } from '@/layout/types';
import { antdFormApi } from '../../../../__tests__/antd';

vi.mock('@/widgets/registry', () => ({
  getWidgetDef: vi.fn(() => undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('antd', async () => {
  const { createAntdMock } = await import('../../../../__tests__/antd');
  return createAntdMock();
});

describe('WidgetConfigModal', () => {
  const baseWidget: WidgetRef = {
    widgetId: 'widget-1',
    resource: 'image',
    content: { value: 'https://example.com/original.png' },
    config: {},
    bounds: {
      marginTop: '10px',
      marginBottom: '20%',
      marginLeft: '5px',
      marginRight: '15%',
      align: 'center',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    antdFormApi.getFieldsValue.mockReturnValue({
      marginTopNum: 10,
      marginTopUnit: 'px',
      marginBottomNum: 20,
      marginBottomUnit: '%',
      marginLeftNum: 5,
      marginLeftUnit: 'px',
      marginRightNum: 15,
      marginRightUnit: '%',
      align: 'center',
    });
  });

  it('hydrates form values from widget bounds when opened', () => {
    render(
      <WidgetConfigModal
        open
        widget={baseWidget}
        onClose={vi.fn()}
        onChange={vi.fn()}
      />,
    );

    expect(antdFormApi.setFieldsValue).toHaveBeenCalledWith({
      marginTopNum: 10,
      marginTopUnit: 'px',
      marginBottomNum: 20,
      marginBottomUnit: '%',
      marginLeftNum: 5,
      marginLeftUnit: 'px',
      marginRightNum: 15,
      marginRightUnit: '%',
      align: 'center',
    });
  });

  it('resets content to the latest widget value when reopened', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <WidgetConfigModal
        open
        widget={baseWidget}
        onClose={onClose}
        onChange={onChange}
      />,
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'draft value');

    rerender(
      <WidgetConfigModal
        open={false}
        widget={baseWidget}
        onClose={onClose}
        onChange={onChange}
      />,
    );

    const nextWidget: WidgetRef = {
      ...baseWidget,
      content: { value: 'https://example.com/new.png' },
    };

    rerender(
      <WidgetConfigModal
        open
        widget={nextWidget}
        onClose={onClose}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue(
      'https://example.com/new.png',
    );
  });

  it('saves the edited content with computed bounds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClose = vi.fn();

    render(
      <WidgetConfigModal
        open
        widget={baseWidget}
        onClose={onClose}
        onChange={onChange}
      />,
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'updated value');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(onChange).toHaveBeenCalledWith({
      ...baseWidget,
      content: { value: 'updated value' },
      bounds: {
        marginTop: '10px',
        marginBottom: '20%',
        marginLeft: '5px',
        marginRight: '15%',
        align: 'center',
      },
    });
    expect(onClose).toHaveBeenCalled();
  });
});
