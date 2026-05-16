'use client';

import { NotificationProvider } from './layout/NotificationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
