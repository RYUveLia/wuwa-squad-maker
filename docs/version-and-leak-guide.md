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
      // 3.7 시즌 버프 대상 캐릭터 (예: 루실라)
      const char = MOCK_CHARACTERS.find(c => c.id === 'lucilla') || null
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

## 3. 작업 및 배포 체크리스트

1. **빌드 및 린트 검증**:
   ```bash
   npm run build
   npm run lint
   ```
2. **개인 계정 커밋 수칙 확인**:
   - `git config user.email` → `ryul3024@gmail.com`
   - `git config commit.gpgsign` → `false`
   - `git remote -v` → `git@github.com-personal:RYUveLia/...`
3. **PR 생성**:
   - feature 브랜치 생성 후 작업 ➔ 커밋 & 푸시 ➔ PR 생성
