#!/usr/bin/env node

/**
 * 새 게임 버전(유출 포함)을 프로젝트에 추가하는 스크립트. nanoka.cc 데이터를 받아 아래를 한 번에 처리한다.
 *
 *   1. versions.ts      GAME_VERSIONS에 버전 추가, 시즌 버프(추가 피로도) 공명자 등록
 *   2. circuitBuffs.ts  CIRCUIT_BUFFS_X_Y 배열 생성 + CIRCUIT_BUFFS_BY_VERSION 등록
 *   3. public/circuits  새 회로 아이콘 내려받기
 *   4. characters.json  프로젝트에 없는 공명자 추가 + 공식 초상화 내려받기 (public/characters)
 *   5. 순수 힐러(영구 2회 출전) 후보 안내 — 목록(DOUBLE_DEPLOYMENT_CHARACTERS)은 사람이 판단해서 고친다
 *
 * LIVE_VERSION은 건드리지 않는다. 라이브 버전보다 뒤에 추가된 버전은 자동으로 '유출' 표시가 붙는다.
 * 이미 있는 항목은 건너뛰므로 여러 번 실행해도 안전하다.
 *
 * 사용법:
 *   node tools/data/add-version.js <보드 버전> [nanoka 데이터 버전] [--dry-run] [--force]
 *     예) node tools/data/add-version.js 4.0
 *     --dry-run  파일을 바꾸지 않고 무엇이 바뀌는지만 출력
 *     --force    nanoka 데이터 버전과 보드 버전이 달라도 진행
 *   cd web && npm run version:add -- 4.0
 */

import fs from 'fs';
import path from 'path';
import {
  PATHS,
  characterIconUrl,
  circuitArrayName,
  circuitIconUrl,
  dataBaseUrl,
  downloadFile,
  ELEMENT_BY_CODE,
  fetchCharacterTags,
  fetchJson,
  fetchManifest,
  fetchTower,
  findSingularityTowers,
  isPureHealerCandidate,
  isRover,
  loadProjectCircuits,
  readDoubleDeploymentIds,
  readProjectCharacters,
  readProjectVersions,
  resolveDataVersion,
  toBoardVersion,
  toCharacterId,
  toCircuitArraySource,
  WEAPON_BY_CODE
} from './nanoka.js';

// 초상화가 아직 없을 때 넣는 1×1 투명 PNG (파일이 없으면 깨진 이미지가 보인다)
const PLACEHOLDER_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAABAElFTkSuQmCC';

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const [boardVersion, explicitDataVersion] = args.filter(a => !a.startsWith('--'));
const DRY_RUN = flags.has('--dry-run');
const done = [];
const todo = [];

const versionNumber = v => Math.round(Number(v) * 10);
const write = (file, content) => {
  if (!DRY_RUN) fs.writeFileSync(file, content, 'utf8');
};

async function main() {
  if (!/^\d+\.\d+$/.test(boardVersion || '')) {
    console.error('사용법: node tools/data/add-version.js <보드 버전> [nanoka 데이터 버전] [--dry-run] [--force]\n  예) node tools/data/add-version.js 4.0');
    process.exit(1);
  }

  const manifest = await fetchManifest();
  const dataVersion = await resolveDataVersion(explicitDataVersion, manifest);
  console.log(`\n🔍 nanoka 데이터 ${dataVersion} → 보드 ${boardVersion} 추가${DRY_RUN ? ' (dry-run: 파일을 바꾸지 않음)' : ''}`);
  if (manifest) console.log(`   nanoka 라이브: ${manifest.live ?? '?'} / 최신: ${manifest.latest ?? '?'} / 받을 수 있는 버전: ${(manifest.available || []).join(', ')}`);

  if (toBoardVersion(dataVersion) !== boardVersion && !flags.has('--force')) {
    console.error(`\n❌ nanoka 데이터 버전(${dataVersion})이 보드 버전(${boardVersion})과 다릅니다. 다른 버전의 타워·회로가 들어갈 수 있어 중단합니다.`);
    console.error('   nanoka에 해당 버전 데이터가 아직 없으면 직접 입력해야 합니다. 그래도 진행하려면 --force');
    process.exit(1);
  }

  const baseUrl = dataBaseUrl(dataVersion);
  const [newtowerList, characters] = await Promise.all([fetchJson(`${baseUrl}/newtower.json`), fetchJson(`${baseUrl}/character.json`)]);
  const tower = findSingularityTowers(newtowerList)[0];
  if (!tower) throw new Error('특이점 확장 타워를 찾지 못했습니다.');
  console.log(`   타워: [ID ${tower.id}] ${tower.name} (${tower.cycle} / ${tower.season})\n`);
  const { fatigueResonators, circuits } = await fetchTower(dataVersion, tower.id, characters);

  const newCharacters = await addCharacters(characters);
  addVersion(fatigueResonators);
  await addCircuits(tower, circuits);
  await reportPureHealers(dataVersion, newCharacters);

  console.log('\n──────── 결과 ────────');
  if (done.length === 0) console.log('바뀐 것 없음 (이미 모두 반영되어 있음)');
  done.forEach(line => console.log(`✅ ${line}`));
  if (todo.length > 0) {
    console.log('\n직접 확인할 것');
    todo.forEach(line => console.log(`👉 ${line}`));
  }
  console.log('\n다음: cd web && npm run check:buff && npm test && npm run lint && npm run build\n');
}

