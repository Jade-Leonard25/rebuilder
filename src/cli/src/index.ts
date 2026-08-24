#!/usr/bin/env node
import { createRouter } from './commands/create-router.js';

// Get name from command line
const name = process.argv[2];

if (!name) {
  console.log('❌ Please provide a name:');
  console.log('   npx create-router homeMain');
  process.exit(1);
}

// Run it
createRouter(name);