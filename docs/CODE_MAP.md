# 백약산 코드 맵 · CODE MAP

> 기준: 첨부된 2026-11-09 단일 HTML 파일. `src/game/manifest.json`이 JavaScript 실행 순서의 기준입니다.

## v1.2.6 UI 수정판 — 상단 메뉴·설정·등급 UX

```text
index.html
 ├─ #hud .btns : 등급 / 설정 / 사진 / 무전 / 지도 / 가방 도감 (2열 × 3행)
 ├─ #settingsPanel : #ecoBtn 절전 / #hudSaveBtn 기록 저장 / #terrainRefreshBtn 지형 새로고침
 └─ #rankPanel
      ├─ #rankLevelTab → #rankLevelContent (기존 등급/5성 감지 레벨 안내)
      └─ #rankSpecialTab → #rankSpecialContent → #secretTitleList (공양 칭호 목록/장착/해제)

styles/12-hud-navigation.css
 ├─ HUD 2×3 버튼 순서는 유지, 기존 반투명 한지색·둥근 모서리·약 40px 높이 복원 (v1.2.6-ui.3)
 ├─ 설정 시트·탭 선택 시각 효과·접근성 포커스
 └─ 기존 styles/00~11 로직 및 게임 배경 유지

src/game/core/03-utils.js
 └─ openRankMenu(tab) → showRankTab(tab) → renderRankGuide() 또는 renderSpecialTitlePanel()

src/game/gameplay/54-secret-offering-and-titles.js
 └─ renderSpecialTitlePanel() → 특별 칭호 데이터(save.specialTitles)와 장착/해제 유지

src/game/core/52-start-and-event-bindings.js
 ├─ openGameSettings()/closeGameSettings() : 설정 모달
 ├─ #ecoBtn → applyPerf() (기존 절전 설정)
 ├─ #hudSaveBtn → openSaveConfirm() (기존 파일 저장)
 └─ #terrainRefreshBtn → refreshWorldFromSettings()

src/game/core/51a-settings-terrain-refresh.js
 ├─ refreshWorldFromSettings() → 현재 위치 기록 persist()
 ├─ sessionStorage에 최대 25초 유효한 일회성 인증 확인값 기록 (PIN 미저장)
 ├─ window.location.reload() → resumeAfterSettingsReload()
 └─ 저장/자동 복귀 실패 → softRepairNearbyTerrain() (청크만 현장 복구)

src/game/world/29-chunks-and-ground.js
 └─ disposeChunk()/updateChunks() : 설정 새로고침 실패 시 지형 재생성

src/game/save/51-profile-and-files.js
 └─ readProfileDoc()/applyRecord() : 기존 닉네임·인벤토리·위치 복원

scripts/test-hud-navigation.mjs
 └─ 버튼 순서 / 탭/칭호 / 1회성 복귀 / 점프 독립 검사
```

**버전 기준:** v1.2.6(동굴 지형 개선)을 기반으로 한 *UI 수정판*입니다. v1.2.7의 연속 3회 점프 복구 코드는 포함하지 않으며, 일반 점프 입력은 바꾸지 않습니다. 동굴·텐트·등반 중에는 새로고침 버튼을 사용하지 못하도록 보호합니다.

**검증 한계:** JavaScript 검증과 헤드리스 Chromium의 정적 HTML/CSS 모바일·PC 레이아웃 검사까지 수행했으며, CDN Three.js를 포함한 실제 3D 게임 플레이·브라우저 새로고침 왕복은 미검증입니다.

## v1.2.5 — 5성 개체수 및 도감 누락 7종 복구

