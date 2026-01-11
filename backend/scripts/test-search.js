// Script para testar a busca de termos
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function testSearch() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB\n');

    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');

    // 1. Contar total de termos
    const total = await terms.countDocuments();
    console.log(`📊 Total de termos no banco: ${total}\n`);

    // 2. Mostrar alguns termos
    console.log('📝 Primeiros 10 termos (ordem alfabética):');
    const primeirosTermos = await terms
      .find({})
      .sort({ prefLabel: 1 })
      .limit(10)
      .project({ prefLabel: 1, status: 1 })
      .toArray();

    primeirosTermos.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.prefLabel} [${t.status}]`);
    });

    // 3. Testar busca por texto
    console.log('\n🔍 Teste de busca: "medicinal"');
    const resultadosMedicinal = await terms
      .find(
        { $text: { $search: 'medicinal' } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .toArray();

    if (resultadosMedicinal.length > 0) {
      console.log(`   ✅ Encontrados ${resultadosMedicinal.length} resultados:`);
      resultadosMedicinal.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.prefLabel} (score: ${t.score?.toFixed(2)})`);
      });
    } else {
      console.log('   ⚠️ Nenhum resultado encontrado');
    }

    // 4. Testar busca por outro termo
    console.log('\n🔍 Teste de busca: "dor"');
    const resultadosDor = await terms
      .find(
        { $text: { $search: 'dor' } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .toArray();

    if (resultadosDor.length > 0) {
      console.log(`   ✅ Encontrados ${resultadosDor.length} resultados:`);
      resultadosDor.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.prefLabel} (score: ${t.score?.toFixed(2)})`);
      });
    } else {
      console.log('   ⚠️ Nenhum resultado encontrado');
    }

    // 5. Testar busca com filtro de status
    console.log('\n🔍 Teste de busca com filtro: "gripe" + status=active');
    const resultadosGripe = await terms
      .find(
        {
          $text: { $search: 'gripe' },
          status: 'active',
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .toArray();

    if (resultadosGripe.length > 0) {
      console.log(`   ✅ Encontrados ${resultadosGripe.length} resultados:`);
      resultadosGripe.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.prefLabel} [${t.status}] (score: ${t.score?.toFixed(2)})`);
      });
    } else {
      console.log('   ⚠️ Nenhum resultado encontrado');
    }

    // 6. Verificar índices
    console.log('\n📋 Índices criados:');
    const indexes = await terms.indexes();
    indexes.forEach((idx) => {
      console.log(`   - ${idx.name}`);
    });

    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testSearch();
