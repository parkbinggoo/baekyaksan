# 백약산 프로젝트 업데이트 기록

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
