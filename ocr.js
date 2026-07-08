/* =========================================================
   SG 返点表 OCR 解析器（浏览器与 Node 共用）
   基于词坐标把识别结果映射回表格结构：
   1. 收集所有"数字类" token 的 x 中心，按间距聚类出比例列；
      列宽取相邻聚类中心的最小间距，网格锚定在最右聚类上。
   2. 每个词按中心点落入品牌区或 6 列之一，同列多词拼接。
   3. 单元格归一化，内置针对本类返点表的纠错规则：
      - "14.0%" 丢小数点读成 "140%" → 值>60 时除以 10
      - "无柜" 常被误读成 2~8 位字母噪声 → 归为 无
      - "←详询特殊团" 常读成 "—wewmE" 型（前导横线+字母）→ 归为 询
   这样个别单元格误读不会让整行错位（旧的"行尾取数"会）。
   ========================================================= */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.SG_OCR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const N_COLS = 6;
  const MAX_RATE = 38;               // 本类返点未见超过 38%，更大视为丢小数点误读
  const CJK_RUN = /[一-鿿㐀-䶿]+/g;

  /* ---- Tesseract data.blocks -> [{words:[{text,x0,x1,y0,y1}]}] ---- */
  function linesFromBlocks(data) {
    const lines = [];
    for (const b of data.blocks || [])
      for (const p of b.paragraphs || [])
        for (const l of p.lines || []) {
          const words = (l.words || [])
            .map(w => ({ text: (w.text || '').trim(), x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1 }))
            .filter(w => w.text && !/^[|\[\]{}]+$/.test(w.text));   // drop grid pipes
          if (words.length) lines.push({ words });
        }
    return lines;
  }

  /* ---- re-cluster words into table rows by y-center (for sparse PSM output
     where every word arrives as its own "line") ---- */
  function regroupRows(lines) {
    const words = [];
    for (const l of lines) for (const w of l.words) words.push(w);
    if (!words.length) return lines;
    const hs = words.map(w => w.y1 - w.y0).sort((a, b) => a - b);
    const h = hs[Math.floor(hs.length / 2)] || 10;
    words.sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1));
    const rows = [];
    let cur = [], curY = null;
    for (const w of words) {
      const yc = (w.y0 + w.y1) / 2;
      if (curY === null || Math.abs(yc - curY) <= h * 0.7) {
        cur.push(w);
        curY = curY === null ? yc : curY + (yc - curY) / cur.length;
      } else { rows.push(cur); cur = [w]; curY = yc; }
    }
    if (cur.length) rows.push(cur);
    return rows.map(ws => ({ words: ws.sort((a, b) => a.x0 - b.x0) }));
  }

  /* ---- cell text -> rate value ---- */
  function sane(v) {
    if (v >= 0 && v <= MAX_RATE) return v;
    if (v > MAX_RATE && v / 10 <= MAX_RATE) return v / 10;   // lost decimal point
    return '-';
  }
  function normCell(raw) {
    let t = String(raw).replace(/\s+/g, '').replace(/[|,，、"“”''\[\]{}]/g, '');
    if (!t) return '-';
    if (/[无無柜]/.test(t)) return '无';
    if (/[询詢详細]/.test(t)) return '询';
    if (/^[-–—~_一.·°=]+$/.test(t)) return '-';
    let m = t.match(/^(\d{1,3}(?:\.\d+)?)%?$/);              // 16 / 16.0% / 160%
    if (m) {
      const hasPct = /%$/.test(t);
      const v = parseFloat(m[1]);
      if (!hasPct && t.length <= 1 && v < 10) return '-';    // lone digit = noise
      return sane(v);
    }
    m = t.match(/^(\d{1,3}(?:\.\d+)?)%[（(]/);               // 21%(包包) 之类保留原文
    if (m) { const v = sane(parseFloat(m[1])); if (v !== '-') return t; }
    if (/^[—–←-]/.test(t) && /[A-Za-z]{3,}/.test(t)) return '询'; // ←详询特殊团 误读
    if (/[-–—]/.test(t) && (t.replace(/[^\d]/g, '').length <= 1)) return '-'; // "0-" 噪声
    if (/^[A-Za-z®#&*©℗一天大中于干]{1,8}$/.test(t) && !/\d/.test(t)) return '无'; // 无柜 误读
    const digits = t.replace(/[^\d.]/g, '');                 // "1 6.0%" 拆词后拼回
    m = digits.match(/^(\d{1,3}(?:\.\d+)?)$/);
    if (m && digits.length >= 2) return sane(parseFloat(m[1]));
    return '-';
  }

  /* ---- estimate the 6-column grid from numeric token positions ---- */
  function detectGrid(lines, imgW) {
    const xs = [];
    for (const l of lines)
      for (const w of l.words) {
        const t = w.text.replace(/[|,，]/g, '');
        const m = t.match(/^(\d{1,3}(?:\.\d+)?)%$/);         // only confident "NN%" tokens
        if (m && sane(parseFloat(m[1])) !== '-') xs.push((w.x0 + w.x1) / 2);
      }
    if (xs.length < 4) return null;
    xs.sort((a, b) => a - b);
    // cluster by gap
    const clusters = [[xs[0]]];
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] - xs[i - 1] > imgW * 0.03) clusters.push([]);
      clusters[clusters.length - 1].push(xs[i]);
    }
    const centers = clusters
      .filter(c => c.length >= Math.max(2, xs.length * 0.05))
      .map(c => c[Math.floor(c.length / 2)]);                 // median resists stray tokens
    if (centers.length < 2) return null;
    // column width = smallest plausible gap between adjacent cluster centers
    // (real column pitch is ~11.7% of sheet width on these rebate sheets)
    let colW = Infinity;
    for (let i = 1; i < centers.length; i++) {
      const g = centers[i] - centers[i - 1];
      for (let k = 1; k <= 3; k++) {                          // a gap may span k empty columns
        const cand = g / k;
        if (cand >= imgW * 0.09 && cand <= imgW * 0.16) colW = Math.min(colW, cand);
      }
    }
    if (!isFinite(colW)) return null;
    // anchor the grid on the rightmost cluster; its column index from distance to right edge
    const cR = centers[centers.length - 1];
    const jr = Math.min(N_COLS - 1, Math.max(0, N_COLS - 1 - Math.round((imgW - colW / 2 - cR) / colW)));
    const col0 = cR - jr * colW;
    return { colW, col0, brandRight: col0 - colW / 2 };
  }

  /* ---- main: word-geometry table parse ---- */
  function parseWords(rawLines, imgW) {
    if (!rawLines || !rawLines.length || !imgW) return null;
    const lines = regroupRows(rawLines);
    const grid = detectGrid(lines, imgW);
    if (!grid) return null;
    const rows = [];
    for (const l of lines) {
      const cells = Array(N_COLS).fill('');
      const brandParts = [];
      for (const w of l.words) {
        const xc = (w.x0 + w.x1) / 2;
        if (xc < grid.brandRight) { brandParts.push(w.text); continue; }
        const clampIdx = x => Math.min(N_COLS - 1, Math.max(0, Math.round((x - grid.col0) / grid.colW)));
        const idx = clampIdx(xc);
        // "←详询特殊团" 一类跨列长词按覆盖范围铺开，避免只落在一列且偏移
        if (w.x1 - w.x0 > grid.colW * 0.9 && normCell(w.text) === '询') {
          const from = clampIdx(w.x0 + grid.colW * 0.3), to = clampIdx(w.x1 - grid.colW * 0.3);
          for (let i = from; i <= to; i++) cells[i] = cells[i] || '询';
        } else {
          cells[idx] += (cells[idx] ? ' ' : '') + w.text;
        }
      }
      const rates = cells.map(normCell);
      // need at least one confident value; all-dash lines are headers/noise
      if (!rates.some(v => v !== '-')) continue;
      const head = brandParts.join(' ');
      const cn = (head.match(CJK_RUN) || []).join('').slice(0, 16);
      const enParts = brandParts
        .filter(t => /^[A-Za-z0-9&.'()\/\-]{2,}$/.test(t) && /[A-Za-z]/.test(t))
        .map(t => t.toUpperCase());
      // 中文名列误读常在英文名后追加 1~2 位字母噪声（"BALENCIAGA BW"）
      while (enParts.length > 1 && enParts[enParts.length - 1].length <= 2) enParts.pop();
      // 中文名列为英文品牌时会整体重复一遍（"2AN 2AN"、"AFTER BLOW AFTER BLOW"）
      let deduped = enParts.filter((t, i) => i === 0 || t !== enParts[i - 1]);
      const half = deduped.length / 2;
      if (Number.isInteger(half) && half >= 1 &&
          deduped.slice(0, half).join(' ') === deduped.slice(half).join(' '))
        deduped = deduped.slice(0, half);
      const en = deduped.join(' ').slice(0, 40);
      if (!cn && !/[A-Z]{2}/.test(en)) continue;             // no usable brand name
      rows.push({ cn, en, rates });
    }
    return rows;
  }

  /* ---- fallback: plain-text trailing-token parse (no coordinates) ---- */
  const RATE_TOKEN = /^(\d{1,2}(?:\.\d+)?(?:-\d{1,2}(?:\.\d+)?)?%?|[-–—~xX×\/]|详询|询|无柜台|无柜|无)$/;
  function normalizeRateToken(t) {
    if (/^([-–—~\/])$/.test(t)) return '-';
    if (/^([xX×]|无柜台|无柜|无)$/.test(t)) return '无';
    if (/^(详询|询)$/.test(t)) return '询';
    const v = t.replace(/%$/, '');
    if (/^\d{1,2}(\.\d+)?$/.test(v)) return sane(parseFloat(v));
    return v;
  }
  function parseText(text) {
    const rows = [];
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.replace(/[|,，、]/g, ' ').trim();
      if (!line) continue;
      const tokens = line.split(/\s+/);
      const rates = [];
      let i = tokens.length - 1;
      while (i >= 0 && rates.length < N_COLS && RATE_TOKEN.test(tokens[i])) {
        rates.unshift(normalizeRateToken(tokens[i]));
        i--;
      }
      if (rates.length < 3) continue;
      while (rates.length < N_COLS) rates.push('-');
      const head = tokens.slice(0, i + 1).join(' ').trim();
      if (!head) continue;
      const cn = (head.match(CJK_RUN) || []).join('');
      const en = head.replace(CJK_RUN, ' ').replace(/\s+/g, ' ').trim();
      if (!cn && !en) continue;
      rows.push({ cn, en, rates });
    }
    return rows;
  }

  return { linesFromBlocks, regroupRows, detectGrid, parseWords, parseText, normCell };
});