```text
world/29-chunks-and-ground.js: buildChunk()
  ├─ world/26-decoy-flora.js: placeExtraMushrooms() → ecologyAllowsResource()
  ├─ 나무 부착 버섯 생성 → ecologyAllowsResource()
  ├─ world/26-decoy-flora.js: placeRockPlants() → ecologyAllowsResource()
  ├─ world/28a-five-star-population.js: addTargetedFiveStarResources()
  ├─ world/28b-ecology-populations.js: addMissingJournalSpecies()
  │    └─ 기존 서식지의 바위·땅을 사용해 미배치 도감 품목 복구
  ├─ world/28b-ecology-populations.js: enforceForestPopulationQuota()
  │    └─ 모든 채집 생성 경로의 개체수 제한 (생성 슬롯 ID 결정적 동기화)
  ├─ world/28-rare-placement.js: relocateRareInChunk()
  ├─ data/21b-golden-five-star.js: applyGoldenVariants()
  └─ repairChunkResources() (기존 지면/장애물/바위 표면 보정)

전수 검사: scripts/audit-population.mjs → reports/population-audit.json (92종, 초기 0개 0종)
빠른 회귀 검사: scripts/test-ecology-balance.mjs
생태·개체수 보고서: [DEVELOPMENT.md](./DEVELOPMENT.md#record-population) (종별 초기 수량; 위치 없음)
```

**설계:** 동일한 원래 후보 슬롯 ID를 선택적으로 유지하며, 황금 5성 7종의 지정 슬롯도 유지합니다. 기존 20분 재생성·채집 난이도·도감 모델·멀티플레이 분산 배치 규칙에는 변화를 주지 않습니다. 실제 플레이어/서버 테스트는 별도 필요합니다.

## 1. 실행 경로

```text
index.html (화면 구조)
 ├─ styles/00~12 (CSS: 순서대로 적용)
 ├─ Three.js r128 (기존 CDN)
 ├─ MQTT 5.10.1 (기존 CDN)
 └─ dist/game.bundle.js  ← npm run build
     └─ src/game/manifest.json (기능별 JS 순서)
         ├─ core/     초기화, 상태, 루프
         ├─ data/     아이템, 등급, 식물정보
         ├─ world/    산·날씨·동물·배치
         ├─ graphics/ Three.js 도형·씬·효과
         ├─ gameplay/ 채집·텐트·상점·등반
         ├─ input/    조작
         ├─ ui/       HUD·도감·지도
         ├─ audio/    사운드
         ├─ network/  멀티플레이·무전기
         └─ save/     기록·내보내기
```

**중요:** 이 버전은 *기능별 소스 분리 + 빌드 결합*입니다. 독립 ES `import/export` 모듈이 아닙니다. 기존 게임은 함수와 `let/const`를 하나의 IIFE(즉시 실행 함수)에서 공유하므로, 동작 변경을 최소화하기 위해 동일한 스코프를 유지한 번들을 생성합니다. 파일을 수정한 후에는 꼭 `npm run build` 또는 `npm run dev`를 실행하세요.

## 2. 기능별 위치 (원본 줄번호 추적)

