import { Global, Injectable, Module } from '@nestjs/common';

@Injectable()
export class Relogio {
  agora(): Date {
    return new Date();
  }
}

@Global()
@Module({ providers: [Relogio], exports: [Relogio] })
export class RelogioModule {}
