# 버전 및 유출(Leak) 데이터 관리 가이드

이 문서는 신규 버전 업데이트 및 유출(찌라시) 정보(공명자, 2회 출전 시즌 버프, 특이점 확장 회로 버프 등)를 추가/수정하는 방법을 설명합니다.

---

## 1. 공명자(캐릭터) 데이터 관리

### 1.1 캐릭터 기본 정보 등록 및 속성 수정
- **파일**: [`src/data/characters.json`](../src/data/characters.json)
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
  - 아직 버전이 완전히 불명인 경우 `9.9`로 지정합니다.

### 1.2 유출 캐릭터 정렬 및 버전별 제어
- **파일**: [`src/utils/character.ts`](../src/utils/character.ts)
- **유출 캐릭터 목록 등록**:
  ```ts
  export const LEAK_CHARACTER_IDS = ['hsin', 'suoming']
  ```
  - `getSortedCharacters(showLeakInfo)` 헬퍼에 의해:
    - **유출 모드 ON (`showLeakInfo: true`)**: `releaseVersion` 3.71이 적용되어 최신순 도감 최상단에 노출됩니다.
    - **유출 모드 OFF (`showLeakInfo: false`)**: 미정(`9.9`)으로 처리되어 5성 도감 맨 뒤로 이동합니다.

### 1.3 시즌 버프 (임시 2회 출전 공명자) 설정
- **파일**: [`src/utils/character.ts`](../src/utils/character.ts)의 `getSeasonBuffInfo`
  ```ts
  export const getSeasonBuffInfo = (showLeakInfo: boolean = false): SeasonBuffInfo => {
    if (showLeakInfo) {
      // 3.7 시즌 버프 대상 캐릭터 (린네)
      const char = MOCK_CHARACTERS.find(c => c.id === 'lynae') || null
      return { version: '3.7', character: char }
    }
    // 3.6 시즌 버프 대상 캐릭터 (데니아)
    const char = MOCK_CHARACTERS.find(c => c.id === 'denia') || null
    return { version: '3.6', character: char }
  }
  ```
  - 유출 모드 ON/OFF에 따라 상단 배너 안내 문구, 도감의 시즌 버프 뱃지, 최대 2회 출전 한도 로직에 자동 연동됩니다.

---

## 2. 특이점 확장 회로 버프 데이터 관리

- **파일**: [`src/constants/circuitBuffs.ts`](../src/constants/circuitBuffs.ts)

### 2.1 버전별 버프 정의
버전별로 버프 목록(`CIRCUIT_BUFFS_3_6`, `CIRCUIT_BUFFS_3_7`)이 분리되어 있습니다.

```ts
// 3.7 유출/신규 버전 특이점 확장 회로 버프 목록
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
- 신규 회로 버프 이미지는 [`public/circuits/`](../public/circuits/) 경로에 추가하고, `iconUrl`에 `'/circuits/파일명.webp'` 형태로 경로를 지정합니다.

### 2.3 동작 및 하위 호환 구조
- **`getCircuitBuffs(showLeakInfo)`**: 모달 및 뷰에서 현재 유출 설정에 맞는 회로 버프 배열을 반환합니다.
- **`findCircuitBuffById(buffId, showLeakInfo)`**: 현재 활성화된 버전을 우선 검색하고, 이전 버전의 버프 ID인 경우 fallback 검색하여 기존 저장된 스쿼드 및 이미지 내보내기와의 하위 호환성을 유지합니다.

---

## 3. nanoka.cc 기반 시즌 버프 및 변경 사항 감지

명조 데이터베이스 사이트인 [ww.nanoka.cc](https://ww.nanoka.cc)의 정적 JSON 데이터를 활용하여 시즌 버프(추가 피로도 2코스트 공명자) 및 특이점 확장 회로 버프 변경 내역을 빠르게 검증할 수 있습니다.

### 3.1 검증 스크립트 실행
반복 작업 시 리소스 낭비를 줄이기 위해 자동 검증 스크립트가 구비되어 있습니다.

```bash
# 최신 버전 데이터 자동 감지 및 검증
npm run check:buff

# 특정 버전 직접 지정 검증 (예: 3.7.1)
node scripts/check-nanoka-season-buff.js 3.7.1
```

**스크립트 동작 내용**:
1. `ww.nanoka.cc`의 최신 데이터 버전(예: `3.7.1`) 탐지
2. `newtower.json`에서 최신 **특이점 확장(Singularity Expansion)** 타워 탐색 (예: `ID 16`)
3. `ko/newtower/<id>.json`의 `roles` 항목에서 **"추가 피로도"** 버프를 보유한 공명자(2코스트 대상) 자동 파싱
4. 특이점 확장 단계별 회로 버프 목록 및 수치 파라미터 출력
5. 현재 프로젝트 코드([`src/utils/character.ts`](../src/utils/character.ts))와의 설정 일치 여부 즉시 판별

### 3.2 nanoka.cc 주요 엔드포인트 규칙
- **기본 경로**: `https://static.nanoka.cc/ww/<version>/`
- **전체 타워 목록**: `https://static.nanoka.cc/ww/<version>/newtower.json`
- **타워 상세 정보**: `https://static.nanoka.cc/ww/<version>/ko/newtower/<towerId>.json`
- **캐릭터 정보**: `https://static.nanoka.cc/ww/<version>/character.json`

---

## 4. 작업 및 배포 체크리스트

1. **데이터 정합성 확인**:
   ```bash
   npm run check:buff
   ```
2. **빌드 및 린트 검증**:
   ```bash
   npm run build
   npm run lint
   ```
3. **개인 계정 커밋 수칙 확인**:
   - `git config user.email` → `ryul3024@gmail.com`
   - `git config commit.gpgsign` → `false`
   - `git remote -v` → `git@github.com-personal:RYUveLia/...`
4. **PR 생성**:
   - feature 브랜치 생성 후 작업 ➔ 커밋 & 푸시 ➔ PR 생성

