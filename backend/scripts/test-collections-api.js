// Script para testar a API de coleções
import fetch from 'node-fetch';

async function testCollectionsAPI() {
  try {
    console.log('🔍 Testando API de coleções...\n');

    // Teste 1: API pública (sem autenticação)
    console.log('1️⃣ Testando GET /api/v1/collections (público)');
    const publicResponse = await fetch('http://localhost:4000/api/v1/collections');

    if (!publicResponse.ok) {
      console.log(`   ❌ Erro: ${publicResponse.status} ${publicResponse.statusText}`);
    } else {
      const publicData = await publicResponse.json();
      console.log(`   ✅ Status: ${publicResponse.status}`);
      console.log(`   📊 Total de coleções: ${publicData.length || 0}`);

      if (Array.isArray(publicData) && publicData.length > 0) {
        console.log('   📝 Coleções:');
        publicData.forEach((col, i) => {
          console.log(`      ${i + 1}. ${col.name} (ID: ${col._id})`);
        });
      }
    }

    // Teste 2: API admin (com autenticação)
    console.log('\n2️⃣ Testando GET /api/v1/collections (admin)');
    const adminResponse = await fetch('http://localhost:4001/api/v1/collections', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:admin123').toString('base64')
      }
    });

    if (!adminResponse.ok) {
      console.log(`   ❌ Erro: ${adminResponse.status} ${adminResponse.statusText}`);
      const errorText = await adminResponse.text();
      console.log(`   Resposta: ${errorText}`);
    } else {
      const adminData = await adminResponse.json();
      console.log(`   ✅ Status: ${adminResponse.status}`);
      console.log(`   📊 Total de coleções: ${adminData.length || 0}`);

      if (Array.isArray(adminData) && adminData.length > 0) {
        console.log('   📝 Coleções:');
        adminData.forEach((col, i) => {
          console.log(`      ${i + 1}. ${col.name} (ID: ${col._id})`);
        });
      }
    }

    console.log('\n✅ Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testCollectionsAPI();
