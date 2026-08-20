const babel = require('@babel/core');
const fs = require('fs');
const path = process.argv[2];
const code = fs.readFileSync(path, 'utf8');
try {
  babel.transformSync(code, { presets: ['@babel/preset-react'], filename: path });
  console.log(path, 'OK');
} catch (e) {
  console.log(path, 'SYNTAX ERROR:');
  console.log(e.message);
  process.exit(1);
}
