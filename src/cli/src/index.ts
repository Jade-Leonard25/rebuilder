#!/usr/bin/env node
import { createRouter } from './commands/create-router.js';
import { initProject } from './commands/init.js';

const command = process.argv[2];
const arg = process.argv[3];

if (command === 'init') {
  initProject(arg);
} else if (command === 'create-router' || command === 'router') {
  if (!arg) {
    console.log('❌ Please provide a router name:');
    console.log('   npx rebuilder-framework-cli create-router homeMain');
    process.exit(1);
  }
  createRouter(arg);
} else {
  // Backwards compatibility for when someone just types the name without a command
  if (command && !arg) {
    createRouter(command);
  } else {
    console.log('❌ Invalid command. Available commands:');
    console.log('   npx rebuilder-framework-cli init <project-name>');
    console.log('   npx rebuilder-framework-cli create-router <router-name>');
    process.exit(1);
  }
}