---
name: version_update
description: 명조 새 버전(유출) 데이터 추가, 유출 버전의 라이브 전환을 한다. 버전·시즌 버프·회로 버프·공명자 데이터를 바꾸는 체크리스트와 검증 절차. "3.9 유출 반영", "3.8 라이브 전환", "회로 버프 업데이트" 같은 요청에 사용.
---

# 버전 업데이트 (유출 추가 / 라이브 전환)

데이터 구조 설명은 [`docs/version-and-leak-guide.md`](../../../docs/version-and-leak-guide.md), 코드 구조는 [`AGENTS.md`](../../AGENTS.md)의 "코드 구조" 참고.

## 수정 지점 한눈에

| 파일 | 무엇 |
|---|---|
| `src/constants/versions.ts` | `GAME_VERSIONS`, `LIVE_VERSION`, `LEAK_VERSIONS`, `SEASON_BUFF_CHARACTER_BY_VERSION` |
| `src/constants/circuitBuffs.ts` | `CIRCUIT_BUFFS_X_Y` 배열 + `CIRCUIT_BUFFS_BY_VERSION` 등록 |
| `public/circuits/` | 회로 아이콘 `.webp` |
| `src/data/characters.json` + `public/characters/` | 신규 공명자 (`releaseVersion` 정확히) + 초상화 |
| `src/utils/character.ts` | `LEAK_CHARACTER_IDS` (출시 버전 미정 `9.9` 유출 캐릭터만 의미 있음) |
| `src/constants/index.ts` | `DOUBLE_DEPLOYMENT_CHARACTERS` (순수 힐러 = 영구 2회) |
| `README.md` | 시즌 버프 대상 문구 |

> 버전 선택 탭·도감 필터·시즌 버프 안내·회로 모달·이미지 저장 배지는 모두 위 상수를 따라가므로 **화면 코드는 고치지 않는다.**

## A. 새 유출 버전 추가 (예: 3.9)

1. **데이터 확인 (nanoka.cc)**
   - `npm run check:buff` → 최신 데이터 버전과 최신 특이점 확장 타워의 시즌 버프(추가 피로도) 공명자, 회로 4종 출력
   - 타워 ↔ 버전: `https://static.nanoka.cc/ww/<데이터버전>/newtower.json`의 `season`(start/end_version_id), `cycle`로 판단. S2는 3.5=12, 3.6=14, 3.7=16, 3.8=18 (특이점 확장은 짝수 ID). **새 시즌이 시작되면 규칙이 바뀔 수 있으니 반드시 확인**
   - 과거 버전 시즌 버프는 해당 버전 스냅샷에서 확인 (최신 스냅샷은 모든 타워 `roles`가 최신 값으로 덮여 있음)
   - 회로 상세: `https://static.nanoka.cc/ww/<데이터버전>/ko/newtower/<towerId>.json`의 `buffs` (`desc`의 `{0}` 등을 `param`으로 치환), 영문은 `/en/`
2. **`versions.ts`**
   ```ts
   export const GAME_VERSIONS = ['3.5', '3.6', '3.7', '3.8', '3.9']
   export const LEAK_VERSIONS = ['3.9']            // 3.8이 아직 미출시면 ['3.8', '3.9']
   export const SEASON_BUFF_CHARACTER_BY_VERSION = { ..., '3.9': '<공명자 id>' /* 미정이면 null */ }
   ```
3. **`circuitBuffs.ts`**: `CIRCUIT_BUFFS_3_9` (회로 4개, `id`는 아이콘 파일명 `T_Iconproperty..._UI`) 작성 후 `CIRCUIT_BUFFS_BY_VERSION`에 `'3.9'` 등록
4. **회로 아이콘**: 새 아이콘만 `https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconAttribute/<아이콘명>.webp` → `public/circuits/<아이콘명>.webp`
5. **신규 공명자**: `characters.json`에 추가 (`releaseVersion` 예: 3.9 전반 `3.91`, 미정 `9.9`), 초상화 `public/characters/<id>.png`. 미정(9.9)이면 `LEAK_CHARACTER_IDS`에 추가. 순수 힐러면 `DOUBLE_DEPLOYMENT_CHARACTERS`에 추가
   - 대량 수집은 [`fetch_fandom_wiki_characters`](../fetch_fandom_wiki_characters/SKILL.md) (characters.json을 통째로 덮어쓰므로 diff 확인 필수)
6. **README.md** 시즌 버프 대상 목록에 새 버전 추가

## B. 유출 버전 → 라이브 전환 (예: 3.8 출시)

1. `versions.ts`: `LIVE_VERSION = '3.8'`, `LEAK_VERSIONS`에서 `'3.8'` 제거
2. `character.ts`: 출시된 캐릭터를 `LEAK_CHARACTER_IDS`에서 제거하고 `characters.json`의 `releaseVersion`을 실제 값으로
3. 실서버 데이터와 유출 데이터가 다르면 `CIRCUIT_BUFFS_3_8`·시즌 버프 수정 (`npm run check:buff`로 대조)
4. 영향 (의도된 변화)
   - 첫 접속 기본 보드가 3.8로 바뀜 (저장된 선택 버전이 있으면 유지)
   - 버전 없는 레거시 회로 ID·이전 편성 코드 해석 시 3.8이 우선됨 (`resolveCircuitBuff`, `pickPreferred`)
5. 테스트 중 버전 데이터 자체를 검증하는 항목은 결과가 바뀔 수 있음 → 의미를 확인하고 기대값 갱신
   - `src/constants/circuitBuffs.test.ts` "레거시 ID 순서" (예: `redice`는 3.6·3.8 모두 존재 → 라이브가 3.8이면 3.8로 해석)
   - 라이브 버전 기본값을 검증하는 테스트는 `LIVE_VERSION` 상수를 쓰므로 그대로 통과해야 정상

## C. 검증 (A·B 공통)

```bash
npm run check:buff   # nanoka.cc 최신 시즌 버프와 versions.ts 대조
npm test             # 단위 테스트 (회로 4개씩, 레거시 해석 순서, 출시 버전 필터 등)
npm run lint
npm run build
```
- `npm run dev` 로 띄워 확인: 새 버전 탭 → 도감에 신규 공명자, 헤더 시즌 버프 문구, 회로 모달 4종/아이콘, 이미지 저장 배지 `vX.Y`
- 테스트가 버전 수·목록을 하드코딩하지 않았는지 확인 (`GAME_VERSIONS`·`LIVE_VERSION` 상수 사용)

## D. 커밋 / PR

- [`AGENTS.md`](../../AGENTS.md) 규칙: 새 브랜치(`feat/version-3-9-leak`, `feat/version-3-8-live` 등) → **사용자 승인 후** 커밋·푸시 → PR. main 머지 = Vercel 즉시 배포
- 커밋 전 개인 계정 확인: `git config user.email`(ryul3024@gmail.com), `git config commit.gpgsign`(false), `git remote -v`(github.com-personal)
