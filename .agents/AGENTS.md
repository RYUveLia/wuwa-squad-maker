# wuwa-squad-maker 작업 규칙

> 개인 repo 공통 지시사항(커밋 계정·remote·서명 규칙)은 [`personal-common.md`](personal-common.md)를 먼저 따른다.

## 커밋 및 브랜치 규칙

- **커밋 전에 반드시 변경 결과(코드/동작)를 유저에게 먼저 보여주고 확인을 거칠 것.**
  - 코드 가공이나 리팩토링 등의 작업을 진행한 후, 유저가 결과를 확인하자고 지시하거나 혹은 변경본이 완료되었을 때는 **임의로 먼저 커밋하거나 원격에 푸시(특히 force push)하지 않는다.**
  - 수정한 소스코드의 변경 내용(diff)이나 기능 작동 방식을 먼저 상세히 보여주고, 유저의 명시적인 커밋/푸시 진행 승인을 득한 후에만 깃 명령어 단계를 밟는다.
- **모든 작업은 항상 새 feature/refactor 브랜치를 통해 진행하고 PR(Pull Request) 요청을 띄울 것.**
  - `main` 브랜치에 직접 커밋하거나 머지 없이 직접 푸시하지 않는다.
  - 작업용 독립 브랜치 생성 ➔ 커밋 ➔ 푸시 ➔ PR 생성 ➔ 유저 최종 검토 및 최종 머지(Merge)의 단계를 확실하게 고수한다.

## 배포 규칙

- **git push 전에 반드시 유저 리뷰를 거칠 것.** 빌드가 성공하더라도 자동으로 커밋/푸시하지 않는다.
- 빌드 성공 → 변경 내역 요약 → 유저 승인 확인 → 커밋 & 푸시 순서를 지킨다.
- Vercel이 깃허브 연동되어 있어 push = 즉시 배포이므로, 잦은 배포를 방지하기 위해 이 규칙을 엄수한다.

## ⚠️ 절대적 엄수 사항 (최우선 순위)

- **모든 코드 변경 완료 시, 임의로 `git commit` 및 `push`를 실행하지 말 것.**
  - 코드를 수정한 뒤 빌드가 정상적으로 완료되었더라도, **"변경 사항을 이대로 커밋할까요?"** 또는 **"이대로 푸시 및 PR을 진행할까요?"** 와 같이 사용자에게 명시적인 승인 여부를 먼저 물어보아야 합니다.
  - 사용자가 사전에 직접 "커밋하고 푸시/PR 올려줘"라고 먼저 지시하지 않은 한, 소스 코드 수정 후에는 반드시 확인 질문을 남기고 사용자의 최종 승인 확답을 얻은 뒤에만 커밋/푸시 단계를 밟아야 합니다.

## 신규 버전 및 유출 데이터(공명자 & 회로 버프) 관리 가이드

상세 가이드는 [`docs/version-and-leak-guide.md`](../docs/version-and-leak-guide.md)에 정리되어 있습니다.

### 0. 버전별 편성 보드 (`src/constants/versions.ts`)
- 상단 버전 선택(3.5~3.8)에 따라 **파티 목록이 버전별로 분리**된다. 3.5에서 만든 파티는 3.6 보드에 보이지 않는다.
- 선택 버전이 결정하는 것: 파티 목록, 공명자 도감(`releaseVersion` ≤ 선택 버전), 2회 출전 시즌 버프 대상, 회로 버프 목록
- `GAME_VERSIONS`(지원 버전), `LIVE_VERSION`(현재 라이브), `LEAK_VERSIONS`(버전 선택에 '유출' 표시, 레거시 데이터 추천 시 마지막 순위), `SEASON_BUFF_CHARACTER_BY_VERSION`(버전별 시즌 버프 대상)
- 저장: localStorage `wuwa-squads-by-version`(버전 → 파티 목록), `selected-version`
- **기존 파티 마이그레이션**: 버전 도입 이전의 `wuwa-squads-data`가 있으면 `VersionMigrationModal`이 뜬다. 파티별로 ① 회로 버전에 넣기(회로 유지, 회로 존재 버전 ∩ 공명자 출시 버전만 선택) ② 회로 삭제 후 원하는 버전에 넣기(공명자 출시 버전 중 선택) 중 고르고, 체크박스로 이관 대상 선택·일괄 지정 가능. 회로 없는 파티는 최신 라이브 버전 추천. 완료 시 `squads-version-migrated=true` (로직: `src/utils/versionTransfer.ts`)
- **다른 버전에서 불러오기**: 불러오기 창의 "다른 버전 보드에서 불러오기"로 파티를 복사. 회로는 초기화, 대상 버전 미출시 공명자·출전 한도 초과분(예: 시즌 2회 공명자의 두 번째 출전)은 제외, 공명자가 모두 빠진 파티는 삭제(전부 삭제되면 빈 파티 1개 유지) (`sanitizeSquadsForVersion`)
- 유출 정보 토글은 제거됨. 모든 지원 버전(유출 포함)을 항상 선택 가능
- **내보내기/불러오기(편성 코드)**: v3 코드에 보드 버전(`ver`)과 버전 포함 회로 키 저장. 현재 보드와 다른 버전 코드를 붙여넣으면 `ImportTargetModal`에서 ① 코드 버전 보드에 넣기(회로 유지) ② 현재 보드에 넣기(회로 삭제 + 현재 버전 규칙 미충족 공명자 제외) 중 선택. 같은 버전 코드/버전 없는 이전 코드는 현재 보드에 적용(덮어쓰기 확인)
- **이미지 저장**: 헤더에 `v3.7` 형식 버전 배지·부제 표기, 파일명 `wuwa-matrix-squad-v<버전>-<날짜>.png`

