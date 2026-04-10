import { ControlOutlined } from '@ant-design/icons';
import type React from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { AntdIconProps } from '@ant-design/icons/es/components/AntdIcon';

type PageTitleProps = {
  name: string;
  Icon?: ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & RefAttributes<HTMLSpanElement>
  >;
};

export function PageTitle({
  name,
  Icon = ControlOutlined,
}: PageTitleProps): React.ReactNode {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Icon />
      {name}
    </span>
  );
}
