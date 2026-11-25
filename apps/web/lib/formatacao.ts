const dataHoraFormato = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const dataFormato = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const horaFormato = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const dataHora = (valor: string | Date): string => dataHoraFormato.format(new Date(valor));
export const diaCurto = (valor: string | Date): string => dataFormato.format(new Date(valor));
export const hora = (valor: string | Date): string => horaFormato.format(new Date(valor));

export const intervalo = (inicio: string, fim: string): string => `${diaCurto(inicio)}, ${hora(inicio)} às ${hora(fim)}`;

export const paraIso = (data: string, horario: string): string => new Date(`${data}T${horario}`).toISOString();

export const minutosDeHora = (valor: string): number => {
  const [horas, minutos] = valor.split(':').map(Number);
  return horas * 60 + minutos;
};
