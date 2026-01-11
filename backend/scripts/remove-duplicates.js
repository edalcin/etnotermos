// Script para remover termos duplicados (case-insensitive)
// Mantém apenas a versão que aparece na lista original
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function removeDuplicates() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB\n');

    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');

    // Buscar todos os termos
    const allTerms = await terms.find({}).toArray();
    console.log(`📊 Total de termos no banco: ${allTerms.length}`);

    // Agrupar por prefLabel (case-insensitive)
    const termsByLabel = new Map();
    for (const term of allTerms) {
      const labelLower = term.prefLabel.toLowerCase();
      if (!termsByLabel.has(labelLower)) {
        termsByLabel.set(labelLower, []);
      }
      termsByLabel.get(labelLower).push(term);
    }

    // Encontrar duplicados
    const duplicates = [];
    for (const [label, terms] of termsByLabel.entries()) {
      if (terms.length > 1) {
        duplicates.push({ label, terms });
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ Nenhum duplicado encontrado!');
      return;
    }

    console.log(`\n⚠️  Encontrados ${duplicates.length} termos duplicados:\n`);

    let totalRemoved = 0;

    for (const { label, terms: duplicateTerms } of duplicates) {
      console.log(`\n📝 Termo: "${label}"`);
      console.log(`   Versões encontradas: ${duplicateTerms.length}`);

      // Ordenar por data de criação (mais antigo primeiro)
      duplicateTerms.sort((a, b) => a.createdAt - b.createdAt);

      // Identificar qual manter
      // Prioridade: 1) minúscula exata, 2) mais antiga
      let toKeep = duplicateTerms.find((t) => t.prefLabel === label);
      if (!toKeep) {
        toKeep = duplicateTerms[0]; // Manter a mais antiga
      }

      // Identificar quais remover
      const toRemove = duplicateTerms.filter((t) => t._id.toString() !== toKeep._id.toString());

      console.log(`   ✓ Mantendo: "${toKeep.prefLabel}" (criado em ${toKeep.createdAt.toISOString()})`);

      for (const term of toRemove) {
        console.log(`   ✗ Removendo: "${term.prefLabel}" (criado em ${term.createdAt.toISOString()})`);
        await terms.deleteOne({ _id: term._id });
        totalRemoved++;
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`   Total de termos removidos: ${totalRemoved}`);
    console.log(`   Total de termos restantes: ${allTerms.length - totalRemoved}`);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

removeDuplicates();
