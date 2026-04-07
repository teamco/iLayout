import { Descriptions, Spin } from 'antd';
import type React from 'react';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { AccessDenied } from '@/pages/AccessDenied';

import styles from './PageLayout.module.less';

type PageLayoutProps = {
  title: React.ReactNode | string;
  description?: React.ReactNode | string;
  action?: string;
  subject?: string;
  children?: React.ReactNode;
  extra?: React.ReactNode[];
  loading?: boolean;
};

export function PageLayout(props: PageLayoutProps) {
  const {
    action = EAction.VIEW,
    subject = ESubject.LAYOUT,
    title,
    description,
    extra = [],
    loading = false,
  } = props;

  return (
    <div className={styles.pageLayout}>
      <Can I={action} a={subject}>
        <div>
          <Descriptions
            title={title}
            className={description ? styles.description : undefined}
          >
            {description ? (
              <Descriptions.Item>{description}</Descriptions.Item>
            ) : null}
          </Descriptions>
          {extra.length > 0 && (
            <div className={styles.extra}>
              {extra.map((item, idx) => (
                <div key={idx}>{item}</div>
              ))}
            </div>
          )}
        </div>
        <Spin spinning={loading}>
          <div>{props.children}</div>
        </Spin>
      </Can>
      <Can not I={action} a={subject}>
        <AccessDenied />
      </Can>
    </div>
  );
}
