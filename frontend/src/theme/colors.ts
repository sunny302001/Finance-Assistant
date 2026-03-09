/**
 * FinanceFlow Color Theme — Dark-first palette
 */
export const Colors = {
  // Base
  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  border: '#475569',

  // Text
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Primary accent
  primary: '#6366f1',
  primaryLight: '#818cf8',

  // Category colors
  needs: { main: '#ef4444', light: '#fca5a5', dark: '#991b1b' },
  wants: { main: '#a855f7', light: '#d8b4fe', dark: '#6b21a8' },
  savings: { main: '#10b981', light: '#6ee7b7', dark: '#065f46' },
  debt: { main: '#f59e0b', light: '#fcd34d', dark: '#92400e' },

  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // Tab bar
  tabBar: '#0f172a',
  tabActive: '#6366f1',
  tabInactive: '#64748b',
};

export const getCategoryColor = (category: string) => {
  const map: Record<string, { main: string; light: string; dark: string }> = {
    Needs: Colors.needs,
    Wants: Colors.wants,
    Savings: Colors.savings,
    Debt: Colors.debt,
  };
  return map[category] || { main: '#6b7280', light: '#9ca3af', dark: '#374151' };
};
