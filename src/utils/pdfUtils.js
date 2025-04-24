const fs = require('fs');

const savePDF = (stream, filePath) => {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

module.exports = { savePDF };
