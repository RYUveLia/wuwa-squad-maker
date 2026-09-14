#!/usr/bin/env node

/**
 * ww.nanoka.cc 정적 데이터를 조회하여 특이점 확장(Tower)의
 * 시즌 버프(추가 피로도 / 2코스트 공명자) 및 회로 버프 목록을 확인하는 스크립트.
 *
 * 사용법:
 *   node scripts/check-nanoka-season-buff.js [버전, 기본값: 자동 감지 또는 3.7.1]
 *   npm run check:buff
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_FALLBACK_VERSION = '3.7.1';
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

async function detectLatestVersion() {
  try {
    const htmlRes = await fetch('https://ww.nanoka.cc/', { headers: HEADERS });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const match = html.match(/https:\/\/static\.nanoka\.cc\/ww\/([0-9]+\.[0-9]+\.[0-9]+)\//);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {
    // ignore error and fallback
  }
  return DEFAULT_FALLBACK_VERSION;
}

async function main() {
  const targetVersion = process.argv[2] || await detectLatestVersion();
  console.log(`\n🔍 ww.nanoka.cc 데이터 확인 중... (버전: ${targetVersion})\n`);

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

  // 5. 타워 회로 버프 목록 출력
  const buffs = towerDetail.buffs || {};
  console.log('\n========================================');
  console.log('⚡ [회로 버프] 특이점 확장 단계 버프 목록');
  console.log('========================================');
  for (const [buffId, buff] of Object.entries(buffs)) {
    let desc = buff.desc || '';
    if (buff.param && Array.isArray(buff.param)) {
      buff.param.forEach((p, idx) => {
        desc = desc.replace(`{${idx}}`, p);
      });
    }
    console.log(`   • [${buffId}] ${buff.name}`);
    console.log(`     ${desc}`);
  }

  // 6. 현재 프로젝트 소스코드(character.ts)와 비교 점검
  try {
    const charTsPath = path.join(process.cwd(), 'src/utils/character.ts');
    const charTsContent = fs.readFileSync(charTsPath, 'utf8');
    const seasonBuffMatch = charTsContent.match(/c\.id === '([^']+)'/);
    const configuredChar = seasonBuffMatch ? seasonBuffMatch[1] : 'unknown';

    console.log('\n========================================');
    console.log('📋 프로젝트 코드 반영 상태 체크');
    console.log('========================================');
    console.log(`   • src/utils/character.ts 현재 설정: '${configuredChar}'`);

    const matchesConfig = fatigueResonators.some(r => r.nameEn.toLowerCase() === configuredChar.toLowerCase());
    if (matchesConfig) {
      console.log(`   ✅ 프로젝트 설정이 nanoka.cc 최신 데이터와 일치합니다!`);
    } else {
      console.log(`   ⚠️ 프로젝트 설정과 불일치할 수 있습니다. 위 감지된 공명자를 확인해주세요.`);
    }
  } catch {
    // ignore
  }

  console.log('\n');
}

main().catch(err => {
  console.error('실행 중 오류 발생:', err);
  process.exit(1);
});
