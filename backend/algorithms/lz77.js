const fs = require('fs');

function compressLZ77(inputPath, outputPath, windowSize = 20, bufferSize = 15) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  const data = input.split('');
  const result = [];

  let i = 0;

  while (i < data.length) {
    let matchLength = 0;
    let matchOffset = 0;
    const windowStart = Math.max(0, i - windowSize);
    const searchWindow = data.slice(windowStart, i).join('');
    const lookAhead = data.slice(i, i + bufferSize).join('');

    for (let j = 0; j < searchWindow.length; j++) {
      let length = 0;
      while (
        length < lookAhead.length &&
        searchWindow[j + length] === lookAhead[length]
      ) {
        length++;
      }
      if (length > matchLength) {
        matchLength = length;
        matchOffset = searchWindow.length - j;
      }
    }

    const nextChar = data[i + matchLength] || '';
    result.push([matchOffset, matchLength, nextChar]);
    i += matchLength + 1;
  }

  const json = JSON.stringify(result);
  fs.writeFileSync(outputPath, json, 'utf-8');

  return {
    originalSize: Buffer.byteLength(input),
    compressedSize: Buffer.byteLength(json),
  };
}

function decompressLZ77(inputPath, outputPath) {
  const encoded = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let output = '';

  for (const [offset, length, nextChar] of encoded) {
    const start = output.length - offset;
    const substring = output.slice(start, start + length);
    output += substring + nextChar;
  }

  fs.writeFileSync(outputPath, output, 'utf-8');

  return {
    decompressedSize: Buffer.byteLength(output),
  };
}

module.exports = {
  compressLZ77,
  decompressLZ77,
};
