// ww.nanoka.cc 정적 데이터 조회 + 프로젝트(web/) 소스 읽기 공용 함수.
// check-nanoka-season-buff.js(대조)와 add-version.js(새 버전 추가)가 함께 쓴다. Node 내장 모듈만 사용.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web');
export const PATHS = {
  versions: path.join(WEB_DIR, 'src/constants/versions.ts'),
  circuitBuffs: path.join(WEB_DIR, 'src/constants/circuitBuffs.ts'),
  constants: path.join(WEB_DIR, 'src/constants/index.ts'),
  characters: path.join(WEB_DIR, 'src/data/characters.json'),
  characterImages: path.join(WEB_DIR, 'public/characters'),
  circuitIcons: path.join(WEB_DIR, 'public/circuits')
};

const STATIC = 'https://static.nanoka.cc';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// nanoka 숫자 코드 → 프로젝트 표기 (기존 공명자 57명과 대조해 확인한 값)
export const ELEMENT_BY_CODE = { 1: 'Glacio', 2: 'Fusion', 3: 'Electro', 4: 'Aero', 5: 'Spectro', 6: 'Havoc' };
export const WEAPON_BY_CODE = { 1: 'Broadblade', 2: 'Sword', 3: 'Pistols', 4: 'Gauntlets', 5: 'Rectifier' };

// 순수 힐러(영구 2회 출전) 추정 기준: 역할 태그 '생존 치료'(1) + '피해 부스트'(13)를 모두 가진 공명자.
// 3.8 기준 65명에서 순수 힐러 7명과 정확히 일치했지만 게임이 명시한 규칙은 아니므로 후보로만 쓴다.
export const HEAL_TAG_ID = '1';
export const BOOST_TAG_ID = '13';

