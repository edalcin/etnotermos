// Script para gerar relatório sobre os termos carregados
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function generateReport() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');
    const auditLogs = db.collection('etnotermos-audit-logs');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('        📊 RELATÓRIO DE CARGA DE TERMOS - ETNOTERMOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Total de termos
    const total = await terms.countDocuments();
    console.log(`✅ Total de termos cadastrados: ${total}`);

    // Por status
    const byStatus = await terms.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    console.log('\n📊 Distribuição por status:');
    byStatus.forEach((item) => {
      console.log(`   - ${item._id}: ${item.count}`);
    });

    // Termos por letra inicial
    console.log('\n📊 Distribuição por letra inicial:');
    const byLetter = await terms.aggregate([
      {
        $project: {
          firstLetter: { $toUpper: { $substrCP: ['$prefLabel', 0, 1] } },
        },
      },
      { $group: { _id: '$firstLetter', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray();

    byLetter.forEach((item) => {
      const bar = '█'.repeat(Math.ceil(item.count / 5));
      console.log(`   ${item._id}: ${bar} ${item.count}`);
    });

    // Termos mais recentes
    console.log('\n📝 Últimos 15 termos adicionados:');
    const recent = await terms
      .find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .project({ prefLabel: 1, createdAt: 1 })
      .toArray();

    recent.forEach((t, i) => {
      const date = t.createdAt.toLocaleString('pt-BR');
      console.log(`   ${i + 1}. ${t.prefLabel} (${date})`);
    });

    // Categorias por tipo de uso (baseado em palavras-chave)
    console.log('\n📊 Categorias principais (análise por palavras-chave):');

    const categories = {
      'Dor/Dores': await terms.countDocuments({ prefLabel: /^dor/i }),
      'Infecção/Inflamação': await terms.countDocuments({ prefLabel: /^inf[el]/i }),
      'Problemas': await terms.countDocuments({ prefLabel: /^problemas/i }),
      'Cólicas': await terms.countDocuments({ prefLabel: /^cólica/i }),
      'Febre': await terms.countDocuments({ prefLabel: /febre/i }),
      'Gripe/Resfriado': await terms.countDocuments({ prefLabel: /(gripe|resfriado)/i }),
      'Tosse': await terms.countDocuments({ prefLabel: /tosse/i }),
      'Cicatriza': await terms.countDocuments({ prefLabel: /cicatriz/i }),
    };

    for (const [category, count] of Object.entries(categories)) {
      if (count > 0) {
        console.log(`   - ${category}: ${count} termo(s)`);
      }
    }

    // Logs de auditoria
    const auditCount = await auditLogs.countDocuments({ entityType: 'Term' });
    console.log(`\n📋 Total de logs de auditoria criados: ${auditCount}`);

    // Índices
    const indexes = await terms.indexes();
    console.log(`\n📚 Total de índices criados: ${indexes.length}`);
    indexes.forEach((idx) => {
      console.log(`   - ${idx.name}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Sistema pronto para uso!');
    console.log('');
    console.log('📌 Próximos passos:');
    console.log('   1. Inicie o servidor admin: npm run dev:admin');
    console.log('   2. Inicie o servidor público: npm run dev:public');
    console.log('   3. Acesse http://localhost:4001 (admin)');
    console.log('   4. Acesse http://localhost:4000 (público)');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

generateReport();
