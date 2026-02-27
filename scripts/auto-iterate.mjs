import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function nowISO() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function write(file, content) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content, 'utf8');
}

function patchAppendUnique(file, marker, line) {
  const p = path.join(root, file);
  let s = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (!s.includes(marker)) {
    s += (s.endsWith('\n') || s.length === 0 ? '' : '\n') + marker + '\n';
  }
  if (!s.includes(line)) {
    s += line + '\n';
  }
  fs.writeFileSync(p, s, 'utf8');
}

// Minimal, safe "iteration": extend event pool with one bilingual entry.
const eventsPath = 'src/lib/events/events.ts';
let events = read(eventsPath);

const stamp = nowISO();
const id = `ev_auto_${stamp.replace(/[:T-]/g, '').slice(0, 12)}`;

const insertion = `
  {
    id: '${id}',
    titleEn: 'A Note Written in Ash',
    titleZh: '灰烬写下的便签',
    bodyEn: 'Someone left a message on stone. The fog tries to erase it as you read.',
    bodyZh: '有人在石头上留了字。你阅读时，迷雾试图把它擦掉。',
    options: [
      {
        id: 'pocket',
        labelEn: 'Pocket the charcoal',
        labelZh: '收走木炭',
        outcomeEn: { text: 'You keep the charcoal. It still feels warm. +6g', goldDelta: 6 },
        outcomeZh: { text: '你把木炭收起来，它仍带余温。+6金币', goldDelta: 6 },
      },
      {
        id: 'burn',
        labelEn: 'Burn the note',
        labelZh: '烧掉便签',
        outcomeEn: { text: 'The smoke curls like a warning. Fog -1', fogDelta: -1 },
        outcomeZh: { text: '烟雾盘旋，像警告。雾值-1', fogDelta: -1 },
      },
    ],
  }
`;

if (!events.includes('const EVENT_POOL')) {
  console.error('Could not find EVENT_POOL in', eventsPath);
  process.exit(2);
}

// Append before array closing "];" right before rollEvent export.
events = events.replace(/\n\];\n\nexport function rollEvent/m, `${insertion}\n];\n\nexport function rollEvent`);
write(eventsPath, events);

patchAppendUnique('ITERATIONS.md', '# Iterations', `- ${stamp} add 1 event (${id})`);

console.log('auto-iterate: added event', id);
