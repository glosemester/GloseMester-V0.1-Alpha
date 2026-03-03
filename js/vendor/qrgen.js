/**
 * qrgen.js - Minimal QR Code Generator for GloseMester
 * Supports: Byte mode, Error Correction Level L, Versions 1-10
 * API: new QRGen(element, { text, size }) → renders canvas inside element
 * No external dependencies.
 */
(function (global) {
  'use strict';

  // ─── GF(256) arithmetic (primitive poly 0x11d) ───────────────────────────
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = x & 0x80 ? (x << 1) ^ 0x11d : x << 1;
      x &= 0xff;
    }
    for (var i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  // ─── Reed-Solomon ────────────────────────────────────────────────────────
  // Generator polynomial coefficients, highest degree first, g[0]=1
  function rsGen(n) {
    var g = new Uint8Array([1]);
    for (var i = 0; i < n; i++) {
      var ng = new Uint8Array(g.length + 1);
      for (var j = 0; j < g.length; j++) {
        ng[j] ^= g[j];
        ng[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = ng;
    }
    return g;
  }

  function rsEncode(data, n) {
    var gen = rsGen(n);
    var rem = new Uint8Array(n);
    for (var i = 0; i < data.length; i++) {
      var f = data[i] ^ rem[0];
      for (var j = 0; j < n - 1; j++) rem[j] = rem[j + 1] ^ gmul(gen[j + 1], f);
      rem[n - 1] = gmul(gen[n], f);
    }
    return rem;
  }

  // ─── QR Code tables ──────────────────────────────────────────────────────
  // Level L only: [blocks, totalCW, dataCW]  (EC = total - data)
  // Multiple entries per version = multiple block groups
  var RSBLOCKS_L = [
    [[1, 26, 19]],          // v1
    [[1, 44, 34]],          // v2
    [[1, 70, 55]],          // v3
    [[1, 100, 80]],         // v4
    [[1, 134, 108]],        // v5
    [[2, 86, 68]],          // v6
    [[2, 98, 78]],          // v7
    [[2, 121, 97]],         // v8
    [[2, 146, 116]],        // v9
    [[2, 86, 68], [2, 87, 69]] // v10
  ];

  // Alignment pattern centre coordinates by version (v1 has none)
  var ALIGN = [
    [], [], [6,18], [6,22], [6,26], [6,30], [6,34],
    [6,22,38], [6,24,42], [6,28,46], [6,32,50]
  ];

  // Module count = 17 + 4 * version
  function moduleCount(v) { return 17 + 4 * v; }

  // Byte capacity in byte mode, Level L
  function byteCapacity(v) { return RSBLOCKS_L[v - 1].reduce(function (s, b) { return s + b[0] * b[2]; }, 0); }

  // Pick smallest version that fits the data (byte mode, Level L)
  function pickVersion(len) {
    // In byte mode v1-9: overhead = 4 (mode) + 8 (count) bits = 12 bits = 1.5 bytes rounded
    // data capacity in bytes = (dataCW * 8 - 12) / 8 = dataCW - 1.5
    for (var v = 1; v <= 10; v++) {
      var cap = byteCapacity(v);
      if (cap - 2 >= len) return v; // -2 to account for mode+count overhead
    }
    return 10;
  }

  // ─── Bit buffer ──────────────────────────────────────────────────────────
  function BitBuf() { this.data = []; this.length = 0; }
  BitBuf.prototype.put = function (val, len) {
    for (var i = len - 1; i >= 0; i--) {
      this.data.push((val >>> i) & 1);
      this.length++;
    }
  };
  BitBuf.prototype.getByte = function (i) {
    var b = 0;
    for (var j = 0; j < 8; j++) b = (b << 1) | (this.data[i * 8 + j] || 0);
    return b;
  };

  // ─── Build data codewords ────────────────────────────────────────────────
  function buildData(text, version) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 0xff);

    var buf = new BitBuf();
    buf.put(0x4, 4);          // Byte mode indicator
    buf.put(bytes.length, 8); // Character count (8 bits for v1-9)
    for (var i = 0; i < bytes.length; i++) buf.put(bytes[i], 8);

    // Total data bits available
    var totalData = byteCapacity(version);
    var totalBits = totalData * 8;

    // Terminator (up to 4 zero bits)
    var term = Math.min(4, totalBits - buf.length);
    buf.put(0, term);

    // Pad to byte boundary
    while (buf.length % 8 !== 0) buf.put(0, 1);

    // Pad codewords: alternate 0xEC and 0x11
    var padBytes = [0xEC, 0x11];
    var pi = 0;
    while (buf.length < totalBits) { buf.put(padBytes[pi], 8); pi = 1 - pi; }

    var codewords = new Uint8Array(totalData);
    for (var i = 0; i < totalData; i++) codewords[i] = buf.getByte(i);
    return codewords;
  }

  // ─── Interleave data + EC blocks ─────────────────────────────────────────
  function interleave(codewords, version) {
    var spec = RSBLOCKS_L[version - 1];
    var blocks = [];
    var pos = 0;

    // Build blocks
    for (var gi = 0; gi < spec.length; gi++) {
      var count = spec[gi][0], total = spec[gi][1], data = spec[gi][2];
      var ec = total - data;
      for (var b = 0; b < count; b++) {
        var d = codewords.slice(pos, pos + data); pos += data;
        blocks.push({ data: d, ec: rsEncode(d, ec) });
      }
    }

    // Interleave data
    var result = [];
    var maxData = Math.max.apply(null, blocks.map(function (b) { return b.data.length; }));
    for (var i = 0; i < maxData; i++)
      for (var j = 0; j < blocks.length; j++)
        if (i < blocks[j].data.length) result.push(blocks[j].data[i]);

    // Interleave EC
    var maxEC = Math.max.apply(null, blocks.map(function (b) { return b.ec.length; }));
    for (var i = 0; i < maxEC; i++)
      for (var j = 0; j < blocks.length; j++)
        if (i < blocks[j].ec.length) result.push(blocks[j].ec[i]);

    return result;
  }

  // ─── QR Matrix ───────────────────────────────────────────────────────────
  var DARK = 1, LIGHT = 0, RESERVED = 2; // RESERVED = function module (not data)

  function makeMatrix(n) {
    var m = [];
    for (var i = 0; i < n; i++) { m[i] = new Int8Array(n); for (var j = 0; j < n; j++) m[i][j] = -1; }
    return m;
  }

  // Place finder pattern (7x7 including border) at top-left corner (r,c)
  function placeFinder(m, r, c) {
    for (var dr = -1; dr <= 7; dr++) {
      for (var dc = -1; dc <= 7; dc++) {
        var nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= m.length || nc < 0 || nc >= m.length) continue;
        var inFinder = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        var val;
        if (inFinder) {
          val = (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
                 (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)) ? RESERVED | DARK : RESERVED;
        } else {
          val = RESERVED; // separator (light)
        }
        m[nr][nc] = val;
      }
    }
  }

  // Place alignment pattern centred at (r,c)
  function placeAlign(m, r, c) {
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        if (m[r + dr][c + dc] !== -1) continue; // skip if already placed
        var v = (dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0))
          ? RESERVED | DARK : RESERVED;
        m[r + dr][c + dc] = v;
      }
    }
  }

  // Timing patterns
  function placeTiming(m, n) {
    for (var i = 8; i < n - 8; i++) {
      if (m[6][i] === -1) m[6][i] = (i % 2 === 0) ? RESERVED | DARK : RESERVED;
      if (m[i][6] === -1) m[i][6] = (i % 2 === 0) ? RESERVED | DARK : RESERVED;
    }
  }

  // Dark module (always dark, version 1+)
  function placeDark(m, v) { m[4 * v + 9][8] = RESERVED | DARK; }

  // Reserve format info areas
  function reserveFormat(m, n) {
    // Around top-left finder
    for (var i = 0; i <= 8; i++) {
      if (m[i][8] === -1) m[i][8] = RESERVED;
      if (m[8][i] === -1) m[8][i] = RESERVED;
    }
    // Top-right finder
    for (var i = n - 8; i < n; i++) if (m[8][i] === -1) m[8][i] = RESERVED;
    // Bottom-left finder
    for (var i = n - 7; i < n; i++) if (m[i][8] === -1) m[i][8] = RESERVED;
  }

  // Compute format info bits (Level L + mask)
  function formatInfoBits(mask) {
    // EC Level L = binary 01, shift to bits 3-4 of format data
    var data = (1 << 3) | mask; // 5-bit: 01 + mask[3]
    var rem = data;
    for (var i = 0; i < 10; i++) rem = ((rem << 1) ^ ((rem >> 9) ? 0x537 : 0)) & 0x7fff;
    var bits = ((data << 10) | rem) ^ 0x5412;
    return bits;
  }

  // Write format information bits into matrix
  function writeFormat(m, n, mask) {
    var bits = formatInfoBits(mask);
    // Around top-left finder (row 8 and col 8)
    var positions = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    for (var i = 0; i < 15; i++) {
      var v = (bits >> (14 - i)) & 1;
      var r = positions[i][0], c = positions[i][1];
      m[r][c] = RESERVED | v;
      // Mirror positions
      if (i < 8) {
        m[8][n - 1 - i] = RESERVED | v;
      } else {
        m[n - 15 + i][8] = RESERVED | v;
      }
    }
  }

  // Data bit placement (zigzag scan)
  function placeData(m, n, bits) {
    var bi = 0;
    for (var right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip vertical timing
      for (var vert = 0; vert < n; vert++) {
        var row = (Math.floor(right / 2) % 2 === 0) ? n - 1 - vert : vert;
        for (var d = 0; d < 2; d++) {
          var col = right - d;
          if (m[row][col] !== -1) continue; // reserved
          m[row][col] = bi < bits.length ? bits[bi++] : 0;
        }
      }
    }
  }

  // Mask patterns (0-7)
  var MASKS = [
    function(r,c){ return (r+c)%2===0; },
    function(r,c){ return r%2===0; },
    function(r,c){ return c%3===0; },
    function(r,c){ return (r+c)%3===0; },
    function(r,c){ return (Math.floor(r/2)+Math.floor(c/3))%2===0; },
    function(r,c){ return (r*c)%2+(r*c)%3===0; },
    function(r,c){ return ((r*c)%2+(r*c)%3)%2===0; },
    function(r,c){ return ((r+c)%2+(r*c)%3)%2===0; }
  ];

  // Apply mask to non-reserved modules
  function applyMask(m, n, maskId) {
    var fn = MASKS[maskId];
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++)
        if (m[r][c] !== -1 && !(m[r][c] & 2)) // data module, not reserved
          if (fn(r, c)) m[r][c] ^= 1;
  }

  // Penalty score for mask evaluation
  function penalty(m, n) {
    var p = 0;
    // Rule 1: 5+ in a row
    for (var r = 0; r < n; r++) {
      var run = 1;
      for (var c = 1; c < n; c++) {
        if ((m[r][c] & 1) === (m[r][c-1] & 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else run = 1;
      }
    }
    for (var c = 0; c < n; c++) {
      var run = 1;
      for (var r = 1; r < n; r++) {
        if ((m[r][c] & 1) === (m[r-1][c] & 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
        else run = 1;
      }
    }
    // Rule 2: 2x2 blocks
    for (var r = 0; r < n-1; r++)
      for (var c = 0; c < n-1; c++) {
        var v = m[r][c] & 1;
        if ((m[r][c+1]&1)===v && (m[r+1][c]&1)===v && (m[r+1][c+1]&1)===v) p += 3;
      }
    return p;
  }

  // ─── Main: generate QR matrix ────────────────────────────────────────────
  function generateMatrix(text) {
    var version = pickVersion(text.length);
    var n = moduleCount(version);
    var codewords = buildData(text, version);
    var finalBytes = interleave(codewords, version);

    // Convert bytes to bits
    var dataBits = [];
    for (var i = 0; i < finalBytes.length; i++)
      for (var b = 7; b >= 0; b--) dataBits.push((finalBytes[i] >> b) & 1);

    // Try all 8 masks, pick best
    var bestMask = 0, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var m = makeMatrix(n);
      placeFinder(m, 0, 0);
      placeFinder(m, 0, n - 7);
      placeFinder(m, n - 7, 0);
      var aligns = ALIGN[version];
      for (var ai = 0; ai < aligns.length; ai++)
        for (var aj = 0; aj < aligns.length; aj++)
          placeAlign(m, aligns[ai], aligns[aj]);
      placeTiming(m, n);
      placeDark(m, version);
      reserveFormat(m, n);
      placeData(m, n, dataBits);
      applyMask(m, n, mask);
      writeFormat(m, n, mask);
      var score = penalty(m, n);
      if (score < bestScore) { bestScore = score; bestMask = mask; }
    }

    // Build final matrix with best mask
    var m = makeMatrix(n);
    placeFinder(m, 0, 0);
    placeFinder(m, 0, n - 7);
    placeFinder(m, n - 7, 0);
    var aligns = ALIGN[version];
    for (var ai = 0; ai < aligns.length; ai++)
      for (var aj = 0; aj < aligns.length; aj++)
        placeAlign(m, aligns[ai], aligns[aj]);
    placeTiming(m, n);
    placeDark(m, version);
    reserveFormat(m, n);
    placeData(m, n, dataBits);
    applyMask(m, n, bestMask);
    writeFormat(m, n, bestMask);

    return { matrix: m, size: n };
  }

  // ─── Render to canvas ────────────────────────────────────────────────────
  function renderCanvas(qr, size) {
    var canvas = document.createElement('canvas');
    var quiet = 4; // 4-module quiet zone
    var cellSize = Math.max(2, Math.floor(size / (qr.size + quiet * 2)));
    var total = (qr.size + quiet * 2) * cellSize;
    canvas.width = canvas.height = total;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, total, total);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < qr.size; r++)
      for (var c = 0; c < qr.size; c++)
        if (qr.matrix[r][c] & 1)
          ctx.fillRect((c + quiet) * cellSize, (r + quiet) * cellSize, cellSize, cellSize);
    return canvas;
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  function QRGen(element, options) {
    if (!element || !options || !options.text) return;
    var size = options.size || 300;
    try {
      var qr = generateMatrix(options.text);
      var canvas = renderCanvas(qr, size);
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
      element.innerHTML = '';
      element.appendChild(canvas);
    } catch (e) {
      element.innerHTML = '<p style="color:red;font-size:13px;">QR-feil: ' + e.message + '</p>';
    }
  }

  global.QRGen = QRGen;

})(window);
