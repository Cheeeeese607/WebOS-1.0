import fs from 'fs';
import https from 'https';

fs.mkdirSync('public', { recursive: true });
https.get('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', res => {
  const file = fs.createWriteStream('public/china.json');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed.');
  });
});
