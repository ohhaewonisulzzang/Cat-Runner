// 메인 게임 엔진 클래스
class GameEngine {
    constructor() {
        // 캔버스 초기화
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 상태 관리자
        this.gameState = new GameStateManager();
        
        // 게임 객체들
        this.player = new Player(256, 620, this.gameState); // 화면 왼쪽 20%, 지면 위
        this.obstacleManager = new ObstacleManager(this.gameState);
        
        // 타이밍 관련
        this.lastTime = 0;
        this.accumulator = 0;
        this.targetFPS = 60;
        this.fixedTimeStep = 1000 / this.targetFPS;
        
        // 게임 루프 상태
        this.isRunning = false;
        
        // 배경 관련
        this.backgroundX = 0;
        this.groundX = 0;
        
        // 스코어 타이머
        this.scoreTimer = 0;
        this.scoreInterval = 100; // 0.1초마다 1점

        // 맵 전환 효과
        this.transitionAlpha = 0;

        // 디버그 모드
        this.debugMode = true; // 디버그 모드 자동 활성화

        // 테스트 모드
        this.testMode = false;
        this.invincible = false;

        // 상태 변경 콜백 등록
        this.setupStateCallbacks();
        
        // 초기화
        this.initialize();
    }
    
    // 초기화
    initialize() {
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 디버그 키 등록
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F12') {
                e.preventDefault();
                this.debugMode = !this.debugMode;
            }

            // 테스트 모드 토글 (` 키)
            if (e.code === 'Backquote') {
                e.preventDefault();
                this.testMode = !this.testMode;
                if (!this.testMode) {
                    this.invincible = false; // 테스트 모드 해제 시 무적 상태도 해제
                }
            }

