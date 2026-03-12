# EtnoTermos — Organização e Análise do Vocabulário Controlado

**Base normativa**: ANSI/NISO Z39.19-2005 (R2010)  
**Princípios**: CARE para Governança de Dados Indígenas  
**Total analisado**: 461 termos  
**Data**: 2026-03-12

---

## 1. Diagnóstico Geral

### 1.1 Problemas identificados por categoria

| Categoria de problema | Qtd. estimada | Prioridade |
|-----------------------|:---:|:---:|
| Termos redundantes / quase-sinônimos sem relação USE/UF | ~60 | Alta |
| Termos vagos ou excessivamente amplos sem Scope Note | ~25 | Alta |
| Termos na forma verbal (infinitivo) em vez de substantivo | ~15 | Média |
| Variantes ortográficas não tratadas como UF | ~8 | Média |
| Termos que são sintomas/órgãos isolados sem hierarquia | ~40 | Média |
| Termos de outras facetas misturados (material, social) | ~20 | Baixa |
| Termos com status `[candidate]` ou `[entry]` sem decisão | 3 | Alta |

---

## 2. Proposta de Estrutura por Facetas

Com base nos 461 termos, propõe-se a seguinte organização em **6 facetas principais**:

---

### FACETA A — USOS E APLICAÇÕES MEDICINAIS
*Top Term: Uso Medicinal*

Esta é a faceta dominante na lista (≈ 75% dos termos). Subdivide-se em:

#### A.1 Sistemas e Órgãos (termos-alvo do tratamento)

