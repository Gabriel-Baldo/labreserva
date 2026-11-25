import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Response } from 'express';
import { AMBIENTE } from '../common/ambiente';
import { Publico, UsuarioAtual, UsuarioAutenticado } from '../common/decorators';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  senha: string;
}

const opcoesDoCookie = () => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: AMBIENTE.producao,
  path: '/',
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) resposta: Response) {
    const { usuario, token } = await this.auth.entrar(dto.email, dto.senha);
    resposta.cookie(AMBIENTE.cookieName, token, opcoesDoCookie());
    return usuario;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) resposta: Response) {
    resposta.clearCookie(AMBIENTE.cookieName, opcoesDoCookie());
  }

  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.auth.perfilDe(usuario.id);
  }
}
