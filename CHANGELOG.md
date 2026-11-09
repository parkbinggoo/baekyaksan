## v1.2.5 · 2026-11-09 — 92종 전수 검사, 0개 도감 종 제거, 희귀 개체수 현실화

- 상황버섯 255→8, 송이 154→12, 능이 15→7, 꽃송이 102→8, 석이 40→6, 토종벌꿀 7→5, 영지버섯 544→22.
- 산삼 3(황금 1), 천마 5(황금 1) 유지. 기존 황금 5성 지원 7종의 황금 슬롯은 1종 1개 유지.
- 초기 배치 0개였던 산부추·돌단풍·바위취·바위채송화·애기기린초·돌양지꽃·바위떡풀을 기존 실제 서식 조건을 적용하는 별도 청크들에 분산 생성.
- `world/28b-ecology-populations.js` 추가; 청크 초기 채집물 생성 시 희귀도 제한과 누락종 복구를 적용. 중복 모델 생성 최소화.
- 기존 저장 형식·채집 성공/실패·타격 보정·황금 판매 제한·칭호·불상·멀티플레이 전송 형식은 변경하지 않음.
- 코드 맵, README, 92종 전체 보고서, 테스트를 갱신. `npm run audit`로 전수 검사를 다시 실행할 수 있음.
- 자동 검사 통과, 실제 WebGL 및 멀티플레이 단말 테스트 미완료.

## v1.2.4 · 2026-11-09 — 5성 희귀 개체 분산 및 황금 단일화

- 산삼: 채집 전 산 전체 슬롯 3개, 황금 1개 포함
- 천마: 채집 전 산 전체 슬롯 5개, 황금 1개 포함
- 산삼/천마 개체끼리 최소 220m 이상 떨어진 서로 다른 적합 구역에 배치. 고도·그늘·습도·수목 및 충돌 없는 지형 조건 유지
- 나머지 5성 약초/버섯의 개체수는 그대로, 기존 황금 도감 지원 7종은 각각 황금 개체를 1개 슬롯에만 부여
- 황금 채집 이후 일반 5성과 동일한 재생성 타이머/위치 재선정 처리; 재생성 시 추가 황금 개체 생성 방지
- `world/28a-five-star-population.js` 추가, `world/24-flora-population.js`, `world/29-chunks-and-ground.js`, `data/21b-golden-five-star.js` 및 manifest/빌드/테스트 문서 수정
- 자동 회귀/정적 검사 통과. 실제 WebGL 브라우저와 공개 MQTT 동기화는 미검증

## v1.2.3 — 작은 채집물 클릭·터치 판정 완화

- 약초·버섯·열매·벌꿀의 화면상 클릭/터치 허용 오차를 소폭 확대했습니다.
- **3D 모델의 실제 크기·모양·좌표는 변경하지 않았습니다.**
- 기존 정확한 3D 레이캐스트 판정이 먼저 작동하며, 조금 빗나간 경우에만 화면상 실루엣 주변의 보조 선택 판정을 사용합니다.
- PC 약 16px / 터치 기기 약 22px을 기존 실루엣의 투영 범위에 보정하되 최종 허용 반경은 48px을 넘지 않도록 제한했습니다.
- 장애물 뒤의 채집물, 제거된 모델, 멀리 있는 모델(35m 초과), 가짜 식물은 추가 판정하지 않습니다.
- 기존 채집 접근 거리(2.4m), 채집 타격 횟수, 성공·실패 확률, 자원 위치 및 멀티플레이/저장 시스템은 변경하지 않았습니다.
- 신규 파일: `src/game/input/34a-forage-hit-assist.js`, `scripts/test-forage-hit-assist.mjs`.
- 수정 파일: `src/game/input/34-pointer-and-keyboard.js`, `src/game/manifest.json`, `dist/game.bundle.js`, `package.json`, `CODE_MAP.md`, `TEST_REPORT.md`, `README.md`, `CHANGELOG.md`.
- 문법·DOM·링크 검사와 기능 회귀 테스트를 통과했습니다. 실제 WebGL PC/모바일 브라우저 조작은 미검증입니다.

