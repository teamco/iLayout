import React from 'react';
import { Button, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { SectionNode } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { renderNode } from './LayoutRenderer';
import styles from './SectionNode.module.less';

type Props = {
  section: SectionNode;
  onConfig: (sectionId: string) => void;
};

function getSectionStyle(section: SectionNode): React.CSSProperties {
  const style: React.CSSProperties = { width: '100%', position: 'relative' };
  switch (section.height.type) {
    case 'fixed': style.height = section.height.value; break;
    case 'min': style.minHeight = section.height.value; break;
    default: break;
  }
  if (section.overlap) style.marginTop = section.overlap;
  if (section.zIndex) style.zIndex = section.zIndex;
  return style;
}

export function SectionNodeComponent({ section, onConfig }: Props) {
  const editMode = useLayoutStore(s => s.editMode);

  return (
    <div
      className={clsx(styles.section, { [styles.sectionEdit]: editMode })}
      style={getSectionStyle(section)}
    >
      {editMode && (
        <Tooltip title="Section config">
          <Button size="small" icon={<SettingOutlined />} className={styles.configBtn} onClick={() => onConfig(section.id)} />
        </Tooltip>
      )}
      {renderNode(section.child)}
    </div>
  );
}