```
Uso Medicinal
  NT: Sistema Respiratório (uso)
      NT: Asma
      NT: Bronquite
          UF: bronquite asmática [→ USE Bronquite]
          UF: asma e tosse [→ USE Bronquite / Asma — ver §3.1]
      NT: Coqueluche
      NT: Congestão
      NT: Expectorante (ação)
      NT: Falta de ar
      NT: Gripe
          UF: gripe e resfriado [→ USE Gripe / Resfriado]
          UF: gripe e tosse [→ USE Gripe / Tosse]
          UF: gripes [→ USE Gripe]
          UF: antigripal [→ USE Gripe — ver §3.2]
      NT: Pneumonia
      NT: Resfriado
          UF: resfriados [→ USE Resfriado]
      NT: Sinusite
      NT: Tosse
          UF: tosses [→ USE Tosse]
      NT: Tuberculose
      NT: Problemas respiratórios
          UF: problemas pulmonares [→ USE Problemas respiratórios]
          UF: infecção pulmonar [→ USE Infecção pulmonar — separar]
      NT: Rouquidão
      NT: Fôlego

  NT: Sistema Digestivo (uso)
      NT: Azia
      NT: Digestão
          UF: digestivo [→ USE Digestão — ver §3.2]
          UF: má digestão [→ USE Digestão]
          UF: problemas digestivos [→ USE Digestão]
          UF: problemas estomacais [→ USE Estômago — ver abaixo]
      NT: Diarreia
          UF: diarréia [→ USE Diarreia — correção ortográfica]
      NT: Disenteria
      NT: Estômago (afecções)
          UF: dor de estômago [→ USE Estômago (afecções)]
          UF: dor no estômago [→ USE Estômago (afecções)]
          UF: problemas do estômago [→ USE Estômago (afecções)]
          UF: cólicas do fígado e estômago [→ USE Estômago (afecções) / Fígado]
          UF: fígado e estômago [→ USE Estômago (afecções) — ver §3.1]
      NT: Flatulência
          UF: gases [→ USE Flatulência]
          UF: gazes [→ USE Flatulência — erro ortográfico]
      NT: Gastrite
      NT: Hepatite
      NT: Fígado (afecções)
          UF: gordura no fígado [→ USE Fígado (afecções)]
          UF: intoxicação do fígado [→ USE Fígado (afecções)]
          UF: problemas de fígado [→ USE Fígado (afecções)]
          UF: problemas do fígado [→ USE Fígado (afecções)]
          UF: dor no fígado [→ USE Fígado (afecções)]
          UF: fígado e rins [→ USE Fígado (afecções) / Rins — ver §3.1]
          UF: estômago e fígado [→ USE Estômago (afecções) / Fígado]
          UF: cirrose [→ separar como NT de Fígado (afecções)]
      NT: Intestino (afecções)
          UF: intestino preso [→ USE Intestino (afecções) / Constipação]
          UF: infecção intestinal [→ USE Intestino (afecções)]
          UF: dor no intestino [→ USE Intestino (afecções)]
      NT: Náusea
          UF: náuseas [→ USE Náusea]
          UF: enjoo [→ USE Náusea]
      NT: Vômito
          UF: causar vômito [→ USE Emético — ver §3.2]
      NT: Parasitas intestinais
          UF: verme [→ USE Parasitas intestinais]
          UF: vermes [→ USE Parasitas intestinais]
      NT: Úlcera
          UF: úlceras [→ USE Úlcera]
      NT: Soluço
      NT: Laxante (ação)
          UF: purgante [→ USE Laxante]
          UF: intestino preso [→ USE Laxante / Intestino (afecções)]

  NT: Sistema Cardiovascular (uso)
      NT: Cardiorritmo (afecções)
          UF: palpitações [→ USE Cardiorritmo (afecções)]
          UF: taquicardia [→ USE Cardiorritmo (afecções)]
      NT: Circulação (afecções)
          UF: circulação do sangue [→ USE Circulação (afecções)]
      NT: Coração (afecções)
          UF: doença do coração [→ USE Coração (afecções)]
          UF: problema no coração [→ USE Coração (afecções)]
          UF: problemas do coração [→ USE Coração (afecções)]
          UF: problemas no coração [→ USE Coração (afecções)]
          UF: calmante para o coração [→ USE Coração (afecções) / Calmante]
          UF: dor do peito [→ USE Coração (afecções) / Dor no peito — ambíguo]
      NT: Colesterol
          UF: colesterol alto [→ USE Colesterol]
          UF: colesterol e diabetes [→ USE Colesterol / Diabetes — ver §3.1]
          UF: triglicerídeos [→ NT de Colesterol ou separar]
      NT: Hemorragia
      NT: Hipertensão
          UF: pressão alta [→ USE Hipertensão]
          UF: baixa a pressão [→ USE Hipotensivo — ver §3.2]
          UF: regulador da pressão arterial [→ USE Hipotensivo / Hipertensão]
      NT: Hipotensão
          UF: pressão baixa [→ USE Hipotensão]
          UF: baixar a pressão [→ USE Hipotensivo — ver §3.2]
      NT: Varizes
          UF: veias [→ USE Varizes / Circulação — ambíguo, Scope Note necessária]
      NT: Derrames

  NT: Sistema Nervoso (uso)
      NT: Ansiedade e nervosismo
          UF: nervosismo [→ USE Ansiedade e nervosismo]
          UF: nervoso [→ USE Ansiedade e nervosismo]
          UF: sistema nervoso [→ USE Ansiedade e nervosismo — ver §3.3]
      NT: Calmante (ação)
          UF: calmante (nervoso) [→ USE Calmante]
          UF: calmante infantil [→ NT de Calmante ou Scope Note]
          UF: calmante natural [→ USE Calmante]
          UF: calmante para os nervos [→ USE Calmante]
          UF: tranquilizante [→ USE Calmante ou separar]
          UF: sedativo [→ USE Calmante ou separar — ver §3.4]
          UF: sonífero [→ USE Sedativo — ver §3.4]
      NT: Depressão
          UF: baixo astral [→ USE Depressão — Scope Note necessária]
          UF: desânimo [→ USE Depressão — Scope Note necessária]
          UF: antidepressivo [→ USE Depressão — ver §3.2]
      NT: Enxaqueca
          UF: dor de cabeça [→ USE Enxaqueca / Cefaleia — desambiguar]
      NT: Epilepsia / Convulsões
          UF: apertar os dentes [→ USE Epilepsia — Scope Note obrigatória]
      NT: Estresse
      NT: Insônia
          UF: curar insônia [→ USE Insônia — ver §3.2]
          UF: dar sono [→ USE Insônia / Sedativo]
          UF: dormir [→ USE Insônia — forma verbal, ver §3.2]
          UF: sono [→ USE Insônia — ambíguo]
      NT: Labirintite
          UF: tontura [→ USE Labirintite / Vertigem — desambiguar]
          UF: vertigem [→ USE Labirintite]
      NT: Mal de Parkinson
      NT: Nevralgia
      NT: Paralisia

  NT: Sistema Urinário e Renal (uso)
      NT: Bexiga (afecções)
          UF: dores na bexiga [→ USE Bexiga (afecções)]
          UF: infecção na bexiga [→ USE Bexiga (afecções)]
          UF: inflamação na bexiga [→ USE Bexiga (afecções)]
          UF: problemas na bexiga [→ USE Bexiga (afecções)]
      NT: Cálculo renal
          UF: pedra no rim [→ USE Cálculo renal]
          UF: pedra nos rins [→ USE Cálculo renal]
          UF: cólica renal [→ USE Cálculo renal / Cólica de rins]
      NT: Diurético (ação)
      NT: Edema
          UF: inchaço [→ USE Edema]
          UF: inchaço nas pernas [→ USE Edema]
          UF: retenção de líquidos [→ USE Edema]
      NT: Infecção urinária
          UF: infecção de urina [→ USE Infecção urinária]
          UF: uropatia [→ USE Infecção urinária — Scope Note necessária]
          UF: vias urinárias [→ USE Infecção urinária — ambíguo, ver §3.3]
      NT: Rins (afecções)
          UF: dor de rins [→ USE Rins (afecções)]
          UF: dor nos rins [→ USE Rins (afecções)]
          UF: fígado e rins [→ USE Rins (afecções) / Fígado]
          UF: problemas de rins [→ USE Rins (afecções)]
          UF: problemas nos rins [→ USE Rins (afecções)]
          UF: problemas renais [→ USE Rins (afecções)]
          UF: infecção renal [→ NT de Rins (afecções)]

  NT: Sistema Reprodutor e Ginecologia (uso)
      NT: Cólica menstrual
          UF: cólica de útero [→ USE Cólica menstrual]
          UF: dores no útero [→ USE Cólica menstrual / Útero (afecções)]
          UF: menstruação dolorosa [→ USE Cólica menstrual]
      NT: Disfunção erétil
          UF: impotência [→ USE Disfunção erétil]
          UF: impotência sexual [→ USE Disfunção erétil]
      NT: Estimulante sexual
          UF: excitante [→ USE Estimulante sexual]
      NT: Menopausa
      NT: Menstruação (regulação)
          UF: menstruação atrasada [→ NT de Menstruação (regulação)]
          UF: regulador menstrual [→ USE Menstruação (regulação)]
      NT: Mioma
      NT: Parto
      NT: Próstata (afecções)
          UF: problemas de próstata [→ USE Próstata (afecções)]
          UF: problemas na próstata [→ USE Próstata (afecções)]
      NT: Útero (afecções)
          UF: infecção de útero [→ USE Útero (afecções)]
          UF: infecção no útero [→ USE Útero (afecções)]
          UF: inflamação de útero [→ USE Útero (afecções)]
          UF: inflamação do útero [→ USE Útero (afecções)]
          UF: inflamação no útero [→ USE Útero (afecções)]
          UF: limpeza do útero [→ USE Útero (afecções) / Limpeza uterina]
          UF: limpeza uterina [→ NT de Útero (afecções)]
          UF: corrimento [→ NT de Útero (afecções) ou separar]

  NT: Sistema Musculoesquelético (uso)
      NT: Artrite
          UF: dores nas articulações [→ USE Artrite / Reumatismo]
          UF: reumatismo [→ USE Artrite ou separar como NT]
      NT: Cólica (geral)
          UF: cólica [→ USE Cólica]
          UF: cólicas [→ USE Cólica]
          UF: cólicas e dores [→ USE Cólica / Dor]
          UF: dores e cólicas [→ USE Cólica / Dor]
      NT: Contusão
          UF: contusões [→ USE Contusão]
          UF: batidas [→ USE Contusão]
          UF: pancadas [→ USE Contusão]
          UF: traumatismo [→ USE Contusão ou separar]
      NT: Dor (geral)
          UF: dor [→ USE Dor]
          UF: dores [→ USE Dor]
          UF: dores no geral [→ USE Dor]
          UF: dores no corpo [→ USE Dor]
          UF: dor no corpo [→ USE Dor]
      NT: Dor lombar
          UF: dor na coluna [→ USE Dor lombar]
          UF: dor na espinha [→ USE Dor lombar]
          UF: dor nas costas [→ USE Dor lombar]
          UF: problemas na coluna [→ USE Dor lombar]
      NT: Dores musculares
          UF: músculos [→ USE Dores musculares — ambíguo, Scope Note]
      NT: Fraturas
      NT: Gota
      NT: Luxação
          UF: luxações [→ USE Luxação]
          UF: torção [→ USE Luxação / Entorse]
      NT: Osteoporose / Ossos (afecções)
          UF: dor nos ossos [→ USE Osteoporose / Ossos (afecções)]
          UF: ossos [→ USE Osteoporose — ambíguo, Scope Note]

  NT: Pele e Tegumento (uso)
      NT: Acne
          UF: espinha [→ USE Acne — ambíguo com espinha dorsal, ver §3.3]
      NT: Cicatrização
          UF: cicatrizante [→ USE Cicatrização — ver §3.2]
          UF: cicatrizar [→ USE Cicatrização — forma verbal]
          UF: cicatrizar feridas [→ USE Cicatrização / Feridas]
          UF: cicatrizar feridas e úlceras [→ USE Cicatrização — ver §3.1]
          UF: cicatrização de feridas [→ USE Cicatrização]
      NT: Cobreiro (herpes-zóster)
          UF: herpes [→ USE Cobreiro — Scope Note necessária]
      NT: Dermatite e alergias cutâneas
          UF: coceira [→ USE Dermatite]
          UF: coceiras [→ USE Dermatite]
          UF: erupção cutânea [→ USE Dermatite]
          UF: impingem [→ USE Dermatite / Micose]
          UF: urticária [→ USE Dermatite]
          UF: sarna [→ NT de Dermatite ou separar]
      NT: Ferida
          UF: feridas [→ USE Ferida]
          UF: ferimento [→ USE Ferida]
          UF: ferimentos [→ USE Ferida]
          UF: machucado [→ USE Ferida]
          UF: machucados [→ USE Ferida]
          UF: escoriações [→ NT de Ferida]
          UF: arranhões [→ NT de Ferida]
          UF: cortes [→ NT de Ferida]
      NT: Furúnculo
          UF: furúnculos [→ USE Furúnculo]
          UF: postema [→ USE Furúnculo — Scope Note necessária]
      NT: Mancha na pele
          UF: psoríase [→ NT de Mancha na pele]
          UF: pigmentação [→ NT de Mancha na pele]
          UF: verrugas [→ NT de Mancha na pele]
      NT: Micose
          UF: micoses [→ USE Micose]
          UF: frieira [→ NT de Micose]
          UF: frieiras [→ USE Frieira — plural]
          UF: pano (micose) [→ NT de Micose — ver §3.3]
      NT: Piolho
      NT: Queimadura
          UF: queimaduras [→ USE Queimadura]
      NT: Calos

  NT: Infecções e Doenças Infecciosas (uso)
      NT: Dengue
      NT: Infecção (geral)
          UF: infecção [→ USE Infecção]
          UF: infecções [implicada]
      NT: Infecção de garganta
          UF: inflamação de garganta [→ USE Infecção de garganta — desambiguar]
          UF: inflamação na garganta [→ USE Infecção de garganta]
          UF: garganta inflamada [→ USE Infecção de garganta]
          UF: infecção de garganta [→ forma preferida]
          UF: problemas na garganta [→ USE Infecção de garganta]
      NT: Infecção de pele
      NT: Infecção no sangue
          UF: sepse (implicada)
      NT: Malária
      NT: Sarampo
      NT: Tifo
      NT: Tuberculose *(ver Sistema Respiratório)*
      NT: Virose

  NT: Intoxicações e Envenenamentos (uso)
      NT: Envenenamento
          UF: intoxicação [→ USE Envenenamento]
          UF: desintoxicar [→ USE Envenenamento — ver §3.2]
          UF: desintoxicação alimentar [→ NT de Envenenamento]
      NT: Mordida de cobra
          UF: picada de cobra [→ USE Mordida de cobra]
      NT: Picada de inseto
          UF: bicho de pé [→ NT de Picada de inseto]
          UF: picada de abelha [→ NT de Picada de inseto]
          UF: picada de aranha [→ NT de Picada de inseto]
          UF: picada de insetos [→ USE Picada de inseto]
          UF: picada de mosquito [→ NT de Picada de inseto]
          UF: picadas [→ USE Picada de inseto]
          UF: picadas de insetos [→ USE Picada de inseto]

  NT: Doenças Metabólicas e Endócrinas (uso)
      NT: Diabetes
          UF: diabete [→ USE Diabetes]
          UF: antidiabético [→ USE Diabetes — ver §3.2]
          UF: colesterol e diabetes [→ USE Diabetes / Colesterol]
      NT: Emagrecimento
          UF: emagrecer [→ USE Emagrecimento — ver §3.2]
          UF: perda de peso [→ USE Emagrecimento]
      NT: Escorbuto
      NT: Ictérícia
          UF: ictéricia [→ USE Icterícia — erro ortográfico]

  NT: Ações Farmacológicas (propriedades atribuídas)
      *Scope Note: termos que descrevem a ação terapêutica da planta/animal,
      não a doença-alvo. Usar em indexação paralela com o termo de condição.*
      NT: Antisséptico
      NT: Antiviral
      NT: Depurativo
          UF: depurativo do sangue [→ USE Depurativo]
      NT: Diaforético
          UF: suor [→ USE Diaforético — ambíguo, Scope Note]
      NT: Diurético *(ver Sistema Urinário)*
      NT: Emético
          UF: causar vômito [→ USE Emético]
      NT: Expectorante *(ver Sistema Respiratório)*
      NT: Hipotensivo
          UF: baixar a febre [→ USE Antitérmico — ver abaixo]
          UF: baixar a pressão [→ USE Hipotensivo]
      NT: Antitérmico
          UF: baixar a febre [→ USE Antitérmico]
      NT: Reconstituinte
          UF: revigorar [→ USE Reconstituinte — ver §3.2]
          UF: tonificante [→ USE Reconstituinte]
          UF: fortificante [→ USE Reconstituinte]
      NT: Vermicida
          UF: inseticida [→ NT de Vermicida ou separar]
```

