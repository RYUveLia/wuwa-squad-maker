#!/usr/bin/env node

/**
 * ww.nanoka.cc 정적 데이터를 조회하여 특이점 확장(Tower)의
 * 시즌 버프(추가 피로도 / 2코스트 공명자) 및 회로 버프 4종을 프로젝트 코드와 대조하는 스크립트.
 * 다른 항목이 있으면 붙여 넣을 값을 출력하고 종료 코드 1로 끝난다. 파일은 수정하지 않는다.
 *
 * 사용법:
 *   node tools/data/check-nanoka-season-buff.js [nanoka 데이터 버전] [보드 버전]
 *     - 데이터 버전: 기본값 자동 감지 (예: 3.8)
 *     - 보드 버전: 기본값 프로젝트에 등록된 가장 최신 버전 (예: 3.8)
 *   cd web && npm run check:buff
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status} ${res.statusText})`);
  }
  return res.json();
}

/** nanoka manifest의 ww 항목: { latest, live, available } (실패 시 null) */
async function fetchManifest() {
  try {
    const manifestRes = await fetch('https://static.nanoka.cc/manifest.json', { headers: HEADERS });
    if (manifestRes.ok) return (await manifestRes.json())?.ww ?? null;
  } catch {
    // ignore
  }
  return null;
}

/** '3.8.1' → '3.8' */
function toBoardVersion(dataVersion) {
  return String(dataVersion).split('.').slice(0, 2).join('.');
}