<!-- AUTO-MAP-START -->
| 구분 | 소스 파일 | 원본 줄 | 현재 줄 수 | 담당 기능 |
|---|---|---:|---:|---|
| core | `src/game/core/00-bootstrap.js` | 465–468 | 4줄 | 런타임 검사·iOS 화면 효과 |
| data | `src/game/data/01-item-catalog.js` | 469–535 | 67줄 | 약초·버섯·꿀 데이터, 가방·랜턴 단계, 판매 가격 |
| data | `src/game/data/02-ranks.js` | 536–628 | 108줄 | 약초꾼 등급·승급 조건·가격 조회 |
| core | `src/game/core/03-utils.js` | 629–645 | 34줄 | DOM 선택·수학·난수 유틸·승급 UI 이벤트 |
| audio | `src/game/audio/04-audio-core.js` | 646–677 | 32줄 | WebAudio 마스터·효과음·톤 |
| core | `src/game/core/05-session-state.js` | 678–749 | 72줄 | 인벤토리·프로필 상태·채집 재생성·희귀 공유 상태 |
| world | `src/game/world/06-terrain-height.js` | 750–768 | 19줄 | 지형 높이·능선·산길 수학 |
| graphics | `src/game/graphics/07-renderer-and-textures.js` | 769–788 | 20줄 | Three.js 렌더러·카메라·재질·캔버스 텍스처 |
| graphics | `src/game/graphics/08-tent-mesh.js` | 789–844 | 56줄 | 텐트 외부 3D 모델 |
| gameplay | `src/game/gameplay/09-campfire-cooking.js` | 845–1130 | 287줄 | 모닥불·불쏘시개·조리·버프·애니메이션 |
| world | `src/game/world/10-tent-placement.js` | 1131–1220 | 90줄 | 산속 텐트 배치·분홍 리본 길 안내 |
| gameplay | `src/game/gameplay/11-tent-occupancy.js` | 1221–1268 | 48줄 | 텐트 출입·수용 인원·점유 동기화 |
| gameplay | `src/game/gameplay/12-tent-upgrades.js` | 1269–1308 | 40줄 | 가방 확장·랜턴 업그레이드·구매 금액 |
| gameplay | `src/game/gameplay/13-market.js` | 1309–1361 | 56줄 | 채집물 판매·필터·정렬·정산 |
| graphics | `src/game/graphics/14-tent-interior.js` | 1362–1460 | 99줄 | 텐트 내부 3D·조명·다른 플레이어 착석 |
| graphics | `src/game/graphics/15-far-mountains.js` | 1461–1479 | 19줄 | 먼 산 배경 모델 |
| graphics | `src/game/graphics/16-intro-scene.js` | 1480–1508 | 29줄 | 인트로 카메라 및 연출 |
| graphics | `src/game/graphics/17-world-and-night-sky.js` | 1509–1642 | 134줄 | 게임 씬 구성·별·별똥별 |
| graphics | `src/game/graphics/18-geometry-helpers.js` | 1643–1657 | 15줄 | 공유 도형·잎·줄기·구체 프리미티브 |
| graphics | `src/game/graphics/19-herb-and-mushroom-mesh.js` | 1658–1700 | 43줄 | 기존 저폴리곤 약초·버섯 3D 모델 |
| graphics | `src/game/graphics/20-hiker-avatar.js` | 1701–1823 | 145줄 | 플레이어 3D 모델·동작·소지물 표시 |
| data | `src/game/data/21-native-flora-database.js` | 1824–2013 | 190줄 | 국내 자생 식물 종·서식 특성 데이터 |
| data | `src/game/data/21b-golden-five-star.js` | —–— | 108줄 | 황금 5성 확률·색상·공양 칭호·머리 위 표시 유틸 |
| world | `src/game/world/22-streams-and-habitats.js` | 2014–2038 | 25줄 | 계곡·토양·그늘·서식지 적합도 |
| graphics | `src/game/graphics/23-low-poly-flora-builders.js` | 2039–2178 | 140줄 | 식물 저폴리곤 빌더·형상 최적화 |
| world | `src/game/world/24-flora-population.js` | 2179–2235 | 57줄 | 지형·고도별 식생 분포·물가 |
| graphics | `src/game/graphics/25-collection-icons.js` | 2236–2346 | 126줄 | 도감 아이콘 렌더·열매·벌집·땅속 채집 |
| world | `src/game/world/26-decoy-flora.js` | 2347–2566 | 220줄 | 배경 야생화·나무·바위 식생·야생버섯 |
| world | `src/game/world/27-wild-honey.js` | 2567–2607 | 41줄 | 벌집 생성·꿀 채집 서식지 |
| world | `src/game/world/28-rare-placement.js` | 2608–2702 | 95줄 | 희귀 채집물 위치 이동·재생성 |
| world | `src/game/world/28a-five-star-population.js` | —–— | 45줄 | 산삼·천마 희귀 5성 개체수 제한, 지형별 분산 배치 및 재생성 |
| world | `src/game/world/28b-ecology-populations.js` | —–— | 81줄 | 실제 적합 지형에서 희귀종 개체수 분산 제한, 도감 미출현 7종 복구, 황금 개체 보호 |
| world | `src/game/world/29-chunks-and-ground.js` | 2703–3080 | 399줄 | 청크 지형·식물 배치·충돌·로드/언로드 |
| world | `src/game/world/30-summit-and-gate.js` | 3081–3143 | 63줄 | 2,500m 정상·태극기·일주문 |
| graphics | `src/game/graphics/31-particles.js` | 3144–3157 | 14줄 | 흙·하트·채집 이펙트 |
| gameplay | `src/game/gameplay/32-harvest.js` | 3158–3262 | 122줄 | 이동 상태·채집·아이템 획득·도감 팝업 |
| ui | `src/game/ui/33-world-labels.js` | 3263–3270 | 8줄 | 캐릭터·채집 세계 좌표 라벨 |
| input | `src/game/input/34-pointer-and-keyboard.js` | 3271–3308 | 44줄 | 마우스·터치·키보드 조작 |
| input | `src/game/input/34a-forage-hit-assist.js` | —–— | 60줄 | 작은 약초·버섯·채집물의 화면 터치 오차범위 보정 (모델/난이도 불변) |
| ui | `src/game/ui/35-hud-and-bag.js` | 3309–3345 | 52줄 | 상단 상태 HUD·가방·도감 UI |
| ui | `src/game/ui/36-map.js` | 3346–3438 | 107줄 | 지도·나침반·위치 표기 |
| network | `src/game/network/37-radio.js` | 3439–3461 | 23줄 | 무전기 UI·상태 메시지 |
| network | `src/game/network/38-multiplayer.js` | 3462–3622 | 172줄 | MQTT 접속·플레이어 동기화·랭크 표시 |
| world | `src/game/world/39-collisions-and-camera.js` | 3623–3643 | 21줄 | 바위·나무 충돌 및 카메라 가림 처리 |
| core | `src/game/core/40-performance.js` | 3644–3659 | 16줄 | 기기별 FPS·화질·절전 설정 |
| world | `src/game/world/41-shared-day-clock.js` | 3660–3676 | 17줄 | 한국 시간 동기화·게임 하루·하늘색 |
| world | `src/game/world/42-weather.js` | 3677–3820 | 163줄 | 공유 날씨·비·눈·안개·하늘 변화 |
| graphics | `src/game/graphics/43-fireflies.js` | 3821–3909 | 89줄 | 야간 반딧불 무리·발광 |
| audio | `src/game/audio/44-forest-ambience.js` | 3910–3968 | 61줄 | 숲 소리·시각별 환경음 |
| audio | `src/game/audio/44a-world-events-sound.js` | —–— | 223줄 | 모닥불·요리·텐트·멧돼지·동굴·천둥·설원 발자국·산삼 축하 효과음 |
| gameplay | `src/game/gameplay/45-careful-harvest.js` | 3969–3987 | 38줄 | 조심스러운 캐기 실패·벌 공격 |
| world | `src/game/world/46-wildlife-models.js` | 3988–4183 | 196줄 | 동물 유형·멧돼지 상태·3D 형상 |
| world | `src/game/world/47-wildlife-states.js` | 4184–4319 | 103줄 | 동물 움직임·위협·기절·멧돼지 경고 |
| gameplay | `src/game/gameplay/47b-five-star-sense.js` | —–— | 79줄 | 레벨 6~9/상위 등급별 5성 채집물 20m·10m 일시/유지 탐지 알림 |
| world | `src/game/world/48-wildlife-update.js` | 4320–4435 | 116줄 | 동물 AI 및 이름표 갱신 |
| gameplay | `src/game/gameplay/49-rock-climbing.js` | 4436–4527 | 195줄 | 바위 등반 타이밍·기절·점프 연결 |
| gameplay | `src/game/gameplay/49a-golden-hoe-ui-and-aura.js` | —–— | 96줄 | 황금 호미 진행·전용 획득창·동굴/호미 30m 접근 알림 |
| world | `src/game/world/53-secret-cave-world.js` | —–— | 431줄 | 결정적 비밀 동굴 위치·입구·암벽 통로·촛불·석불·카메라 레이어 |
| world | `src/game/world/53a-cave-blessing-visuals.js` | —–— | 63줄 | 공양 후 촛불 동시 흔들림·은은한 광원·황금 불상 빛·동굴 카메라 진동 |
| gameplay | `src/game/gameplay/54-secret-offering-and-titles.js` | —–— | 132줄 | 공양 확인·재료 소모·절하기·영구 칭호·공양 UI 및 멀티 연출 |
| gameplay | `src/game/gameplay/54a-cave-blessing-buff.js` | —–— | 51줄 | 일반/황금 5성 공양 40분/24시간 음식 동일 효과·산삼 힌트 3%·황금 기절 보호·저장·HUD |
| core | `src/game/core/50-game-update.js` | 4528–4605 | 84줄 | 프레임별 게임 로직·물리·상태 갱신 |
| save | `src/game/save/51-profile-and-files.js` | 4606–4843 | 249줄 | 프로필 키·JSON 저장·복원·기록 내보내기 |
| core | `src/game/core/51a-settings-terrain-refresh.js` | —–— | 73줄 | 설정 > 지형 새로고침: 프로필 위치 보존·자동 복귀·청크 복구 대체 |
| core | `src/game/core/52-start-and-event-bindings.js` | 4844–4970 | 142줄 | 시작·버튼 이벤트·메인 렌더 루프 |
<!-- AUTO-MAP-END -->