---

### FACETA B — USOS NÃO MEDICINAIS
*Top Term: Uso Não Medicinal*

```
Uso Não Medicinal
  NT: Uso Alimentar
      UF: alimentar [→ USE Uso Alimentar]
      UF: alimentício [→ USE Uso Alimentar]
      UF: comida [→ USE Uso Alimentar]
      UF: doce [→ NT de Uso Alimentar]
      UF: sustento [→ USE Uso Alimentar]
      NT: Apetite (regulação)
          UF: apetite [→ USE Apetite (regulação)]
          UF: falta de apetite [→ NT de Apetite (regulação)]
          UF: perda de apetite [→ USE Falta de apetite]
          UF: fome [→ USE Apetite (regulação) — Scope Note]
      NT: Energia (alimento)
          UF: dar energia [→ USE Energia — ver §3.2]
          UF: esgotamento [→ NT de Energia]
          UF: esgotamento físico [→ USE Esgotamento]
          UF: fraqueza [→ NT de Energia]

  NT: Uso Cosmético e de Higiene
      UF: cosmético [→ USE Uso Cosmético]
      UF: esfolantes [→ NT de Uso Cosmético]
      UF: higiene [→ USE Uso Cosmético e de Higiene]
      UF: lubrificante [→ NT de Uso Cosmético]
      NT: Cuidados com cabelo
          UF: cabelo [→ USE Cuidados com cabelo — ambíguo]
          UF: crescer cabelo [→ USE Cuidados com cabelo — ver §3.2]
      NT: Cuidados com a pele (cosmético)
          UF: cuidados pessoais [→ USE Cuidados com a pele]

  NT: Uso Material e Tecnológico
      UF: artesanal [→ USE Uso Material — ver §3.2]
      UF: artesanato [→ NT de Uso Material]
      UF: combustível [→ NT de Uso Material]
      UF: construção [→ NT de Uso Material]
      UF: madeira [→ NT de Uso Material — ambíguo, Scope Note]
      UF: móveis [→ NT de Uso Material]
      UF: revestimento [→ NT de Uso Material]
      UF: tecnologia [→ USE Uso Material — Scope Note]
      UF: tecnologia social [→ NT de Uso Material]
      UF: tecnológico [→ USE Uso Material — ver §3.2]
      NT: Utensílio doméstico
          UF: utensílio [→ USE Utensílio doméstico]
          UF: utensílios [→ USE Utensílio doméstico]
          UF: cesto [→ NT de Utensílio doméstico]
          UF: velas [→ NT de Utensílio doméstico — ambíguo]
          UF: panos [→ NT de Utensílio doméstico — ambíguo]
      NT: Corante
      NT: Inseticida *(ver também Faceta A / Vermicida)*

  NT: Uso Ritual e Espiritual
      UF: descarrego [→ NT de Uso Ritual]
      UF: defumação [→ NT de Uso Ritual]
      UF: defumador [→ USE Defumação]
      UF: espiritual [→ USE Uso Ritual e Espiritual]
      UF: litúrgico [→ USE Uso Ritual e Espiritual]
      UF: místico [→ USE Uso Ritual e Espiritual]
      UF: olho gordo [→ NT de Uso Ritual — Scope Note cultural obrigatória]
      UF: ritual [→ USE Uso Ritual e Espiritual]
      UF: espectro [→ NT de Uso Ritual — Scope Note cultural obrigatória]
      NT: Banho ritual
          UF: banho [→ USE Banho ritual — ambíguo, Scope Note]

  NT: Uso Lúdico e Ornamental
      UF: lúdico [→ USE Uso Lúdico]
      UF: ornamental [→ USE Uso Ornamental]

  NT: Fonte Genética
      UF: fonte genética [→ USE Fonte Genética]
      *Scope Note: uso para conservação e pesquisa genética de recursos biológicos.*
```

