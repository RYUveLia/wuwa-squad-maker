# 버전 및 유출(Leak) 데이터 관리 가이드

이 문서는 신규 버전 업데이트 및 유출(찌라시) 정보(공명자, 2회 출전 시즌 버프, 특이점 확장 회로 버프 등)를 추가/수정하는 방법을 설명합니다.

---

## 0. 버전별 편성 보드 구조

- **파일**: [`web/src/constants/versions.ts`](../web/src/constants/versions.ts)
- 화면 상단의 버전 선택(3.5부터 `GAME_VERSIONS`의 최신 버전까지)에 따라 **파티 목록이 버전별로 분리 저장**됩니다. (3.5에서 만든 파티는 3.6 보드에 보이지 않음)
- 선택된 버전이 결정하는 것:
  - 파티 목록 (localStorage `wuwa-squads-by-version`, 선택 버전은 `selected-version`)
  - 공명자 도감: `releaseVersion`이 선택 버전 이하인 공명자만 노출 (`isAvailableInVersion`)
  - 2회 출전 시즌 버프 대상 (`SEASON_BUFF_CHARACTER_BY_VERSION`)
  - 회로 버프 목록 (`CIRCUIT_BUFFS_BY_VERSION`)
- **유출 버전은 `LIVE_VERSION`에서 자동으로 정해집니다.** `GAME_VERSIONS`에서 `LIVE_VERSION`보다 뒤에 있는 버전이 유출 버전(`LEAK_VERSIONS`)이고, 버전 선택에 `유출` 표시가 붙습니다. 따로 목록을 관리하지 않습니다. (유출 정보 토글은 제거되어 모든 버전을 항상 선택 가능)
- **편성 코드 내보내기/불러오기**: 내보내기 코드(v3)에 보드 버전(`ver`)이 포함됩니다. 현재 보드와 다른 버전의 코드를 붙여넣으면 **① 코드 버전 보드에 넣기(회로 유지)** / **② 현재 보드에 넣기(회로 삭제, 현재 버전에서 2회 출전이 안 되는 공명자 등 규칙 미충족분 제외)** 중 고르는 창이 뜹니다. 버전 정보가 없는 이전 코드(v1/v2)는 세트 추천과 같은 방식으로 버전을 추정해 같은 선택 창을 띄웁니다. 추정한 버전 보드에 넣으면 회로를 유지하고, 추정할 수 없어 라이브 버전(`LIVE_VERSION`)으로 가정한 경우에는 회로를 삭제합니다. 같은 버전 코드는 현재 보드에 바로 적용합니다(덮어쓰기 확인).
- **이미지 저장**: 편성표 헤더에 `v3.7` 형식의 버전 배지와 부제가 표시되고, 파일명에 버전이 포함됩니다. (`wuwa-matrix-squad-v3.7-2026-11-06.png`)
- **기존 파티 마이그레이션**: 버전 구분 도입 이전에 저장된 파티(`wuwa-squads-data` 등)가 있으면 첫 진입 시 `VersionMigrationModal`이 뜹니다.
  - **세트 추천**: 모든 파티를 함께 넣었을 때 아무것도 빠지지 않는(미출시 공명자·출전 한도 초과·회로 초기화 없음) 버전이 있으면 전체를 그 버전으로 추천합니다. (예: 3.6 전용 회로 + 데니아 2회 출전 세트 → 전체 3.6) 후보가 여럿이면 라이브 → 이전 버전 → 유출 버전 순.
  - 세트 추천이 불가하면 파티별 추천 버전 = 회로가 존재하는 버전 ∩ 공명자가 모두 출시된 버전. 회로를 고르지 않은 파티는 최신 라이브 버전으로 안내합니다.
  - 파티마다 옮길 버전(공명자가 모두 출시된 버전)을 고르고, 체크박스로 옮길 파티를 고릅니다. "추천대로" / "전체 X" 일괄 지정이 가능합니다.
  - **회로 처리**: 이전 데이터의 회로는 아이콘 ID만 저장되어 있고 같은 아이콘이 버전마다 다른 효과로 재사용됩니다. 그래서 **세트 추천 버전으로 옮길 때만 회로를 유지**하고, 다른 버전으로 옮기거나 세트 추천이 없으면 회로를 삭제합니다.
  - 대상 버전 출전 한도를 넘는 공명자는 제외됩니다. 완료 시 `squads-version-migrated=true`가 저장되며, "나중에"를 누르면 다음 방문 때 다시 안내합니다.
