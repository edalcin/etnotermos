// Script para corrigir campos de linguagem e recriar índices
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function fixLanguageAndIndexes() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB');

    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');

    // 1. Remover todos os índices de texto existentes
    console.log('\n1. Removendo índices de texto existentes...');
    try {
      const indexes = await terms.indexes();
      for (const index of indexes) {
        if (index.name && index.name.includes('text')) {
          await terms.dropIndex(index.name);
          console.log(`   ✓ Removido índice: ${index.name}`);
        }
      }
    } catch (error) {
      console.log('   ℹ Nenhum índice de texto para remover');
    }

    // 2. Atualizar termos com language = "pt-BR" para null
    console.log('\n2. Corrigindo campos de linguagem...');
    const result = await terms.updateMany(
      { language: 'pt-BR' },
      { $unset: { language: '' } }
    );
    console.log(`   ✓ ${result.modifiedCount} termos corrigidos`);

    // 3. Criar índice de texto sem language_override
    console.log('\n3. Criando novo índice de texto...');
    await terms.createIndex(
      {
        prefLabel: 'text',
        altLabels: 'text',
        hiddenLabels: 'text',
        definition: 'text',
        scopeNote: 'text',
        example: 'text',
      },
      {
        name: 'etnotermos_text_search',
        weights: {
          prefLabel: 10,
          altLabels: 5,
          definition: 3,
          scopeNote: 2,
          example: 1,
          hiddenLabels: 1,
        },
        default_language: 'portuguese',
      }
    );
    console.log('   ✓ Índice de texto criado com sucesso');

    // 4. Criar outros índices necessários
    console.log('\n4. Criando outros índices...');

    await terms.createIndex({ status: 1 });
    console.log('   ✓ Índice em status');

    await terms.createIndex({ collectionIds: 1 });
    console.log('   ✓ Índice em collectionIds');

    await terms.createIndex({ createdAt: -1 });
    console.log('   ✓ Índice em createdAt');

    await terms.createIndex({ updatedAt: -1 });
    console.log('   ✓ Índice em updatedAt');

    // 5. Criar índices para relationships
    const relationships = db.collection('etnotermos-relationships');
    console.log('\n5. Criando índices para relationships...');

    await relationships.createIndex({ sourceTermId: 1, type: 1 });
    await relationships.createIndex({ targetTermId: 1, type: 1 });
    console.log('   ✓ Índices de relacionamentos');

    // 6. Criar índices para notes
    const notes = db.collection('etnotermos-notes');
    console.log('\n6. Criando índices para notes...');

    await notes.createIndex({ termId: 1 });
    await notes.createIndex({ termId: 1, type: 1 });
    console.log('   ✓ Índices de notas');

    // 7. Criar índices para collections
    const collections = db.collection('etnotermos-collections');
    console.log('\n7. Criando índices para collections...');

    try {
      await collections.createIndex({ name: 1 }, { unique: true });
      console.log('   ✓ Índice único em name');
    } catch (error) {
      console.log('   ℹ Índice em name já existe');
    }

    // 8. Criar índices para audit logs
    const auditLogs = db.collection('etnotermos-audit-logs');
    console.log('\n8. Criando índices para audit logs...');

    await auditLogs.createIndex({ entityType: 1, entityId: 1 });
    await auditLogs.createIndex({ timestamp: -1 });
    await auditLogs.createIndex({ action: 1 });
    console.log('   ✓ Índices de audit logs');

    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixLanguageAndIndexes();
