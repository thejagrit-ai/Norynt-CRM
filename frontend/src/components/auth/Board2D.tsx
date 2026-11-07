import React from 'react';
import styles from './auth.module.css';

function Deal({
  name,
  value,
  initials,
  color,
  className,
  children,
}: {
  name: string;
  value: string;
  initials: string;
  color: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${styles.deal} ${className ?? ''}`}>
      {children}
      <span className={styles.dealName}>{name}</span>
      <span className={styles.dealMeta}>
        <span className={styles.dealValue}>{value}</span>
        <span className={styles.avatar} style={{ background: color }} aria-hidden="true">
          {initials}
        </span>
      </span>
    </div>
  );
}

/** Flat fallback used when WebGL is unavailable. */
export function Board2D() {
  return (
      <div className={styles.board}>
        <div className={styles.col}>
          <div className={styles.colHead}>New lead <span className={styles.colCount}>2</span></div>
          <Deal name="Brightpath Dental" value="$6,200" initials="AK" color="#2158d6" />
          <Deal name="Oakline Interiors" value="$3,850" initials="RM" color="#0e7490" />
        </div>
        <div className={styles.col}>
          <div className={styles.colHead}>Proposal <span className={styles.colCount}>2</span></div>
          <Deal name="Northwind Foods" value="$12,000" initials="SP" color="#7c3aed" />
          <Deal name="Harbor Logistics" value="$18,400" initials="JT" color="#c2410c" className={styles.mover}>
            <span className={styles.wonTag}>Won</span>
          </Deal>
        </div>
        <div className={styles.col}>
          <div className={styles.colHead}>Won <span className={styles.colCount}>2</span></div>
          <Deal name="Vela Studio" value="$9,750" initials="LD" color="#15803d" />
          <div className={styles.slot} />
        </div>
      </div>
  );
}