## v1.2.2 — 황금 5성 도감 미발견 이미지 스타일 복원

- 황금 5성 미발견 카드 이미지 소스를 `gold:<종>` 대신 일반 도감과 같은 기본 종 모델로 변경했습니다.
- 일반 도감의 `card unk` 실루엣 필터가 적용되도록 전용 필터 무효화 CSS를 제거했습니다.
- 황금 도감의 금색 테두리/배경, 카드 배치, 미발견 `???`, 발견 후 황금색 모델, 재고 및 공양 기능은 그대로 유지합니다.
- 미발견 카드 이미지의 대체 텍스트에 미발견 품목명이 노출되지 않도록 수정했습니다.
- 회귀 테스트에 미발견 모델 소스·실루엣 및 기존 황금 도감 색상 유지 확인을 추가했습니다.
- 게임 실행·WebGL 화면은 이 작업 환경에서 실제 통합 검증하지 못했으며 게임에서 확인이 필요합니다.

# 백약산 프로젝트 업데이트 기록

## v1.2.1 · 2026-11-09

### 황금 5성 도감 이미지·채집 안정화
- 황금 5성 미발견 카드가 `.card.unk img` 규칙 때문에 거의 검게 보이던 문제 해결: **황금 5성 영역만** 이미지가 보이도록 수정. 일반 도감의 미발견 실루엣 규칙은 유지
- 이미 보유 중인 황금 5성은 예전 발견 표시 데이터가 누락돼도 `goldKnown || inventory > 0` 방식으로 발견 카드와 이름을 표시
- 황금 5성 3D 도감 이미지에 설명 가능한 대체 텍스트 추가. 기존 아이콘은 원본 3D 모델을 그대로 재사용하고 금빛 재질만 적용
- **추가 발견 오류:** 황금 산삼 등 뿌리 약초의 `collect()`가 `SPI["gold:<키>"]`를 참조하여 수집 도중 중단될 수 있던 문제 수정. 원본 `SPI[originalType]`를 사용하고 결측 안전 처리
- `scripts/test-golden-guide.mjs` 추가: 이미지 링크/발견 상태/미발견 카드/금빛 모델 키/황금 산삼 채집 경로 회귀 검사
- 이전 v1.2.0의 20m·10m 탐지 알림 규칙 및 v1.1.0의 동굴·공양·특별 칭호 기능 유지

### 브라우저/불상 3D 검토
- 불상 구현은 `src/game/world/53-secret-cave-world.js::makeCaveBuddha()`에 정의된 저폴리곤 기하로 확인: 앉은 석불, 들어 올린 손, 돌받침
- 실제 Three.js 게임 HTML의 WebGL 실행은 테스트 환경에서 외부 CDN 및 로컬 브라우저 접속 제한 때문에 미검증. 별도 제공하는 불상 이미지는 **Three.js 원본 기하 파라미터를 다른 3D 렌더러로 재구성한 참고 이미지**이며 실제 게임 화면 캡처가 아님

### 적용 파일
- 수정: `src/game/ui/35-hud-and-bag.js`, `styles/10-secret-cave-and-titles.css`, `src/game/gameplay/32-harvest.js`, `package.json`, `README.md`, `TEST_REPORT.md`, `CHANGELOG.md`, `dist/game.bundle.js`, `CODE_MAP.md`
- 추가: `scripts/test-golden-guide.mjs`


## v1.2.0 · 2026-11-09

### 레벨별 5성 감지 개편
- Lv.6: 20m 일시 알림(3초)만 제공
- Lv.7: 20m 유지형 알림, 10m 알림 없음
- Lv.8: 20m 유지형 + 10m 일시 알림(3초)
- Lv.9~11: 20m와 10m 모두 범위 내 유지형
- 거리별 재진입 독립 판정, 탐지 중 승급하면 새 능력 즉시 적용
- 기존 약초꾼의 눈썰미 UI에 20m/10m 표시, 등급창 Lv.6~9 효과 설명
- 동굴 입장 시 탐지창 종료, 야생 멧돼지 경고 우선 표시 유지

