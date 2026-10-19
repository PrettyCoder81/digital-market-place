/**
 * Shared UI / domain types for the marketplace frontend.
 */

/** Severity used across notifications and alerts. */
export type NoticeSeverity = 'success' | 'error' | 'info';

/** Callback shape for showing a global notification (Snackbar). */
export type ShowStatusFn = (message: string, severity: NoticeSeverity) => void;

/** Common prop passed to every page that can trigger notifications. */
export interface WithShowStatus {
  onShowStatus: ShowStatusFn;
}

/** Pages available in the app navigation. */
export type PageId = 'marketplace' | 'create' | 'admin' | 'transactions';