- **다른 버전에서 불러오기**: 불러오기 창의 "다른 버전 보드에서 불러오기"로 다른 버전 파티를 현재 보드로 복사합니다. 회로는 초기화되고, 현재 버전에 출시되지 않은 공명자와 출전 한도 초과분은 제외됩니다. 현재 보드에 파티가 있으면 덮어쓰기 확인을 거칩니다.
- 이관·불러오기 공통: 공명자가 있었는데 규칙 정리로 모두 빠진 파티는 삭제되며(회로만 남은 빈 파티 방지), 전부 삭제되면 빈 파티 1개를 남깁니다.
- 관련 로직: [`web/src/utils/versionTransfer.ts`](../web/src/utils/versionTransfer.ts)
- 공유 코드 불러오기는 현재 선택된 버전 보드에 적용됩니다.

직접 고치는 값은 세 가지입니다. (현재 값은 [`versions.ts`](../web/src/constants/versions.ts) 참고)

| 상수 | 의미 | 언제 고치나 |
|---|---|---|
| `GAME_VERSIONS` | 지원 버전 목록 (오래된 순) | 새 버전 추가 |
| `LIVE_VERSION` | 현재 라이브 버전 | **라이브 전환 (이 값만 바꾸면 됨)** |
| `SEASON_BUFF_CHARACTER_BY_VERSION` | 버전별 2회 출전 시즌 버프 대상 (미정이면 `null`) | 새 버전 추가, 실서버와 다를 때 |

`LEAK_VERSIONS`는 위 값에서 계산되므로 직접 고치지 않습니다. (예: 지원 버전 `3.5~4.0`, 라이브 `3.8` → 유출 `['4.0']`)

---

## 1. 공명자(캐릭터) 데이터 관리

### 1.1 캐릭터 기본 정보 등록 및 속성 수정
- **파일**: [`web/src/data/characters.json`](../web/src/data/characters.json)
- **필드 구성**:
  ```json
  {
    "id": "hsin",
    "name": "여우의 별자리",
    "enName": "Hsin",
    "rarity": 5,
    "element": "Electro",
    "weapon": "Unknown",
    "releaseVersion": 3.71,
    "img": "/characters/hsin.png"
  }
  ```
- **속성(`element`)**: `'Spectro'`(회절), `'Aero'`(기류), `'Electro'`(전도), `'Fusion'`(용융), `'Glacio'`(응결), `'Havoc'`(인멸), `'Unknown'`(미정) 중 지정합니다.
- **버전(`releaseVersion`)**:
  - 정식 출시 또는 유출 버전 번호를 소수점 형식(예: 3.7 버전 전반 `3.71`, 후반 `3.72`)으로 지정합니다.
  - 버전 보드의 도감 노출 기준이므로 정확히 입력합니다. (예: `3.62`는 3.6 보드부터 노출)
  - 아직 버전이 완전히 불명인 경우 `9.9`로 지정합니다.

### 1.2 유출 캐릭터 및 버전별 노출
- **파일**: [`web/src/utils/character.ts`](../web/src/utils/character.ts)의 `isAvailableInVersion`
  - `getSortedCharacters(version)`은 `releaseVersion`이 선택 버전 이하인 공명자만 반환합니다.
  - **출시 버전이 미정(`9.9`)인 공명자는 유출 버전 보드에서만 자동으로 노출됩니다.** 따로 등록하는 목록은 없습니다.
  - 출시 버전이 확정되면 `releaseVersion`을 실제 값으로 바꿉니다. 유출 버전이 하나도 없는데 `9.9` 공명자가 남아 있으면 `npm test`가 실패해서 알려 줍니다.

### 1.3 시즌 버프 (임시 2회 출전 공명자) 설정
- **파일**: [`web/src/constants/versions.ts`](../web/src/constants/versions.ts)의 `SEASON_BUFF_CHARACTER_BY_VERSION`
  - 버전별로 대상 공명자 ID를 지정합니다. 미정이면 `null`.
  - `getSeasonBuffInfo(version)`을 통해 상단 안내 문구, 도감의 `2회 (시즌)` 뱃지, 최대 2회 출전 한도 로직에 자동 연동됩니다.