### 1. 공명자(캐릭터) 데이터 (`src/data/characters.json`, `src/utils/character.ts`)
- **기본 데이터**: `characters.json`에서 `id`, `name`, `enName`, `rarity`, `element`, `weapon`, `releaseVersion`, `img` 관리. `releaseVersion`이 버전 보드 노출 기준이므로 정확히 입력 (예: 3.6 전반 `3.61`)
- **유출 캐릭터 목록**: `character.ts`의 `LEAK_CHARACTER_IDS`. 출시 버전 미정(`9.9`)이어도 유출 버전 보드에서는 노출
- **시즌 버프(임시 2회 출전)**: `versions.ts`의 `SEASON_BUFF_CHARACTER_BY_VERSION`에 버전별로 지정 (3.5 치사, 3.6 데니아, 3.7 린네, 3.8 루실라)

### 2. 특이점 확장 회로 버프 (`src/constants/circuitBuffs.ts`)
- **버전별 버프 배열**: `CIRCUIT_BUFFS_3_5` ~ `CIRCUIT_BUFFS_3_8`로 분리하고 `CIRCUIT_BUFFS_BY_VERSION`에 등록 (S2 시즌: 3.5=Tower 12, 3.6=14, 3.7=16, 3.8=18)
- **버프 내용 수정**: 이미지(`iconUrl`), 한/영 이름(`name`, `nameEn`), 한/영 설명(`description`, `descriptionEn`)을 해당 버전 배열에서 수정
- **회로 모달**: 현재 보드 버전의 회로만 노출
- **저장 키**: 같은 아이콘 ID를 버전마다 재사용하므로 선택값은 `${version}:${id}`(예: `3.8:T_Iconpropertyredcrit_UI`)로 저장. `resolveCircuitBuff(key)`가 조회하며, 버전 없는 레거시 ID는 `LIVE_VERSION` → 이전 버전 → 유출 버전 순으로 해석. 보드 버전과 다른 버전의 회로면 파티 칸에 버전 배지 표시
- **아이콘**: `https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/<아이콘명>.webp`에서 받아 `public/circuits/`에 저장

### 3. 신규 버전 추가 / 라이브 전환 체크리스트
1. `versions.ts`: `GAME_VERSIONS`에 추가, `LEAK_VERSIONS` 갱신, `SEASON_BUFF_CHARACTER_BY_VERSION` 등록 (라이브 전환 시 `LIVE_VERSION` 변경 + `LEAK_VERSIONS`에서 제거)
2. `circuitBuffs.ts`: `CIRCUIT_BUFFS_X_Y` 추가 후 `CIRCUIT_BUFFS_BY_VERSION` 등록
3. `characters.json`: 신규 캐릭터 `releaseVersion` 입력, 필요 시 `LEAK_CHARACTER_IDS` 갱신
4. `npm run check:buff`로 nanoka.cc와 대조 → `npm run build` / `npm run lint`

## 스킬 (`.agents/skills/`)

### `fetch_fandom_wiki_characters` — Fandom Wiki 캐릭터 일괄 수집
- 상세 절차: [`.agents/skills/fetch_fandom_wiki_characters/SKILL.md`](skills/fetch_fandom_wiki_characters/SKILL.md)
- 실행: `node scripts/fetch-characters.js <저장한 HTML 파일 경로>` (repo의 `scripts/` 버전이 실사용본)
- **주의**: 결과를 `src/data/characters.json`에 통째로 덮어쓰므로, 실행 후 반드시 diff로 수동 수정분(유출 캐릭터, `releaseVersion` 등)이 유실되지 않았는지 확인할 것
