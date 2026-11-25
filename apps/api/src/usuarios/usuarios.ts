import { Body, ConflictException, Controller, Get, HttpCode, Injectable, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Perfil, Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UsuarioPublico, paraPublico } from '../auth/auth.service';
import { Perfis } from '../common/decorators';
import { MENSAGENS } from '../common/mensagens';
import { DelegateDeCadastro, ServicoCadastro } from '../common/servico-cadastro';
import { PrismaService } from '../prisma/prisma.service';

const CUSTO_DO_HASH = 10;
const CODIGO_DUPLICADO = 'P2002';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsEnum(Perfil)
  perfil: Perfil;
}

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;
}

@Injectable()
export class UsuariosService extends ServicoCadastro<Usuario, UsuarioPublico & { ativo: boolean }> {
  protected readonly delegate: DelegateDeCadastro<Usuario>;
  protected readonly mensagemNaoEncontrado = MENSAGENS.usuarioNaoEncontrado;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = prisma.usuario as unknown as DelegateDeCadastro<Usuario>;
  }

  protected apresentar(usuario: Usuario) {
    return { ...paraPublico(usuario), ativo: usuario.ativo };
  }

  async criar(dto: CriarUsuarioDto) {
    const senhaHash = await bcrypt.hash(dto.senha, CUSTO_DO_HASH);
    const usuario = await this.prisma.usuario
      .create({ data: { nome: dto.nome.trim(), email: dto.email.trim().toLowerCase(), senhaHash, perfil: dto.perfil } })
      .catch((erro: Prisma.PrismaClientKnownRequestError) => {
        if (erro.code !== CODIGO_DUPLICADO) throw erro;
        throw new ConflictException(MENSAGENS.emailEmUso);
      });
    return this.apresentar(usuario);
  }

  async atualizar(id: number, dto: AtualizarUsuarioDto) {
    await this.obter(id);
    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, CUSTO_DO_HASH) : undefined;
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { nome: dto.nome?.trim(), perfil: dto.perfil, senhaHash },
    });
    return this.apresentar(usuario);
  }
}

@ApiTags('usuarios')
@Perfis('ADMIN')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@Query('incluirInativos') incluirInativos?: string) {
    return this.usuarios.listar(incluirInativos === 'true');
  }

  @Post()
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuarios.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarUsuarioDto) {
    return this.usuarios.atualizar(id, dto);
  }

  @Post(':id/desativar')
  @HttpCode(200)
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.desativar(id);
  }
}
