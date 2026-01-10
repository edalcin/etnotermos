// Database Seed Script for EtnoTermos
// Populates database with sample terms, relationships, sources, and collections for testing

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

// Sample data
const sampleSources = [
  {
    _id: 'source_001',
    type: 'bibliographic',
    fields: {
      author: 'Silva, J.M.',
      title: 'Flora Medicinal Brasileira',
      year: '2020',
      publisher: 'Editora Científica'
    },
    createdAt: new Date()
  },
  {
    _id: 'source_002',
    type: 'interview',
    fields: {
      interviewee: 'Maria Santos',
      community: 'Comunidade Quilombola São José',
      date: '2021-05-15',
      interviewer: 'Dr. Carlos Oliveira'
    },
    createdAt: new Date()
  },
  {
    _id: 'source_003',
    type: 'field_notes',
    fields: {
      researcher: 'Ana Paula Costa',
      location: 'Floresta Amazônica, AM',
      date: '2022-08-20',
      notes: 'Observação direta de uso tradicional'
    },
    createdAt: new Date()
  }
];

const sampleCollections = [
  {
    _id: 'coll_001',
    name: 'Plantas Medicinais',
    description: 'Termos relacionados a plantas com uso medicinal'
  },
  {
    _id: 'coll_002',
    name: 'Comunidades Tradicionais',
    description: 'Tipos de comunidades tradicionais do Brasil'
  },
  {
    _id: 'coll_003',
    name: 'Usos Etnobotânicos',
    description: 'Categorias de uso de plantas por comunidades tradicionais'
  }
];

