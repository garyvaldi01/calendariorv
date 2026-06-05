import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix print header alt text for consistency
content = content.replace(
  'alt="Logo" className="inline-block h-8 w-8 rounded-full object-cover align-middle" onError',
  'alt="Casino Club RV" className="inline-block h-8 w-8 rounded-full object-cover align-middle" onError'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Alt text fixed');
