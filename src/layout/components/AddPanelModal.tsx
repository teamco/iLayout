// src/layout/components/AddPanelModal.tsx
import React from 'react';
import { Modal, Button, Tooltip } from 'antd';
import type { SplitDirection } from '../types';

type Props = {
  open: boolean;
  onSelect: (direction: SplitDirection) => void;
  onCancel: () => void;
  isDirectionAllowed?: (dir: SplitDirection) => boolean;
};

const ARROWS: { dir: SplitDirection; label: string; style: React.CSSProperties }[] = [
  { dir: 'top',    label: '↑', style: { gridColumn: 2, gridRow: 1 } },
  { dir: 'left',   label: '←', style: { gridColumn: 1, gridRow: 2 } },
  { dir: 'right',  label: '→', style: { gridColumn: 3, gridRow: 2 } },
  { dir: 'bottom', label: '↓', style: { gridColumn: 2, gridRow: 3 } },
];

export function AddPanelModal({ open, onSelect, onCancel, isDirectionAllowed }: Props) {
  return (
    <Modal
      open={open}
      title="Add panel — choose direction"
      onCancel={onCancel}
      footer={null}
      width={280}
      centered
    >
      <div style={{ display: 'grid', gridTemplateColumns: '48px 48px 48px', gridTemplateRows: '48px 48px 48px', gap: 4, margin: '16px auto', width: 'fit-content' }}>
        {ARROWS.map(({ dir, label, style }) => {
          const allowed = isDirectionAllowed ? isDirectionAllowed(dir) : true;
          return (
            <Tooltip key={dir} title={!allowed ? 'Max depth reached' : undefined}>
              <Button
                type="primary"
                disabled={!allowed}
                style={{ ...style, width: 48, height: 48, fontSize: 20, padding: 0 }}
                onClick={() => allowed && onSelect(dir)}
              >
                {label}
              </Button>
            </Tooltip>
          );
        })}
        <div style={{ gridColumn: 2, gridRow: 2, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', borderRadius: 6, fontSize: 10, color: '#666' }}>
          HERE
        </div>
      </div>
    </Modal>
  );
}