### 1.4 순수 힐러(기본 2회 출전) 공명자 관리
- **파일**: [`web/src/constants/index.ts`](../web/src/constants/index.ts)의 `DOUBLE_DEPLOYMENT_CHARACTERS`
  - 순수 힐러 공명자 id 목록입니다. (현재 값은 코드 참고)
  - **순수 힐러 영구 2회 규칙**: 명조 종말 매트릭스 시스템상 '순수 힐러' 공명자는 특정 버전의 한시적인 시즌 버프와 무관하게 **버전이 지나도 영구적으로 2회 출전이 가능**합니다.
  - 신규 공명자(유출 단계 포함)가 순수 힐러로 확인된 경우(예: 3.8 릴리), 한시적 예외가 아닌 순수 힐러 영구 목록인 `DOUBLE_DEPLOYMENT_CHARACTERS`에 바로 등록합니다.
  - **후보 찾기**: `npm run check:buff`와 `npm run version:add`가 nanoka 역할 태그 '생존 치료' + '피해 부스트'를 모두 가진 공명자를 순수 힐러 후보로 알려 줍니다. 3.8 기준 65명에서 순수 힐러 7명과 정확히 일치했지만 게임이 명시한 규칙은 아니므로, 목록에 넣을지는 사람이 판단합니다.
  - 상단 안내 문구의 순수 힐러 명단은 선택 버전에 출시된 공명자만 표시합니다.

---

## 2. 특이점 확장 회로 버프 데이터 관리

- **파일**: [`web/src/constants/circuitBuffs.ts`](../web/src/constants/circuitBuffs.ts)

### 2.1 버전별 버프 정의
버전별로 버프 목록(`CIRCUIT_BUFFS_X_Y`, 예: `CIRCUIT_BUFFS_3_8`)이 분리되어 있고, `CIRCUIT_BUFFS_BY_VERSION`에 버전 키로 등록합니다. 회로 모달은 현재 보드 버전의 목록만 노출합니다.

각 배열 위 주석에 그 버전의 nanoka 특이점 확장 Tower 번호와 시즌 단계가 적혀 있습니다. (예: `// 3.8 특이점 확장 회로 버프 목록 (Tower 18 / S2 단계4)`)

새 버전의 배열은 손으로 쓰지 않고 `cd web && npm run version:add -- <버전>`으로 만듭니다. 아래는 배열의 모양입니다.

```ts
// 신규(유출 포함) 버전 특이점 확장 회로 버프 목록
export const CIRCUIT_BUFFS_3_7: CircuitBuff[] = [
  {
    id: '신규_또는_기존_ID',
    name: '버프 이름 (한글)',
    nameEn: 'Buff Name (English)',
    description: '버프 상세 설명 (한글)',
    descriptionEn: 'Buff Detailed Description (English)',
    iconUrl: '/circuits/아이콘_파일명.webp'
  },
  // ...
]
```

### 2.2 이미지/아이콘 추가
- 신규 회로 버프 이미지는 [`web/public/circuits/`](../web/public/circuits/) 경로에 추가하고, `iconUrl`에 `'/circuits/파일명.webp'` 형태로 경로를 지정합니다.
- 아이콘 원본: `https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/<아이콘명>.webp` (`newtower/<id>.json`의 `buffs[].icon` 경로 끝 파일명)

### 2.3 동작 및 하위 호환 구조
- **저장 키**: 게임이 같은 아이콘 ID(`redcrit`, `redattack` 등)를 버전마다 재사용하므로, 선택값은 `${version}:${id}` 형식(예: `3.8:T_Iconpropertyredcrit_UI`)으로 localStorage와 공유 코드에 저장됩니다. (`toCircuitBuffKey`)
- **`resolveCircuitBuff(key)`**: 저장 키로 `{ version, buff }`를 반환합니다. 버전 없는 레거시 ID는 `LIVE_VERSION` → 이전 버전(최신순) → 유출 버전 순으로 검색하여 기존 저장 스쿼드·공유 코드와의 하위 호환성을 유지합니다.
- 보드 버전과 다른 버전의 회로(레거시 저장값 등)는 파티 슬롯과 이미지 내보내기에 버전이 함께 표시됩니다.

---

## 3. nanoka.cc 기반 시즌 버프 및 변경 사항 감지

