import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.WEB_URL ?? 'http://localhost:3000';
const SENHA = process.env.SEED_PASSWORD;
const SAIDA = new URL('../docs/telas/', import.meta.url).pathname;
const DIA_EM_MS = 86_400_000;

mkdirSync(SAIDA, { recursive: true });

const navegador = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome', headless: true });

const novaPagina = async () => {
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'pt-BR' });
  return contexto.newPage();
};

const entrar = async (pagina, email, senha = SENHA) => {
  await pagina.goto(`${BASE}/login`);
  await pagina.getByLabel('E-mail').fill(email);
  await pagina.getByLabel('Senha').fill(senha);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
};

const foto = (pagina, nome) => pagina.screenshot({ path: `${SAIDA}${nome}.png`, fullPage: true });

const instanteLocal = (pagina, dias, hora, minuto) =>
  pagina.evaluate(([d, h, m]) => {
    const base = new Date(Date.now() + d * 86_400_000);
    base.setHours(h, m, 0, 0);
    return base.toISOString();
  }, [dias, hora, minuto]);

const visitante = await novaPagina();
await visitante.goto(`${BASE}/login`);
await foto(visitante, '01-login');
await entrar(visitante, 'aluno@labreserva.local', 'senha-incorreta');
await visitante.locator('div[role="alert"]').waitFor();
await foto(visitante, '02-login-erro');

const aluno = await novaPagina();
await entrar(aluno, 'aluno@labreserva.local');
await aluno.waitForURL('**/agenda');
const laboratorios = await (await aluno.request.get(`${BASE}/api/laboratorios`)).json();
const idDe = (nome) => laboratorios.find((lab) => lab.nome === nome).id;
const REDES = idDe('Laboratório de Redes');
await aluno.locator('button[aria-label^="Livre"]').first().waitFor();
await foto(aluno, '03-agenda-semanal');

await aluno.locator('button[aria-label^="Livre"][aria-label$="às 16:00"]').first().click();
await aluno.waitForURL('**/reservas/nova**');
await aluno.getByLabel('Finalidade').fill('Estudo em grupo de roteamento');
await foto(aluno, '04-solicitar-reserva');
await aluno.getByRole('button', { name: 'Solicitar reserva' }).click();
await aluno.getByText('Reserva registrada').waitFor();
await foto(aluno, '05-reserva-registrada');

const conflito = await instanteLocal(aluno, 1, 14, 30);
await aluno.goto(`${BASE}/reservas/nova?laboratorio=${REDES}&inicio=${encodeURIComponent(conflito)}`);
await aluno.getByLabel('Finalidade').fill('Tentativa em horário ocupado');
await aluno.getByRole('button', { name: 'Solicitar reserva' }).click();
await aluno.locator('div[role="alert"]').waitFor();
await foto(aluno, '06-erro-horario-ocupado');

const longa = await instanteLocal(aluno, 5, 8, 0);
await aluno.goto(`${BASE}/reservas/nova?laboratorio=${REDES}&inicio=${encodeURIComponent(longa)}`);
await aluno.getByLabel('Fim').fill('11:00');
await aluno.getByLabel('Finalidade').fill('Projeto em grupo');
await aluno.getByRole('button', { name: 'Solicitar reserva' }).click();
await aluno.locator('div[role="alert"]').waitFor();
await foto(aluno, '07-erro-duracao-aluno');

await aluno.goto(`${BASE}/reservas`);
await aluno.getByRole('table').waitFor();
await foto(aluno, '08-minhas-reservas');

const admin = await novaPagina();
await entrar(admin, 'admin@labreserva.local');
await admin.waitForURL('**/agenda');
await admin.goto(`${BASE}/aprovacoes`);
await admin.getByRole('table').waitFor();
await foto(admin, '09-aprovacoes');

const linhas = admin.getByRole('row');
await linhas.filter({ hasText: 'Estudo em grupo para a prova' }).getByRole('button', { name: 'Aprovar' }).click();
await admin.getByText('Estudo em grupo para a prova').waitFor({ state: 'detached' });

await linhas.filter({ hasText: 'Estudo em grupo de roteamento' }).getByRole('button', { name: 'Recusar' }).click();
await admin.getByLabel('Justificativa (obrigatória)').fill('Laboratório reservado para manutenção preventiva nesse horário');
await foto(admin, '10-recusar-solicitacao');
await admin.getByRole('button', { name: 'Recusar', exact: true }).last().click();
await admin.getByText('Estudo em grupo de roteamento').waitFor({ state: 'detached' });

await admin.goto(`${BASE}/laboratorios`);
await admin.getByRole('table').waitFor();
await foto(admin, '11-laboratorios');
await admin.getByRole('button', { name: 'Bloquear horário' }).first().click();
await admin.getByLabel('Motivo').fill('Manutenção da rede elétrica');
await foto(admin, '12-bloquear-horario');
await admin.keyboard.press('Escape');

await admin.goto(`${BASE}/usuarios`);
await admin.getByRole('table').waitFor();
await foto(admin, '13-usuarios');

await aluno.goto(`${BASE}/reservas`);
await aluno.getByRole('table').waitFor();
await foto(aluno, '14-reservas-decididas');

const professor = await novaPagina();
await entrar(professor, 'professor@labreserva.local');
await professor.waitForURL('**/agenda');
await professor.locator('button[aria-label^="Livre"]').first().waitFor();
await professor.getByRole('button', { name: 'Próxima semana ›' }).click();
await professor.locator('button[aria-label^="Livre"]').first().waitFor();
await foto(professor, '15-agenda-proxima-semana');

await navegador.close();
console.log('telas salvas em docs/telas');