---

### FACETA C — PARTES DE PLANTAS E ANIMAIS
*Top Term: Partes Utilizadas*

```
Partes Utilizadas
  NT: Raízes
      UF: raízes [entry → confirmar como Top Term ou NT]
      UF: tubérculo [entry → NT de Raízes ou separar]
  NT: Sementes
  NT: Planta inteira
  NT: Cerne (madeira)
      UF: cerne [→ USE Cerne (madeira)]
  NT: Partes animais
      NT: Ponta de flecha (material de pesca/caça)
          UF: ponta de flecha [→ NT — Scope Note necessária]
```

*Nota: esta faceta está **subdesenvolvida** na lista atual. A maioria das partes de plantas
(folhas, cascas, flores, frutos) está ausente como termos independentes.*

---

### FACETA D — FORMAS DE PREPARO E ADMINISTRAÇÃO
*Top Term: Formas de Preparo*

```
Formas de Preparo
  NT: Chá (infusão/decocção)
      UF: chá [→ USE Chá]
      UF: chá (bebida recreativa) [→ NT de Chá — Scope Note distinguindo uso]
      UF: chá de bebê [→ NT de Chá ou USE Calmante infantil]
      UF: xarope [→ NT de Formas de Preparo]
      UF: clister [→ NT — Scope Note necessária, uso histórico]
  NT: Defumação *(ver Faceta B / Uso Ritual)*
  NT: Banho *(ver Faceta B / Uso Ritual — desambiguar uso terapêutico x ritual)*
```

