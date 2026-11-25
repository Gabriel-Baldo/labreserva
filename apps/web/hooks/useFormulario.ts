'use client';

import { FormEvent, useState } from 'react';

export function useFormulario<T extends Record<string, string>>(inicial: T, enviar: (valores: T) => Promise<void>) {
  const [valores, setValores] = useState<T>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo: keyof T) => (valor: string) => setValores((atual) => ({ ...atual, [campo]: valor }));

  const submeter = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    await enviar(valores)
      .catch((falha: Error) => setErro(falha.message))
      .finally(() => setEnviando(false));
  };

  return { valores, alterar, erro, enviando, submeter, redefinir: () => setValores(inicial) };
}
