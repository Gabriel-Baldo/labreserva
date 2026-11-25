import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Perfil } from '@prisma/client';

export const PUBLICO = 'publico';
export const PERFIS = 'perfis';

export type UsuarioAutenticado = { id: number; nome: string; perfil: Perfil };

export const Publico = () => SetMetadata(PUBLICO, true);

export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS, perfis);

export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => contexto.switchToHttp().getRequest().usuario,
);
