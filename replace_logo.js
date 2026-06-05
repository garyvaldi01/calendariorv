const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the header logo
const oldDiv = '<div className="size-8 rounded bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center text-black font-bold">\n              <Coins className="size-5" />\n            </div>';

const newDiv = '<div className="size-10 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] overflow-hidden shrink-0">\n              <img src="/logo.png" alt="Casino Club RV" className="size-full object-cover" />\n            </div>';

if (content.includes(oldDiv)) {
  content = content.replace(oldDiv, newDiv);
  
  // Also replace the print-header Coins
  const oldPrint = '<Coins className="size-8" /> Casino Club RV';
  const newPrint = '<img src="/logo.png" alt="Logo" className="inline-block h-8 w-8 rounded-full object-cover align-middle" /> Casino Club RV';
  
  if (content.includes(oldPrint)) {
    content = content.replace(oldPrint, newPrint);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Logo replacements applied');
} else {
  console.log('ERROR: Old string not found in file');
  process.exit(1);
}
