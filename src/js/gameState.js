// 게임 상태 관리 시스템
class GameStateManager {
    constructor() {
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            GAME_OVER: 'gameOver',
            SETTINGS: 'settings'
        };
        
        this.currentState = this.states.MENU;
        this.previousState = null;
        
        // 게임 데이터
        this.gameData = {
            score: 0,
            highScore: this.loadHighScore(),
            obstaclesPassed: 0,
            gameSpeed: 6, // 적당한 시작 속도
            difficultyLevel: 1,
            gameTime: 0, // 게임 플레이 시간 (초)
            soundEnabled: this.loadSetting('soundEnabled', true),
            sfxEnabled: this.loadSetting('sfxEnabled', true),
            currentMap: 'normal', // normal, lava, ice
            mapTransitioning: false, // 맵 전환 중인지
            heatGauge: 100, // 더위 게이지 (0-100)
            lastHeatUpdate: Date.now() // 마지막 게이지 감소 시간
        };
        
        // 상태 변경 콜백들
        this.stateChangeCallbacks = {};
        
        this.initializeUI();
    }
    
    // 상태 변경
    setState(newState) {
        if (this.currentState === newState) return;

        this.previousState = this.currentState;
        this.currentState = newState;

        this.updateUI();

        // 게임 시작 시 맵 클래스 업데이트
        if (newState === 'playing') {
            this.updateMapClass();
        }

        // 상태 변경 콜백 실행
        if (this.stateChangeCallbacks[newState]) {
            this.stateChangeCallbacks[newState]();
        }

        console.log(`게임 상태 변경: ${this.previousState} → ${this.currentState}`);
    }
    
    // 상태 변경 콜백 등록
    onStateChange(state, callback) {
        this.stateChangeCallbacks[state] = callback;
    }
    
    // 현재 상태 확인
    isState(state) {
        return this.currentState === state;
    }
    
    // 게임 데이터 업데이트
    updateScore(points) {
        const prevScore = this.gameData.score;
        this.gameData.score += points;
        this.updateScoreDisplay();

        // 1000점 돌파 시 용암 맵으로 전환
        if (prevScore < 1000 && this.gameData.score >= 1000 && this.gameData.currentMap === 'normal') {
            this.triggerMapTransition('lava');
        }

        // 2000점 돌파 시 빙하 맵으로 전환
        if (prevScore < 2000 && this.gameData.score >= 2000 && this.gameData.currentMap === 'lava') {
            this.triggerMapTransition('ice');
        }

        // 최고 점수 확인 및 업데이트
        if (this.gameData.score > this.gameData.highScore) {
            this.gameData.highScore = this.gameData.score;
            this.saveHighScore();
            this.showNewRecord();
        }

        // 난이도 조정
        this.updateDifficulty();
    }

    // 맵 전환 트리거
    triggerMapTransition(newMap) {
        this.gameData.mapTransitioning = true;

        // 화면 전환 콜백 실행 (gameEngine에서 처리)
        if (this.mapTransitionCallback) {
            this.mapTransitionCallback();
        }

        setTimeout(() => {
            this.gameData.currentMap = newMap;
            this.gameData.mapTransitioning = false;

            // 맵에 따라 body 클래스 업데이트
            this.updateMapClass();
        }, 1000); // 1초 후 새 맵으로 전환
    }

    // 맵 클래스 업데이트
    updateMapClass() {
        // 기존 맵 클래스 제거
        document.body.classList.remove('normal-map', 'lava-map', 'ice-map');

        // 현재 맵 클래스 추가
        if (this.gameData.currentMap === 'lava') {
            document.body.classList.add('lava-map');
        } else if (this.gameData.currentMap === 'ice') {
            document.body.classList.add('ice-map');
        } else {
            document.body.classList.add('normal-map');
        }
    }

    // 맵 전환 콜백 등록
    onMapTransition(callback) {
        this.mapTransitionCallback = callback;
    }
    
    // 장애물 통과 수 증가
    incrementObstacles() {
        this.gameData.obstaclesPassed++;
    }
    
    // 난이도 업데이트 (점진적 증가 시스템 - 균형있게)
    updateDifficulty() {
        const score = this.gameData.score;
        const gameTime = this.gameData.gameTime;

        // 시간 기반 레벨 증가 (30초마다 레벨 +1)
        const timeLevelBonus = Math.floor(gameTime / 30);

        // 점수 기반 추가 레벨
        let scoreLevel = 0;
        if (score >= 3000) {
            scoreLevel = 4;
        } else if (score >= 2000) {
            scoreLevel = 3;
        } else if (score >= 1000) {
            scoreLevel = 2;
        } else if (score >= 500) {
            scoreLevel = 1;
        }

        // 최종 난이도 레벨 (최대 10)
        this.gameData.difficultyLevel = Math.min(1 + timeLevelBonus + scoreLevel, 10);

        // 속도 점진적 증가 (기본 6에서 시작, 적절하게 증가)
        const baseSpeed = 6;
        const timeSpeedBonus = Math.floor(gameTime / 15) * 0.5; // 15초마다 0.5 증가
        const scoreSpeedBonus = scoreLevel * 0.8;

        this.gameData.gameSpeed = Math.min(baseSpeed + timeSpeedBonus + scoreSpeedBonus, 20); // 최대 속도 20
    }
    
    // 게임 시간 업데이트
    updateGameTime(deltaTime) {
        if (this.isState('playing')) {
            this.gameData.gameTime += deltaTime / 1000; // 밀리초를 초로 변환
            this.updateDifficulty(); // 시간이 업데이트될 때마다 난이도 재계산
            this.updateHeatGauge(); // 더위 게이지 업데이트
        }
    }

    // 더위 게이지 업데이트
    updateHeatGauge() {
        // 용암 맵에서만 작동
        if (this.gameData.currentMap !== 'lava') {
            return;
        }

        const now = Date.now();
        const timePassed = (now - this.gameData.lastHeatUpdate) / 1000; // 초 단위

        // 초당 2.5% 감소 (100% → 0%까지 40초)
        if (timePassed >= 0.4) { // 0.4초마다 1% 감소
            this.gameData.heatGauge = Math.max(0, this.gameData.heatGauge - 1);
            this.gameData.lastHeatUpdate = now;

            // 게이지 UI 업데이트
            this.updateHeatGaugeDisplay();

            // 게이지가 0이 되면 게임 오버
            if (this.gameData.heatGauge <= 0) {
                this.triggerHeatGameOver();
            }
        }
    }

    // 물 아이템 획득 시 게이지 회복
    recoverHeatGauge() {
        this.gameData.heatGauge = Math.min(100, this.gameData.heatGauge + 25);
        this.updateHeatGaugeDisplay();
    }

    // 더위 게이지 UI 업데이트
    updateHeatGaugeDisplay() {
        const heatBar = document.getElementById('heatGaugeBar');
        const heatValue = document.getElementById('heatValue');

        if (heatBar && heatValue) {
            heatBar.style.width = this.gameData.heatGauge + '%';
            heatValue.textContent = Math.floor(this.gameData.heatGauge) + '%';

            // 게이지 클래스 제거
            heatBar.classList.remove('warning', 'critical');

            // 게이지 색상 변경 및 깜빡임 효과
            if (this.gameData.heatGauge <= 30) {
                heatBar.style.background = '#ff4444';
                heatBar.classList.add('critical'); // 빠른 깜빡임
            } else if (this.gameData.heatGauge <= 50) {
                heatBar.style.background = 'linear-gradient(90deg, #ff6b35 0%, #ff4444 100%)';
                heatBar.classList.add('warning'); // 느린 깜빡임
            } else {
                heatBar.style.background = 'linear-gradient(90deg, #ffa500 0%, #ff6b35 100%)';
            }
        }
    }

    // 더위로 인한 게임 오버
    triggerHeatGameOver() {
        if (this.heatGameOverCallback) {
            this.heatGameOverCallback();
        }
    }

    // 더위 게임 오버 콜백 등록
    onHeatGameOver(callback) {
        this.heatGameOverCallback = callback;
    }
    
    // 게임 리셋
    resetGame() {
        this.gameData.score = 0;
        this.gameData.obstaclesPassed = 0;
        this.gameData.gameSpeed = 6; // 초기 속도로 리셋
        this.gameData.difficultyLevel = 1;
        this.gameData.gameTime = 0; // 게임 시간도 리셋
        this.gameData.currentMap = 'normal'; // 일반 맵으로 리셋
        this.gameData.mapTransitioning = false;
        this.gameData.heatGauge = 100; // 더위 게이지 리셋
        this.gameData.lastHeatUpdate = Date.now();
        this.updateScoreDisplay();
        this.updateHeatGaugeDisplay();
        this.updateMapClass(); // 맵 클래스 업데이트
    }
    
    // UI 초기화
    initializeUI() {
        // 버튼 이벤트 리스너 등록
        document.getElementById('startBtn').addEventListener('click', () => {
            this.setState(this.states.PLAYING);
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.setState(this.states.SETTINGS);
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.setState(this.states.PLAYING);
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.setState(this.states.PLAYING);
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.setState(this.states.MENU);
        });
        
        // 게임 오버 화면에서 클릭으로 재시작
        document.getElementById('gameOverScreen').addEventListener('click', (e) => {
            // 메인으로 버튼이 아닌 경우에만 재시작
            if (e.target.id !== 'backToMenuBtn') {
                this.resetGame();
                this.setState(this.states.PLAYING);
            }
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.setState(this.states.MENU);
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.setState(this.previousState || this.states.MENU);
        });
        
        // 설정 토글 이벤트
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.gameData.soundEnabled = e.target.checked;
            this.saveSetting('soundEnabled', e.target.checked);
        });
        
        document.getElementById('sfxToggle').addEventListener('change', (e) => {
            this.gameData.sfxEnabled = e.target.checked;
            this.saveSetting('sfxEnabled', e.target.checked);
        });
        
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    // UI 업데이트
    updateUI() {
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // body 클래스 업데이트 (게임 플레이 중 컨트롤 가이드 숨기기용)
        document.body.className = this.currentState;
        
        // 현재 상태에 맞는 화면 표시
        switch (this.currentState) {
            case this.states.MENU:
                document.getElementById('menuScreen').classList.add('active');
                break;
            case this.states.PAUSED:
                document.getElementById('pauseScreen').classList.add('active');
                break;
            case this.states.GAME_OVER:
                this.updateGameOverScreen();
                document.getElementById('gameOverScreen').classList.add('active');
                break;
            case this.states.SETTINGS:
                this.updateSettingsScreen();
                document.getElementById('settingsScreen').classList.add('active');
                break;
        }
    }
    
    // 점수 표시 업데이트
    updateScoreDisplay() {
        document.querySelector('#currentScore span').textContent = this.gameData.score;
        document.querySelector('#highScore span').textContent = this.gameData.highScore;
    }
    
    // 게임 오버 화면 업데이트
    updateGameOverScreen() {
        document.querySelector('#finalScore span').textContent = this.gameData.score;
        document.querySelector('#bestScore span').textContent = this.gameData.highScore;
        document.querySelector('#obstacleCount span').textContent = this.gameData.obstaclesPassed;
    }
    
    // 설정 화면 업데이트
    updateSettingsScreen() {
        document.getElementById('soundToggle').checked = this.gameData.soundEnabled;
        document.getElementById('sfxToggle').checked = this.gameData.sfxEnabled;
    }
    
    // 새 기록 표시
    showNewRecord() {
        const bestScoreElement = document.querySelector('#bestScore');
        bestScoreElement.classList.add('new-record');
        bestScoreElement.textContent = 'NEW RECORD! ' + this.gameData.highScore;
        
        setTimeout(() => {
            bestScoreElement.classList.remove('new-record');
        }, 3000);
    }
    
    // 키보드 이벤트 처리
    handleKeyDown(e) {
        switch (e.code) {
            case 'Escape':
                if (this.currentState === this.states.PLAYING) {
                    this.setState(this.states.PAUSED);
                } else if (this.currentState === this.states.PAUSED) {
                    this.setState(this.states.PLAYING);
                } else if (this.currentState === this.states.SETTINGS) {
                    this.setState(this.previousState || this.states.MENU);
                }
                break;
                
            case 'Space':
                e.preventDefault();
                if (this.currentState === this.states.MENU) {
                    this.setState(this.states.PLAYING);
                } else if (this.currentState === this.states.GAME_OVER) {
                    this.resetGame();
                    this.setState(this.states.PLAYING);
                }
                break;
                
            case 'Enter':
                if (this.currentState === this.states.MENU) {
                    this.setState(this.states.PLAYING);
                }
                break;
        }
    }
    
    // 로컬 스토리지 관리
    loadHighScore() {
        return parseInt(localStorage.getItem('catRunnerHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('catRunnerHighScore', this.gameData.highScore.toString());
    }
    
    loadSetting(key, defaultValue) {
        const stored = localStorage.getItem(`catRunner${key}`);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    }
    
    saveSetting(key, value) {
        localStorage.setItem(`catRunner${key}`, JSON.stringify(value));
    }
    
    // 게임 통계 저장
    saveGameStats() {
        const stats = {
            totalPlayTime: parseInt(localStorage.getItem('catRunnerTotalPlayTime')) || 0,
            gamesPlayed: parseInt(localStorage.getItem('catRunnerGamesPlayed')) || 0,
            totalObstaclesPassed: parseInt(localStorage.getItem('catRunnerTotalObstacles')) || 0
        };
        
        stats.gamesPlayed++;
        stats.totalObstaclesPassed += this.gameData.obstaclesPassed;
        
        localStorage.setItem('catRunnerTotalPlayTime', stats.totalPlayTime.toString());
        localStorage.setItem('catRunnerGamesPlayed', stats.gamesPlayed.toString());
        localStorage.setItem('catRunnerTotalObstacles', stats.totalObstaclesPassed.toString());
    }
}