const BASE = process.env.API_URL ?? 'http://localhost:3001/api';
const SENHA = process.env.SEED_PASSWORD;
const DESLOCAMENTO = process.env.SEED_UTC_OFFSET ?? '-03:00';
const DIA_EM_MS = 86_400_000;

const resultados = [];
const verificar = (nome, condicao, detalhe = '') => {
  resultados.push(condicao);
  console.log(`${condicao ? 'OK   ' : 'FALHA'} ${nome}${condicao ? '' : ` -> ${detalhe}`}`);
};

const instante = (dias, hora) => {
  const dia = new Date(Date.now() + dias * DIA_EM_MS).toISOString().slice(0, 10);
  return new Date(`${dia}T${hora}:00${DESLOCAMENTO}`).toISOString();
};

const sessao = async (email) => {
  const resposta = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, senha: SENHA }),
  });
  const cookie = resposta.headers.getSetCookie()[0].split(';')[0];
  return async (caminho, opcoes = {}) => {
    const r = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      headers: { 'content-type': 'application/json', cookie, ...(opcoes.headers ?? {}) },
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
    });
    const texto = await r.text();
    return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
  };
};

const admin = await sessao('admin@labreserva.local');
const professor = await sessao('professor@labreserva.local');
const aluno = await sessao('aluno@labreserva.local');

const labs = (await admin('/laboratorios')).corpo;
const hardware = labs.find((l) => l.nome === 'Laboratório de Hardware');
const reserva = (lab, dia, de, ate, finalidade = 'Teste automatizado') => ({
  method: 'POST',
  body: { laboratorioId: lab.id, inicio: instante(dia, de), fim: instante(dia, ate), finalidade },
});

const base = 1 + (Date.now() % 20);

const pendente = await aluno('/reservas', reserva(hardware, base, '09:00', '10:00'));
verificar('aluno cria reserva PENDENTE', pendente.status === 201 && pendente.corpo.status === 'PENDENTE', JSON.stringify(pendente));

const dentroDoLimite = await aluno('/reservas', reserva(hardware, base, '10:00', '12:00'));
verificar('aluno com exatamente 2h é aceito (borda)', dentroDoLimite.status === 201, JSON.stringify(dentroDoLimite));

const acimaDoLimite = await aluno('/reservas', reserva(hardware, base + 1, '08:00', '10:01'));
verificar('aluno com 2h01 é recusado (422)', acimaDoLimite.status === 422, JSON.stringify(acimaDoLimite));

const alemDe30Dias = await aluno('/reservas', reserva(hardware, 31, '09:00', '10:00'));
verificar('reserva além de 30 dias é recusada (422)', alemDe30Dias.status === 422, JSON.stringify(alemDe30Dias));

const passada = await professor('/reservas', reserva(hardware, -1, '09:00', '10:00'));
verificar('reserva no passado é recusada (422)', passada.status === 422, JSON.stringify(passada));

const foraDoHorario = await professor('/reservas', reserva(hardware, base + 2, '17:30', '18:30'));
verificar('fora do funcionamento é recusada (422)', foraDoHorario.status === 422, JSON.stringify(foraDoHorario));

const sobreposta = await professor('/reservas', reserva(hardware, base, '09:30', '10:30'));
verificar('horário sobreposto é recusado (409)', sobreposta.status === 409, JSON.stringify(sobreposta));

const encostada = await professor('/reservas', reserva(hardware, base, '12:00', '13:00'));
verificar('reserva que só encosta no fim da outra é aceita (borda)', encostada.status === 201, JSON.stringify(encostada));
verificar('professor tem aprovação automática', encostada.corpo.status === 'APROVADA', JSON.stringify(encostada));

const simultaneas = await Promise.all(
  [professor, aluno, admin, professor, aluno, admin].map((quem) => quem('/reservas', reserva(hardware, base + 3, '14:00', '15:00'))),
);
const criadas = simultaneas.filter((r) => r.status === 201).length;
const conflitos = simultaneas.filter((r) => r.status === 409).length;
verificar('6 pedidos simultâneos geram 1 reserva e 5 conflitos', criadas === 1 && conflitos === 5, JSON.stringify(simultaneas.map((r) => r.status)));

const semPermissao = await aluno('/usuarios');
verificar('aluno não lista usuários (403)', semPermissao.status === 403, JSON.stringify(semPermissao));

const semSessao = await fetch(`${BASE}/reservas/minhas`);
verificar('sem sessão é 401', semSessao.status === 401);

const pendentes = (await admin('/aprovacoes/pendentes')).corpo;
verificar('pendentes ordenadas pela data mais próxima', pendentes.every((p, i) => i === 0 || new Date(pendentes[i - 1].inicio) <= new Date(p.inicio)));

const semJustificativa = await admin(`/aprovacoes/${pendente.corpo.id}/recusar`, { method: 'POST', body: { justificativa: '' } });
verificar('recusar sem justificativa é 400', semJustificativa.status === 400, JSON.stringify(semJustificativa));

