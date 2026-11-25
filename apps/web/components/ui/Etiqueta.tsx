import { ESTILO_STATUS, ROTULO_STATUS } from '@/lib/rotulos';
import type { StatusReserva } from '@/lib/tipos';

export function EtiquetaDeStatus({ status }: { status: StatusReserva }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILO_STATUS[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}
