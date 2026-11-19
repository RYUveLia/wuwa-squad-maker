#!/usr/bin/env node

/**
 * ww.nanoka.cc 정적 데이터를 조회하여 프로젝트 코드와 대조하는 스크립트. 파일은 수정하지 않는다.
 *
 * 대조 항목
 *   - 시즌 버프(추가 피로도 2회 출전 공명자) ↔ versions.ts
 *   - 특이점 확장 회로 버프 4종의 이름·설명(한/영) ↔ circuitBuffs.ts
 *     → 다르면 붙여 넣을 값을 출력하고 종료 코드 1
 * 안내만 하는 항목 (종료 코드에 영향 없음)
 *   - nanoka 라이브 버전 ↔ LIVE_VERSION (라이브 전환 필요 여부)
 *   - 프로젝트에 없는 공명자, 순수 힐러(영구 2회 출전) 후보
 *
 * 사용법:
 *   node tools/data/check-nanoka-season-buff.js [nanoka 데이터 버전] [보드 버전]
 *     - 데이터 버전: 기본값 자동 감지 (예: 3.8)
 *     - 보드 버전: 기본값 프로젝트에 등록된 가장 최신 버전 (예: 3.8)
 *   cd web && npm run check:buff
 */

import {
  circuitArrayName,
  dataBaseUrl,
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
  toTsString
} from './nanoka.js';

