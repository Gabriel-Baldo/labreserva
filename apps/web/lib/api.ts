export class ErroDeApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

type Opcoes = { method?: string; corpo?: unknown };

const MENSAGEM_PADRAO = 'Erro inesperado. Tente novamente.';

const mensagemDe = (dados: { message?: string | string[] } | null): string =>
  [dados?.message ?? MENSAGEM_PADRAO].flat().join('. ');

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const resposta = await fetch(`/api${caminho}`, {
    method: opcoes.method ?? 'GET',
    headers: { 'content-type': 'application/json' },
    body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    credentials: 'same-origin',
  });
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) throw new ErroDeApi(resposta.status, mensagemDe(dados));
  return dados as T;
}