## 3. CSS 코드 맵

| 소스 | 원본 줄 | UI |
|---|---:|---|
| `styles/00-foundation.css` | 10–42 | 공통 디자인 토큰·전역·알림·경고 |
| `styles/01-intro-hud-inventory.css` | 43–84 | 인트로·HUD·알림·도감·가방 |
| `styles/02-controls-and-profiles.css` | 85–108 | 조작·프로필 폼·머리 위 이름표 |
| `styles/03-ranks-upgrades.css` | 109–133 | 등급 패널·텐트 업그레이드 |
| `styles/04-joystick-map-climb.css` | 134–163 | 조이스틱·도움말·지도·바위 오르기 |
| `styles/05-responsive-layout.css` | 164–192 | 안전 영역·모바일 크기 대응 |
| `styles/06-save-and-camp.css` | 193–210 | 저장 확인·모닥불 조리 UI |
| `styles/07-tent-and-market.css` | 211–273 | 텐트·판매 상자·정산 UI |
| `styles/08-mobile-opacity.css` | 274–320 | 모바일 투명도·터치 UI |
| `styles/09-markup-refinements.css` | 이전 인라인 style | HTML에 남아 있던 6개 스타일의 별도 관리 |
| `styles/10-secret-cave-and-titles.css` | 신규(v1.1) | 동굴 입장 버튼·공양/칭호 UI·황금색 이름표·모바일 대응 |
| `styles/11-five-star-sense.css` | 신규(v1.2) | 20m·10m 눈썰미 알림 배치, 등급창 탐지 능력 문구 |

