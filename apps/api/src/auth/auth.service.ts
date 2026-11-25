import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { MENSAGENS } from '../common/mensagens';
import { Relogio } from '../common/relogio';
import { somarMinutos } from '../common/tempo';
import { CHAVES, ConfiguracaoService } from '../configuracao/configuracao.service';
import { PrismaService } from '../prisma/prisma.service';

export type UsuarioPublico = Pick<Usuario, 'id' | 'nome' | 'email' | 'perfil'>;

export const paraPublico = ({ id, nome, email, perfil }: Usuario): UsuarioPublico => ({ id, nome, email, perfil });

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly configuracao: ConfiguracaoService,
    private readonly relogio: Relogio,
  ) {}

  async entrar(email: string, senha: string): Promise<{ usuario: UsuarioPublico; token: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!usuario || !usuario.ativo) throw new UnauthorizedException(MENSAGENS.credenciaisInvalidas);
    const agora = this.relogio.agora();
    if (usuario.bloqueadoAte && usuario.bloqueadoAte.getTime() > agora.getTime()) {
      throw new ForbiddenException(MENSAGENS.acessoBloqueado);
    }
    const confere = await bcrypt.compare(senha, usuario.senhaHash);
    if (!confere) {
      await this.registrarFalha(usuario, agora);
      throw new UnauthorizedException(MENSAGENS.credenciaisInvalidas);
    }
    await this.prisma.usuario.update({ where: { id: usuario.id }, data: { tentativasFalhas: 0, bloqueadoAte: null } });
    return { usuario: paraPublico(usuario), token: await this.jwt.signAsync({ sub: usuario.id }) };
  }

  private async registrarFalha(usuario: Usuario, agora: Date): Promise<void> {
    const limite = await this.configuracao.numero(CHAVES.maxTentativas);
    const minutos = await this.configuracao.numero(CHAVES.bloqueioMinutos);
    const falhas = usuario.tentativasFalhas + 1;
    const atingiuLimite = falhas >= limite;
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasFalhas: falhas % limite,
        bloqueadoAte: atingiuLimite ? somarMinutos(agora, minutos) : null,
      },
    });
  }

  async perfilDe(id: number): Promise<UsuarioPublico> {
    return paraPublico(await this.prisma.usuario.findUniqueOrThrow({ where: { id } }));
  }
}
