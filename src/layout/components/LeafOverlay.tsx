// src/layout/components/LeafOverlay.tsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { AddPanelModal } from './AddPanelModal';
import { useLayoutStore } from '../store/layoutStore';
import { useCanEdit } from '../hooks/useCanEdit';
import { getDepth, findNode } from '../utils/treeUtils';
import type { LayoutNode, LeafNode, SplitDirection, SplitterNode } from '../types';

/** Returns true if at least one direction is available. */
function hasAvailableDirection(node: LeafNode, root: LayoutNode, maxDepth: number): boolean {
  if (maxDepth === 0) return true;
  const depth = getDepth(node, root);
  if (depth < maxDepth) return true;
  const parent = findNode(root, node.id)?.parent as SplitterNode | null;
  return parent !== null;
}

/** Returns true for directions allowed at current depth. */
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
  dragAttributes?: Record<string, unknown>;
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
      {/* Blue edit overlay border */}
      <div style={{ position: 'absolute', inset: 0, border: '2px solid #1890ff', borderRadius: 4, background: 'rgba(24,144,255,0.06)', pointerEvents: 'none' }} />

      {/* Drag handle (shown when DnD listeners are provided) */}
      {dragListeners && (
        <div
          {...dragListeners}
          {...dragAttributes}
          style={{ position: 'absolute', top: 4, left: 4, zIndex: 10, cursor: 'grab', color: '#1890ff', padding: 2, fontSize: 14 }}
        >
          ⠿
        </div>
      )}

      {/* Remove button */}
      {!isRoot && (
        <Button
          size="small"
          danger
          icon={<CloseOutlined />}
          style={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}
          onClick={() => removePanel(node.id)}
        />
      )}

      {/* Add button — hidden only when ALL directions are blocked */}
      {showAddButton && (
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
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