## 4. 주요 동작 흐름

```text
닉네임 + PIN → save/51-profile-and-files.js → core/52-start-and-event-bindings.js: beginGame()
                                          ↓
                 core/50-game-update.js: updateGame() → 월드·플레이어·날씨·동물·HUD

채집 클릭 → input/34-pointer-and-keyboard.js → gameplay/32-harvest.js → data/02-ranks.js → ui/35-hud-and-bag.js
                         ↘ input/34a-forage-hit-assist.js (정확한 클릭이 빗나간 경우에만 소폭 보정)
                               ↓
               network/38-multiplayer.js (채집 공유)

텐트 진입 → gameplay/11-tent-occupancy.js → gameplay/13-market.js / 12-tent-upgrades.js
                                    ↘ graphics/14-tent-interior.js

산길 이동 → world/29-chunks-and-ground.js → data/21-native-flora-database.js + graphics/23-low-poly-flora-builders.js

프레임 렌더 → core/52-start-and-event-bindings.js: frame() → graphics/07-renderer-and-textures.js
```

### v1.2.3 작은 채집물 클릭·터치 허용 범위 확대

```text
input/34-pointer-and-keyboard.js: clickAt(sx,sy)
  ├─ ① 기존 ray.intersectObjects() : 실제 채집물·텐트·모닥불 정확한 직접 클릭 우선
  ├─ ② input/34a-forage-hit-assist.js: findForageTapAssist(sx,sy,hits)
  │      ├─ 현재 청크의 실제 herb/mush/honey/fruit만 확인
  │      ├─ 화면 좌표로 투영해 실루엣 반경 + PC 16px / 터치 22px 소폭 허용
  │      ├─ 최대 48px 반경, 카메라로부터 35m 초과/앞쪽 장애물 뒤 차단
  │      ├─ 가까운 두 자원 중 클릭 좌표에 더 적합한 하나 선택
  │      └─ 유사 식물, 이미 제거된 자원은 추가 판정 제외
  └─ ③ 보정 대상이 없으면 기존 나무·땅 이동/땅 파기 처리
       ↓
gameplay/32-harvest.js: act() / swing() / impact() (기존 그대로)
```

