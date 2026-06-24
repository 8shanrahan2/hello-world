const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outputDir = path.join(rootDir, 'dist');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of ['index.html', 'styles.css', 'chat.css', 'script.js']) {
  fs.copyFileSync(path.join(rootDir, fileName), path.join(outputDir, fileName));
}

const indexPath = path.join(outputDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(
  indexPath,
  indexHtml.replace(
    '<link rel="stylesheet" href="styles.css" />',
    '<link rel="stylesheet" href="styles.css" />\n    <link rel="stylesheet" href="chat.css" />'
  )
);

const config = `window.SUPABASE_CONFIG = {\n  url: '${process.env.SUPABASE_URL}',\n  publishableKey: '${process.env.SUPABASE_PUBLISHABLE_KEY}',\n};\n`;

fs.writeFileSync(path.join(outputDir, 'config.js'), config);

console.log('Built static site into dist/.');
