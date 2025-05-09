import fs from 'fs';
import { Readable } from 'stream';

const savePDF = (stream: Readable, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const writer = fs.createWriteStream(filePath);
      stream.pipe(writer);
      
      writer.on('finish', resolve);
      writer.on('error', reject);
    } catch (error) {
      console.error('Error saving PDF:', error);
      reject(error);
    }
  });
};

export { savePDF };