### 변경된 파일
- 신규: `src/game/gameplay/47b-five-star-sense.js`, `styles/11-five-star-sense.css`, `scripts/test-rare-sense.mjs`
- 수정: `src/game/world/47-wildlife-states.js`(기존 감지 코드만 이동), `src/game/data/02-ranks.js`, `src/game/world/53-secret-cave-world.js`, `index.html`, `src/game/manifest.json`, `package.json`, `README.md`, `CODE_MAP.md`, `TEST_REPORT.md`, `CHANGELOG.md`, `dist/game.bundle.js`
- 기존 채집물 생성, 출현 확률, 판매, 저장 포맷, 멀티플레이 통신 및 등급 승급 조건 변경 없음

### 검증 및 한계
- `npm run check`, `npm test` 통과. 기존 황금 5성·공양·저장 회귀 테스트도 통과
- WebGL 렌더링, 실제 PC/모바일 클릭·움직임, MQTT 접속은 환경상 미검증


## v1.1.0 · 2026-11-09

### 신규
- 기존 서식지와 5성 슬롯에만 출현하는 황금빛 변형 5성 (기존 3D 외형 재활용)
- 숲·이끼 낀 바위에 일부 가려진 1인용 비밀 동굴 입구
- 굽은 암벽 통로, 바위 불상, 공양대, 촛불과 은은한 국소 조명
- 일반·황금 5성 공양 선택과 확인, 공양물 봉헌 및 캐릭터 절하기
- 공양 칭호별 영구 보관·중복 방지·하나 선택/해제·머리 위 표시
- 3D 동굴 안에서 다른 플레이어 상태와 절하기/칭호 표시
- `npm test` 자동 기능 회귀 테스트

### 호환성/보호
- 기존 일반 채집물, 판매 가격, 채집 성공/실패, 레벨/등급 시스템 유지
- 황금 5성은 별도 재고 키로 관리하며 판매 목록에서 제외하고 결제 함수에서 거부
- 기존 프로필 v2 저장/불러오기 포맷 유지하면서 새 속성만 보완
- 기능별 JS·CSS 분리 구조, 코드 맵, GitHub Pages 배포 경로 보존

### 미검증/한계
- 이 작업 환경에서는 실제 브라우저 WebGL / MQTT 통합 테스트를 수행할 수 없었음
- 공용 MQTT와 브라우저 로컬 저장은 보안 서버가 아니므로 신뢰 가능한 서버 거래 보증은 불가능
- 동굴 위치는 UI/지도에는 없지만 공개 JavaScript 소스를 분석해 역추적할 수 있음

### 파일 위치
- 신규: `src/game/data/21b-golden-five-star.js`, `src/game/world/53-secret-cave-world.js`, `src/game/gameplay/54-secret-offering-and-titles.js`, `styles/10-secret-cave-and-titles.css`, `scripts/test-features.mjs`
- 수정: `index.html`, `src/game/data/02-ranks.js`, `src/game/core/05-session-state.js`, `src/game/world/29-chunks-and-ground.js`, `src/game/gameplay/32-harvest.js`, `src/game/graphics/25-collection-icons.js`, `src/game/ui/35-hud-and-bag.js`, `src/game/gameplay/13-market.js`, `src/game/graphics/20-hiker-avatar.js`, `src/game/network/38-multiplayer.js`, `src/game/core/50-game-update.js`, `src/game/core/52-start-and-event-bindings.js`, `src/game/input/34-pointer-and-keyboard.js`, `src/game/ui/36-map.js`, `src/game/gameplay/49-rock-climbing.js`, `src/game/save/51-profile-and-files.js`, `src/game/manifest.json`, `scripts/check.mjs`, `package.json`, `CODE_MAP.md`, `README.md`, `TEST_REPORT.md`, `dist/game.bundle.js`
