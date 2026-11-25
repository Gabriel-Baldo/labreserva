const DIA_EM_MS = 86_400_000;
const DIAS_NA_SEMANA_LETIVA = 6;

export const inicioDaSemana = (referencia: Date): Date => {
  const dia = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  const deslocamento = (dia.getDay() + 6) % 7;
  return new Date(dia.getTime() - deslocamento * DIA_EM_MS);
};

export const somarDias = (data: Date, dias: number): Date =>
  new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);

export const diasDaSemana = (inicio: Date): Date[] =>
  Array.from({ length: DIAS_NA_SEMANA_LETIVA }, (_, indice) => somarDias(inicio, indice));

export const comHora = (dia: Date, horas: number): Date =>
  new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas);

export const dataParaCampo = (data: Date): string =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

export const horaParaCampo = (data: Date): string =>
  `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
