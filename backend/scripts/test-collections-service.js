// Script para testar o CollectionService diretamente
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function testCollectionsService() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB\n');

    const db = client.db('etnodb');
    const collections = db.collection('etnotermos-collections');
    const terms = db.collection('etnotermos');

    // 1. Buscar todas as coleções
    console.log('1️⃣ Testando query: collections.find({})');
    const allCollections = await collections.find({}).sort({ name: 1 }).toArray();
    console.log(`   ✅ Retornou ${allCollections.length} coleção(ões)\n`);

    if (allCollections.length === 0) {
      console.log('⚠️  Nenhuma coleção encontrada!\n');
      return;
    }

    // 2. Mostrar detalhes de cada coleção
    console.log('2️⃣ Detalhes das coleções:\n');
    for (const col of allCollections) {
      console.log(`📁 ${col.name}`);
      console.log(`   ID: ${col._id}`);
      console.log(`   Descrição: ${col.description || 'Sem descrição'}`);
      console.log(`   Criada em: ${col.createdAt?.toISOString()}`);

      // Contar termos associados
      const termCount = await terms.countDocuments({
        collectionIds: col._id
      });
      console.log(`   📊 Termos associados: ${termCount}`);
      console.log('');
    }

    // 3. Verificar formato da resposta
    console.log('3️⃣ Formato da resposta (tipo):', typeof allCollections);
    console.log('   É array?', Array.isArray(allCollections));
    console.log('   JSON stringify:\n', JSON.stringify(allCollections, null, 2).substring(0, 500));

    console.log('\n✅ Testes concluídos!');
    console.log('\n💡 Se o servidor admin estiver rodando, a API deve retornar:');
    console.log('   GET /api/v1/collections → Array com', allCollections.length, 'coleção(ões)');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testCollectionsService();
