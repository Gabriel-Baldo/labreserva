import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AMBIENTE } from '../common/ambiente';
import { PUBLICO } from '../common/decorators';
import { MENSAGENS } from '../common/mensagens';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publico = this.reflector.getAllAndOverride<boolean>(PUBLICO, [contexto.getHandler(), contexto.getClass()]);
    if (publico) return true;
    const requisicao = contexto.switchToHttp().getRequest();
    const token = requisicao.cookies?.[AMBIENTE.cookieName];
    if (!token) throw new UnauthorizedException(MENSAGENS.naoAutenticado);
    const payload = await this.jwt.verifyAsync<{ sub: number }>(token).catch(() => {
      throw new UnauthorizedException(MENSAGENS.naoAutenticado);
    });
    const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario || !usuario.ativo) throw new UnauthorizedException(MENSAGENS.naoAutenticado);
    requisicao.usuario = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
    return true;
  }
}