/** 1. versions.ts: GAME_VERSIONS + 시즌 버프 */
function addVersion(fatigueResonators) {
  const project = readProjectVersions();
  let src = fs.readFileSync(PATHS.versions, 'utf8');
  let changed = false;

  if (!project.gameVersions.includes(boardVersion)) {
    const latest = project.gameVersions[project.gameVersions.length - 1];
    if (latest && versionNumber(boardVersion) < versionNumber(latest)) {
      throw new Error(`${boardVersion}은 등록된 최신 버전(${latest})보다 이전 버전입니다. 지난 버전은 이 스크립트로 추가하지 않습니다.`);
    }
    const next = [...project.gameVersions, boardVersion].map(v => `'${v}'`).join(', ');
    src = src.replace(/(export const GAME_VERSIONS: string\[\] = \[)[^\]]*(\])/, `$1${next}$2`);
    changed = true;
    const isLeak = project.liveVersion && versionNumber(boardVersion) > versionNumber(project.liveVersion);
    done.push(`versions.ts: GAME_VERSIONS에 '${boardVersion}' 추가${isLeak ? ` (라이브 ${project.liveVersion}보다 뒤라 '유출' 표시가 붙음)` : ''}`);
  }

  if (!(boardVersion in project.seasonBuff)) {
    const target = fatigueResonators[0] ?? null;
    const value = target ? `'${target.id}'` : 'null';
    src = src.replace(/(SEASON_BUFF_CHARACTER_BY_VERSION[^{]*\{[\s\S]*?)(\n\})/, `$1,\n  '${boardVersion}': ${value}$2`);
    changed = true;
    done.push(`versions.ts: ${boardVersion} 시즌 버프 = ${target ? `${target.nameKo}('${target.id}')` : 'null (미정)'}`);
    if (!target) todo.push('시즌 버프 대상이 데이터에 없습니다. 정해지면 SEASON_BUFF_CHARACTER_BY_VERSION에 입력');
    if (fatigueResonators.length > 1) todo.push(`추가 피로도 공명자가 여러 명입니다: ${fatigueResonators.map(r => r.nameKo).join(', ')} — 첫 번째만 넣었으니 확인`);
  }

  if (changed) write(PATHS.versions, src);
}

/** 2~3. circuitBuffs.ts 배열 + 맵 등록, 아이콘 내려받기 */
async function addCircuits(tower, circuits) {
  const MAP_COMMENT = /\/\/ 버전별 회로 버프 맵[^\n]*\n/;
  let src = fs.readFileSync(PATHS.circuitBuffs, 'utf8');
  const arrayName = circuitArrayName(boardVersion);

  if (loadProjectCircuits(boardVersion)) {
    console.log(`   (${arrayName}는 이미 있음 → 건너뜀. 내용 대조는 npm run check:buff)`);
  } else {
    if (circuits.length !== 4) todo.push(`회로가 ${circuits.length}개입니다 (보통 4개). 데이터 확인`);
    if (!MAP_COMMENT.test(src)) throw new Error('circuitBuffs.ts에서 "// 버전별 회로 버프 맵" 주석을 찾지 못했습니다.');
    const arraySource = toCircuitArraySource(boardVersion, circuits, `${boardVersion} 특이점 확장 회로 버프 목록 (Tower ${tower.id} / ${tower.cycle})`);
    // 배열은 맵 주석 바로 앞에, 타워 번호는 맵 주석 끝에 덧붙인다
    src = src.replace(MAP_COMMENT, line => `${arraySource}\n${line.replace(/\)\n$/, `, ${boardVersion}=${tower.id})\n`)}`);
    src = src.replace(/(export const CIRCUIT_BUFFS_BY_VERSION: Record<string, CircuitBuff\[\]> = \{[\s\S]*?)(\n\})/, `$1,\n  '${boardVersion}': ${arrayName}$2`);
    write(PATHS.circuitBuffs, src);
    done.push(`circuitBuffs.ts: ${arrayName} 생성 (${circuits.map(c => c.name).join(', ')}) + 맵 등록`);
  }

  for (const c of circuits) {
    const dest = path.join(PATHS.circuitIcons, `${c.id}.webp`);
    if (fs.existsSync(dest)) continue;
    if (DRY_RUN) {
      done.push(`회로 아이콘 내려받기 예정: ${c.id}.webp`);
      continue;
    }
    try {
      await downloadFile(circuitIconUrl(c.id), dest);
      done.push(`회로 아이콘 내려받음: public/circuits/${c.id}.webp`);
    } catch (err) {
      todo.push(`회로 아이콘을 받지 못했습니다: ${c.id}.webp (${err.message})`);
    }
  }
}