*Nota: faceta igualmente subdesenvolvida. Termos como decocção, maceração, tintura,
cataplasma, infusão estão **ausentes** e deveriam ser propostos.*

---

### FACETA E — COMUNIDADES E SUJEITOS DO CONHECIMENTO
*Top Term: Sujeitos do Conhecimento Tradicional*

```
Sujeitos do Conhecimento Tradicional
  NT: Comunidades Quilombolas
      UF: comunidades quilombolas [status: candidate → ATIVAR]
  NT: Povos Indígenas
      UF: povos indígenas [→ confirmar como Top Term]
  NT: Caçadores
      UF: caça [→ USE Caçadores — ambíguo, pode ser atividade]
```

*Nota: faceta crítica para os Princípios CARE. Está muito subdesenvolvida.
Devem ser propostos termos para: pajés, raizeiros, parteiras, benzedeiras,
ribeirinhos, caiçaras, seringueiros, pescadores artesanais.*

---

### FACETA F — PROPRIEDADES E CATEGORIAS ANALÍTICAS
*Top Term: Propriedades Atribuídas*

```
Propriedades Atribuídas
  NT: Tóxico
      UF: tóxico [→ USE Tóxico]
      UF: veneno [→ USE Tóxico — Scope Note diferenciando de picada/envenenamento]
      UF: químico [→ ambíguo — ver §3.3]
  NT: Anticorpos
      *Scope Note: propriedade biológica atribuída; verificar se é user warrant.*
  NT: Refrescante
  NT: Estimulante
      UF: estimulante [→ USE Estimulante]
      UF: dar energia [→ USE Estimulante / Energia]
  NT: Relaxante
      UF: relaxante [→ USE Relaxante]
  NT: Balanço (propriedade)
      UF: balanço [→ REVISAR — pode ser forma de preparo ou propriedade — Scope Note]
  NT: Escorregadio
      *Scope Note: propriedade física (mucilaginosa?). Verificar user warrant.*
```

