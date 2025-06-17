const fs = require('fs');

class Node {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

// Build frequency map
function buildFrequencyMap(data) {
  const freq = {};
  for (let char of data) {
    freq[char] = (freq[char] || 0) + 1;
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

function compressHuffman(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  const freqMap = buildFrequencyMap(input);
  const tree = buildTree(freqMap);
  const codeMap = buildCodes(tree);

  let encoded = '';
  for (let char of input) {
    encoded += codeMap[char];
  }

  // Save encoded data and codeMap to file
  const result = JSON.stringify({ encoded, codeMap });
  fs.writeFileSync(outputPath, result, 'utf-8');

  return {
    originalSize: Buffer.byteLength(input),
    compressedSize: Buffer.byteLength(result),
  };
}

function decompressHuffman(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf-8');
  const { encoded, codeMap } = JSON.parse(input);

  // Build reverse map
  const reverseMap = Object.entries(codeMap).reduce((acc, [char, code]) => {
    acc[code] = char;
    return acc;
  }, {});

  let decoded = '';
  let current = '';
  for (let bit of encoded) {
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

module.exports = {
  compressHuffman,
  decompressHuffman,
};
