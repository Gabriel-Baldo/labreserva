import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '@prisma/client';
import { PERFIS, UsuarioAutenticado } from '../common/decorators';
import { MENSAGENS } from '../common/mensagens';

@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Perfil[]>(PERFIS, [contexto.getHandler(), contexto.getClass()]);
    if (!permitidos) return true;
    const usuario: UsuarioAutenticado = contexto.switchToHttp().getRequest().usuario;
    if (!permitidos.includes(usuario.perfil)) throw new ForbiddenException(MENSAGENS.semPermissao);
    return true;
  }
}
