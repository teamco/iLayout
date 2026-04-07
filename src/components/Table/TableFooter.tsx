import React from 'react';

import styles from './table.module.less';

type TTableFooterProps = {
  className?: string;
  /**
   * Pre-computed filtered count (memoized in useTable).
   * Use this for optimal performance — it only recalculates when entities or filters change.
   */
  computedFilteredCount?: number;
  /**
   * Total count before filtering.
   */
  totalCount?: number;
  /**
   * @deprecated Use computedFilteredCount instead.
   */
  of?: number;
  /**
   * @deprecated Use totalCount instead.
   */
  total?: number;
};

export const TableFooter = (props: TTableFooterProps): React.JSX.Element | null => {
  const { className = styles.gridFooter, computedFilteredCount, totalCount, of, total } = props;

  // Support legacy API (of/total) for backwards compatibility
  const filteredCount = computedFilteredCount ?? total ?? 0;
  const totalItems = totalCount ?? of ?? 0;

  if (totalItems === 0) {
    return null;
  }

  if (filteredCount === totalItems) {
    return <div className={className}>Total: {totalItems}</div>;
  }

  return (
    <div className={className}>
      Showing {filteredCount} of {totalItems}
    </div>
  );
};