---

## 3. Problemas que Requerem Decisão Editorial

### 3.1 Termos pré-coordenados indevidos (dois conceitos num só termo)

Estes termos combinam dois conceitos distintos. A norma Z39.19 recomenda
separar em dois termos independentes, usando RT entre eles:

| Termo atual | Ação recomendada |
|---|---|
| `asma e tosse` | → Deprecar. USE: Asma + Tosse (dois registros) |
| `gripe e resfriado` | → Deprecar. USE: Gripe + Resfriado |
| `gripe e tosse` | → Deprecar. USE: Gripe + Tosse |
| `colesterol e diabetes` | → Deprecar. USE: Colesterol + Diabetes |
| `cólicas do fígado e estômago` | → Deprecar. USE: Cólica + Fígado + Estômago |
| `cicatrizar feridas e úlceras` | → Deprecar. USE: Cicatrização (ação) |
| `fígado e estômago` | → Deprecar. USE: Fígado (afecções) + Estômago (afecções) |
| `fígado e rins` | → Deprecar. USE: Fígado (afecções) + Rins (afecções) |
| `dores e cólicas` | → Deprecar. USE: Dor + Cólica |
| `dor de garganta` | → Deprecar. USE: Infecção de garganta (se inflamatória) |

### 3.2 Termos em forma verbal ou adjetival (devem virar substantivos)

