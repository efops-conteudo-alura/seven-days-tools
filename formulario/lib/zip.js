'use strict';
/*
 * zip.js — monta um arquivo ZIP em modo "stored" (sem compressão), sem
 * nenhuma biblioteca. É o suficiente para um .docx, que é um ZIP de XMLs.
 *
 * Formato de referência: PKWARE APPNOTE (local file header + central
 * directory + end of central directory).
 */

// Tabela CRC-32 padrão (polinômio 0xEDB88320).
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Data/hora no formato DOS que o ZIP usa.
function dataHoraDos(d) {
  const data = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  return { data, hora };
}

/**
 * criarZip([{ nome: 'word/document.xml', conteudo: <string|Buffer> }, ...]) -> Buffer
 */
function criarZip(arquivos) {
  const { data, hora } = dataHoraDos(new Date());
  const locais = [];
  const centrais = [];
  let offset = 0;

  for (const arq of arquivos) {
    const nome = Buffer.from(arq.nome, 'utf8');
    const conteudo = Buffer.isBuffer(arq.conteudo) ? arq.conteudo : Buffer.from(arq.conteudo, 'utf8');
    const crc = crc32(conteudo);

    // Local file header (30 bytes + nome) — flag 0x0800 = nome em UTF-8.
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // versão mínima
    local.writeUInt16LE(0x0800, 6);      // flags
    local.writeUInt16LE(0, 8);           // método: stored
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(data, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(conteudo.length, 18); // compactado (= original)
    local.writeUInt32LE(conteudo.length, 22); // original
    local.writeUInt16LE(nome.length, 26);
    local.writeUInt16LE(0, 28);          // extra

    // Entrada correspondente no central directory (46 bytes + nome).
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);        // feita por
    central.writeUInt16LE(20, 6);        // versão mínima
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(data, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(conteudo.length, 20);
    central.writeUInt32LE(conteudo.length, 24);
    central.writeUInt16LE(nome.length, 28);
    central.writeUInt32LE(offset, 42);   // onde está o local header

    locais.push(local, nome, conteudo);
    centrais.push(Buffer.concat([central, nome]));
    offset += local.length + nome.length + conteudo.length;
  }

  const dirCentral = Buffer.concat(centrais);

  // End of central directory (22 bytes).
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(dirCentral.length, 12);
  fim.writeUInt32LE(offset, 16);

  return Buffer.concat([...locais, dirCentral, fim]);
}

module.exports = { criarZip, crc32 };
