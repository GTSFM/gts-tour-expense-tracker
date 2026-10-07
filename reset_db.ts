import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_SETTINGS,
  INITIAL_POLICIES,
  INITIAL_USERS,
  INITIAL_TERRITORY_CONFIGS,
  INITIAL_TOURS,
  INITIAL_CLAIMS,
  INITIAL_EXPENSE_ITEMS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_TRAIL
} from './server/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'server', 'data', 'db.json');

const cleanDb = {
  settings: INITIAL_SETTINGS,
  policies: INITIAL_POLICIES,
  users: INITIAL_USERS,
  territories: INITIAL_TERRITORY_CONFIGS,
  tours: INITIAL_TOURS,
  claims: INITIAL_CLAIMS,
  expenseItems: INITIAL_EXPENSE_ITEMS,
  documents: INITIAL_DOCUMENTS,
  auditTrail: INITIAL_AUDIT_TRAIL,
  notifications: []
};

fs.writeFileSync(DATA_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');
console.log('Successfully wrote clean db.json:');
console.log('- Users count:', cleanDb.users.length);
console.log('- Claims count:', cleanDb.claims.length);
console.log('- Tours count:', cleanDb.tours.length);
console.log('- Expense items count:', cleanDb.expenseItems.length);
