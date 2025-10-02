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
        
        // 디버그 모드
        this.debugMode = false;
        
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
            // 플레이어 업데이트
            this.player.update(deltaTime);
            
            // 장애물 관리자 업데이트
            this.obstacleManager.update(deltaTime);
            
            // 충돌 검사
            if (this.obstacleManager.checkCollisions(this.player)) {
                this.gameState.setState('gameOver');
                return;
            }
            
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
    }
    
    // 배경 렌더링
    renderBackground() {
        // 하늘 그라데이션
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 720);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#87CEEB');
        gradient.addColorStop(0.6, '#90EE90');
        gradient.addColorStop(1, '#8FBC8F');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 1280, 720);
        
        // 구름 (선택사항)
        this.renderClouds();
        
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
        
        // 지면 패턴 (풀)
        this.ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 1280; i += 20) {
            const grassX = (i + this.groundX) % 1280;
            if (grassX > -20) {
                // 풀 그리기
                this.ctx.fillRect(grassX, 670, 2, 8);
                this.ctx.fillRect(grassX + 5, 670, 2, 6);
                this.ctx.fillRect(grassX + 10, 670, 2, 10);
                this.ctx.fillRect(grassX + 15, 670, 2, 7);
            }
        }
    }
    
    // 디버그 정보 렌더링
    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 200);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';
        
        const debugInfo = [
            `FPS: ${Math.round(1000 / (this.lastTime - (this.lastTime - 16)))}`,
            `State: ${this.gameState.currentState}`,
            `Score: ${this.gameState.gameData.score}`,
            `Speed: ${this.gameState.gameData.gameSpeed}`,
            `Difficulty: ${this.gameState.gameData.difficultyLevel}`,
            '',
            'Player:',
            `  ${this.player.getDebugInfo().position}`,
            `  Velocity: ${this.player.getDebugInfo().velocity}`,
            `  Grounded: ${this.player.getDebugInfo().grounded}`,
            '',
            'Obstacles:',
            `  Count: ${this.obstacleManager.getDebugInfo().obstacleCount}`,
            `  Active: ${this.obstacleManager.getDebugInfo().activeObstacles}`
        ];
        
        debugInfo.forEach((line, index) => {
            this.ctx.fillText(line, 20, 30 + index * 16);
        });
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