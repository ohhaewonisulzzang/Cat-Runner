# Cat Runner 🐱 - JavaScript 리펙토링 문서

## 목차
1. [리펙토링 개요](#리펙토링-개요)
2. [폴더 구조](#폴더-구조)
3. [주요 변경사항](#주요-변경사항)
4. [파일별 설명](#파일별-설명)
5. [마이그레이션 가이드](#마이그레이션-가이드)

---

## 리펙토링 개요

### 목표
- **모듈화**: 코드를 기능별로 분리하여 재사용성 향상
- **유지보수성 향상**: 각 파일이 단일 책임을 갖도록 구조화
- **가독성**: 명확한 폴더 구조로 코드 이해도 증진
- **확장성**: 새로운 기능 추가가 용이한 구조

### 적용된 기술
- ES6 Modules (import/export)
- Async/Await (이미지 로딩)
- Class 기반 OOP
- 의존성 주입 패턴

---

## 폴더 구조

### 변경 전
```
src/js/
├── main.js
├── gameState.js
├── player.js
├── obstacle.js
└── gameEngine.js
```

### 변경 후
```
src/js/
├── config/                    # 설정 및 상수
│   └── constants.js           # 게임 상수, 키코드 정의, 이미지 경로
│
├── utils/                     # 유틸리티 함수
│   ├── collision.js           # 충돌 감지 로직
│   └── imageLoader.js         # 이미지 로딩 유틸
│
├── entities/                  # 게임 엔티티
│   ├── Player.js              # 플레이어 클래스
│   └── Obstacle.js            # 장애물 및 아이템 클래스
│
├── managers/                  # 게임 관리자
│   ├── StateManager.js        # 게임 상태 관리
│   └── ObstacleManager.js     # 장애물 생성 및 관리
│
├── renderers/                 # 렌더링 클래스
│   └── BackgroundRenderer.js  # 배경 렌더링 담당
│
├── systems/                   # 게임 시스템 (향후 확장용)
│
├── app.js                     # 애플리케이션 진입점
└── gameEngine.js              # 게임 루프 (메인 관리자)
```

---

## 주요 변경사항

### 1. ES6 모듈 시스템 적용

**변경 전:**
```javascript
// 전역 변수로 관리
class Player {
    constructor() { ... }
}
```

**변경 후:**
```javascript
// 모듈화 export/import
import { GAME_CONSTANTS } from '../config/constants.js';

export class Player {
    constructor(gameState) { ... }
}
```

### 2. 상수 파일 분리

**변경 전:**
```javascript
// 코드 내 하드코딩
this.width = 90;
this.gravity = 0.6;
if (score >= 1000) { ... }
```

**변경 후:**
```javascript
// constants.js에서 관리
export const GAME_CONSTANTS = {
    PLAYER: {
        WIDTH: 90,
        GRAVITY: 0.6
    },
    MAP_TRANSITIONS: {
        LAVA_THRESHOLD: 1000
    }
};

// 사용
this.width = GAME_CONSTANTS.PLAYER.WIDTH;
```

### 3. 렌더링 로직 분리

**변경 전:**
```javascript
class GameEngine {
    renderBackground() {
        // 1000줄 이상의 배경 렌더링 코드
    }
}
```

**변경 후:**
```javascript
// BackgroundRenderer.js
export class BackgroundRenderer {
    constructor(ctx) { ... }
    render(currentMap, score) { ... }
}

// GameEngine.js
this.backgroundRenderer = new BackgroundRenderer(this.ctx);
this.backgroundRenderer.render(currentMap, score);
```

### 4. 유틸리티 함수 분리

**변경 전:**
```javascript
// 각 클래스마다 충돌 감지 로직 중복
isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && ...
}
```

**변경 후:**
```javascript
// utils/collision.js
export class CollisionDetector {
    static checkAABB(rect1, rect2) { ... }
}

// 사용
import { CollisionDetector } from '../utils/collision.js';
CollisionDetector.checkAABB(playerBounds, obstacleBounds);
```

### 5. 이미지 로딩 개선

**변경 전:**
```javascript
// 콜백 기반
const img = new Image();
img.onload = () => { ... };
img.onerror = () => { ... };
```

**변경 후:**
```javascript
// Promise 기반 + async/await
import { ImageLoader } from '../utils/imageLoader.js';

const images = await ImageLoader.loadImages(paths);
```

---

## 파일별 설명

### config/constants.js
**역할**: 게임 전역 상수를 중앙에서 관리

**주요 내용**:
- 게임 설정 (캔버스 크기, FPS 등)
- 플레이어/장애물 설정
- 맵 전환 기준점
- 이미지 경로
- 키 코드
- 로컬 스토리지 키

**장점**:
- 한 곳에서 값 변경 가능
- 매직 넘버 제거
- 설정 파일 역할

### utils/collision.js
**역할**: 충돌 감지 로직 제공

**주요 메서드**:
- `checkAABB()`: AABB 충돌 감지
- `checkCircle()`: 원형 충돌 감지
- `pointInRect()`: 점-사각형 포함

**장점**:
- 로직 재사용
- 테스트 용이성
- 유지보수 간편

### utils/imageLoader.js
**역할**: 이미지 로딩 유틸 제공

**주요 메서드**:
- `loadImage()`: 단일 이미지 로드
- `loadImages()`: 다중 이미지 병렬 로드
- `loadImageSafe()`: 실패 시 null 반환
- `loadImageCached()`: 캐시 기능 로드

**장점**:
- Promise 기반으로 async/await 사용 가능
- 에러 처리 일관성
- 캐시 기능

### entities/Player.js
**역할**: 플레이어 객체와 행동

**주요 기능**:
- 이미지 및 위치 로드
- 물리엔진 관리
- 입력 처리 (점프/슬라이드)
- 애니메이션 관리

**개선점**:
- 상수 파일로 값 이동해 유지보수성 향상
- async/await로 이미지 로딩 개선
- 의존성 주입 (gameState)

### entities/Obstacle.js
**역할**: 장애물 및 물 아이템 엔티티

**주요 클래스**:
- `ObstacleImageLoader`: 이미지 로딩 관리
- `Obstacle`: 장애물 엔티티
- `WaterItem`: 물 아이템 엔티티

**개선점**:
- 이미지 로더 분리
- 상수 기반 설정
- 깔끔한 렌더링 로직분리

### managers/StateManager.js
**역할**: 게임 상태 관리

**주요 기능**:
- 게임 상태 전환 (시작, 플레이, 일시정지, 게임오버)
- 점수 및 난이도 관리
- UI 업데이트
- 로컬 스토리지 관리

**개선점**:
- 상수 파일 활용
- 콜백 패턴으로 의존성 최소화
- 맵 전환 콜백화

### managers/ObstacleManager.js
**역할**: 장애물 생성 및 관리

**주요 기능**:
- 장애물 생성
- 충돌 감지
- 물 아이템 관리
- 난이도 기반 생성 간격 조절

**개선점**:
- CollisionDetector 활용
- Obstacle 클래스 활용
- 상수 기반 설정

### renderers/BackgroundRenderer.js
**역할**: 배경 렌더링 담당

**주요 기능**:
- 배경 이미지 로딩
- 무한 배경 렌더링
- 페이드 효과
- 맵 전환 처리

**장점**:
- GameEngine에서 렌더링 로직 분리
- 단일 책임으로 유지보수성 향상
- 페이드인 애니메이션 관리

### gameEngine.js
**역할**: 게임 루프 (메인 관리자)

**주요 기능**:
- 게임 초기화
- 게임 루프(업데이트 및 렌더링 주기)
- 업데이트 및 렌더링 조율
- 입력 관리

**개선점**:
- 의존성 주입으로 메인 루프 단순화
- 렌더링 로직 외부화
- 상수 활용

### app.js
**역할**: 애플리케이션 진입점

**주요 기능**:
- DOMContentLoaded 이벤트 처리
- GameEngine 초기화
- 전역 접근
- 초기화 에러 처리 (옵션)

**장점**:
- 초기화 로직 분리
- 파일분리 용이성
- 에러핸들링 중앙화

---

## 마이그레이션 가이드

### HTML 수정사항

**변경 전:**
```html
<script src="src/js/gameState.js"></script>
<script src="src/js/player.js"></script>
<script src="src/js/obstacle.js"></script>
<script src="src/js/gameEngine.js"></script>
<script src="src/js/main.js"></script>
```

**변경 후:**
```html
<script type="module" src="src/js/app.js"></script>
```

### 브라우저 호환성
- ES6 Modules 지원 필요 (모던 브라우저 권장)
- Chrome 61+, Firefox 60+, Safari 11+, Edge 16+

### 로컬 서버 필요 여부
ES6 모듈은 `file://` 프로토콜에서 작동하지 않습니다.

**로컬로 로컬 서버 실행 방법:**
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VS Code Live Server 익스텐션 사용
```

---

## 리펙토링 효과

### 코드 개선 사항
- ✅ 코드 중복 제거 및 관리성 향상
- ✅ 각각 파일의 책임 명확화로 유지보수성 향상
- ✅ 단위 테스트 용이성 증가 (각 모듈 독립적으로 테스트 가능)
- ✅ 의존성 주입으로 테스트 용이성 및 재사용성 향상

### 향후 개선 사항
- ✅ 각 모듈 중복 제거
- ✅ 상수 파일로 값 관리 용이
- ✅ 파일 분리로 새로운 기능 추가 용이
- ✅ 유지보수성 및 확장성 크게 개선

### 다음 단계
- 📝 테스트 코드 작성
- 📝 에러 시스템 구축
- 📝 파티클 효과 추가
- 📝 사운드 시스템통합

---

## 향후 확장 가능성

### 추가 가능한 시스템
```
src/js/systems/
├── AudioSystem.js         # 사운드 관리
├── ParticleSystem.js      # 파티클 효과
├── AchievementSystem.js   # 업적 시스템
└── PowerUpSystem.js       # 파워업 시스템
```

### 추가 가능한 렌더러
```
src/js/renderers/
├── UIRenderer.js          # UI 렌더링
├── ParticleRenderer.js    # 파티클 렌더링
└── EffectRenderer.js      # 시각 효과 렌더링
```

### 추가 가능한 유틸리티
```
src/js/utils/
├── storage.js             # 로컬 스토리지 유틸
├── animation.js           # 애니메이션 유틸
├── input.js               # 입력 관리자
└── math.js                # 수학 유틸리티
```

---

## 주의사항

### 일반사항
1. **ES6 모듈은 CORS 정책 적용**: 로컬 서버 필요
2. **import 경로에 파일 확장자 필수**: `./`, `../` 사용
3. **파일 유형의 정확한 이름**: `.js` 확장자 필수

### 디버그 도구
- 브라우저 개발자 도구의 Sources 탭에서 모듈 구조 확인 가능
- `console.log` 관리 및 `debugger` 문 활용
- `window.gameEngine`으로 전역 접근 가능 (디버깅용)

### 초기 로딩속도
- 초기(캐시) 전: 디버깅 모드 권장
- F12 키: 테스트 모드 권장
- 개발자 도구 콘솔에서 `gameEngine.getGameStats()` 호출

---

## 결론

이번 리펙토링을 통해 Cat Runner 프로젝트의 JavaScript 코드를 **모듈화**하고 **구조화**했습니다.

### 주요 성과
- 명확한 코드 모듈화로 관리성 향상
- 유지보수성 향상 및 단일 책임 원칙 적용
- 명확한 유지보수 및 구조화로 향후 기능 확장 용이
- 유지보수 용이성 향상 및 관리 최적화

### 다음 단계
1. 📝 테스트 코드 작성
2. 🎨 에러 시스템 구축
3. ✨ 파티클 효과 추가
4. 🔊 사운드시스템통합

---

**작성일**: 2025-01-15
**버전**: 1.0.0
**작성자**: Claude Code Assistant