| Termo atual | Forma preferida proposta |
|---|---|
| `alimentício` | → USE: Uso Alimentar (UF de alimentício) |
| `artesanal` | → USE: Uso Artesanal (UF de artesanal) |
| `causar vômito` | → USE: Emético |
| `cicatrizante` | → USE: Cicatrização (ação) |
| `crescer cabelo` | → USE: Cuidados com cabelo |
| `curar insônia` | → USE: Insônia |
| `dar energia` | → USE: Estimulante / Energia |
| `dar sono` | → USE: Sedativo / Insônia |
| `digestivo` | → USE: Digestão |
| `dormir` | → USE: Insônia / Sedativo |
| `emagrecer` | → USE: Emagrecimento |
| `remediar` | → USE: Uso Medicinal *(muito amplo — avaliar exclusão)* |
| `revigorar` | → USE: Reconstituinte |
| `tecnológico` | → USE: Uso Material e Tecnológico |
| `baixar a febre` | → USE: Antitérmico |
| `baixar a pressão` | → USE: Hipotensivo |
| `desintoxicar` | → USE: Depurativo / Envenenamento |

### 3.3 Homógrafos sem qualificador (ambiguidade semântica)

| Termo ambíguo | Conceitos distintos | Ação |
|---|---|---|
| `espinha` | acne ≠ espinha dorsal | → `acne` + `coluna vertebral` |
| `sistema nervoso` | órgão anatômico ≠ condição nervosa | → qualificar com Scope Note |
| `panos` | utensílio doméstico ≠ micose (pano-branco) | → `panos (utensílio)` + `tinea (micose)` |
| `vias urinárias` | órgão ≠ condição | → Scope Note |
| `canal` | conduto anatômico ≠ uso material | → verificar warrant |
| `músculos` | órgão ≠ dor muscular | → Scope Note obrigatória |
| `banho` | higiene ≠ ritual ≠ terapêutico | → `banho ritual` + `banho terapêutico` |
| `veias` | órgão ≠ varizes | → USE: Varizes ou Scope Note |
| `sono` | estado fisiológico ≠ insônia ≠ sedativo | → Scope Note |
| `balanço` | propriedade física ≠ uso ≠ equipamento | → investigar warrant |
| `quengo` | crânio (regionalismo) ≠ ? | → Scope Note + fonte |
| `químico` | propriedade ≠ profissional ≠ uso | → verificar warrant |

### 3.4 Sobreposição entre termos relacionados que precisam de distinção

| Par / Grupo | Problema | Solução proposta |
|---|---|---|
| `calmante` / `sedativo` / `tranquilizante` / `sonífero` | graus de intensidade ou sinônimos? | Definir `sedativo` como NT de `calmante`, com Scope Notes distintas |
| `depurativo` / `desintoxicação` / `limpeza` | conceitos sobrepostos | `depurativo` (ação farmacológica) RT `desintoxicação` (processo) |
| `inflamação` / `infecção` | confundidos no uso popular | Scope Notes distinguindo: inflamação = resposta imune; infecção = agente externo |
| `dor de barriga` / `cólica de rins` / `dor na bacia` | sintoma genérico vs. específico | Manter específicos como NT do genérico `Dor abdominal` |
| `medicinal` / `remédio` / `cura` / `saúde` | muito amplos | Avaliar se são Top Terms ou se devem ser removidos por falta de especificidade |

