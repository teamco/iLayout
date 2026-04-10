// src/layout/components/LeafOverlay.tsx
import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { DraggableAttributes } from '@dnd-kit/core';
import { AddPanelModal } from './AddPanelModal';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useCanEdit } from '@/layout/hooks/useCanEdit';
import { getDepth, findNode } from '@/layout/utils/treeUtils';
import type {
  LayoutNode,
  LeafNode,
  SplitDirection,
  SplitterNode,
  ScrollRoot,
  GridRoot,
} from '@/layout/types';
import styles from './LeafOverlay.module.less';

/** Find which section contains a given node id */
function findSectionForNode(root: LayoutNode, nodeId: string): string | null {
  if (root.type === 'scroll') {
    const scrollRoot = root as unknown as ScrollRoot;
    for (const section of scrollRoot.sections) {
      if (containsNode(section.child, nodeId)) return section.id;
    }
  }
  if (root.type === 'grid') {
    const grid = root as unknown as GridRoot;
    for (const col of grid.columns) {
      const result = findSectionForNode(col.child, nodeId);
      if (result) return result;
    }
  }
  return null;
}

function containsNode(node: LayoutNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  if (node.type === 'splitter')
    return node.children.some((c) => containsNode(c, targetId));
  if (node.type === 'section') return containsNode(node.child, targetId);
  if (node.type === 'scroll') {
    const scroll = node as unknown as ScrollRoot;
    return scroll.sections.some((s) => containsNode(s, targetId));
  }
  if (node.type === 'grid') {
    const grid = node as unknown as GridRoot;
    return grid.columns.some((c) => containsNode(c.child, targetId));
  }
  return false;
}

function hasAvailableDirection(
  node: LeafNode,
  root: LayoutNode,
  maxDepth: number,
): boolean {
  if (maxDepth === 0) return true;
  const depth = getDepth(node, root);
  if (depth < maxDepth) return true;
  const parent = findNode(root, node.id)?.parent as SplitterNode | null;
  return parent !== null;
}

function isDirectionAllowed(
  dir: SplitDirection,
  node: LeafNode,
  root: LayoutNode,
  maxDepth: number,
): boolean {
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
  const addPanel = useLayoutStore((s) => s.addPanel);
  const addSection = useLayoutStore((s) => s.addSection);
  const removePanel = useLayoutStore((s) => s.removePanel);
  const root = useLayoutStore((s) => s.root);
  const maxDepth = useLayoutStore((s) => s.maxDepth);
  const layoutMode = useLayoutStore((s) => s.layoutMode);

  if (!canEdit) return null;

  const isRoot = findNode(root, node.id)?.parent === null;
  const showAddButton = hasAvailableDirection(node, root, maxDepth);

  function handleSelect(direction: SplitDirection) {
    if (!isDirectionAllowed(direction, node, root, maxDepth)) return;
    setModalOpen(false);

    // In scroll mode, top/bottom create new sections instead of splitting
    if (
      layoutMode === 'scroll' &&
      (direction === 'top' || direction === 'bottom')
    ) {
      const sectionId = findSectionForNode(root, node.id);
      if (sectionId) {
        addSection(direction === 'top' ? 'before' : 'after', sectionId);
        return;
      }
    }

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

      {!isRoot && layoutMode !== 'scroll' && (
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
        isDirectionAllowed={(dir) =>
          isDirectionAllowed(dir, node, root, maxDepth)
        }
      />
    </>
  );
}