**변경하지 않은 부분:** 3D 메시 크기·색상·배치, 채집 횟수·성공/실패 확률, 채집 접근 거리, 황금 5성 확률, 도감, 레벨 탐지, 저장 데이터와 네트워크 규약.

**자동 검사:** `scripts/test-forage-hit-assist.mjs`가 정확한 클릭 우선, 주변 클릭 허용, 모바일 터치, 장애물 가림, 복수 자원, 제거된 자원 등을 점검합니다.

### v1.2.2 황금 5성 미발견 도감 이미지 복원

```text
ui/35-hud-and-bag.js: buildBag()
  ├─ GOLD_FIVE_BASES 순회 → 발견 여부( goldKnown || inv[gold:key] > 0 ) 확인
  ├─ 미발견(known=false): iconURL(itemKindOf(base), base)
  │     ↳ graphics/25-collection-icons.js : 일반 도감의 원본 3D 모델 재사용
  │     ↳ styles/01-intro-hud-inventory.css : .card.unk img → 회색 실루엣 필터
  └─ 발견(known=true): iconURL(itemKindOf(base), goldenKey(base))
        ↳ data/21b-golden-five-star.js : tintGoldenObject() 사용

styles/10-secret-cave-and-titles.css
  ↳ .golden-card : 기존 금색 테두리와 배경 유지
  ↳ 미발견 이미지 필터를 강제로 해제하던 규칙 제거

scripts/test-golden-guide.mjs : 기본/금색 이미지 키, 미발견 스타일 회귀 검사
```

황금 채집물 출현 확률·가격·도감 발견 조건·기존 일반 도감은 변경하지 않습니다.

### v1.2 레벨별 5성 탐지 기능 흐름

