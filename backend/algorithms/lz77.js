const fs = require('fs');

// ====== TEXT VERSION ====== //

function compressLZ77(inputPath, outputPath, windowSize = 1024, bufferSize = 128) {
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

// ====== BINARY VERSION ====== //

function compressLZ77Raw(inputPath, outputPath, windowSize = 1024, bufferSize = 128) {
  const input = fs.readFileSync(inputPath);
  const result = [];

  let i = 0;

  while (i < input.length) {
    let matchLength = 0;
    let matchOffset = 0;
    const windowStart = Math.max(0, i - windowSize);
    const searchWindow = input.slice(windowStart, i);
    const lookAhead = input.slice(i, Math.min(i + bufferSize, input.length));

    // Find longest match in search window
    for (let j = 0; j < searchWindow.length; j++) {
      let length = 0;
      while (
        length < lookAhead.length &&
        j + length < searchWindow.length &&
        searchWindow[j + length] === lookAhead[length]
      ) {
        length++;
      }
      if (length > matchLength) {
        matchLength = length;
        matchOffset = searchWindow.length - j;
      }
    }

    const nextByte = i + matchLength < input.length ? input[i + matchLength] : 0;
    result.push([matchOffset, matchLength, nextByte]);
    i += matchLength + 1;
  }

  // Allocate 5 bytes per entry
  const outputBuffer = Buffer.alloc(result.length * 5);
  for (let i = 0; i < result.length; i++) {
    const [offset, length, byte] = result[i];
    const base = i * 5;
    outputBuffer.writeUInt16BE(offset, base);     // 2 bytes
    outputBuffer.writeUInt16BE(length, base + 2); // 2 bytes
    outputBuffer.writeUInt8(byte, base + 4);      // 1 byte
  }

  fs.writeFileSync(outputPath, outputBuffer);

  return {
    originalSize: input.length,
    compressedSize: outputBuffer.length,
  };
}

function decompressLZ77Raw(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const output = [];
  let pos = 0;

  while (pos + 5 <= input.length) {
    const offset = input.readUInt16BE(pos);
    const length = input.readUInt16BE(pos + 2);
    const nextByte = input.readUInt8(pos + 4);

    const start = output.length - offset;
    for (let i = 0; i < length; i++) {
      if (start + i >= 0 && start + i < output.length) {
        output.push(output[start + i]);
      }
    }

    output.push(nextByte);
    pos += 5;
  }

  fs.writeFileSync(outputPath, Buffer.from(output));

  return {
    decompressedSize: output.length,
  };
}
module.exports = {
  compressLZ77,
  decompressLZ77,
  compressLZ77Raw,
  decompressLZ77Raw,
};