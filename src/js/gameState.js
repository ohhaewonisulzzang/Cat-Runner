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
            gameSpeed: 5,
            difficultyLevel: 1,
            soundEnabled: this.loadSetting('soundEnabled', true),
            sfxEnabled: this.loadSetting('sfxEnabled', true)
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
        this.gameData.score += points;
        this.updateScoreDisplay();
        
        // 최고 점수 확인 및 업데이트
        if (this.gameData.score > this.gameData.highScore) {
            this.gameData.highScore = this.gameData.score;
            this.saveHighScore();
            this.showNewRecord();
        }
        
        // 난이도 조정
        this.updateDifficulty();
    }
    
    // 장애물 통과 수 증가
    incrementObstacles() {
        this.gameData.obstaclesPassed++;
    }
    
    // 난이도 업데이트
    updateDifficulty() {
        const score = this.gameData.score;
        
        if (score >= 1000) {
            this.gameData.difficultyLevel = 4;
            this.gameData.gameSpeed = 8;
        } else if (score >= 500) {
            this.gameData.difficultyLevel = 3;
            this.gameData.gameSpeed = 7;
        } else if (score >= 200) {
            this.gameData.difficultyLevel = 2;
            this.gameData.gameSpeed = 6;
        } else {
            this.gameData.difficultyLevel = 1;
            this.gameData.gameSpeed = 5;
        }
    }
    
    // 게임 리셋
    resetGame() {
        this.gameData.score = 0;
        this.gameData.obstaclesPassed = 0;
        this.gameData.gameSpeed = 5;
        this.gameData.difficultyLevel = 1;
        this.updateScoreDisplay();
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
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.setState(this.states.PLAYING);
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