const aprovada = await admin(`/aprovacoes/${pendente.corpo.id}/aprovar`, { method: 'POST' });
verificar('admin aprova reserva pendente', aprovada.status === 200 && aprovada.corpo.status === 'APROVADA', JSON.stringify(aprovada));

const reaprovada = await admin(`/aprovacoes/${pendente.corpo.id}/aprovar`, { method: 'POST' });
verificar('aprovar de novo é recusado (422)', reaprovada.status === 422, JSON.stringify(reaprovada));

const recusada = await admin(`/aprovacoes/${dentroDoLimite.corpo.id}/recusar`, { method: 'POST', body: { justificativa: 'Laboratório em uso por outra turma' } });
verificar('admin recusa com justificativa', recusada.status === 200 && recusada.corpo.status === 'RECUSADA', JSON.stringify(recusada));

const outraSessao = await professor(`/reservas/${pendente.corpo.id}/cancelar`, { method: 'POST' });
verificar('não cancela reserva de outro usuário (403)', outraSessao.status === 403, JSON.stringify(outraSessao));

const cancelada = await aluno(`/reservas/${pendente.corpo.id}/cancelar`, { method: 'POST' });
verificar('dono cancela a própria reserva', cancelada.status === 200 && cancelada.corpo.status === 'CANCELADA', JSON.stringify(cancelada));

const liberado = await professor('/reservas', reserva(hardware, base, '09:00', '10:00'));
verificar('horário cancelado volta a ficar livre', liberado.status === 201, JSON.stringify(liberado));

const bloqueioSobreReserva = await admin(`/laboratorios/${hardware.id}/bloqueios`, {
  method: 'POST',
  body: { inicio: instante(base, '09:00'), fim: instante(base, '10:00'), motivo: 'Manutenção' },
});
verificar('bloqueio sobre reserva ativa é recusado (422)', bloqueioSobreReserva.status === 422, JSON.stringify(bloqueioSobreReserva));

const bloqueio = await admin(`/laboratorios/${hardware.id}/bloqueios`, {
  method: 'POST',
  body: { inicio: instante(base + 5, '09:00'), fim: instante(base + 5, '11:00'), motivo: 'Manutenção' },
});
verificar('bloqueio em horário livre é criado', bloqueio.status === 201, JSON.stringify(bloqueio));

const reservaEmBloqueio = await professor('/reservas', reserva(hardware, base + 5, '10:00', '11:00'));
verificar('reserva em horário bloqueado é recusada (409)', reservaEmBloqueio.status === 409, JSON.stringify(reservaEmBloqueio));

const agenda = await aluno(`/agenda?laboratorioId=${hardware.id}&de=${instante(base + 5, '00:00')}&ate=${instante(base + 6, '00:00')}`);
verificar('agenda mostra o bloqueio como indisponível', agenda.corpo.some((e) => e.situacao === 'BLOQUEIO'), JSON.stringify(agenda));

const usuarioDuplicado = await admin('/usuarios', { method: 'POST', body: { nome: 'Outro', email: 'aluno@labreserva.local', senha: 'senhaforte1', perfil: 'ALUNO' } });
verificar('e-mail duplicado é recusado (409)', usuarioDuplicado.status === 409, JSON.stringify(usuarioDuplicado));

const labInvalido = await admin('/laboratorios', { method: 'POST', body: { nome: 'Lab inválido', tipo: 'X', capacidade: 10, abertura: '18:00', fechamento: '08:00' } });
verificar('laboratório com fechamento antes da abertura é recusado (422)', labInvalido.status === 422, JSON.stringify(labInvalido));

const capacidadeZero = await admin('/laboratorios', { method: 'POST', body: { nome: 'Lab zero', tipo: 'X', capacidade: 0, abertura: '08:00', fechamento: '18:00' } });
verificar('capacidade zero é recusada (400)', capacidadeZero.status === 400, JSON.stringify(capacidadeZero));

const email = `bloqueio.${Date.now()}@labreserva.local`;
await admin('/usuarios', { method: 'POST', body: { nome: 'Teste de bloqueio', email, senha: 'senhaforte1', perfil: 'ALUNO' } });
const tentativa = () => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, senha: 'errada' }) });
const respostas = [];
for (let i = 0; i < 5; i += 1) respostas.push((await tentativa()).status);
verificar('5 senhas erradas retornam 401', respostas.every((s) => s === 401), JSON.stringify(respostas));
const apos = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, senha: SENHA }) });
verificar('após 5 erros a conta fica bloqueada mesmo com a senha certa (403)', apos.status === 403, String(apos.status));

const logs = await admin('/auth/me');
verificar('sessão do admin continua válida', logs.status === 200);

const falhas = resultados.filter((r) => !r).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram`);
process.exit(falhas === 0 ? 0 : 1);
