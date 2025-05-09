import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

function testFile(testType) {
  const filePath = [
    path.join(__dirname, '../data/samples', `test${testType}Date.json`),
    path.join(__dirname, '../data/samples', `test${testType}Id.json`),
    path.join(__dirname, '../data/samples', `test${testType}Status.json`),
  ];

  filePath.forEach((file) => {
    const rawData = fs.readFileSync(file, 'utf-8');
    const jsonData = JSON.parse(rawData);

    axios.post('http://localhost:3000/webhook/docusign-webhook', jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(res => {
      console.log(`${file} ✅ Success:`, res.data);
    })
    .catch(err => {
      console.error(`${file} ❌ Error:`, err.response?.data || err.message);
    });
  });
}

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

testFile('Empty');
testFile('No');
testFile('Num');

// const filePath = path.join(__dirname, '../data/samples/testEmptyDate.json');
// const rawData = fs.readFileSync(filePath, 'utf-8');
// const jsonData = JSON.parse(rawData);

// axios.post('http://localhost:3000/webhook/docusign-webhook', jsonData, {
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })
// .then(res => {
//   console.log('✅ Success:', res.data);
// })
// .catch(err => {
//   console.error('❌ Error:', err.response?.data || err.message);
// });
