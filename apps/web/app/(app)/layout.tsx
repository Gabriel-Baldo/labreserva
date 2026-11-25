'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { SessaoProvider } from '@/hooks/useSessao';

export default function LayoutAutenticado({ children }: { children: ReactNode }) {
  return (
    <SessaoProvider>
      <AppShell>{children}</AppShell>
    </SessaoProvider>
  );
}
