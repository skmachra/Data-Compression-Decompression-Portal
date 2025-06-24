const fs = require('fs');

class Node {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

// Build frequency map for text
function buildFrequencyMap(data) {
  const freq = {};
  for (let char of data) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

// Build frequency map for binary
function buildFrequencyMapRaw(data) {
  const freq = {};
  for (let byte of data) {
    freq[byte] = (freq[byte] || 0) + 1;
  }
  return freq;
}

// Build Huffman Tree
function buildTree(freqMap) {
  const nodes = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push(new Node(null, left.freq + right.freq, left, right));
  }
  return nodes[0];
}

// Build Code Map
function buildCodes(node, prefix = '', codeMap = {}) {
  if (!node) return;
  if (node.char !== null) {
    codeMap[node.char] = prefix;
  }
  buildCodes(node.left, prefix + '0', codeMap);
  buildCodes(node.right, prefix + '1', codeMap);
  return codeMap;
}

// Compress text using Huffman encoding
function compressHuffman(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  const freqMap = buildFrequencyMap(input);
  const tree = buildTree(freqMap);
  const codeMap = buildCodes(tree);

  let encoded = '';
  for (let char of input) {
    encoded += codeMap[char];
  }

  const padding = (8 - (encoded.length % 8)) % 8;
  encoded += '0'.repeat(padding);

  const byteArray = [];
  for (let i = 0; i < encoded.length; i += 8) {
    byteArray.push(parseInt(encoded.slice(i, i + 8), 2));
  }

  const codeMapBuffer = Buffer.from(JSON.stringify({ codeMap, padding }), 'utf-8');
  const encodedBuffer = Buffer.from(byteArray);

  const codeMapLengthBuffer = Buffer.alloc(4);
  codeMapLengthBuffer.writeUInt32BE(codeMapBuffer.length);

  const finalBuffer = Buffer.concat([codeMapLengthBuffer, codeMapBuffer, encodedBuffer]);

  fs.writeFileSync(outputPath, finalBuffer);

  return {
    originalSize: Buffer.byteLength(input),
    compressedSize: finalBuffer.length,
  };
}

// Decompress text using Huffman
function decompressHuffman(inputPath, outputPath) {
  const buffer = fs.readFileSync(inputPath);
  const codeMapLength = buffer.readUInt32BE(0);
  const codeMapBuffer = buffer.slice(4, 4 + codeMapLength);
  const dataBuffer = buffer.slice(4 + codeMapLength);

  const { codeMap, padding } = JSON.parse(codeMapBuffer.toString('utf-8'));

  const reverseMap = Object.entries(codeMap).reduce((acc, [char, code]) => {
    acc[code] = char;
    return acc;
  }, {});

  let bitString = '';
  for (let byte of dataBuffer) {
    bitString += byte.toString(2).padStart(8, '0');
  }

  bitString = bitString.slice(0, bitString.length - padding);

  let decoded = '';
  let current = '';
  for (let bit of bitString) {
    current += bit;
    if (reverseMap[current]) {
      decoded += reverseMap[current];
      current = '';
    }
  }

  fs.writeFileSync(outputPath, decoded, 'utf-8');

  return {
    decompressedSize: Buffer.byteLength(decoded),
  };
}

// Compress raw binary data (e.g. image)
function compressHuffmanRaw(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const freqMap = buildFrequencyMapRaw(input);
  const tree = buildTree(freqMap);
  const codeMap = buildCodes(tree);

  let encoded = '';
  for (let byte of input) {
    encoded += codeMap[byte];
  }

  const padding = (8 - (encoded.length % 8)) % 8;
  encoded += '0'.repeat(padding);

  const byteArray = [];
  for (let i = 0; i < encoded.length; i += 8) {
    byteArray.push(parseInt(encoded.slice(i, i + 8), 2));
  }

  const codeMapBuffer = Buffer.from(JSON.stringify({ codeMap, padding }), 'utf-8');
  const encodedBuffer = Buffer.from(byteArray);
  const codeMapLengthBuffer = Buffer.alloc(4);
  codeMapLengthBuffer.writeUInt32BE(codeMapBuffer.length);

  const finalBuffer = Buffer.concat([codeMapLengthBuffer, codeMapBuffer, encodedBuffer]);

  fs.writeFileSync(outputPath, finalBuffer);

  return {
    originalSize: input.length,
    compressedSize: finalBuffer.length,
  };
}

// Decompress binary data (e.g. image)
function decompressHuffmanRaw(inputPath, outputPath) {
  const buffer = fs.readFileSync(inputPath);
  const codeMapLength = buffer.readUInt32BE(0);
  const codeMapBuffer = buffer.slice(4, 4 + codeMapLength);
  const dataBuffer = buffer.slice(4 + codeMapLength);

  const { codeMap, padding } = JSON.parse(codeMapBuffer.toString('utf-8'));

  const reverseMap = Object.entries(codeMap).reduce((acc, [byte, code]) => {
    acc[code] = parseInt(byte);
    return acc;
  }, {});

  let bitString = '';
  for (let byte of dataBuffer) {
    bitString += byte.toString(2).padStart(8, '0');
  }

  bitString = bitString.slice(0, bitString.length - padding);

  const result = [];
  let current = '';
  for (let bit of bitString) {
    current += bit;
    if (reverseMap[current] !== undefined) {
      result.push(reverseMap[current]);
      current = '';
    }
  }

  fs.writeFileSync(outputPath, Buffer.from(result));

  return {
    decompressedSize: result.length,
  };
}

module.exports = {
  compressHuffman,
  decompressHuffman,
  compressHuffmanRaw,
  decompressHuffmanRaw,
};
