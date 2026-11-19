# tools/data — 데이터 스크립트

Node 내장 모듈만 사용한다 (`npm install` 불필요). 경로는 스크립트 위치 기준으로 `web/`을 찾으므로 어디서 실행해도 된다.

## add-version.js — 새 버전(유출 포함) 추가

nanoka.cc 데이터를 받아 새 게임 버전을 프로젝트에 한 번에 추가한다. 이미 있는 항목은 건너뛰므로 여러 번 실행해도 된다.

```bash
cd web && npm run version:add -- 4.0 --dry-run   # 무엇이 바뀌는지만 출력
cd web && npm run version:add -- 4.0             # 실제 반영
node tools/data/add-version.js 4.0 [nanoka 데이터 버전] [--dry-run] [--force]
```

| 하는 일 | 바뀌는 곳 |
|---|---|
| 지원 버전에 추가, 시즌 버프(추가 피로도) 공명자 등록 | `web/src/constants/versions.ts` |
| 최신 특이점 확장 타워의 회로 4종으로 배열 생성 + 맵 등록 | `web/src/constants/circuitBuffs.ts` |
| 새 회로 아이콘 내려받기 | `web/public/circuits/` |
| 프로젝트에 없는 공명자 추가, 공식 초상화 내려받기 (없으면 투명 임시 이미지) | `web/src/data/characters.json`, `web/public/characters/` |
| 순수 힐러 후보·확인할 값 안내 ("직접 확인할 것") | 출력만 (파일은 고치지 않음) |

- `LIVE_VERSION`은 바꾸지 않는다. 라이브 버전보다 뒤에 추가된 버전은 자동으로 `유출` 표시가 붙는다
- nanoka 데이터 버전이 보드 버전과 다르면(그 버전 데이터가 아직 없으면) 멈춘다. 그때는 값을 직접 입력한다
- 신규 공명자 `releaseVersion`은 전반(`X.Y1`)으로 넣는다. 후반이면 `X.Y2`, 모르면 `9.9`로 고친다
- 검증: 3.8을 지운 복사본에서 이 스크립트로 3.8을 다시 만들면 손으로 만든 파일과 바이트 단위로 같다 (회로 배열, 공명자 데이터, 초상화, 아이콘)

## check-nanoka-season-buff.js — 시즌 버프·회로 대조

nanoka.cc 데이터에서 특이점 확장(Tower)의 시즌 버프(추가 피로도 2회 출전) 공명자와 회로 버프 4종을 가져와 프로젝트 코드와 대조한다. 시즌 버프는 `web/src/constants/versions.ts`, 회로 이름·설명(한/영)은 `web/src/constants/circuitBuffs.ts`와 비교한다. 다른 항목은 `지금` / `nanoka` 값을 나란히 출력하고(그대로 붙여 넣을 수 있는 형태) 종료 코드 1로 끝난다. 파일은 수정하지 않는다. nanoka 기준 라이브 버전이 `LIVE_VERSION`과 다르면 라이브 전환 안내를, 프로젝트에 없는 공명자와 순수 힐러 후보(역할 태그 '생존 치료' + '피해 부스트')가 있으면 그 안내도 출력한다 (안내는 종료 코드에 영향 없음).

```bash
node tools/data/check-nanoka-season-buff.js          # 최신 데이터 버전 자동 감지
node tools/data/check-nanoka-season-buff.js 3.8 3.8    # nanoka 데이터 버전, 비교할 보드 버전 지정
cd web && npm run check:buff                         # 같은 동작
```

새 버전 추가·라이브 전환 때 사용한다. 절차: [`../../.agents/skills/version_update/SKILL.md`](../../.agents/skills/version_update/SKILL.md)

## nanoka.js — 공용 모듈

위 두 스크립트가 함께 쓰는 nanoka 조회·프로젝트 소스 읽기 함수. 직접 실행하지 않는다.

## fetch-characters.js — Fandom Wiki 캐릭터 일괄 수집

Fandom Wiki `Resonator/List` 페이지 HTML에서 이름(한/영)·등급·속성·무기·출시 버전을 뽑아 `characters.json`을 만들고, 없는 초상화를 내려받는다.

```bash
node tools/data/fetch-characters.js <저장한 HTML 파일 경로>
```

- ⚠️ `web/src/data/characters.json`을 **통째로 덮어쓴다.** 실행 후 반드시 diff로 수동 수정분(유출 캐릭터, `releaseVersion` 등)이 사라지지 않았는지 확인한다
- 초상화는 `web/public/characters/`에 이미 있는 파일은 건너뛴다
- 한국어 이름은 스크립트 안 `KR_NAME_MAP`으로 변환한다. 새 캐릭터는 여기에 추가
- 상세 절차: [`../../.agents/skills/fetch_fandom_wiki_characters/SKILL.md`](../../.agents/skills/fetch_fandom_wiki_characters/SKILL.md)