/** 4. characters.json에 없는 공명자 추가 + 초상화 */
async function addCharacters(characters) {
  const project = readProjectCharacters();
  const known = new Set(project.map(c => c.id));
  const added = [];

  for (const [nanokaId, c] of Object.entries(characters)) {
    if (!c.en || isRover(c.en)) continue;
    const id = toCharacterId(c.en);
    if (known.has(id)) continue;

    const entry = {
      id,
      name: (c.ko || c.en).replaceAll(' · ', ' '),
      enName: c.en,
      rarity: c.rank,
      element: ELEMENT_BY_CODE[c.element] || 'Unknown',
      weapon: WEAPON_BY_CODE[c.weapon] || 'Unknown',
      // 전반(.x1)으로 넣는다. 후반 출시면 .x2로, 출시 버전을 모르면 9.9로 고친다 (보드 노출은 X.Y 단위라 정렬에만 영향)
      releaseVersion: Number(`${boardVersion}1`),
      img: `/characters/${id}.png`
    };
    project.push(entry);
    known.add(id);
    added.push({ nanokaId, ...entry });
    done.push(`characters.json: ${entry.name}('${id}') 추가 — ${entry.rarity}성 ${entry.element} ${entry.weapon}, releaseVersion ${entry.releaseVersion}`);
    if (entry.element === 'Unknown' || entry.weapon === 'Unknown') todo.push(`${entry.name}: 속성/무기 코드가 처음 보는 값입니다 (element ${c.element}, weapon ${c.weapon})`);

    const dest = path.join(PATHS.characterImages, `${id}.png`);
    if (fs.existsSync(dest) || DRY_RUN) continue;
    try {
      if (!c.icon) throw new Error('아이콘 정보 없음');
      await downloadFile(characterIconUrl(c.icon), dest);
      done.push(`초상화 내려받음: public/characters/${id}.png (공식 아이콘)`);
    } catch (err) {
      fs.writeFileSync(dest, Buffer.from(PLACEHOLDER_PNG, 'base64'));
      todo.push(`${entry.name}: 공식 초상화가 아직 없어 투명 임시 이미지를 넣었습니다 (${err.message}). 일러스트가 있으면 tools/portrait/cutout.py로 임시 누끼`);
    }
  }

  if (added.length > 0) {
    write(PATHS.characters, JSON.stringify(project, null, 2));
    todo.push(`신규 공명자 releaseVersion(${added.map(c => `${c.name} ${c.releaseVersion}`).join(', ')})이 전반/후반 중 맞는지 확인`);
  }
  return added;
}

/** 5. 신규 공명자 중 순수 힐러 후보 안내 */
async function reportPureHealers(dataVersion, newCharacters) {
  if (newCharacters.length === 0) return;
  const doubleIds = readDoubleDeploymentIds();
  const tags = await fetchCharacterTags(dataVersion, newCharacters.map(c => c.nanokaId));
  for (const c of newCharacters) {
    const tagIds = tags.get(c.nanokaId);
    if (!tagIds) {
      todo.push(`${c.name}: 역할 태그 데이터가 아직 없습니다. 순수 힐러(영구 2회 출전)인지 직접 확인`);
    } else if (isPureHealerCandidate(tagIds) && !doubleIds.includes(c.id)) {
      todo.push(`${c.name}: 순수 힐러 후보('생존 치료' + '피해 부스트'). 맞으면 constants/index.ts의 DOUBLE_DEPLOYMENT_CHARACTERS에 '${c.id}' 추가`);
    }
  }
}

main().catch(err => {
  console.error('\n❌', err.message || err);
  process.exit(1);
});
