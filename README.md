# 백약산 3D — 기능별 분리 개발판

기존 `index(20261109-082129).html` 게임을 **기존 코드를 잃지 않고** HTML / CSS / JavaScript로 분리한 첫 번째 구조화 버전입니다.

## 실행 방법 (Mac / Windows / Linux)

**Node.js 18 이상**만 있으면 됩니다. 새 라이브러리 설치는 필요하지 않습니다.

```bash
npm run dev
```

브라우저에서 **http://localhost:8000/** 을 여세요. 시작 전에 JavaScript가 자동 빌드됩니다.

수정 사항의 빌드/검사는 다음을 사용합니다.

```bash
npm run build   # 기능별 JavaScript → dist/game.bundle.js
npm run check   # 빌드 및 정적 코드 검사
```

`index.html`을 직접 더블 클릭할 수도 있지만, 브라우저의 저장/보안 정책 차이 때문에 **로컬 개발 서버를 권장**합니다. 기존과 마찬가지로 Google Fonts / Three.js / MQTT는 외부 CDN을 사용하므로 최초 접속에는 인터넷이 필요합니다.

## 어떤 파일을 수정할까요?

- **화면 요소 추가/이동** → `index.html`
- **색상, 크기, 화면 배치** → `styles/` 하위 UI별 CSS
- **약초·버섯 종, 이름, 희귀도, 가격** → `src/game/data/`
- **약초 모델(약초스타일그래픽)** → `src/game/graphics/19-herb-and-mushroom-mesh.js` 및 `23-low-poly-flora-builders.js`
- **한국 식물의 실제 고도/서식지 기반 배치** → `src/game/data/21-native-flora-database.js`, `src/game/world/22-streams-and-habitats.js`, `24-flora-population.js`
- **가방 확장·랜턴 구매** → `src/game/gameplay/12-tent-upgrades.js`
- **텐트에서 판매** → `src/game/gameplay/13-market.js`
- **밤·날씨·별똥별·반딧불** → `src/game/world/41-shared-day-clock.js`, `42-weather.js`, `src/game/graphics/17-world-and-night-sky.js`, `43-fireflies.js`
- **야생동물·멧돼지** → `src/game/world/46~48-wildlife-*.js`
- **다른 유저에게 보이는 캐릭터** → `src/game/network/38-multiplayer.js`
- **JSON 저장 / 코드 입력** → `src/game/save/51-profile-and-files.js`

**전체 파일 목록과 연결 흐름은 [`CODE_MAP.md`](./CODE_MAP.md)를 참고하세요.** `npm run build`에서 소스별 현재 줄 수와 파일 경로가 자동 갱신됩니다.

## 실행 설계: 기존 기능 보호

기존 단일 `<script>`는 서로의 변수와 함수를 바로 참조하는 약 4,500줄의 즉시 실행 함수(IIFE)입니다. 이를 성급하게 독립 ES 모듈로 전환하면 실제 작동하는 지형·네트워크·게임 루프가 끊길 수 있습니다. 따라서 이번 단계에서는 기능별 원본 코드 조각을 `src/game/`에 보관하고, `manifest.json` 순서로 *원본과 동일한 한 실행 스코프*에 결합합니다. 이는 정적 파일 서버나 GitHub Pages에서 실행 가능하며, npm 외부 패키지 / CDN 빌드 도구를 요구하지 않습니다.

- **소스코드**: `src/game/`에서만 수정하고 `dist/game.bundle.js`는 직접 편집하지 않습니다.
- **CSS**: 기능 파일이 `index.html`에서 개별 연결됩니다. CSS의 불변 순서를 유지합니다.
- **데이터**: 기존 JSON 세이브 구조, 아이템 키, 채집물 가격, 랜턴 단계 등은 이번 정리에서 변경하지 않았습니다.
- **배포**: `index.html`, `styles/`, `dist/game.bundle.js`를 동일한 폴더 구조로 업로드하면 됩니다. `src/`와 `scripts/`는 소스 및 개발용입니다.

### 확인 상태

`npm run check`는 JavaScript 문법, 구성 파일 누락, HTML ID 중복 및 JS→HTML ID 참조, CSS 괄호를 검사합니다. 코드 결합 당시 게임 JS 본문은 원본과 **바이트 단위로 동일**하도록 보존했습니다. 실제 멀티플레이 MQTT 접속·모든 모바일 기기에서의 3D 플레이까지 자동 검증하는 것은 별도 현장 테스트가 필요합니다.

### 사용 시 주의

- `src/game/` 파일은 ***독립 실행 가능한 ES 모듈이 아닌*** 빌드 입력 소스입니다. 다른 파일의 공유 변수에 의존합니다.
- 레이아웃을 확장할 때 CSS는 `styles/`에만 추가하세요. 인라인 스타일 6개를 외부 CSS로 옮겨 놓았습니다.
- 단일 JS 번들로 묶어도 브라우저 실제 코드 실행은 원본과 같으며, 신규 기능을 도입할 때는 이 코드 맵을 갱신해야 합니다.
