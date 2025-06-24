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


function compressRLERaw(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const output = [];
  let count = 1;
  let currentByte = input[0];

  for (let i = 1; i < input.length; i++) {
    if (input[i] === currentByte && count < 255) {
      count++;
    } else {
      output.push(count, currentByte);
      currentByte = input[i];
      count = 1;
    }
  }
  // Add the last run
  output.push(count, currentByte);

  fs.writeFileSync(outputPath, Buffer.from(output));
  return {
    originalSize: input.length,
    compressedSize: output.length,
  };
}

function decompressRLERaw(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const output = [];

  for (let i = 0; i < input.length; i += 2) {
    const count = input[i];
    const byte = input[i + 1];
    for (let j = 0; j < count; j++) {
      output.push(byte);
    }
  }

  fs.writeFileSync(outputPath, Buffer.from(output));
  return {
    decompressedSize: output.length,
  };
}

module.exports = {
  compressRLE,
  decompressRLE,
  compressRLERaw,
  decompressRLERaw,
};
