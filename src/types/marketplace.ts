export type NoticeSeverity = 'success' | 'error' | 'info';

export type ShowStatusFn = (message: string, severity: NoticeSeverity) => void;

export interface WithShowStatus {
  onShowStatus: ShowStatusFn;
}

export type PageId = 'marketplace' | 'create' | 'admin' | 'transactions';