const sampleTerms = [
  {
    _id: 'term_001',
    prefLabel: 'Jaborandi',
    altLabels: ['Pilocarpus jaborandi', 'arruda-do-mato'],
    hiddenLabels: ['jaborandi plant'],
    definition: 'Planta medicinal nativa da Mata Atlântica, conhecida por suas propriedades sudoríferas e sialagogas.',
    scopeNote: 'Utilizada principalmente para extração de pilocarpina, usada em tratamentos oftalmológicos.',
    example: 'As folhas de jaborandi são coletadas para produção de medicamentos.',
    termType: 'preferred',
    status: 'active',
    facets: {
      plantPart: 'folha',
      usageType: 'medicinal',
      region: 'Mata Atlântica'
    },
    sourceIds: ['source_001'],
    collectionIds: ['coll_001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  },
  {
    _id: 'term_002',
    prefLabel: 'Uso medicinal',
    altLabels: ['uso terapêutico', 'aplicação medicinal'],
    definition: 'Categoria de uso de plantas para fins terapêuticos e de tratamento de enfermidades.',
    scopeNote: 'Inclui preparações como chás, infusões, cataplasmas e extratos medicinais.',
    termType: 'preferred',
    status: 'active',
    facets: {
      category: 'uso',
      domain: 'saúde'
    },
    sourceIds: ['source_001', 'source_002'],
    collectionIds: ['coll_003'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  },
  {
    _id: 'term_003',
    prefLabel: 'Quilombola',
    altLabels: ['comunidade quilombola', 'remanescente de quilombo'],
    definition: 'Comunidade tradicional formada por descendentes de africanos escravizados que resistiram ao regime escravocrata.',
    scopeNote: 'Reconhecidas constitucionalmente no Brasil pelo Art. 68 do ADCT da Constituição de 1988.',
    termType: 'preferred',
    status: 'active',
    facets: {
      type: 'comunidade_tradicional',
      region: 'Brasil',
      marco_legal: 'Decreto 8.750/2016'
    },
    sourceIds: ['source_002'],
    collectionIds: ['coll_002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  },
  {
    _id: 'term_004',
    prefLabel: 'Infusão',
    altLabels: ['chá', 'tisana'],
    definition: 'Método de preparo de plantas medicinais por imersão em água quente.',
    scopeNote: 'Técnica comumente usada para extração de princípios ativos de folhas e flores.',
    termType: 'preferred',
    status: 'active',
    facets: {
      category: 'método_preparo',
      domain: 'etnobotânica'
    },
    sourceIds: ['source_001'],
    collectionIds: ['coll_001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  },
  {
    _id: 'term_005',
    prefLabel: 'Mata Atlântica',
    altLabels: ['floresta atlântica', 'Atlantic Forest'],
    definition: 'Bioma brasileiro caracterizado por floresta tropical úmida costeira.',
    scopeNote: 'Um dos biomas mais ameaçados do mundo, rico em biodiversidade e conhecimento tradicional.',
    termType: 'preferred',
    status: 'active',
    facets: {
      category: 'bioma',
      region: 'litoral brasileiro'
    },
    sourceIds: ['source_003'],
    collectionIds: ['coll_001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }
];

const sampleRelationships = [
  {
    _id: 'rel_001',
    sourceTermId: 'term_001', // Jaborandi
    targetTermId: 'term_002', // Uso medicinal
    type: 'BT', // Broader Term - Jaborandi is a type of medicinal use
    reciprocalType: 'NT',
    isReciprocal: true,
    createdAt: new Date(),
    validatedAt: new Date()
  },
  {
    _id: 'rel_002',
    sourceTermId: 'term_002', // Uso medicinal
    targetTermId: 'term_001', // Jaborandi
    type: 'NT', // Narrower Term - reciprocal
    reciprocalType: 'BT',
    isReciprocal: true,
    createdAt: new Date(),
    validatedAt: new Date()
  },
  {
    _id: 'rel_003',
    sourceTermId: 'term_004', // Infusão
    targetTermId: 'term_002', // Uso medicinal
    type: 'RT', // Related Term
    reciprocalType: 'RT',
    isReciprocal: true,
    createdAt: new Date(),
    validatedAt: new Date()
  },
  {
    _id: 'rel_004',
    sourceTermId: 'term_001', // Jaborandi
    targetTermId: 'term_005', // Mata Atlântica
    type: 'RT', // Related Term
    reciprocalType: 'RT',
    isReciprocal: true,
    createdAt: new Date(),
    validatedAt: new Date()
  }
];

const sampleNotes = [
  {
    _id: 'note_001',
    termId: 'term_001',
    type: 'scope',
    content: 'O termo "jaborandi" pode se referir a várias espécies do gênero Pilocarpus, mas P. jaborandi é a mais conhecida.',
    sourceIds: ['source_001'],
    createdAt: new Date()
  },
  {
    _id: 'note_002',
    termId: 'term_003',
    type: 'historical',
    content: 'As comunidades quilombolas foram reconhecidas oficialmente pela Constituição de 1988, marcando um importante avanço nos direitos das comunidades tradicionais.',
    sourceIds: ['source_002'],
    createdAt: new Date()
  },
  {
    _id: 'note_003',
    termId: 'term_002',
    type: 'cataloger',
    content: 'Este termo é usado como categoria pai para diversos usos medicinais específicos.',
    sourceIds: [],
    createdAt: new Date()
  }
];

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Clear existing data (optional - remove in production)
    console.log('Clearing existing collections...');
    await db.collection('sources').deleteMany({});
    await db.collection('collections').deleteMany({});
    await db.collection('etnotermos').deleteMany({});
    await db.collection('relationships').deleteMany({});
    await db.collection('notes').deleteMany({});

    // Insert sample data
    console.log('Inserting sample sources...');
    await db.collection('sources').insertMany(sampleSources);

    console.log('Inserting sample collections...');
    await db.collection('collections').insertMany(sampleCollections);

    console.log('Inserting sample terms...');
    await db.collection('etnotermos').insertMany(sampleTerms);

    console.log('Inserting sample relationships...');
    await db.collection('relationships').insertMany(sampleRelationships);

    console.log('Inserting sample notes...');
    await db.collection('notes').insertMany(sampleNotes);

    console.log('✅ Database seeded successfully!');
    console.log(`
Seeded data summary:
- ${sampleSources.length} sources
- ${sampleCollections.length} collections
- ${sampleTerms.length} terms
- ${sampleRelationships.length} relationships
- ${sampleNotes.length} notes
    `);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export default seed;
