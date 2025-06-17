const fs = require('fs');
const path = require('path');

// RLE Compression (only for text files here)
function compressRLE(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  let encoded = '';

  for (let i = 0; i < input.length; i++) {
    let count = 1;
    while (i < input.length - 1 && input[i] === input[i + 1]) {
      count++;
      i++;
    }
    encoded += input[i] + count;
  }

  fs.writeFileSync(outputPath, encoded, 'utf-8');
  return {
    originalSize: Buffer.byteLength(input),
    compressedSize: Buffer.byteLength(encoded),
  };
}

// RLE Decompression
function decompressRLE(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  let decoded = '';

  for (let i = 0; i < input.length; i += 2) {
    const char = input[i];
    const count = parseInt(input[i + 1], 10);
    decoded += char.repeat(count);
  }

  fs.writeFileSync(outputPath, decoded, 'utf-8');
  return {
    decompressedSize: Buffer.byteLength(decoded),
  };
}

module.exports = {
  compressRLE,
  decompressRLE,
};
