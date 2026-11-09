# 백약산 코드 맵 · CODE MAP

> 기준: 첨부된 2026-11-09 단일 HTML 파일. `src/game/manifest.json`이 JavaScript 실행 순서의 기준입니다.

## 1. 실행 경로

```text
index.html (화면 구조)
 ├─ styles/00~10 (CSS: 순서대로 적용)
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
| data | `src/game/data/02-ranks.js` | 536–628 | 94줄 | 약초꾼 등급·승급 조건·가격 조회 |
| core | `src/game/core/03-utils.js` | 629–645 | 17줄 | DOM 선택·수학·난수 유틸·승급 UI 이벤트 |
| audio | `src/game/audio/04-audio-core.js` | 646–677 | 32줄 | WebAudio 마스터·효과음·톤 |
| core | `src/game/core/05-session-state.js` | 678–749 | 72줄 | 인벤토리·프로필 상태·채집 재생성·희귀 공유 상태 |
| world | `src/game/world/06-terrain-height.js` | 750–768 | 19줄 | 지형 높이·능선·산길 수학 |
| graphics | `src/game/graphics/07-renderer-and-textures.js` | 769–788 | 20줄 | Three.js 렌더러·카메라·재질·캔버스 텍스처 |
| graphics | `src/game/graphics/08-tent-mesh.js` | 789–844 | 56줄 | 텐트 외부 3D 모델 |
| gameplay | `src/game/gameplay/09-campfire-cooking.js` | 845–1130 | 286줄 | 모닥불·불쏘시개·조리·버프·애니메이션 |
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
| graphics | `src/game/graphics/20-hiker-avatar.js` | 1701–1823 | 128줄 | 플레이어 3D 모델·동작·소지물 표시 |
| data | `src/game/data/21-native-flora-database.js` | 1824–2013 | 190줄 | 국내 자생 식물 종·서식 특성 데이터 |
| data | `src/game/data/21b-golden-five-star.js` | —–— | 70줄 | 황금 5성 확률·색상·공양 칭호·머리 위 표시 유틸 |
| world | `src/game/world/22-streams-and-habitats.js` | 2014–2038 | 25줄 | 계곡·토양·그늘·서식지 적합도 |
| graphics | `src/game/graphics/23-low-poly-flora-builders.js` | 2039–2178 | 140줄 | 식물 저폴리곤 빌더·형상 최적화 |
| world | `src/game/world/24-flora-population.js` | 2179–2235 | 57줄 | 지형·고도별 식생 분포·물가 |
| graphics | `src/game/graphics/25-collection-icons.js` | 2236–2346 | 113줄 | 도감 아이콘 렌더·열매·벌집·땅속 채집 |
| world | `src/game/world/26-decoy-flora.js` | 2347–2566 | 220줄 | 배경 야생화·나무·바위 식생·야생버섯 |
| world | `src/game/world/27-wild-honey.js` | 2567–2607 | 41줄 | 벌집 생성·꿀 채집 서식지 |
| world | `src/game/world/28-rare-placement.js` | 2608–2702 | 95줄 | 희귀 채집물 위치 이동·재생성 |
| world | `src/game/world/29-chunks-and-ground.js` | 2703–3080 | 380줄 | 청크 지형·식물 배치·충돌·로드/언로드 |
| world | `src/game/world/30-summit-and-gate.js` | 3081–3143 | 63줄 | 2,500m 정상·태극기·일주문 |
| graphics | `src/game/graphics/31-particles.js` | 3144–3157 | 14줄 | 흙·하트·채집 이펙트 |
| gameplay | `src/game/gameplay/32-harvest.js` | 3158–3262 | 111줄 | 이동 상태·채집·아이템 획득·도감 팝업 |
| ui | `src/game/ui/33-world-labels.js` | 3263–3270 | 8줄 | 캐릭터·채집 세계 좌표 라벨 |
| input | `src/game/input/34-pointer-and-keyboard.js` | 3271–3308 | 38줄 | 마우스·터치·키보드 조작 |
| ui | `src/game/ui/35-hud-and-bag.js` | 3309–3345 | 48줄 | 상단 상태 HUD·가방·도감 UI |
| ui | `src/game/ui/36-map.js` | 3346–3438 | 93줄 | 지도·나침반·위치 표기 |
| network | `src/game/network/37-radio.js` | 3439–3461 | 23줄 | 무전기 UI·상태 메시지 |
| network | `src/game/network/38-multiplayer.js` | 3462–3622 | 164줄 | MQTT 접속·플레이어 동기화·랭크 표시 |
| world | `src/game/world/39-collisions-and-camera.js` | 3623–3643 | 21줄 | 바위·나무 충돌 및 카메라 가림 처리 |
| core | `src/game/core/40-performance.js` | 3644–3659 | 16줄 | 기기별 FPS·화질·절전 설정 |
| world | `src/game/world/41-shared-day-clock.js` | 3660–3676 | 17줄 | 한국 시간 동기화·게임 하루·하늘색 |
| world | `src/game/world/42-weather.js` | 3677–3820 | 144줄 | 공유 날씨·비·눈·안개·하늘 변화 |
| graphics | `src/game/graphics/43-fireflies.js` | 3821–3909 | 89줄 | 야간 반딧불 무리·발광 |
| audio | `src/game/audio/44-forest-ambience.js` | 3910–3968 | 59줄 | 숲 소리·시각별 환경음 |
| gameplay | `src/game/gameplay/45-careful-harvest.js` | 3969–3987 | 19줄 | 조심스러운 캐기 실패·벌 공격 |
| world | `src/game/world/46-wildlife-models.js` | 3988–4183 | 196줄 | 동물 유형·멧돼지 상태·3D 형상 |
| world | `src/game/world/47-wildlife-states.js` | 4184–4319 | 136줄 | 동물 움직임·위협·기절·희귀 감지 |
| world | `src/game/world/48-wildlife-update.js` | 4320–4435 | 116줄 | 동물 AI 및 이름표 갱신 |
| gameplay | `src/game/gameplay/49-rock-climbing.js` | 4436–4527 | 92줄 | 바위 등반 타이밍·기절·점프 연결 |
| world | `src/game/world/53-secret-cave-world.js` | —–— | 256줄 | 결정적 비밀 동굴 위치·입구·암벽 통로·촛불·석불·카메라 레이어 |
| gameplay | `src/game/gameplay/54-secret-offering-and-titles.js` | —–— | 132줄 | 공양 확인·재료 소모·절하기·영구 칭호·공양 UI 및 멀티 연출 |
| core | `src/game/core/50-game-update.js` | 4528–4605 | 80줄 | 프레임별 게임 로직·물리·상태 갱신 |
| save | `src/game/save/51-profile-and-files.js` | 4606–4843 | 244줄 | 프로필 키·JSON 저장·복원·기록 내보내기 |
| core | `src/game/core/52-start-and-event-bindings.js` | 4844–4970 | 128줄 | 시작·버튼 이벤트·메인 렌더 루프 |
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
| `styles/10-secret-cave-and-titles.css` | 신규 | 동굴 입장 버튼·공양/칭호 UI·황금색 이름표·모바일 대응 |

## 4. 주요 동작 흐름

```text
닉네임 + PIN → save/51-profile-and-files.js → core/52-start-and-event-bindings.js: beginGame()
                                          ↓
                 core/50-game-update.js: updateGame() → 월드·플레이어·날씨·동물·HUD

채집 클릭 → input/34-pointer-and-keyboard.js → gameplay/32-harvest.js → data/02-ranks.js → ui/35-hud-and-bag.js
                               ↓
               network/38-multiplayer.js (채집 공유)

텐트 진입 → gameplay/11-tent-occupancy.js → gameplay/13-market.js / 12-tent-upgrades.js
                                    ↘ graphics/14-tent-interior.js

산길 이동 → world/29-chunks-and-ground.js → data/21-native-flora-database.js + graphics/23-low-poly-flora-builders.js

프레임 렌더 → core/52-start-and-event-bindings.js: frame() → graphics/07-renderer-and-textures.js
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