---

## 4. Termos que Requerem Atenção Cultural (Princípios CARE)

| Termo | Tipo de atenção necessária |
|---|---|
| `olho gordo` | Conhecimento espiritual/cultural — Scope Note obrigatória indicando contexto cultural e comunidade |
| `espectro` | Idem — verificar se é termo de uso indígena específico |
| `descarrego` | Uso em tradições afro-brasileiras — atribuição necessária |
| `defumação` / `defumador` | Uso ritual — distinguir uso terapêutico de uso espiritual |
| `ritual` | Muito amplo — Scope Note ou subdivisão por tradição |
| `espinhela caída` | Síndrome popular brasileira — Scope Note etnomédica obrigatória |
| `corpo ruim` | Idem — verificar contexto cultural de uso |
| `dúvida` | Uso popular como "estado de saúde" — investigar warrant etnomédico |
| `catuaba` | Planta com nome vernáculo — verificar se deve estar em Faceta de Recursos ou Ações |
| `comunidades quilombolas` | Status: candidate → ativar com consulta à comunidade |
| `povos indígenas` | Verificar se é Top Term ou se deve ser mais específico por povo |

---

## 5. Termos Candidatos à Exclusão (baixo warrant ou fora de escopo)

Estes termos devem ser avaliados para exclusão ou reclassificação:

| Termo | Razão |
|---|---|
| `arame` | Sem warrant etnobotânico identificado — verificar |
| `anticorpos` | Conceito biomédico sem warrant no uso popular/tradicional |
| `outros` | Inválido como termo controlado — não tem delimitação semântica |
| `ponta de flecha` | Possível, mas precisa de Scope Note específica |
| `porrete` | Sem warrant claro — verificar contexto de uso |
| `ralação` | Idem |
| `canal` | Muito ambíguo sem contexto — investigar |
| `quengo` | Regionalismo — verificar warrant e comunidade de uso |

---

## 6. Termos Ausentes (lacunas identificadas)

Termos que deveriam existir mas estão ausentes da lista atual:

### Formas de preparo (Faceta D — lacuna crítica)
- Decocção, Infusão, Maceração, Tintura, Cataplasma, Pomada, Emplastro, Gargarejo, Inalação, Suposição

### Partes de plantas (Faceta C — lacuna crítica)
- Folhas, Cascas, Flores, Frutos, Látex, Resina, Óleo essencial, Rizoma, Bulbo

### Detentores do conhecimento (Faceta E — lacuna crítica)
- Pajé, Raizeiro, Benzedeira, Parteira, Curandeiro, Rezador, Erveiro

### Contexto de uso
- Dose, Contraindicação, Interação com outros remédios, Via de administração

---

## 7. Checklist de Qualidade (Z39.19 §9)

```
[✗] Termos órfãos sem BT declarado — grande maioria dos 461 termos
[✗] Relacionamentos BT/NT/RT ausentes — nenhum está mapeado na lista atual
[✗] Reciprocidade BT/NT — não verificável sem estrutura
[!] Homógrafos sem qualificador — ~10 casos identificados (§3.3)
[!] Termos em forma verbal — ~15 casos (§3.2)
[!] Termos pré-coordenados indevidos — ~10 casos (§3.1)
[✗] Scope notes ausentes — todos os termos
[!] Status [candidate] não resolvido — 3 termos
[!] Termos culturalmente sensíveis sem Scope Note — ~10 casos (§4)
[?] Termos fora de escopo — ~8 casos para avaliação (§5)
```

**Legenda**: ✗ = problema generalizado | ! = casos específicos | ? = requer decisão

---

## 8. Próximos Passos Recomendados

1. **Imediato**: Resolver os termos pré-coordenados (§3.1) e os verbais (§3.2) — são mecânicos e podem ser feitos em lote
2. **Curto prazo**: Mapear BT para todos os termos usando as facetas propostas acima
3. **Médio prazo**: Redigir Scope Notes para os homógrafos (§3.3) e termos culturais (§4)
4. **Longo prazo**: Desenvolver as facetas C, D e E, que estão subdesenvolvidas
5. **Com comunidades**: Validar os termos da Faceta E e os termos de §4 com os detentores do conhecimento

---

*Documento gerado com base na skill `controlled-vocabulary` seguindo ANSI/NISO Z39.19-2005 (R2010) e Princípios CARE.*
