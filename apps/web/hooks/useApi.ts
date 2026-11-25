'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Estado<T> = { dados: T | null; erro: string | null; carregando: boolean };

export function useApi<T>(caminho: string | null) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: null, carregando: caminho !== null });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    if (caminho === null) return;
    let ativo = true;
    setEstado((atual) => ({ ...atual, carregando: true }));
    api<T>(caminho)
      .then((dados) => ativo && setEstado({ dados, erro: null, carregando: false }))
      .catch((erro: Error) => ativo && setEstado({ dados: null, erro: erro.message, carregando: false }));
    return () => {
      ativo = false;
    };
  }, [caminho, versao]);

  const recarregar = useCallback(() => setVersao((atual) => atual + 1), []);
  return { ...estado, recarregar };
}
