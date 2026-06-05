import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add logo state after the existing useState declarations
// Find a good place to add it - after the language state
const afterLanguage = 'const [language, setLanguage] = useState<Language>(\'es\');';
const logoState = 'const [language, setLanguage] = useState<Language>(\'es\');\n  const [headerLogo, setHeaderLogo] = useState<string | null>(() => localStorage.getItem(\'clubrv_logo\'));';

if (content.includes(afterLanguage)) {
  content = content.replace(afterLanguage, logoState);
  console.log('1. Logo state added');
} else {
  console.log('1. ERROR: Could not find anchor for logo state');
  process.exit(1);
}

// 2. Update the header img src to use headerLogo with fallback
const oldImg = '<img src="/logo.png" alt="Casino Club RV" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = \'none\' }} />';
const newImg = '<img src={headerLogo || "/logo.png"} alt="Casino Club RV" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = \'none\' }} />';

if (content.includes(oldImg)) {
  content = content.replace(oldImg, newImg);
  console.log('2. Header img src updated with state');
} else {
  console.log('2. ERROR: Header img pattern not found');
  process.exit(1);
}

// 3. Update the print header img src too
const oldPrint = '<img src="/logo.png" alt="Casino Club RV" className="inline-block h-8 w-8 rounded-full object-cover align-middle" onError={(e) => { (e.target as HTMLImageElement).style.display = \'none\' }} />';
const newPrint = '<img src={headerLogo || "/logo.png"} alt="Casino Club RV" className="inline-block h-8 w-8 rounded-full object-cover align-middle" onError={(e) => { (e.target as HTMLImageElement).style.display = \'none\' }} />';

if (content.includes(oldPrint)) {
  content = content.replace(oldPrint, newPrint);
  console.log('3. Print header img src updated');
} else {
  console.log('3. WARNING: Print img pattern not found (may have different format)');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: All logo state changes applied');
