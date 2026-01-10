# EtnoTermos - Plataforma de Gestão de Terminologia Etnobotânica

<div align="center">
  <img src="docs/etnoImagens/etnotermosTrans.png" alt="etnoTermos Logo" width="200">
  
</div>

## Motivação e justificativa

O conhecimento e a ciência existente nas comunidades tradicionais do Brasil contém descrições, termos e práticas que expressam relações profundas com o ambiente e com as entidades que nele existem — incluindo as entidades biológicas. Preservar esse conhecimento de forma legítima e documentada é essencial para reconhecer, valorizar e proteger a memória cultural dessas comunidades, bem como para garantir transparência e justiça na repartição de benefícios decorrentes deste conhecimento. O EtnoTermos propõe criar e manter um repositório de termos e associações que registre com precisão as formas linguísticas, os contextos de uso e as relações comunitárias com estas entidades, promovendo a visibilidade das comunidades e oferecendo uma base confiável para pesquisa colaborativa, políticas públicas e mecanismos de repartição de benefícios justos e equitativos.

## 🌿 Propósito

O **EtnoTermos** é uma plataforma digital que preserva e organiza o conhecimento etnobotânico através de um sistema estruturado de glossários, vocabulários e tesauros. O sistema permite a criação de uma rede interconectada de termos que reflete as complexas relações entre entidades biológicas (plantas e animais), usos tradicionais e conhecimento cultural.

### Conformidade com Padrões Internacionais

O EtnoTermos segue as diretrizes da norma **ANSI/NISO Z39.19-2005 (R2010)** - *Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies*. Esta conformidade garante que o vocabulário etnobotânico construído seja:

- **Interoperável**: Compatível com outros sistemas de organização do conhecimento
- **Estruturado**: Seguindo princípios estabelecidos de seleção e forma de termos
- **Sustentável**: Com práticas definidas de manutenção e evolução
- **Profissional**: Alinhado com padrões bibliotecários e de ciência da informação reconhecidos internacionalmente

A norma Z39.19 estabelece práticas para:
- **Seleção de termos** (Section 6): Critérios de inclusão baseados em garantia literária, de usuário e organizacional
- **Forma de termos** (Section 7): Convenções gramaticais, sintaxe e uso de singular/plural
- **Relacionamentos** (Section 8): Estruturas de equivalência (USE/UF), hierárquicas (BT/NT) e associativas (RT)
- **Notas e referências** (Section 10): Notas de escopo, definições, notas históricas e bibliográficas
- **Controle de autoridade** (Section 9): Princípio "um conceito, um termo" e desambiguação
- **Apresentação** (Section 11): Formatos de exibição alfabéticos, hierárquicos e facetados

### Contexto dentro da etnoArquitetura

