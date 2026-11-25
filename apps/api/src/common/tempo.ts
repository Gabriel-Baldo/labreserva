const MS_POR_MINUTO = 60_000;
const MINUTOS_POR_DIA = 1_440;

export type PartesLocais = { dia: string; minutos: number };

export const somarMinutos = (data: Date, minutos: number): Date => new Date(data.getTime() + minutos * MS_POR_MINUTO);

export const somarDias = (data: Date, dias: number): Date => somarMinutos(data, dias * MINUTOS_POR_DIA);

export const diferencaEmMinutos = (inicio: Date, fim: Date): number => (fim.getTime() - inicio.getTime()) / MS_POR_MINUTO;

export const minutosDeHora = (hora: string): number => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

export const partesLocais = (data: Date, fuso: string): PartesLocais => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
  return {
    dia: `${valor('year')}-${valor('month')}-${valor('day')}`,
    minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
  };
};
