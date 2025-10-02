# Cat Runner 🐱‍💻

Chrome 공룡게임에서 영감을 받은 무한 횡스크롤 러너 게임입니다.

## 🎮 게임 소개

플레이어는 고양이 캐릭터를 조작하여 끝없이 이어지는 장애물들을 피하며 최대한 오래 생존해야 합니다. 시간이 지날수록 게임 속도가 빨라지고 더 많은 장애물이 등장합니다.

### 주요 특징
- **3단계 점프 시스템**: 스페이스바를 누르는 시간에 따라 점프 높이 조절
- **6가지 장애물**: 지면/공중 각각 소/중/대 크기
- **적응형 난이도**: 점수에 따른 자동 난이도 조절
- **반응형 디자인**: 다양한 화면 크기 지원
- **로컬 저장**: 최고 점수 및 설정 저장

## 🕹️ 조작법

- **스페이스바**: 점프 (누르는 시간에 따라 높이 조절)
  - 짧게 누르기 (0.1초 미만): 낮은 점프
  - 중간 누르기 (0.1~0.3초): 중간 점프
  - 길게 누르기 (0.3초 이상): 높은 점프
- **ESC**: 일시정지/재개
- **터치**: 모바일에서 점프 (터치 시간으로 높이 조절)

## 🚀 실행 방법

1. 저장소 클론
```bash
git clone https://github.com/your-username/cat-runner.git
cd cat-runner
```

2. 웹 서버 실행 (선택사항)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server 설치 후)
npm install -g http-server
http-server
```

3. 브라우저에서 `index.html` 열기 또는 `http://localhost:8000` 접속

## 📁 프로젝트 구조

```
cat-runner/
├── index.html              # 메인 HTML 파일
├── src/
│   ├── css/
│   │   └── style.css       # 스타일시트
│   ├── js/
│   │   ├── gameState.js    # 게임 상태 관리
│   │   ├── player.js       # 플레이어 캐릭터
│   │   ├── obstacle.js     # 장애물 시스템
│   │   ├── gameEngine.js   # 메인 게임 엔진
│   │   └── main.js         # 진입점
│   └── assets/
│       ├── images/         # 이미지 파일들 (추후 추가)
│       └── sounds/         # 사운드 파일들 (추후 추가)
├── docs/                   # 개발 문서
└── README.md
```

## 🎯 게임 시스템

### 점수 시스템
- **시간 점수**: 0.1초마다 1점
- **장애물 통과**: 장애물 1개당 10-20점 (크기별 차등)
- **콤보 보너스**: 연속 3회 장애물 회피시 50점

### 난이도 단계
| 점수 구간 | 게임 속도 | 장애물 간격 | 큰 장애물 확률 |
|-----------|-----------|-------------|----------------|
| 0~200 | 5px/frame | 2000~2500px | 10% |
| 200~500 | 6px/frame | 1600~2200px | 25% |
| 500~1000 | 7px/frame | 1400~2000px | 40% |
| 1000+ | 8px/frame | 1200~1800px | 55% |

### 장애물 종류
- **지면 장애물**: 점프로 회피
- **공중 장애물**: 몸을 낮춰 회피
- **크기**: 소(30px), 중(50px), 대(70px)

## 🔧 개발 정보

### 기술 스택
- **언어**: Vanilla JavaScript (ES6+)
- **렌더링**: Canvas API (2D Context)
- **스타일**: CSS3
- **타겟 성능**: 60 FPS

### 개발자 도구
- **F12**: 디버그 모드 토글
- **브라우저 콘솔**: 다양한 디버그 명령어 사용 가능

#### 콘솔 명령어
```javascript
// 디버그 모드 활성화
gameEngine.debugMode = true;

// 점수 추가
gameEngine.gameState.updateScore(1000);

// 게임 속도 변경
gameEngine.gameState.gameData.gameSpeed = 10;

// 게임 리셋
gameEngine.resetGame();

// 게임 통계 확인
gameEngine.getGameStats();
```

## 🎨 커스터마이징

### 게임 설정 변경
`src/js/gameState.js`에서 다음 값들을 수정할 수 있습니다:
- 난이도 곡선
- 점수 배율
- 장애물 생성 간격

### 스타일 변경
`src/css/style.css`에서 색상, 애니메이션, 레이아웃을 수정할 수 있습니다.

## 📱 브라우저 호환성

- **권장**: Chrome, Firefox, Safari (최신 버전)
- **필수 기능**: Canvas 2D, requestAnimationFrame, localStorage
- **모바일**: iOS Safari, Chrome Mobile

## 🚧 향후 계획

### Phase 2: 게임성 향상
- [ ] 스프라이트 애니메이션
- [ ] 사운드 효과
- [ ] 파티클 효과
- [ ] 파워업 시스템

### Phase 3: 폴리싱
- [ ] 캐릭터 스킨
- [ ] 배경 테마
- [ ] 업적 시스템
- [ ] 리더보드

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참고하세요.

## 👥 개발팀

**팀 D**
- 최서준
- 박시완  
- 박영진

---

**Cat Runner** - 심플하지만 중독성 있는 러너 게임을 즐겨보세요! 🎮