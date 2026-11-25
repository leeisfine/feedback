const fs = require('fs');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required');
  process.exit(1);
}
fs.writeFileSync(
  'public/config.js',
  `window.APP_CONFIG = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key })};\n`
);