```text
core/50-game-update.js: updateGame(dt)
    ↓ (기존 호출 유지, 실외 플레이에서만 매 프레임)
gameplay/47b-five-star-sense.js: updateRareSense(dt)
    ├─ rareSenseMode(playerRank,20|10) : Lv.6~9 / Lv.10+ 단계별 규칙
    ├─ 0.25초마다 chunks.values().items 검색 : 화면의 실제 5성·미채집·높이차 ≤6
    ├─ updateRareSenseBand(20,...) : 20m 진입/재진입/3초·지속 알림
    ├─ updateRareSenseBand(10,...) : 10m 진입/재진입/3초·지속 알림
    └─ #rareSense/#rareSense20/#rareSense10 표시 토글, boarWarning 우선
         ↓
index.html + styles/00-foundation.css + styles/11-five-star-sense.css
    (기존 디자인 유지, 거리별 분리, 정확한 위치/방향은 비공개)

data/02-ranks.js: fiveStarSenseRankText()/renderRankGuide()
    ├─ Lv.6~9 설명을 rankTier에 추가 (승급 조건 불변)
    └─ 현재 Lv.6+ 탐지 효과를 rankProgress에도 표시

world/53-secret-cave-world.js: enterSecretCave() → clearRareSense()
    (실외 탐지 UI가 동굴 내부에 남지 않도록 전환 시 초기화)
```

### v1.1 신규 기능 흐름 (참고 사진 반영)

```text
[비밀 동굴 — 지도에 표기하지 않음]
world/53-secret-cave-world.js
 ├─ chooseSecretCaveSite()  : 기존 지형에서 같은 시드로 후보 자동 선정
 ├─ makeCaveEntrance()     : 숲·이끼·바위로 절반 가린 협소 입구
 ├─ makeCaveTunnel()       : 굽은 암석 통로·별도 카메라 레이어
 ├─ makeCaveBuddha()       : 석불 및 공양대 (제공 사진에서 분위기 참고)
 ├─ makeCaveCandles()      : 저폴리곤 촛불·국소 조명
 └─ updateSecretCaveInterior() : 실내 이동·카메라·입퇴장·동기화

[황금 5성 — 기존 종과 형상 그대로]
data/21b-golden-five-star.js
 ├─ GOLD_FIVE_BASES : 실제 5성 약초·버섯만 선택 (일반 품목 변경 없음)
 ├─ goldenSpawn()   : 품목 슬롯 ID와 출현 주기 기반 결정적 희귀 판정
 ├─ tintGoldenObject() : 기존 메시 재질 복제 후 황금빛 변경
 └─ addSpecialTitle() : 중복 없는 별도 영구 칭호
       ↓
world/29-chunks-and-ground.js: applyGoldenVariants()
       ↓
gameplay/32-harvest.js : 황금 개체 별도 수량 저장·보통 5성과 동일한 채집
       ↓
ui/35-hud-and-bag.js : 도감·가방 황금 섹션
       ↘ gameplay/13-market.js : 판매 키/가격/처리 3단계 차단

[공양 + 칭호]
gameplay/54-secret-offering-and-titles.js
 ├─ openSecretOffering() : 5성 보유품 확인 / 선택 / 최종 확인
 ├─ startSecretOffering(): 3D 재료 올리기·절하기 고정
 ├─ completeSecretOffering() : 절 이후 1회 차감 + 저장
 └─ renderSpecialTitlePanel() : 획득 칭호 누적·교체·해제
       ↓
graphics/20-hiker-avatar.js : bow 자세
network/38-multiplayer.js : 동굴 여부 / 절 동작 / 장착 칭호 실시간 표시
save/51-profile-and-files.js : 기존 v2 프로필에 goldKnown / specialTitles 확장
core/50-game-update.js : 동굴 전용 업데이트와 기존 산 업데이트 분기
core/52-start-and-event-bindings.js : 입장 준비 / 렌더링 시작
```

**주의:** 공용 MQTT는 서버 인증이나 원자적 인벤토리 거래를 제공하지 않습니다. 일반적인 플레이 과정에서는 이중 클릭 방지·절 완료 후 차감·로컬 저장을 적용했으나 **악의적인 클라이언트나 기기 간 동시 사용까지 보증하지 않습니다.** 이런 보증은 인증된 서버 및 트랜잭션 DB가 필요합니다.

