// src/layout/components/LeafOverlay.tsx
import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { DraggableAttributes } from '@dnd-kit/core';
import { AddPanelModal } from './AddPanelModal';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useCanEdit } from '@/layout/hooks/useCanEdit';
import { getDepth, findNode } from '@/layout/utils/treeUtils';
import type { LayoutNode, LeafNode, SplitDirection, SplitterNode } from '@/layout/types';
import styles from './LeafOverlay.module.less';

function hasAvailableDirection(node: LeafNode, root: LayoutNode, maxDepth: number): boolean {
  if (maxDepth === 0) return true;
  const depth = getDepth(node, root);
  if (depth < maxDepth) return true;
  const parent = findNode(root, node.id)?.parent as SplitterNode | null;
  return parent !== null;
}

function isDirectionAllowed(dir: SplitDirection, node: LeafNode, root: LayoutNode, maxDepth: number): boolean {
  if (maxDepth === 0) return true;
  const depth = getDepth(node, root);
  if (depth < maxDepth) return true;
  const parent = findNode(root, node.id)?.parent as SplitterNode | null;
  if (!parent) return false;
  const axis = dir === 'left' || dir === 'right' ? 'horizontal' : 'vertical';
  return parent.direction === axis;
}

type Props = {
  node: LeafNode;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: DraggableAttributes;
};

export function LeafOverlay({ node, dragListeners, dragAttributes }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const canEdit = useCanEdit();
  const addPanel = useLayoutStore(s => s.addPanel);
  const removePanel = useLayoutStore(s => s.removePanel);
  const root = useLayoutStore(s => s.root);
  const maxDepth = useLayoutStore(s => s.maxDepth);

  if (!canEdit) return null;

  const isRoot = findNode(root, node.id)?.parent === null;
  const showAddButton = hasAvailableDirection(node, root, maxDepth);

  function handleSelect(direction: SplitDirection) {
    if (!isDirectionAllowed(direction, node, root, maxDepth)) return;
    setModalOpen(false);
    addPanel(node.id, direction);
  }

  return (
    <>
      <div className={styles.border} />

      {dragListeners && (
        <div
          {...dragListeners}
          {...dragAttributes}
          className={styles.dragHandle}
        >
          ⠿
        </div>
      )}

      {!isRoot && (
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          className={styles.removeBtn}
          onClick={() => removePanel(node.id)}
        />
      )}

      {showAddButton && (
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          className={styles.addBtn}
          onClick={() => setModalOpen(true)}
        />
      )}

      <AddPanelModal
        open={modalOpen}
        onSelect={handleSelect}
        onCancel={() => setModalOpen(false)}
        isDirectionAllowed={(dir) => isDirectionAllowed(dir, node, root, maxDepth)}
      />
    </>
  );
}
