require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const images = {
  'FLO-00001': '/products/first-lady-5l.svg',
  'FLO-00002': '/products/first-lady-3l.svg',
  'FLO-00003': '/products/first-lady-1l.svg',
  'PWV-00001': '/products/purewave-soap-family.svg',
  'PWV-00002': '/products/purewave-soap-regular.svg',
  'PWC-00001': '/products/purewave-cream-large.svg',
  'PWC-00002': '/products/purewave-cream-medium.svg',
  'PWC-00003': '/products/purewave-cream-small.svg',
};

(async () => {
  for (const [sku, image] of Object.entries(images)) {
    const res = await pool.query('UPDATE products SET image = $1 WHERE sku = $2', [image, sku]);
    console.log(sku + ': ' + res.rowCount + ' row(s) updated');
  }
  await pool.end();
  console.log('All products updated!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