**기밀성:** 동굴 위치는 일반 게임 지도·UI·설명서에 나오지 않습니다. 하지만 공개된 GitHub Pages 클라이언트 소스 안에는 결정적 위치 선택 코드가 포함되므로 코드를 분석하면 계산할 수 있습니다.

## 5. 앞으로 기능을 고칠 때의 개발 원칙

1. 먼저 이 코드 맵에서 기능 파일을 확인하고 영향 받는 UI·데이터·저장 로직을 찾습니다.
2. **기존 함수 이름과 아이템 키, 저장 포맷, 네트워크 메시지 포맷을 임의 변경하지 않습니다.**
3. 새 기능은 해당 디렉터리에 파일을 추가하고 `src/game/manifest.json`에 올바른 위치로 등록합니다. `npm run build`에서 코드 맵을 자동 갱신합니다.
4. `npm run check`로 기능 파일, 번들 구문, HTML ID 참조, CSS를 검사합니다.
5. 게임 플레이 실검증은 모바일/데스크톱에서 각각 시작·채집·가방·도감·텐트·상점·저장·멀티플레이를 확인합니다.

## 6. 변경 기록

| 날짜 | 버전 | 변경 | 검증 |
|---|---|---|---|
| 2026-11-09 | 1.0.0 | 단일 HTML을 기능별 JavaScript / CSS / HTML 분리, 코드 맵 및 무의존성 빌드 추가 | `npm run check` |
| 2026-11-09 | 1.1.0 | 비밀 동굴·석불·촛불·황금 5성·공양 절하기·칭호 보관/장착·멀티 상태 추가 | `npm run check`, `npm test` |
| 2026-11-09 | 1.2.0 | 레벨별 5성 20m·10m 탐지 알림 분리, 등급창 안내·회귀 테스트 추가 | `npm run check`, `npm test` |
| 2026-11-09 | 1.2.1 | 황금 5성 도감 아이콘 표시 및 수집 오류 수정 | `npm run check`, `npm test` |
| 2026-11-09 | 1.2.2 | 황금 5성 미발견 이미지: 기존 도감 실루엣 복원 | `npm run check`, `npm test` |
| 2026-11-09 | 1.2.3 | 작은 채집물 클릭·터치 오차범위 확대, 모델 크기 불변 | `npm run check`, `npm test` |

## v1.2.1 황금 5성 도감 이미지 표시 오류 — 변경 코드 맵

| 파일 | 이번 변경 | 관련 기능 |
|---|---|---|
| `src/game/ui/35-hud-and-bag.js` | `buildBag()` 황금 품목의 발견 여부를 `goldKnown` 또는 보유 수량으로 판정; 3D 이미지에 alt 텍스트 지정 | 도감 목록 → `iconURL()` → `tintGoldenObject()` |
| `styles/10-secret-cave-and-titles.css` | `.golden-card.unk img`의 검은 실루엣 필터 제거, 이미지는 황금색 그대로 표시 | `styles/01-intro-hud-inventory.css`의 일반 미발견 카드 규칙을 황금 카드에서만 덮어씀 |
| `src/game/gameplay/32-harvest.js` | `collect()`의 황금 뿌리 채집 애니메이션에서 `SPI[originalType]` 사용 | `data/21-native-flora-database.js` 식물 원본 → 가방 저장 `save.inv['gold:'+type]` |
| `scripts/test-golden-guide.mjs` | 도감 이미지/황금 품목 발견 표시/황금 뿌리 채집 회귀 검사 | `npm test`에서 호출 |
| `dist/game.bundle.js` | 빌드로 재생성된 배포 JS | GitHub Pages의 `index.html`에서 로드 |

이 추가 설명은 코드 맵 자동 생성표 아래에 별도 부록으로 기재했습니다. `npm run build` 시 자동 생성 코드 맵 본문은 새로 써지므로, 이 부록을 다시 추가해야 할 수 있습니다.