명조 데이터베이스 사이트인 [ww.nanoka.cc](https://ww.nanoka.cc)의 정적 JSON 데이터를 활용하여 시즌 버프(추가 피로도 2코스트 공명자) 및 특이점 확장 회로 버프 변경 내역을 빠르게 검증할 수 있습니다.

### 3.1 검증 스크립트 실행
반복 작업 시 리소스 낭비를 줄이기 위해 자동 검증 스크립트가 구비되어 있습니다.

```bash
# 최신 버전 데이터 자동 감지 및 검증 (web/에서)
cd web && npm run check:buff

# nanoka 데이터 버전·비교할 보드 버전 직접 지정 (예: 데이터 3.8, 보드 3.8)
node tools/data/check-nanoka-season-buff.js 3.8 3.8
```

**스크립트 동작 내용**:
1. `ww.nanoka.cc`의 최신 데이터 버전(예: `3.8`) 탐지
2. `newtower.json`에서 최신 **특이점 확장(Singularity Expansion)** 타워 탐색 (예: `ID 18`)
3. `ko/newtower/<id>.json`의 `roles` 항목에서 **"추가 피로도"** 버프를 보유한 공명자(2코스트 대상) 자동 파싱
4. 특이점 확장 단계별 회로 버프 목록 및 수치 파라미터 출력 (한글·영문)
5. 프로젝트 코드와 대조: **라이브 버전**(nanoka `manifest.json`의 `live` ↔ `LIVE_VERSION`, 다르면 안내만), **시즌 버프**([`versions.ts`](../web/src/constants/versions.ts))와 **회로 4종의 이름·설명 한글/영문**([`circuitBuffs.ts`](../web/src/constants/circuitBuffs.ts)). 기본 비교 대상은 프로젝트에 등록된 가장 최신 버전
6. 다른 항목이 있으면 `지금` / `nanoka` 값을 나란히 출력하고 종료 코드 1로 끝납니다. `nanoka` 값은 그대로 붙여 넣을 수 있는 형태입니다. 파일은 수정하지 않습니다.
7. nanoka는 지난 버전 스냅샷을 지웁니다. 받을 수 있는 데이터 버전은 스크립트 첫 줄(`받을 수 있는 버전`)에 나옵니다. 최신 스냅샷은 모든 타워의 `roles`가 최신 값으로 덮여 있어 **지난 버전의 시즌 버프는 확인할 수 없으므로, 해당 버전이 라이브일 때 대조해 둡니다.**

### 3.2 nanoka.cc 주요 엔드포인트 규칙
- **기본 경로**: `https://static.nanoka.cc/ww/<version>/`
- **전체 타워 목록**: `https://static.nanoka.cc/ww/<version>/newtower.json`
- **타워 상세 정보**: `https://static.nanoka.cc/ww/<version>/ko/newtower/<towerId>.json`
- **캐릭터 정보**: `https://static.nanoka.cc/ww/<version>/character.json`

---

## 4. 신규 버전 오픈 시 승격(Leak → Live) 절차

새 버전이 오픈되면 세 단계로 끝납니다. (모두 `web/`에서 실행)

1. **[`versions.ts`](../web/src/constants/versions.ts)의 `LIVE_VERSION` 한 줄을 오픈된 버전으로 바꿉니다.**
   - 버전 탭·이전 데이터 이관 창·이미지 저장의 `유출` 표시, 첫 접속 기본 보드, 레거시 데이터 해석 순서가 모두 따라 바뀝니다.
2. **`npm run check:buff`** 로 실서버 데이터와 대조하고, 다르다고 나온 항목만 고칩니다.
   - 시즌 버프 대상이 다르면 `SEASON_BUFF_CHARACTER_BY_VERSION`, 회로 문구가 다르면 출력된 `nanoka` 값을 `circuitBuffs.ts`에 붙여 넣기
3. **`npm test && npm run lint && npm run build`** 후 사용자 승인을 받아 `feat/version-X-Y-live` 브랜치로 PR
   - 출시 버전 미정(`9.9`) 공명자가 남아 있으면 테스트가 실패합니다 → `characters.json`의 `releaseVersion`을 실제 값으로

차기 유출 버전을 함께 추가하는 경우는 [`version_update` 스킬](../.agents/skills/version_update/SKILL.md)의 "A. 새 유출 버전 추가"를 따릅니다.

> [!TIP]
> 단계별 체크리스트와 검증 절차는 [`version_update` 스킬](../.agents/skills/version_update/SKILL.md)에 정리되어 있습니다. AI 에이전트는 "버전 업데이트", "유출 정보 반영", "라이브 전환" 요청 시 이 스킬을 따릅니다.

---

## 5. 작업 및 배포 체크리스트

1. **데이터 정합성 확인**:
   ```bash
   cd web && npm run check:buff
   ```
2. **빌드 및 린트 검증**:
   ```bash
   cd web && npm run build && npm run lint
   ```
3. **개인 계정 커밋 수칙 확인**:
   - `git config user.email` → `ryul3024@gmail.com`
   - `git config commit.gpgsign` → `false`
   - `git remote -v` → `git@github.com-personal:RYUveLia/...`
4. **PR 생성**:
   - feature 브랜치 생성 후 작업 ➔ 커밋 & 푸시 ➔ PR 생성