export async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status} ${res.statusText})`);
  return res.json();
}

/** 파일 내려받기 (이미 있으면 건너뜀). 반환: 'exists' | 'downloaded' */
export async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath)) return 'exists';
  const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
  if (!res.ok) throw new Error(`Failed to download ${url} (${res.status})`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
  return 'downloaded';
}

/** nanoka manifest의 ww 항목: { latest, live, available } (실패 시 null) */
export async function fetchManifest() {
  try {
    return (await fetchJson(`${STATIC}/manifest.json`))?.ww ?? null;
  } catch {
    return null;
  }
}

/** 조회할 nanoka 데이터 버전: 인자 → manifest 최신 → 사이트 HTML에서 추출 */
export async function resolveDataVersion(explicit, manifest) {
  if (explicit) return explicit;
  if (manifest?.latest) return manifest.latest;
  try {
    const htmlRes = await fetch('https://ww.nanoka.cc/', { headers: HEADERS });
    if (htmlRes.ok) {
      const match = (await htmlRes.text()).match(/https:\/\/static\.nanoka\.cc\/ww\/([0-9]+\.[0-9]+(?:\.[0-9]+)?)\//);
      if (match?.[1]) return match[1];
    }
  } catch {
    // ignore
  }
  throw new Error('nanoka 데이터 버전을 감지하지 못했습니다. 버전을 인자로 지정하세요 (예: 3.8)');
}

export const dataBaseUrl = dataVersion => `${STATIC}/ww/${dataVersion}`;

/** '3.8.1' → '3.8' */
export function toBoardVersion(dataVersion) {
  return String(dataVersion).split('.').slice(0, 2).join('.');
}

/** nanoka 영문 이름 → 프로젝트 공명자 id (예: "Luuk Herssen" → "luuk-herssen") */
export function toCharacterId(nameEn) {
  return String(nameEn).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** 방랑자는 프로젝트에서 속성별 4종으로 따로 관리하므로 nanoka 목록 비교에서 제외 */
export const isRover = nameEn => /^rover\b/i.test(String(nameEn));

/** UE 경로("/Game/.../T_X_UI.T_X_UI") → 에셋 이름("T_X_UI") */
export const assetName = uePath => String(uePath || '').split('.').pop();

export const circuitIconUrl = id => `${STATIC}/assets/ww/UIResources/Common/Image/IconAttribute/${id}.webp`;
export const characterIconUrl = uePath => `${STATIC}/assets/ww/UIResources/Common/Image/IconRoleHead256/${assetName(uePath)}.webp`;

/** newtower.json에서 '특이점 확장' 타워 목록 (최신순) */
export function findSingularityTowers(newtowerList) {
  return Object.entries(newtowerList)
    .filter(([, tower]) => (tower.name?.ko || '').includes('특이점 확장') || (tower.name?.en || '').toLowerCase().includes('singularity'))
    .map(([id, tower]) => ({
      id: Number(id),
      name: tower.name?.ko || tower.name?.en || '',
      cycle: tower.cycle?.name?.ko || tower.cycle?.name?.en || `Cycle ${tower.cycle?.id}`,
      season: tower.season?.name?.ko || tower.season?.name?.en || tower.season?.tag || ''
    }))
    .sort((a, b) => b.id - a.id);
}

/** 타워 상세의 roles에서 '추가 피로도'(시즌 2회 출전) 공명자 추출 */
export function getFatigueResonators(towerDetail, characters) {
  const result = [];
  for (const [charId, roleData] of Object.entries(towerDetail.roles || {})) {
    const info = characters[charId] || {};
    for (const buff of Object.values(roleData)) {
      const desc = buff.desc || '';
      if (desc.includes('추가 피로도') || /fatigue|vigor/i.test(desc)) {
        result.push({
          nanokaId: charId,
          id: toCharacterId(info.en || ''),
          nameKo: info.ko || '미상',
          nameEn: info.en || 'Unknown',
          desc: desc.replace(/<[^>]*>/g, '')
        });
      }
    }
  }
  return result;
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
export function toCircuitList(koBuffs = {}, enBuffs = {}) {
  return Object.entries(koBuffs).map(([key, ko]) => {
    const en = enBuffs?.[key];
    const id = assetName(ko.icon);
    return {
      id,
      name: ko.name || '',
      nameEn: en?.name || '',
      description: fillDesc(ko),
      descriptionEn: fillDesc(en),
      iconUrl: `/circuits/${id}.webp`
    };
  });
}

/** 타워 상세(ko + en)를 받아 시즌 버프 공명자와 회로 목록으로 정리 */
export async function fetchTower(dataVersion, towerId, characters) {
  const base = dataBaseUrl(dataVersion);
  const ko = await fetchJson(`${base}/ko/newtower/${towerId}.json`);
  const en = await fetchJson(`${base}/en/newtower/${towerId}.json`).catch(() => null);
  return { fatigueResonators: getFatigueResonators(ko, characters), circuits: toCircuitList(ko.buffs, en?.buffs) };
}

/** 공명자별 역할 태그 id 목록. 반환: Map(nanokaId → string[]) */
export async function fetchCharacterTags(dataVersion, nanokaIds, concurrency = 8) {
  const base = dataBaseUrl(dataVersion);
  const tags = new Map();
  for (let i = 0; i < nanokaIds.length; i += concurrency) {
    await Promise.all(nanokaIds.slice(i, i + concurrency).map(async id => {
      try {
        const detail = await fetchJson(`${base}/ko/character/${id}.json`);
        tags.set(id, Object.keys(detail.tag || {}));
      } catch {
        tags.set(id, null); // 상세 데이터 없음 (유출 초기 등)
      }
    }));
  }
  return tags;
}

export const isPureHealerCandidate = tagIds => !!tagIds && tagIds.includes(HEAL_TAG_ID) && tagIds.includes(BOOST_TAG_ID);

// ───────── 프로젝트 소스 읽기 ─────────

/** versions.ts에서 지원 버전·라이브 버전·시즌 버프 맵을 읽는다 */
export function readProjectVersions() {
  const src = fs.readFileSync(PATHS.versions, 'utf8');
  const listMatch = src.match(/export const GAME_VERSIONS: string\[\] = \[([^\]]*)\]/);
  const gameVersions = listMatch ? [...listMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  const liveVersion = src.match(/export const LIVE_VERSION = '([^']+)'/)?.[1] ?? null;
  const mapBlock = src.match(/SEASON_BUFF_CHARACTER_BY_VERSION[^{]*\{([\s\S]*?)\}/);
  const seasonBuff = {};
  for (const m of mapBlock ? mapBlock[1].matchAll(/'(\d+\.\d+)':\s*(?:'([^']+)'|null)/g) : []) seasonBuff[m[1]] = m[2] ?? null;
  return { gameVersions, liveVersion, seasonBuff };
}

export const circuitArrayName = boardVersion => `CIRCUIT_BUFFS_${boardVersion.replace('.', '_')}`;

/** circuitBuffs.ts에서 해당 버전 회로 배열을 읽는다 (문자열만 든 배열 리터럴이라 그대로 평가). 없으면 null */
export function loadProjectCircuits(boardVersion) {
  const src = fs.readFileSync(PATHS.circuitBuffs, 'utf8');
  const match = src.match(new RegExp(`export const ${circuitArrayName(boardVersion)}: CircuitBuff\\[\\] = (\\[[\\s\\S]*?\\n\\])`));
  if (!match) return null;
  try {
    return new Function(`return ${match[1]}`)();
  } catch {
    return null;
  }
}

/** constants/index.ts의 순수 힐러(영구 2회 출전) id 목록 */
export function readDoubleDeploymentIds() {
  const src = fs.readFileSync(PATHS.constants, 'utf8');
  const match = src.match(/export const DOUBLE_DEPLOYMENT_CHARACTERS = \[([^\]]*)\]/);
  return match ? [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
}

export const readProjectCharacters = () => JSON.parse(fs.readFileSync(PATHS.characters, 'utf8'));

/** TS 소스에 그대로 붙여 넣을 수 있는 작은따옴표 문자열 */
export function toTsString(value) {
  return `'${JSON.stringify(value).slice(1, -1).replaceAll('\\"', '"').replaceAll("'", "\\'")}'`;
}

/** CircuitBuff 배열을 circuitBuffs.ts와 같은 모양의 소스 코드로 */
export function toCircuitArraySource(boardVersion, circuits, comment) {
  const items = circuits.map(c => [
    '  {',
    `    id: ${toTsString(c.id)},`,
    `    name: ${toTsString(c.name)},`,
    `    nameEn: ${toTsString(c.nameEn)},`,
    `    description: ${toTsString(c.description)},`,
    `    descriptionEn: ${toTsString(c.descriptionEn)},`,
    `    iconUrl: ${toTsString(c.iconUrl)}`,
    '  }'
  ].join('\n'));
  return `// ${comment}\nexport const ${circuitArrayName(boardVersion)}: CircuitBuff[] = [\n${items.join(',\n')}\n]\n`;
}
