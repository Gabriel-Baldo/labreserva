CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "laboratorio"
  ADD CONSTRAINT "laboratorio_capacidade_positiva" CHECK ("capacidade" > 0),
  ADD CONSTRAINT "laboratorio_fechamento_depois_da_abertura" CHECK ("fechamento" > "abertura");

ALTER TABLE "reserva"
  ADD CONSTRAINT "reserva_fim_depois_do_inicio" CHECK ("fim" > "inicio"),
  ADD CONSTRAINT "reserva_sem_sobreposicao"
    EXCLUDE USING gist (
      "laboratorio_id" WITH =,
      tstzrange("inicio", "fim") WITH &&
    ) WHERE ("status" IN ('PENDENTE', 'APROVADA'));

ALTER TABLE "bloqueio"
  ADD CONSTRAINT "bloqueio_fim_depois_do_inicio" CHECK ("fim" > "inicio");
