-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ALUNO', 'PROFESSOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tentativas_falhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratorio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "recursos" TEXT NOT NULL DEFAULT '',
    "abertura" VARCHAR(5) NOT NULL,
    "fechamento" VARCHAR(5) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "serie_id" INTEGER,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "finalidade" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL,
    "justificativa" TEXT,
    "decidido_por" INTEGER,
    "decidido_em" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueio" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "bloqueio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serie_recorrente" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fim" VARCHAR(5) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,

    CONSTRAINT "serie_recorrente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" INTEGER NOT NULL,
    "detalhes" JSONB,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regra_perfil" (
    "perfil" "Perfil" NOT NULL,
    "status_inicial" "StatusReserva" NOT NULL,
    "duracao_maxima_minutos" INTEGER,
    "antecedencia_maxima_dias" INTEGER,
    "antecedencia_minima_minutos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "regra_perfil_pkey" PRIMARY KEY ("perfil")
);

-- CreateTable
CREATE TABLE "configuracao" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "configuracao_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "laboratorio_nome_key" ON "laboratorio"("nome");

-- CreateIndex
CREATE INDEX "reserva_laboratorio_id_inicio_idx" ON "reserva"("laboratorio_id", "inicio");

-- CreateIndex
CREATE INDEX "reserva_usuario_id_inicio_idx" ON "reserva"("usuario_id", "inicio");

-- CreateIndex
CREATE INDEX "bloqueio_laboratorio_id_inicio_idx" ON "bloqueio"("laboratorio_id", "inicio");

-- CreateIndex
CREATE INDEX "log_auditoria_entidade_entidade_id_idx" ON "log_auditoria"("entidade", "entidade_id");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_decidido_por_fkey" FOREIGN KEY ("decidido_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "serie_recorrente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueio" ADD CONSTRAINT "bloqueio_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueio" ADD CONSTRAINT "bloqueio_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_recorrente" ADD CONSTRAINT "serie_recorrente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_recorrente" ADD CONSTRAINT "serie_recorrente_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
