import fs from 'fs';
import { Readable } from 'stream';

const savePDF = (stream: Readable, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);
    
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

export { savePDF };
