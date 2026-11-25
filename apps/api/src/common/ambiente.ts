const exigir = (nome: string): string => {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida`);
  return valor;
};

export const AMBIENTE = {
  jwtSecret: exigir('JWT_SECRET'),
  jwtExpiresIn: exigir('JWT_EXPIRES_IN'),
  cookieName: exigir('COOKIE_NAME'),
  porta: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
  producao: process.env.NODE_ENV === 'production',
};
