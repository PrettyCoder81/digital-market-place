/** Normalize any thrown error into a user-friendly message. */
export function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { code?: number; reason?: string; message?: string };
  if (err?.code === 4001) return 'Transaction rejected by user';
  return err?.reason || err?.message || fallback;
}

/**
 * Run an async transaction with standardized loading + error handling.
 * Returns true when the action completed without throwing.
 */
export async function runTransaction(options: {
  action: () => Promise<void>;
  onError: (message: string) => void;
  fallbackMessage: string;
  onStart?: () => void;
  onFinish?: () => void;
}): Promise<boolean> {
  const { action, onError, fallbackMessage, onStart, onFinish } = options;
  onStart?.();
  try {
    await action();
    return true;
  } catch (error) {
    console.error(fallbackMessage, error);
    onError(getErrorMessage(error, fallbackMessage));
    return false;
  } finally {
    onFinish?.();
  }
}
