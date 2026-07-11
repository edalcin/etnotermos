#!/usr/bin/env node
/**
 * Gera docker/.env com ADMIN_USERS configurado.
 * Uso: node docker/create-admin-user.js
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const bcrypt = require('../backend/node_modules/bcrypt/bcrypt.js');

const ENV_FILE = path.join(__dirname, '.env');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// Hidden password input — falls back to visible if not a TTY
function askPassword(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      // Non-interactive (pipe/test): read normally
      rl.question(prompt, resolve);
      return;
    }

    process.stdout.write(prompt);
    let password = '';

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function onData(ch) {
      if (ch === '\r' || ch === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (ch === '') {
        // Ctrl+C
        process.stdout.write('\n');
        process.exit(0);
      } else if (ch === '' || ch === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + '*'.repeat(password.length));
        }
      } else {
        password += ch;
        process.stdout.write('*');
      }
    }

    process.stdin.on('data', onData);
  });
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    result[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return result;
}

async function main() {
  console.log('\n=== BioCultTermos — Configuração de Usuário Admin ===\n');

  const existing = parseEnvFile(ENV_FILE);
  let users = [];

  if (existing.ADMIN_USERS) {
    try {
      users = JSON.parse(existing.ADMIN_USERS);
      console.log(`Usuários existentes: ${users.map((u) => u.username).join(', ')}`);
      const action = await ask('Deseja (A)dicionar usuário ou (S)ubstituir todos? [A/S]: ');
      if (action.toUpperCase() === 'S') users = [];
    } catch {
      console.log('Aviso: ADMIN_USERS existente inválido — será substituído.\n');
    }
  }

  // Add users loop
  let addMore = true;
  while (addMore) {
    console.log('');
    const username = (await ask('  Nome de usuário: ')).trim();
    if (!username) { console.log('  Nome inválido.'); continue; }

    let password = '';
    while (true) {
      password = await askPassword('  Senha (mín. 6 chars): ');
      if (password.length < 6) { console.log('  Senha muito curta.'); continue; }
      const confirm = await askPassword('  Confirmar senha: ');
      if (password !== confirm) { console.log('  Senhas não coincidem.'); continue; }
      break;
    }

    process.stdout.write('  Gerando hash bcrypt...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(' OK');

    const idx = users.findIndex((u) => u.username === username);
    if (idx >= 0) {
      users[idx] = { username, passwordHash };
      console.log(`  Usuário "${username}" atualizado.`);
    } else {
      users.push({ username, passwordHash });
      console.log(`  Usuário "${username}" adicionado.`);
    }

    const more = await ask('\nAdicionar outro usuário? [s/N]: ');
    addMore = more.trim().toLowerCase() === 's';
  }

  rl.close();

  // Write .env
  const lines = [
    '# Gerado por docker/create-admin-user.js — NÃO commitar este arquivo',
    '',
    `SQLITE_DB_PATH=${existing.SQLITE_DB_PATH || '/data/unidade-dev.sqlite'}`,
    `ADMIN_USERS=${JSON.stringify(users)}`,
    `ACQUISITION_CRON_SCHEDULE=${existing.ACQUISITION_CRON_SCHEDULE || '0 3 * * *'}`,
    `LOG_LEVEL=${existing.LOG_LEVEL || 'info'}`,
  ];

  writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf8');

  console.log(`\n✓  Arquivo gravado: ${ENV_FILE}`);
  console.log(`   Usuários: ${users.map((u) => u.username).join(', ')}`);
  console.log('\nPara iniciar:');
  console.log('  docker-compose -f docker/docker-compose.yml up -d\n');
}

main().catch((err) => {
  console.error('\nErro:', err.message);
  rl.close();
  process.exit(1);
});
