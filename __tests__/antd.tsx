import React from 'react';
import { vi } from 'vitest';

export const antdFormApi = {
  setFieldsValue: vi.fn(),
  getFieldsValue: vi.fn(),
};

export function createAntdMock() {
  const FormComponent = ({ children }: { children: React.ReactNode }) => (
    <form>{children}</form>
  );

  const FormItem = ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label?: React.ReactNode;
  }) => (
    <label>
      {label ? <span>{label}</span> : null}
      {children}
    </label>
  );

  const SpaceComponent = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );

  return {
    Modal: ({
      open,
      title,
      children,
      footer,
    }: {
      open: boolean;
      title: React.ReactNode;
      children: React.ReactNode;
      footer?: React.ReactNode;
    }) =>
      open ? (
        <div data-testid="antd-modal">
          <div role="heading">{title}</div>
          {children}
          <div>{footer}</div>
        </div>
      ) : null,
    Tabs: ({
      items,
    }: {
      items: Array<{
        key: string;
        label: React.ReactNode;
        children: React.ReactNode;
      }>;
    }) => (
      <div>
        {items.map((item) => (
          <section key={item.key} aria-label={String(item.label)}>
            {item.children}
          </section>
        ))}
      </div>
    ),
    Form: Object.assign(FormComponent, {
      Item: FormItem,
      useForm: () => [antdFormApi],
    }),
    Input: Object.assign(
      ({
        value,
        onChange,
      }: {
        value?: string;
        onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
      }) => <input value={value} onChange={onChange} />,
      {
        TextArea: ({
          value,
          onChange,
          placeholder,
        }: {
          value?: string;
          onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
          placeholder?: string;
        }) => (
          <textarea
            aria-label={placeholder ?? 'content'}
            value={value}
            onChange={onChange}
          />
        ),
      },
    ),
    InputNumber: ({ value }: { value?: number }) => (
      <input type="number" value={value} readOnly />
    ),
    Select: ({
      value,
      options = [],
      onChange,
    }: {
      value?: string;
      options?: Array<{ value: string; label: string }>;
      onChange?: (value: string) => void;
    }) => (
      <select
        aria-label="select"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
    Button: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
    Space: Object.assign(SpaceComponent, {
      Compact: SpaceComponent,
    }),
    Typography: {
      Text: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
      ),
    },
  };
}
