# EtnoTerms - Sistema de Gestão de Terminologia Etnobotânica

Um sistema web moderno para catalogação, organização e exploração de terminologia relacionada ao uso tradicional de plantas por comunidades tradicionais.

## 🌿 Propósito

O **EtnoTerms** é uma plataforma digital que preserva e organiza o conhecimento etnobotânico através de um sistema estruturado de glossários, vocabulários e tesauros. O sistema permite a criação de uma rede interconectada de termos que reflete as complexas relações entre plantas, usos tradicionais e conhecimento cultural.

### Inspiração

Baseado no [TemaTres](https://vocabularyserver.com/web/), o EtnoTerms adapta as melhores práticas de representação de conhecimento formal para o contexto específico da etnobotânica.

## 👥 Usuários-Alvo

- **Pesquisadores em Etnobotânica**: Acesso completo para pesquisa e catalogação
- **Estudantes de Graduação e Pós-graduação**: Interface educacional com recursos de orientação
- **Lideranças de Comunidades Tradicionais**: Foco na contribuição de conhecimentos tradicionais
- **Sistemas Externos**: Integração via API para outros projetos de pesquisa

## 🚀 Funcionalidades Principais

### Gestão de Termos
- **Criação e edição** de termos etnobotânicos com identificadores únicos
- **Classificação hierárquica**: meta termo → termo genérico → termo específico
- **Relacionamentos múltiplos**: conexões n:n entre termos
- **Suporte multilíngue** para variações de nomenclatura

### Sistema de Notas
Seis tipos de anotações contextuais:
- 📝 **Nota de escopo**: Definição do contexto de uso
- 👨‍💼 **Nota do catalogador**: Observações do pesquisador
- 📚 **Nota histórica**: Contexto histórico e cultural
- 📖 **Nota bibliográfica**: Referências acadêmicas
- 🔒 **Nota privada**: Informações restritas
- ✏️ **Nota de definição**: Definições técnicas
- 💡 **Nota de exemplo**: Casos de uso práticos

### Gestão de Fontes
- **Referências bibliográficas** com estrutura de citação padrão
- **Relacionamentos n:n** entre termos, notas e fontes
- **Rastreabilidade completa** de atribuições acadêmicas

### Recursos Avançados
- 🔍 **Busca inteligente** com Meilisearch
- 📊 **Dashboard administrativo** com métricas e analytics
- 🔐 **Autenticação Google OAuth** com controle de acesso baseado em funções
- 📤 **Exportação** em padrões abertos (SKOS, RDF, Dublin Core, CSV)
- 🔌 **APIs REST** para integração com sistemas externos

## 🎯 Capacidade do Sistema

- **Escala**: Suporte para até 200.000 termos
- **Usuários**: Otimizado para pequenos grupos com baixa concorrência
- **Performance**: Busca e navegação eficientes em grandes volumes de dados

## 🔒 Segurança e Controle

- **Autenticação**: Login seguro via Google OAuth
- **Autorização**: Sistema de funções gerenciado por administradores
- **Proteção de dados**: Avisos antes de exclusão de termos com dependências
- **Auditoria**: Registro completo de modificações para integridade da pesquisa

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

O sistema será containerizado com Docker e disponibilizado sob demanda através de GitHub Actions, garantindo:
- Implantação consistente
- Escalabilidade automática
- Manutenção simplificada
- Ambiente reproduzível

## 🎓 Impacto Acadêmico

O EtnoTerms contribui para:
- **Preservação** do conhecimento tradicional sobre plantas
- **Padronização** da terminologia etnobotânica
- **Colaboração** entre pesquisadores e comunidades
- **Acessibilidade** do conhecimento para futuras gerações
- **Interoperabilidade** entre projetos de pesquisa

---

**Status do Projeto**: Em especificação
**Documentação**: [Especificação completa](specs/spec.md)
**Inspiração**: [TemaTres Vocabulary Server](https://vocabularyserver.com/web/)