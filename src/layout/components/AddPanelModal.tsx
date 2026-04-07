// src/layout/components/AddPanelModal.tsx
import { Modal, Button, Tooltip } from 'antd';
import type { SplitDirection } from '@/layout/types';
import styles from './AddPanelModal.module.less';

type Props = {
  open: boolean;
  onSelect: (direction: SplitDirection) => void;
  onCancel: () => void;
  isDirectionAllowed?: (dir: SplitDirection) => boolean;
};

const ARROWS: { dir: SplitDirection; label: string; className: string }[] = [
  { dir: 'top',    label: '↑', className: styles.arrowTop },
  { dir: 'left',   label: '←', className: styles.arrowLeft },
  { dir: 'right',  label: '→', className: styles.arrowRight },
  { dir: 'bottom', label: '↓', className: styles.arrowBottom },
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
      <div className={styles.grid}>
        {ARROWS.map(({ dir, label, className }) => {
          const allowed = isDirectionAllowed ? isDirectionAllowed(dir) : true;
          return (
            <Tooltip key={dir} title={!allowed ? 'Max depth reached' : undefined}>
              <Button
                type="primary"
                disabled={!allowed}
                className={`${styles.arrowBtn} ${className}`}
                onClick={() => allowed && onSelect(dir)}
              >
                {label}
              </Button>
            </Tooltip>
          );
        })}
        <div className={styles.hereCell}>HERE</div>
      </div>
    </Modal>
  );
}