async function detectLatestVersion(manifest) {
  if (manifest?.latest) return manifest.latest;

  try {
    const htmlRes = await fetch('https://ww.nanoka.cc/', { headers: HEADERS });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const match = html.match(/https:\/\/static\.nanoka\.cc\/ww\/([0-9]+\.[0-9]+(?:\.[0-9]+)?)\//);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {
    // ignore error
  }
  throw new Error('nanoka 데이터 버전을 감지하지 못했습니다. 버전을 첫째 인자로 지정하세요 (예: 3.8)');
}

async function main() {
  const manifest = await fetchManifest();
  const targetVersion = process.argv[2] || await detectLatestVersion(manifest);
  console.log(`\n🔍 ww.nanoka.cc 데이터 확인 중... (버전: ${targetVersion})`);
  if (manifest) {
    console.log(`   nanoka 라이브: ${manifest.live ?? '?'} / 최신: ${manifest.latest ?? '?'} / 받을 수 있는 버전: ${(manifest.available || []).join(', ')}`);
  }
  console.log('');

  const baseUrl = `https://static.nanoka.cc/ww/${targetVersion}`;

  // 1. newtower.json & character.json 로드
  const [newtowerList, characters] = await Promise.all([
    fetchJson(`${baseUrl}/newtower.json`).catch(err => {
      console.error(`❌ newtower.json 로드 실패:`, err.message);
      return null;
    }),
    fetchJson(`${baseUrl}/character.json`).catch(err => {
      console.error(`❌ character.json 로드 실패:`, err.message);
      return null;
    })
  ]);

  if (!newtowerList || !characters) {
    process.exit(1);
  }

  // 2. '특이점 확장' 또는 'Singularity Expansion'에 해당하는 타워 탐색
  const singularityTowers = Object.entries(newtowerList)
    .filter(([_, tower]) => {
      const koName = tower.name?.ko || '';
      const enName = tower.name?.en || '';
      return koName.includes('특이점 확장') || enName.toLowerCase().includes('singularity');
    })
    .map(([id, tower]) => ({
      id: Number(id),
      name: tower.name?.ko || tower.name?.en || '',
      cycle: tower.cycle?.name?.ko || tower.cycle?.name?.en || `Cycle ${tower.cycle?.id}`,
      season: tower.season?.name?.ko || tower.season?.name?.en || tower.season?.tag || ''
    }))
    .sort((a, b) => b.id - a.id); // 최신순 정렬

  if (singularityTowers.length === 0) {
    console.log('⚠️ 특이점 확장 타워 정보를 찾을 수 없습니다.');
    return;
  }

  console.log(`📌 발견된 특이점 확장 목록 (최신 3개):`);
  singularityTowers.slice(0, 3).forEach(t => {
    console.log(`   - [ID: ${t.id}] ${t.name} (${t.cycle} / ${t.season})`);
  });

  const latestTower = singularityTowers[0];
  console.log(`\n🔎 최신 타워(ID: ${latestTower.id}, ${latestTower.cycle}) 상세 데이터 조회 중...`);

  // 3. 최신 타워 상세 데이터 (ko 우선, fallback en)
  let towerDetail = null;
  try {
    towerDetail = await fetchJson(`${baseUrl}/ko/newtower/${latestTower.id}.json`);
  } catch {
    towerDetail = await fetchJson(`${baseUrl}/en/newtower/${latestTower.id}.json`);
  }

  if (!towerDetail) {
    console.error('❌ 타워 상세 정보를 불러오지 못했습니다.');
    return;
  }

  // 4. 추가 피로도 (시즌 2회 출전 공명자) 분석
  const roles = towerDetail.roles || {};
  const fatigueResonators = [];

  for (const [charId, roleData] of Object.entries(roles)) {
    const charInfo = characters[charId] || {};
    for (const [_, buff] of Object.entries(roleData)) {
      const desc = buff.desc || '';
      if (desc.includes('추가 피로도') || desc.toLowerCase().includes('fatigue') || desc.toLowerCase().includes('vigor')) {
        fatigueResonators.push({
          id: charId,
          nameKo: charInfo.ko || '미상',
          nameEn: charInfo.en || 'Unknown',
          desc: desc.replace(/<[^>]*>/g, '')
        });
      }
    }
  }

  console.log('\n========================================');
  console.log('🌟 [시즌 버프] 추가 피로도(2코스트) 공명자');
  console.log('========================================');
  if (fatigueResonators.length === 0) {
    console.log('   (추가 피로도 부여 공명자가 발견되지 않았습니다)');
  } else {
    fatigueResonators.forEach(r => {
      console.log(`   • ${r.nameKo} (${r.nameEn}) [ID: ${r.id}]`);
      console.log(`     효과: ${r.desc}`);
    });
  }

  // 5. 타워 회로 버프 목록 출력 (한글 + 영문)
  const enDetail = await fetchJson(`${baseUrl}/en/newtower/${latestTower.id}.json`).catch(() => null);
  const liveCircuits = toCircuitList(towerDetail.buffs, enDetail?.buffs);
  console.log('\n========================================');
  console.log('⚡ [회로 버프] 특이점 확장 단계 버프 목록');
  console.log('========================================');
  for (const c of liveCircuits) {
    console.log(`   • [${c.id}] ${c.name} / ${c.nameEn}`);
    console.log(`     ${c.description}`);
  }

  // 6. 현재 프로젝트 소스코드와 비교 점검 (시즌 버프 + 회로 4종)
  const versionsTs = fs.readFileSync(path.join(WEB_DIR, 'src/constants/versions.ts'), 'utf8');
  const mapBlock = versionsTs.match(/SEASON_BUFF_CHARACTER_BY_VERSION[^{]*\{([\s\S]*?)\}/);
  const entries = mapBlock ? [...mapBlock[1].matchAll(/'(\d+\.\d+)':\s*(?:'([^']+)'|null)/g)] : [];
  // 비교할 보드 버전: 둘째 인자, 없으면 프로젝트에 등록된 가장 최신 버전
  const boardVersion = process.argv[3] || (entries.length ? entries[entries.length - 1][1] : null);
  const problems = [];

  console.log('\n========================================');
  console.log(`📋 프로젝트 코드 반영 상태 체크 (보드 ${boardVersion ?? '?'} ↔ Tower ${latestTower.id})`);
  console.log('========================================');

  // 라이브 전환 필요 여부: nanoka 라이브 버전 ↔ 프로젝트 LIVE_VERSION
  const projectLive = versionsTs.match(/export const LIVE_VERSION = '([^']+)'/)?.[1] ?? null;
  if (manifest?.live && projectLive) {
    const nanokaLive = toBoardVersion(manifest.live);
    if (nanokaLive === projectLive) {
      console.log(`   • 라이브 버전: '${projectLive}'`);
      console.log('     ✅ nanoka.cc와 일치');
    } else {
      console.log(`   • 라이브 버전: '${projectLive}'`);
      // 게임 버전 출시와 매트릭스 오픈 시점이 다를 수 있어 안내만 한다 (불일치로 세지 않음)
      console.log(`     ℹ️ nanoka.cc 라이브는 ${nanokaLive}. 매트릭스가 열렸으면 versions.ts의 LIVE_VERSION을 '${nanokaLive}'로 바꾸면 라이브 전환`);
    }
  }
  if (boardVersion && toBoardVersion(targetVersion) !== boardVersion) {
    console.log(`   ℹ️ nanoka 데이터 버전(${targetVersion})과 비교 보드(${boardVersion})가 다릅니다. 새 버전 데이터일 수 있으니 아래 결과는 참고만 하세요.`);
  }

  const entry = entries.find(e => e[1] === boardVersion);
  const configuredChar = entry?.[2] ?? null;
  console.log(`   • 시즌 버프 (web/src/constants/versions.ts): '${configuredChar ?? '미정(null)'}'`);
  const matchesConfig = configuredChar && fatigueResonators.some(r => toCharacterId(r.nameEn) === configuredChar.toLowerCase());
  if (matchesConfig) {
    console.log('     ✅ nanoka.cc와 일치');
  } else {
    console.log(`     ⚠️ 불일치: nanoka.cc = ${fatigueResonators.map(r => `${r.nameKo}(${toCharacterId(r.nameEn)})`).join(', ') || '없음'}`);
    problems.push('시즌 버프');
  }

  console.log('   • 회로 버프 (web/src/constants/circuitBuffs.ts):');
  const projectCircuits = boardVersion ? loadProjectCircuits(boardVersion) : null;
  if (!projectCircuits) {
    console.log(`     ⚠️ CIRCUIT_BUFFS_${String(boardVersion).replace('.', '_')} 배열을 찾지 못했습니다.`);
    problems.push('회로 배열 없음');
  } else {
    const FIELDS = ['name', 'nameEn', 'description', 'descriptionEn'];
    for (const live of liveCircuits) {
      const mine = projectCircuits.find(p => p.id === live.id);
      if (!mine) {
        console.log(`     ⚠️ 프로젝트에 없음: ${live.id} (${live.name})`);
        problems.push(live.id);
        continue;
      }
      const diffs = FIELDS.filter(f => live[f] && mine[f] !== live[f]);
      if (diffs.length === 0) {
        console.log(`     ✅ ${live.name}`);
        continue;
      }
      problems.push(live.id);
      console.log(`     ⚠️ ${live.name} (${live.id})`);
      for (const f of diffs) {
        console.log(`        ${f}`);
        console.log(`          지금:   ${toTsString(mine[f])}`);
        console.log(`          nanoka: ${toTsString(live[f])}`);
      }
    }
    for (const mine of projectCircuits) {
      if (!liveCircuits.some(l => l.id === mine.id)) {
        console.log(`     ⚠️ nanoka.cc에 없음: ${mine.id} (${mine.name})`);
        problems.push(mine.id);
      }
    }
  }

  if (problems.length === 0) {
    console.log('\n✅ 프로젝트 설정이 nanoka.cc 데이터와 일치합니다!\n');
  } else {
    console.log(`\n⚠️ 다른 항목 ${problems.length}개. 위 "nanoka" 값을 그대로 붙여 넣으면 됩니다.\n`);
    process.exitCode = 1;
  }
}

/** nanoka 영문 이름 → 프로젝트 공명자 id (예: "Luuk Herssen" → "luuk-herssen") */
function toCharacterId(nameEn) {
  return nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** nanoka 회로 설명: {0} 같은 자리표시자를 param으로 채우고 태그 제거 */
function fillDesc(buff) {
  let desc = buff?.desc || '';
  (buff?.param || []).forEach((p, idx) => {
    desc = desc.replaceAll(`{${idx}}`, p);
  });
  return desc.replace(/<[^>]*>/g, '');
}

/** nanoka 타워의 buffs(ko, en)를 프로젝트 CircuitBuff 형태로 변환. id는 아이콘 파일명 */
function toCircuitList(koBuffs = {}, enBuffs = {}) {
  return Object.entries(koBuffs).map(([key, ko]) => {
    const en = enBuffs?.[key];
    return {
      id: String(ko.icon || '').split('.').pop(),
      name: ko.name || '',
      nameEn: en?.name || '',
      description: fillDesc(ko),
      descriptionEn: fillDesc(en)
    };
  });
}

/** circuitBuffs.ts에서 해당 버전 회로 배열을 읽는다 (문자열만 든 배열 리터럴이라 그대로 평가) */
function loadProjectCircuits(boardVersion) {
  const src = fs.readFileSync(path.join(WEB_DIR, 'src/constants/circuitBuffs.ts'), 'utf8');
  const name = `CIRCUIT_BUFFS_${boardVersion.replace('.', '_')}`;
  const match = src.match(new RegExp(`export const ${name}: CircuitBuff\\[\\] = (\\[[\\s\\S]*?\\n\\])`));
  if (!match) return null;
  try {
    return new Function(`return ${match[1]}`)();
  } catch {
    return null;
  }
}

/** circuitBuffs.ts에 그대로 붙여 넣을 수 있는 작은따옴표 문자열 */
function toTsString(value) {
  return `'${JSON.stringify(value).slice(1, -1).replaceAll('\\"', '"').replaceAll("'", "\\'")}'`;
}

main().catch(err => {
  console.error('실행 중 오류 발생:', err);
  process.exit(1);
});
