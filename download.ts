import fs from 'fs';
import https from 'https';

const url = "https://pgridiy.or.id/_next/image?url=%2Flogo.png&w=640&q=75";

const download = (targetUrl: string, dest: string) => {
  return new Promise<void>((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
           redirectUrl = 'https://pgridiy.or.id' + redirectUrl;
        }
        return download(redirectUrl, dest).then(resolve).catch(reject);
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
};

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

download(url, './public/logo.png').then(() => {
  console.log('Downloaded successfully');
}).catch(console.error);
