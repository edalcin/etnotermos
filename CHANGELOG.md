# Changelog — Módulo BioCultTermos

Este é o **changelog central do módulo compartilhado**, não um changelog de release: o repositório não
tem versão própria implantável (ADR-007 F2, `Arquitetura-BioCultural`). Cada entrada documenta uma
mudança de código feita a partir do submodule de alguma unidade hospedeira, pushada para este remoto
compartilhado — para que qualquer unidade (inclusive as que ainda não têm código) veja o que mudou sem
precisar ler `git log` diretamente.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Toda entrada nova segue
o fluxo obrigatório do [ADR-010](https://github.com/edalcin/Arquitetura-BioCultural/blob/main/docs/architecture-decisions/ADR-010-central-documentation-and-build-verification.md)
(push + esta documentação são obrigatórios; bump do submodule em outras unidades continua opcional,
ADR-007 F3).

---

## 2026-07-22 — origem: BioCultDB

**Commit**: `3d7d878`

Remoção da capacidade de gerar Docker standalone (`docker/etnotermos.Dockerfile`,
`docker/docker-compose.yml`, workflow de CI `docker-build.yml` que publicava
`ghcr.io/edalcin/bioculttermos`). Enforcement do ADR-007 F2 — o repositório nunca mais funcionará de
forma independente das instâncias hospedeiras; `docs/deployment.md` e `docs/instalacao-unraid.md`
marcados como histórico.

## 2026-07-22 — origem: BioCultDB

**Commit**: `3153f06`

Sete ajustes de interface no admin/público (BioCultDB, porta 4001/4000):
- Card "Definição e Notas": lista fontes bibliográficas do BioCultDB (APA), linkadas para
  `/referencia/:id` no BioCultDB público.
- "Navegar" público: lista todos os termos ativos com suas relações (antes redirecionava para busca
  vazia).
- "Ativar Conceito": troca de card em tempo real (sem reload) via swap HTMX + versão OOB.
- Upload de áudio: texto "Enviar áudio" + modal de ajuda sobre pronúncia comunitária.
- Rótulos preferenciais/alternativos: editáveis inline (botão "Editar" ou clique no texto).
- "Adicionar Rótulo": autocomplete de termos existentes no campo "Forma literal".
- Relações Semânticas "Adicionar": corrigido bug em que nada acontecia — resolve o conceito-alvo pelo
  nome exato digitado quando nenhuma sugestão foi clicada; "Mais específico (NT)" agora é relação
  derivada e somente-leitura.

---

**Nota sobre entradas anteriores a esta data**: não há reconstrução retroativa completa do histórico
antes de 2026-07-22 — este changelog central passa a existir a partir do ADR-010. Para o histórico
completo anterior, ver `git log` deste repositório.