            // 테스트 모드 기능들
            if (this.testMode) {
                // 숫자 1: 점수 100점 추가
                if (e.code === 'Digit1') {
                    this.gameState.updateScore(100);
                }

                // 숫자 2: 무적 모드 토글
                if (e.code === 'Digit2') {
                    this.invincible = !this.invincible;
                }

                // 숫자 3: 수분 게이지 10%로 설정
                if (e.code === 'Digit3') {
                    this.gameState.gameData.heatGauge = 10;
                    this.gameState.updateHeatGaugeDisplay();
                    console.log('수분 게이지를 10%로 설정했습니다.');
                }
            }
        });
        
        // 게임 루프 시작
        this.start();
    }
    
    // 상태 변경 콜백 설정
    setupStateCallbacks() {
        this.gameState.onStateChange('playing', () => {
            this.startGame();
        });

        this.gameState.onStateChange('paused', () => {
            // 게임 일시정지 시 처리
        });

        this.gameState.onStateChange('gameOver', () => {
            this.endGame();
        });

        this.gameState.onStateChange('menu', () => {
            this.resetGame();
        });

        // 맵 전환 콜백 등록
        this.gameState.onMapTransition(() => {
            this.startMapTransition();
        });

        // 더위 게임 오버 콜백 등록
        this.gameState.onHeatGameOver(() => {
            this.gameState.setState('gameOver');
        });
    }

    // 맵 전환 시작
    startMapTransition() {
        this.transitionAlpha = 0;
        const transitionInterval = setInterval(() => {
            this.transitionAlpha += 0.05;
            if (this.transitionAlpha >= 1) {
                clearInterval(transitionInterval);
                // 어두워진 후 다시 밝아지기
                setTimeout(() => {
                    const fadeInInterval = setInterval(() => {
                        this.transitionAlpha -= 0.05;
                        if (this.transitionAlpha <= 0) {
                            clearInterval(fadeInInterval);
                            this.transitionAlpha = 0;
                        }
                    }, 30);
                }, 200);
            }
        }, 30);
    }
    
    // 캔버스 크기 조정
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();
        
        // 16:9 비율 유지
        this.canvas.style.width = containerRect.width + 'px';
        this.canvas.style.height = containerRect.height + 'px';
        
        // 고해상도 디스플레이 지원
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 1280 * dpr;
        this.canvas.height = 720 * dpr;
        
        this.ctx.scale(dpr, dpr);
    }
    
    // 게임 시작
    start() {
        this.isRunning = true;
        this.gameLoop(0);
    }
    
    // 게임 중단
    stop() {
        this.isRunning = false;
    }
    
    // 게임 시작 (플레이 상태로 전환 시)
    startGame() {
        // 점수 타이머 리셋
        this.scoreTimer = 0;
    }
    
    // 게임 종료
    endGame() {
        // 게임 통계 저장
        this.gameState.saveGameStats();
    }
    
    // 게임 리셋
    resetGame() {
        console.log('게임 리셋 중...');
        this.player.reset();
        this.obstacleManager.reset();
        this.backgroundX = 0;
        this.groundX = 0;
        this.scoreTimer = 0;
        this.gameState.resetGame();
        console.log('게임 리셋 완료');
    }
    
    // 메인 게임 루프
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 델타 타임 계산
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 고정 타임스텝 업데이트
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }
        
        // 렌더링
        this.render();
        
        // 다음 프레임 요청
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 업데이트
    update(deltaTime) {
        if (this.gameState.isState('playing')) {
            // 게임 시간 업데이트 (난이도 자동 조정)
            this.gameState.updateGameTime(deltaTime);
            
            // 플레이어 업데이트
            this.player.update(deltaTime);
            
            // 장애물 관리자 업데이트
            this.obstacleManager.update(deltaTime);
            
            // 충돌 검사 (무적 모드가 아닐 때만)
            if (!this.invincible && this.obstacleManager.checkCollisions(this.player)) {
                this.gameState.setState('gameOver');
                return;
            }

            // 물 아이템 획득 검사
            this.obstacleManager.checkWaterCollection(this.player);

            // 통과한 장애물 확인
            this.obstacleManager.checkPassedObstacles(this.player.x);
            
            // 배경 스크롤 업데이트
            this.updateBackground();
            
            // 시간 기반 점수 업데이트
            this.updateTimeScore(deltaTime);
        }
    }
    
    // 배경 스크롤 업데이트
    updateBackground() {
        const gameSpeed = this.gameState.gameData.gameSpeed;
        
        // 배경 스크롤 (느린 속도)
        this.backgroundX -= gameSpeed * 0.3;
        if (this.backgroundX <= -1280) {
            this.backgroundX = 0;
        }
        
        // 지면 스크롤 (게임 속도와 동일)
        this.groundX -= gameSpeed;
        if (this.groundX <= -1280) {
            this.groundX = 0;
        }
    }
    
    // 시간 기반 점수 업데이트
    updateTimeScore(deltaTime) {
        this.scoreTimer += deltaTime;
        
        if (this.scoreTimer >= this.scoreInterval) {
            this.gameState.updateScore(1);
            this.scoreTimer = 0;
        }
    }
    
    // 렌더링
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, 1280, 720);
        
        // 배경 렌더링
        this.renderBackground();
        
        if (this.gameState.isState('playing') || this.gameState.isState('paused')) {
            // 게임 객체 렌더링
            this.obstacleManager.render(this.ctx);
            this.player.render(this.ctx);
        }
        
        // 디버그 정보 렌더링
        if (this.debugMode) {
            this.renderDebugInfo();
        }

        // 테스트 모드 라벨 렌더링
        if (this.testMode) {
            this.renderTestModeLabel();
        }
    }
    
    // 배경 렌더링
    renderBackground() {
        const currentMap = this.gameState.gameData.currentMap;

        if (currentMap === 'lava') {
            this.renderLavaBackground();
        } else if (currentMap === 'ice') {
            this.renderIceBackground();
        } else {
            this.renderNormalBackground();
        }

        // 전환 효과 오버레이
        if (this.transitionAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            this.ctx.fillRect(0, 0, 1280, 720);
        }
    }

    // 일반 배경 렌더링
    renderNormalBackground() {
        // 하늘 그라데이션
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 720);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#87CEEB');
        gradient.addColorStop(0.6, '#90EE90');
        gradient.addColorStop(1, '#8FBC8F');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 1280, 720);

        // 구름 데코레이션
        this.renderClouds();

        // 나무 데코레이션
        this.renderTrees();

        // 지면 패턴
        this.renderGround();

        // 지평선
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 670);
        this.ctx.lineTo(1280, 670);
        this.ctx.stroke();
    }

    // 용암 배경 렌더링
    renderLavaBackground() {
        // 용암 하늘 그라데이션
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 720);
        gradient.addColorStop(0, '#1a0000');
        gradient.addColorStop(0.6, '#4a0000');
        gradient.addColorStop(0.6, '#8B0000');
        gradient.addColorStop(1, '#FF4500');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 1280, 720);

        // 화산 데코레이션
        this.renderVolcanoes();

        // 용암 방울 데코레이션
        this.renderLavaBubbles();

        // 용암 지면
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(0, 670, 1280, 50);

        // 용암 효과 (움직이는 용암)
        this.ctx.fillStyle = '#FF4500';
        for (let i = 0; i < 1280; i += 30) {
            const lavaX = (i + this.groundX * 2) % 1280;
            if (lavaX > -30) {
                this.ctx.fillRect(lavaX, 670 + Math.sin((lavaX + this.groundX) * 0.1) * 5, 25, 10);
            }
        }

        // 용암 지평선
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 670);
        this.ctx.lineTo(1280, 670);
        this.ctx.stroke();
    }

    // 빙하 배경 렌더링
    renderIceBackground() {
        // 빙하 하늘 그라데이션
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 720);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(0.7, '#0f3460');
        gradient.addColorStop(1, '#53a8b6');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 1280, 720);

        // 눈 내리는 효과
        this.renderSnowfall();

        // 빙산 데코레이션
        this.renderIcebergs();

        // 오로라 효과
        this.renderAurora();

        // 얼음 지면
        this.ctx.fillStyle = '#b8e4f0';
        this.ctx.fillRect(0, 670, 1280, 50);

        // 얼음 반짝이는 효과
        this.ctx.fillStyle = '#d4f1f9';
        for (let i = 0; i < 1280; i += 40) {
            const iceX = (i + this.groundX) % 1280;
            if (iceX > -40) {
                const sparkleY = 670 + Math.sin((iceX + this.groundX) * 0.05) * 3;
                this.ctx.fillRect(iceX, sparkleY, 8, 3);
                this.ctx.fillRect(iceX + 15, sparkleY + 5, 5, 2);
            }
        }

        // 빙하 지평선
        this.ctx.strokeStyle = '#89cff0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 670);
        this.ctx.lineTo(1280, 670);
        this.ctx.stroke();
    }
    
    // 구름 렌더링
    renderClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // 구름들 (배경 스크롤에 따라 이동)
        const cloudPositions = [
            { x: 200 + this.backgroundX, y: 100 },
            { x: 500 + this.backgroundX, y: 150 },
            { x: 800 + this.backgroundX, y: 80 },
            { x: 1100 + this.backgroundX, y: 120 },
            // 반복을 위한 추가 구름들
            { x: 1400 + this.backgroundX, y: 100 },
            { x: 1700 + this.backgroundX, y: 150 }
        ];
        
        cloudPositions.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, 60);
        });
    }
    
    // 개별 구름 그리기
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 지면 렌더링
    renderGround() {
        // 지면 기본 색상
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 670, 1280, 50);

        // 지면 패턴 (풀) - 연속적으로 렌더링
        this.ctx.fillStyle = '#32CD32';
        const patternWidth = 20;
        const startX = Math.floor(this.groundX / patternWidth) * patternWidth;

        for (let i = startX; i < startX + 1280 + patternWidth; i += patternWidth) {
            const grassX = i - this.groundX;
            if (grassX >= -patternWidth && grassX <= 1280) {
                // 풀 그리기
                this.ctx.fillRect(grassX, 670, 2, 8);
                this.ctx.fillRect(grassX + 5, 670, 2, 6);
                this.ctx.fillRect(grassX + 10, 670, 2, 10);
                this.ctx.fillRect(grassX + 15, 670, 2, 7);
            }
        }
    }

    // 나무 데코레이션 (일반 맵)
    renderTrees() {
        const treePositions = [
            { x: 150 + this.backgroundX * 0.5, y: 620 },
            { x: 400 + this.backgroundX * 0.5, y: 610 },
            { x: 700 + this.backgroundX * 0.5, y: 625 },
            { x: 950 + this.backgroundX * 0.5, y: 615 },
            { x: 1350 + this.backgroundX * 0.5, y: 620 }
        ];

        treePositions.forEach(tree => {
            // 나무 줄기
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(tree.x - 5, tree.y, 10, 50);

            // 나무 잎 (삼각형)
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.moveTo(tree.x, tree.y - 30);
            this.ctx.lineTo(tree.x - 20, tree.y);
            this.ctx.lineTo(tree.x + 20, tree.y);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(tree.x, tree.y - 20);
            this.ctx.lineTo(tree.x - 15, tree.y + 5);
            this.ctx.lineTo(tree.x + 15, tree.y + 5);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    // 화산 데코레이션 (용암 맵)
    renderVolcanoes() {
        const volcanoPositions = [
            { x: 250 + this.backgroundX * 0.4, y: 670 },
            { x: 650 + this.backgroundX * 0.4, y: 670 },
            { x: 1050 + this.backgroundX * 0.4, y: 670 },
            { x: 1450 + this.backgroundX * 0.4, y: 670 }
        ];

        volcanoPositions.forEach(volcano => {
            // 화산 몸체
            this.ctx.fillStyle = '#4a0000';
            this.ctx.beginPath();
            this.ctx.moveTo(volcano.x, volcano.y - 80);
            this.ctx.lineTo(volcano.x - 50, volcano.y);
            this.ctx.lineTo(volcano.x + 50, volcano.y);
            this.ctx.closePath();
            this.ctx.fill();

            // 화산 분화구
            this.ctx.fillStyle = '#8B0000';
            this.ctx.beginPath();
            this.ctx.moveTo(volcano.x - 15, volcano.y - 80);
            this.ctx.lineTo(volcano.x - 20, volcano.y - 70);
            this.ctx.lineTo(volcano.x + 20, volcano.y - 70);
            this.ctx.lineTo(volcano.x + 15, volcano.y - 80);
            this.ctx.closePath();
            this.ctx.fill();

            // 용암 빛
            this.ctx.fillStyle = '#FF4500';
            this.ctx.fillRect(volcano.x - 10, volcano.y - 75, 20, 5);
        });
    }

    // 용암 방울 데코레이션 (용암 맵)
    renderLavaBubbles() {
        const time = Date.now() * 0.001;
        const bubblePositions = [
            { x: 100, y: 300, speed: 1 },
            { x: 300, y: 400, speed: 1.5 },
            { x: 600, y: 250, speed: 0.8 },
            { x: 900, y: 350, speed: 1.2 },
            { x: 1100, y: 280, speed: 1.1 }
        ];

        bubblePositions.forEach(bubble => {
            const offsetY = Math.sin(time * bubble.speed) * 20;

            this.ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y + offsetY, 8, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 140, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y + offsetY, 12, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 눈 내리는 효과 (빙하 맵)
    renderSnowfall() {
        const time = Date.now() * 0.001;
        const snowflakes = [];

        for (let i = 0; i < 50; i++) {
            const x = (i * 30 + time * 20) % 1280;
            const y = ((i * 50 + time * 30) % 670);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 빙산 데코레이션 (빙하 맵)
    renderIcebergs() {
        const icebergPositions = [
            { x: 200 + this.backgroundX * 0.5, y: 670 },
            { x: 500 + this.backgroundX * 0.5, y: 670 },
            { x: 800 + this.backgroundX * 0.5, y: 670 },
            { x: 1100 + this.backgroundX * 0.5, y: 670 },
            { x: 1400 + this.backgroundX * 0.5, y: 670 }
        ];

        icebergPositions.forEach(iceberg => {
            // 빙산 몸체
            this.ctx.fillStyle = '#b8e4f0';
            this.ctx.beginPath();
            this.ctx.moveTo(iceberg.x, iceberg.y - 60);
            this.ctx.lineTo(iceberg.x - 40, iceberg.y);
            this.ctx.lineTo(iceberg.x + 40, iceberg.y);
            this.ctx.closePath();
            this.ctx.fill();

            // 빙산 하이라이트
            this.ctx.fillStyle = '#d4f1f9';
            this.ctx.beginPath();
            this.ctx.moveTo(iceberg.x, iceberg.y - 60);
            this.ctx.lineTo(iceberg.x - 20, iceberg.y - 30);
            this.ctx.lineTo(iceberg.x, iceberg.y);
            this.ctx.closePath();
            this.ctx.fill();

            // 빙산 그림자
            this.ctx.fillStyle = '#89cff0';
            this.ctx.beginPath();
            this.ctx.moveTo(iceberg.x, iceberg.y);
            this.ctx.lineTo(iceberg.x + 20, iceberg.y - 30);
            this.ctx.lineTo(iceberg.x + 40, iceberg.y);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    // 오로라 효과 (빙하 맵)
    renderAurora() {
        const time = Date.now() * 0.0005;

        // 오로라 레이어 1
        const gradient1 = this.ctx.createLinearGradient(0, 100, 1280, 200);
        gradient1.addColorStop(0, 'rgba(0, 255, 150, 0)');
        gradient1.addColorStop(0.3 + Math.sin(time) * 0.1, 'rgba(0, 255, 150, 0.15)');
        gradient1.addColorStop(0.7 + Math.cos(time * 1.3) * 0.1, 'rgba(100, 200, 255, 0.15)');
        gradient1.addColorStop(1, 'rgba(100, 200, 255, 0)');

        this.ctx.fillStyle = gradient1;
        this.ctx.fillRect(0, 100, 1280, 150);

        // 오로라 레이어 2
        const gradient2 = this.ctx.createLinearGradient(0, 150, 1280, 300);
        gradient2.addColorStop(0, 'rgba(150, 0, 255, 0)');
        gradient2.addColorStop(0.4 + Math.cos(time * 0.8) * 0.1, 'rgba(150, 0, 255, 0.1)');
        gradient2.addColorStop(0.8 + Math.sin(time * 1.5) * 0.1, 'rgba(200, 100, 255, 0.1)');
        gradient2.addColorStop(1, 'rgba(200, 100, 255, 0)');

        this.ctx.fillStyle = gradient2;
        this.ctx.fillRect(0, 150, 1280, 200);
    }
    
    // 디버그 정보 렌더링
    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 200);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';
        
        const obsDebug = this.obstacleManager.getDebugInfo();
        const debugInfo = [
            `FPS: ${Math.round(1000 / (this.lastTime - (this.lastTime - 16)))}`,
            `State: ${this.gameState.currentState}`,
            `Score: ${this.gameState.gameData.score}`,
            `Speed: ${this.gameState.gameData.gameSpeed.toFixed(1)}`,
            `Difficulty: ${this.gameState.gameData.difficultyLevel}`,
            `Game Time: ${this.gameState.gameData.gameTime.toFixed(1)}s`,
            '',
            'Player:',
            `  ${this.player.getDebugInfo().position}`,
            `  Velocity: ${this.player.getDebugInfo().velocity}`,
            `  Grounded: ${this.player.getDebugInfo().grounded}`,
            '',
            'Obstacles:',
            `  Count: ${obsDebug.obstacleCount}`,
            `  Active: ${obsDebug.activeObstacles}`,
            `  Timer: ${obsDebug.spawnTimer}ms`,
            `  Interval: ${obsDebug.spawnInterval}ms`
        ];
        
        debugInfo.forEach((line, index) => {
            this.ctx.fillText(line, 20, 30 + index * 16);
        });
    }
    
    // 테스트 모드 라벨 렌더링
    renderTestModeLabel() {
        // 배경 박스
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        this.ctx.fillRect(1080, 10, 190, 80);

        // 테두리
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(1080, 10, 190, 80);

        // 텍스트
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('TEST MODE', 1100, 35);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('1: +100 Score', 1095, 58);
        this.ctx.fillText(`2: Invincible ${this.invincible ? 'ON' : 'OFF'}`, 1095, 78);
    }

    // 게임 통계 반환
    getGameStats() {
        return {
            currentScore: this.gameState.gameData.score,
            highScore: this.gameState.gameData.highScore,
            obstaclesPassed: this.gameState.gameData.obstaclesPassed,
            difficulty: this.gameState.gameData.difficultyLevel,
            gameSpeed: this.gameState.gameData.gameSpeed
        };
    }
}