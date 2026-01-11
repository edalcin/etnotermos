// Script para verificar coleções no banco
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function checkCollections() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Conectado ao MongoDB\n');

    const db = client.db('etnodb');
    const collections = db.collection('etnotermos-collections');

    // Contar coleções
    const count = await collections.countDocuments();
    console.log(`📊 Total de coleções no banco: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  Não há coleções cadastradas no banco de dados.\n');
      console.log('💡 Para criar coleções, acesse:');
      console.log('   http://localhost:4001/collections/new\n');
      return;
    }

    // Listar coleções
    console.log('📝 Coleções cadastradas:\n');
    const allCollections = await collections.find({}).toArray();

    allCollections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name}`);
      console.log(`   ID: ${col._id}`);
      console.log(`   Descrição: ${col.description || 'Sem descrição'}`);
      console.log(`   Criada em: ${col.createdAt?.toLocaleString('pt-BR')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkCollections();