O **EtnoTermos** faz parte da [etnoArquitetura](https://github.com/edalcin/etnoArquitetura), um ecossistema integrado de ferramentas para gestão, análise e preservação do conhecimento etnobotânico. A etnoArquitetura fornece a base conceitual e metodológica para organizar dados etnobotânicos de forma estruturada, garantindo interoperabilidade entre diferentes sistemas e promovendo a colaboração entre pesquisadores e comunidades tradicionais.

Dentro deste ecossistema, o EtnoTermos se integra especialmente com o [etnoDB](https://github.com/edalcin/etnoDB), fornecendo um vocabulário robusto e controlado para a associação de plantas com suas formas de uso pelas comunidades tradicionais. Enquanto o etnoDB gerencia os dados relacionais e observacionais (ocorrências, usos, práticas), o EtnoTermos fornece a camada terminológica padronizada que garante consistência semântica e facilita a pesquisa e descoberta de conhecimento.

### Inspiração

Baseado no [TemaTres](https://github.com/tematres/TemaTres-Vocabulary-Server), o EtnoTermos adapta as melhores práticas de representação de conhecimento formal para o contexto específico da etnobotânica brasileira, incorporando padrões internacionais de construção de vocabulários controlados (ANSI/NISO Z39.19-2005).

## 👥 Usuários-Alvo

- **Pesquisadores em Etnobotânica**: Acesso completo para pesquisa e catalogação
- **Estudantes de Graduação e Pós-graduação**: Interface educacional com recursos de orientação. Principais responsáveis pela alimentação e gestão dos dados
- **Lideranças de Comunidades Tradicionais**: Foco na contribuição e validação de termos
- **Sistemas Externos**: Integração via API para outros projetos de pesquisa

## 🚀 Funcionalidades Principais

### Gestão de Termos

- **Criação e edição** de termos etnobotânicos com identificadores únicos
- **Classificação hierárquica conforme Z39.19**:
  - Relações de equivalência (USE/UF): termos preferenciais e não-preferenciais
  - Relações hierárquicas (BT/NT): termos mais amplos e mais específicos
  - Relações associativas (RT): termos relacionados tematicamente
  - Suporte a polihierarquia (um termo pode ter múltiplos termos mais amplos)
- **Relacionamentos múltiplos**: conexões n:n entre termos, com visualização gráfica
- **Suporte multilíngue** para variações de nomenclatura
- **Controle de autoridade**: um conceito, um termo preferencial
- **Desambiguação de homógrafos**: qualificadores para termos idênticos com significados diferentes

### Sistema de Notas (Z39.19 Section 10)

Seis tipos de anotações contextuais seguindo a norma Z39.19:

- 📝 **Nota de escopo** (Z39.19 10.2): Define os limites e contexto de uso do termo
- 👨‍💼 **Nota do catalogador**: Observações do pesquisador sobre o processo de catalogação
- 📚 **Nota histórica** (Z39.19 10.4): Documenta evolução e mudanças do termo ao longo do tempo
- 📖 **Nota bibliográfica**: Referências acadêmicas onde o termo é citado
- 🔒 **Nota privada**: Informações restritas (visível apenas ao autor e administradores)
- ✏️ **Nota de definição** (Z39.19 10.3): Definição formal do conceito representado pelo termo
- 💡 **Nota de exemplo** (Z39.19 10.5): Casos de uso práticos e contextos de aplicação

### Gestão de Fontes e Atribuição

- **Rastreabilidade da Origem**: O sistema registrará a proveniência de cada informação, seja ela uma referência bibliográfica, um conhecimento tradicional compartilhado por um líder comunitário ou uma anotação de um pesquisador.
- **Fontes Bibliográficas**: Gerenciamento de referências acadêmicas com estrutura de citação padrão (autor, título, ano, etc.).
- **Conhecimento Tradicional**: Atribuição clara e respeitosa do conhecimento a seus detentores, garantindo o reconhecimento da autoria e a governança dos dados em conformidade com os princípios CARE.
- **Relacionamentos n:n**: Conexões flexíveis entre termos, notas e suas respectivas fontes, permitindo uma rede de citações completa.

### Recursos Avançados

- 🔍 **Busca avançada** com suporte a pesquisa em todos os campos de termos, notas e relacionamentos
- 📊 **Dashboard administrativo** com métricas e analytics
- 📤 **Exportação** em padrões abertos (SKOS, RDF, Dublin Core, CSV)
- 🔌 **APIs REST** para integração com sistemas externos

## 🎯 Capacidade do Sistema

- **Escala**: Suporte para um número massivo de termos
- **Usuários**: Otimizado para pequenos grupos com baixa concorrência
- **Performance**: Busca e navegação eficientes em grandes volumes de dados

## 🔒 Integridade e Controle

- **Proteção de dados**: Avisos antes de exclusão de termos com dependências hierárquicas
- **Auditoria**: Registro completo de modificações para integridade da pesquisa e rastreabilidade
- **Validação**: Garantia de consistência nas relações entre termos (reciprocidade, prevenção de ciclos)

## 🌐 Integração e Interoperabilidade

### APIs Disponíveis

- Recuperação de termos e relacionamentos
- Funcionalidades de busca avançada
- Consultas de dados com autenticação segura
- Documentação completa para desenvolvedores

### Formatos de Export

- **SKOS** (Simple Knowledge Organization System)
- **RDF** (Resource Description Framework)
- **Dublin Core** para metadados
- **CSV** para análise de dados

## 🐳 Implementação

O sistema é containerizado com Docker e pode ser implantado de diversas formas, garantindo:

- Implantação consistente
- Escalabilidade
- Manutenção simplificada
- Ambiente reproduzível

### Guias de Instalação

- **[Desenvolvimento Local](docs/desenvolvimento.md)**: Instruções completas para desenvolvedores
- **[Deployment em Produção](docs/deployment.md)**: Guia para implantação em servidores Linux
- **[Instalação no UNRAID](docs/instalacao-unraid.md)**: Passo a passo via interface web do UNRAID

### Tecnologias

- **Backend**: Node.js 20 LTS, Express.js, MongoDB 7.0+
- **Frontend**: HTMX, Alpine.js, Tailwind CSS (tema "forest", integrado com etnoDB)
- **Visualização**: Cytoscape.js para grafos de relacionamentos
- **Deploy**: Docker, Docker Compose

## 🎓 Impacto Acadêmico

O EtnoTermos contribui para:

- **Preservação** do conhecimento tradicional sobre plantas
- **Padronização** da terminologia etnobotânica seguindo normas internacionais (ANSI/NISO Z39.19)
- **Colaboração** entre pesquisadores e comunidades
- **Acessibilidade** do conhecimento para futuras gerações
- **Interoperabilidade** entre projetos de pesquisa através de formatos abertos e padrões estabelecidos
- **Qualidade científica** através de controle de autoridade e práticas de construção de vocabulários controlados
- **Sustentabilidade** com práticas documentadas de manutenção e evolução do vocabulário

---

## 📖 Documentação

### Para Pesquisadores

- [Especificação completa](specs/main/spec.md) - Detalhamento funcional do sistema
- [Modelo de dados](specs/main/data-model.md) - Estrutura de dados e relacionamentos
- [Diretrizes de construção do vocabulário (Z39.19)](specs/main/vocabulary-guidelines.md) - Padrões de catalogação
- [Exemplo de registro (JSON)](docs/examples/term-record-example.json) - Estrutura de um termo completo
- [Conformidade com princípios CARE](docs/care-compliance.md) - Governança de dados indígenas

### Para Administradores

- **[Instalação no UNRAID](docs/instalacao-unraid.md)** - Guia passo a passo via interface web
- [Deployment em Produção](docs/deployment.md) - Implantação em servidores Linux
- Backup e recuperação de dados
- Monitoramento e manutenção

### Para Desenvolvedores

- **[Guia de Desenvolvimento](docs/desenvolvimento.md)** - Setup local, testes, contribuição
- [Arquitetura do sistema](specs/main/spec.md#arquitetura) - Design técnico
- Stack tecnológica e padrões de código
- APIs e formatos de exportação

## 🔗 Padrões e Referências

- [ANSI/NISO Z39.19-2005 (R2010)](docs/ANSI-NISO%20Z39.19-2005%20(R2010).pdf) - Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies
- [TemaTres Vocabulary Server](https://github.com/tematres/TemaTres-Vocabulary-Server) - Inspiração inicial
- [CARE Principles for Indigenous Data Governance](https://www.gida-global.org/care) - Princípios de governança de dados
- [SKOS - Simple Knowledge Organization System](https://www.w3.org/2004/02/skos/) - Padrão W3C para vocabulários
- [etnoArquitetura](https://github.com/edalcin/etnoArquitetura) - Ecossistema integrado de ferramentas etnobotânicas
- [etnoDB](https://github.com/edalcin/etnoDB) - Sistema de gestão de dados etnobotânicos

---

**Status do Projeto**: Em desenvolvimento ativo

**Licença**: A definir

**Contato**: [GitHub Issues](https://github.com/edalcin/etnotermos/issues)
