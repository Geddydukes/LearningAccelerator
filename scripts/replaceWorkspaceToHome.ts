import fs from 'fs';
import path from 'path';

const exts = ['.tsx', '.ts'];
const root = path.resolve('src');

function walk(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (exts.includes(path.extname(p))) fix(p);
  }
}

function fix(file: string) {
  let t = fs.readFileSync(file, 'utf8');
  const b = t;
  
  t = t.replaceAll('"/workspace/module/current"', '"/home/module/current"')
       .replaceAll('"/workspace/socratic"', '"/home/socratic"')
       .replaceAll('"/workspace/ta"', '"/home/ta"')
       .replaceAll('"/workspace/career"', '"/home/career"')
       .replaceAll('"/workspace/portfolio"', '"/home/portfolio"')
       .replaceAll('"/workspace"', '"/home"');
  
  if (t !== b) {
    fs.writeFileSync(file, t, 'utf8');
    console.log('Updated', file);
  }
}

walk(root);
console.log('Workspace to home replacement complete!'); 