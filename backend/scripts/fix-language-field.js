// Script para remover valores inválidos do campo language
// MongoDB não aceita "pt-BR", apenas "portuguese" ou null
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function fixLanguageField() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB\n');

    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');

    // 1. Contar termos com language inválido
    console.log('1️⃣ Verificando termos com language inválido...');

    const invalidCount = await terms.countDocuments({
      language: { $in: ['pt-BR', 'pt'] }
    });

    console.log(`   Encontrados ${invalidCount} termos com language inválido\n`);

    if (invalidCount === 0) {
      console.log('✅ Nenhum termo precisa ser corrigido!');
      return;
    }

    // 2. Mostrar alguns exemplos
    console.log('2️⃣ Exemplos de termos que serão corrigidos:');
    const examples = await terms
      .find({ language: { $in: ['pt-BR', 'pt'] } })
      .limit(10)
      .project({ prefLabel: 1, language: 1 })
      .toArray();

    examples.forEach((term, i) => {
      console.log(`   ${i + 1}. ${term.prefLabel} (language: "${term.language}")`);
    });

    if (invalidCount > 10) {
      console.log(`   ... e mais ${invalidCount - 10} termos\n`);
    }

    // 3. Remover o campo language inválido
    console.log('\n3️⃣ Removendo campo language inválido...');

    const result = await terms.updateMany(
      { language: { $in: ['pt-BR', 'pt'] } },
      { $unset: { language: '' } }
    );

    console.log(`   ✅ ${result.modifiedCount} termos corrigidos\n`);

    // 4. Verificar resultado
    console.log('4️⃣ Verificando resultado...');
    const remainingInvalid = await terms.countDocuments({
      language: { $in: ['pt-BR', 'pt'] }
    });

    if (remainingInvalid === 0) {
      console.log('   ✅ Todos os termos foram corrigidos!');
    } else {
      console.log(`   ⚠️  Ainda restam ${remainingInvalid} termos com language inválido`);
    }

    // 5. Estatísticas finais
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`   Total de termos no banco: ${await terms.countDocuments({})}`);

    const withLanguage = await terms.countDocuments({
      language: { $exists: true, $ne: null }
    });
    console.log(`   Termos com language definido: ${withLanguage}`);

    const withoutLanguage = await terms.countDocuments({
      $or: [
        { language: { $exists: false } },
        { language: null }
      ]
    });
    console.log(`   Termos sem language: ${withoutLanguage}`);

    console.log('\n✅ Processo concluído!');
    console.log('\n💡 Agora você pode editar termos sem erro de "language override unsupported"');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixLanguageField();