async function main() {
  const manifest = await fetchManifest();
  const dataVersion = await resolveDataVersion(process.argv[2], manifest);
  console.log(`\n🔍 ww.nanoka.cc 데이터 확인 중... (버전: ${dataVersion})`);
  if (manifest) {
    console.log(`   nanoka 라이브: ${manifest.live ?? '?'} / 최신: ${manifest.latest ?? '?'} / 받을 수 있는 버전: ${(manifest.available || []).join(', ')}`);
  }
  console.log('');

  // 1. newtower.json & character.json 로드
  const baseUrl = dataBaseUrl(dataVersion);
  const [newtowerList, characters] = await Promise.all([
    fetchJson(`${baseUrl}/newtower.json`).catch(err => {
      console.error('❌ newtower.json 로드 실패:', err.message);
      return null;
    }),
    fetchJson(`${baseUrl}/character.json`).catch(err => {
      console.error('❌ character.json 로드 실패:', err.message);
      return null;
    })
  ]);
  if (!newtowerList || !characters) process.exit(1);

  // 2. 최신 '특이점 확장' 타워
  const towers = findSingularityTowers(newtowerList);
  if (towers.length === 0) {
    console.log('⚠️ 특이점 확장 타워 정보를 찾을 수 없습니다.');
    process.exit(1);
  }
  console.log('📌 발견된 특이점 확장 목록 (최신 3개):');
  towers.slice(0, 3).forEach(t => console.log(`   - [ID: ${t.id}] ${t.name} (${t.cycle} / ${t.season})`));

  const latestTower = towers[0];
  console.log(`\n🔎 최신 타워(ID: ${latestTower.id}, ${latestTower.cycle}) 상세 데이터 조회 중...`);
  const { fatigueResonators, circuits: liveCircuits } = await fetchTower(dataVersion, latestTower.id, characters);

  // 3. 시즌 버프(추가 피로도) 공명자
  console.log('\n========================================');
  console.log('🌟 [시즌 버프] 추가 피로도(2코스트) 공명자');
  console.log('========================================');
  if (fatigueResonators.length === 0) {
    console.log('   (추가 피로도 부여 공명자가 발견되지 않았습니다)');
  } else {
    fatigueResonators.forEach(r => {
      console.log(`   • ${r.nameKo} (${r.nameEn}) [ID: ${r.nanokaId}]`);
      console.log(`     효과: ${r.desc}`);
    });
  }

  // 4. 회로 버프 목록
  console.log('\n========================================');
  console.log('⚡ [회로 버프] 특이점 확장 단계 버프 목록');
  console.log('========================================');
  for (const c of liveCircuits) {
    console.log(`   • [${c.id}] ${c.name} / ${c.nameEn}`);
    console.log(`     ${c.description}`);
  }

  // 5. 프로젝트 코드와 대조
  const project = readProjectVersions();
  // 비교할 보드 버전: 둘째 인자, 없으면 프로젝트에 등록된 가장 최신 버전
  const boardVersion = process.argv[3] || project.gameVersions[project.gameVersions.length - 1] || null;
  const problems = [];

  console.log('\n========================================');
  console.log(`📋 프로젝트 코드 반영 상태 체크 (보드 ${boardVersion ?? '?'} ↔ Tower ${latestTower.id})`);
  console.log('========================================');

  // 5-1. 라이브 전환 필요 여부 (안내만)
  if (manifest?.live && project.liveVersion) {
    const nanokaLive = toBoardVersion(manifest.live);
    console.log(`   • 라이브 버전: '${project.liveVersion}'`);
    if (nanokaLive === project.liveVersion) {
      console.log('     ✅ nanoka.cc와 일치');
    } else {
      // 게임 버전 출시와 매트릭스 오픈 시점이 다를 수 있어 안내만 한다 (불일치로 세지 않음)
      console.log(`     ℹ️ nanoka.cc 라이브는 ${nanokaLive}. 매트릭스가 열렸으면 versions.ts의 LIVE_VERSION을 '${nanokaLive}'로 바꾸면 라이브 전환`);
    }
  }
  if (boardVersion && toBoardVersion(dataVersion) !== boardVersion) {
    console.log(`   ℹ️ nanoka 데이터 버전(${dataVersion})과 비교 보드(${boardVersion})가 다릅니다. 새 버전 데이터일 수 있습니다.`);
    console.log(`      새 버전을 추가하려면: node tools/data/add-version.js ${toBoardVersion(dataVersion)}`);
  }

  // 5-2. 시즌 버프
  const configuredChar = boardVersion ? project.seasonBuff[boardVersion] ?? null : null;
  console.log(`   • 시즌 버프 (web/src/constants/versions.ts): '${configuredChar ?? '미정(null)'}'`);
  if (configuredChar && fatigueResonators.some(r => r.id === configuredChar)) {
    console.log('     ✅ nanoka.cc와 일치');
  } else {
    console.log(`     ⚠️ 불일치: nanoka.cc = ${fatigueResonators.map(r => `${r.nameKo}('${r.id}')`).join(', ') || '없음'}`);
    problems.push('시즌 버프');
  }

  // 5-3. 회로 4종
  console.log('   • 회로 버프 (web/src/constants/circuitBuffs.ts):');
  const projectCircuits = boardVersion ? loadProjectCircuits(boardVersion) : null;
  if (!projectCircuits) {
    console.log(`     ⚠️ ${circuitArrayName(String(boardVersion))} 배열을 찾지 못했습니다.`);
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

  // 5-4. 공명자 (안내만): 프로젝트에 없는 공명자, 순수 힐러 후보
  await reportCharacters(dataVersion, characters);

  if (problems.length === 0) {
    console.log('\n✅ 시즌 버프·회로 버프가 nanoka.cc 데이터와 일치합니다!\n');
  } else {
    console.log(`\n⚠️ 다른 항목 ${problems.length}개. 위 "nanoka" 값을 그대로 붙여 넣으면 됩니다.\n`);
    process.exitCode = 1;
  }
}

/** 프로젝트에 없는 공명자와 순수 힐러(영구 2회 출전) 후보를 안내한다. 판단은 사람이 한다 */
async function reportCharacters(dataVersion, characters) {
  const projectIds = new Set(readProjectCharacters().map(c => c.id));
  const doubleIds = readDoubleDeploymentIds();
  const nanokaChars = Object.entries(characters)
    .filter(([, c]) => c.en && !isRover(c.en))
    .map(([nanokaId, c]) => ({ nanokaId, id: toCharacterId(c.en), nameKo: c.ko || c.en }));

  console.log('   • 공명자 (web/src/data/characters.json, constants/index.ts):');
  const missing = nanokaChars.filter(c => !projectIds.has(c.id));
  if (missing.length === 0) {
    console.log(`     ✅ nanoka.cc 공명자 ${nanokaChars.length}명이 모두 등록되어 있음`);
  } else {
    console.log(`     ℹ️ 프로젝트에 없는 공명자: ${missing.map(c => `${c.nameKo}('${c.id}')`).join(', ')}`);
  }

  const tags = await fetchCharacterTags(dataVersion, nanokaChars.map(c => c.nanokaId));
  const candidates = nanokaChars.filter(c => isPureHealerCandidate(tags.get(c.nanokaId)));
  const notListed = candidates.filter(c => !doubleIds.includes(c.id));
  const notTagged = nanokaChars.filter(c => doubleIds.includes(c.id) && tags.get(c.nanokaId) && !isPureHealerCandidate(tags.get(c.nanokaId)));
  if (notListed.length === 0 && notTagged.length === 0) {
    console.log(`     ✅ 순수 힐러 목록(${doubleIds.length}명)이 역할 태그('생존 치료' + '피해 부스트') 기준과 일치`);
  }
  if (notListed.length > 0) {
    console.log(`     ℹ️ 순수 힐러 후보인데 목록에 없음: ${notListed.map(c => `${c.nameKo}('${c.id}')`).join(', ')}`);
    console.log('        → 영구 2회 출전이 맞으면 constants/index.ts의 DOUBLE_DEPLOYMENT_CHARACTERS에 추가');
  }
  if (notTagged.length > 0) {
    console.log(`     ℹ️ 목록에 있는데 태그 기준과 다름: ${notTagged.map(c => `${c.nameKo}('${c.id}')`).join(', ')} (확인 필요)`);
  }
}

main().catch(err => {
  console.error('실행 중 오류 발생:', err.message || err);
  process.exit(1);
});
