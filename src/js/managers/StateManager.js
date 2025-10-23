import { GAME_CONSTANTS, STORAGE_KEYS, KEY_CODES } from '../config/constants.js';
import { AudioManager } from './AudioManager.js';

/**
 * 게임 상태 관리 시스템
 */
export class GameStateManager {
    constructor() {
        this.states = GAME_CONSTANTS.STATES;
        this.currentState = this.states.MENU;
        this.previousState = null;

        // 게임 데이터
        this.gameData = {
            score: 0,
            highScore: this.loadHighScore(),
            obstaclesPassed: 0,
            gameSpeed: GAME_CONSTANTS.DIFFICULTY.INITIAL_SPEED,
            difficultyLevel: 1,
            gameTime: 0,
            soundEnabled: this.loadSetting('soundEnabled', true),
            sfxEnabled: this.loadSetting('sfxEnabled', true),
            currentMap: GAME_CONSTANTS.MAPS.NORMAL,
            mapTransitioning: false,
            heatGauge: GAME_CONSTANTS.HEAT_GAUGE.MAX,
            lastHeatUpdate: Date.now()
        };

        // 상태 변경 콜백들
        this.stateChangeCallbacks = {};

        // 오디오 매니저
        this.audioManager = new AudioManager();
        this.audioManager.toggleMute(!this.gameData.soundEnabled);

        this.initializeUI();
    }

    // 상태 변경
    setState(newState) {
        if (this.currentState === newState) return;

        this.previousState = this.currentState;
        this.currentState = newState;

        this.updateUI();

        if (newState === 'playing') {
            this.updateMapClass();
            // 게임 플레이 시작 시 BGM 재생
            this.audioManager.playBGM();
        } else {
            // 게임 플레이 중이 아닐 때 BGM 일시정지
            this.audioManager.pauseBGM();
        }

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

        // 맵 전환
        if (prevScore < GAME_CONSTANTS.MAP_TRANSITIONS.LAVA_THRESHOLD &&
            this.gameData.score >= GAME_CONSTANTS.MAP_TRANSITIONS.LAVA_THRESHOLD &&
            this.gameData.currentMap === GAME_CONSTANTS.MAPS.NORMAL) {
            this.triggerMapTransition(GAME_CONSTANTS.MAPS.LAVA);
        }

        if (prevScore < GAME_CONSTANTS.MAP_TRANSITIONS.ICE_THRESHOLD &&
            this.gameData.score >= GAME_CONSTANTS.MAP_TRANSITIONS.ICE_THRESHOLD &&
            this.gameData.currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            this.triggerMapTransition(GAME_CONSTANTS.MAPS.ICE);
        }

        // 최고 점수 확인
        if (this.gameData.score > this.gameData.highScore) {
            this.gameData.highScore = this.gameData.score;
            this.saveHighScore();
            this.showNewRecord();
        }

        this.updateDifficulty();
    }

    // 맵 전환 트리거
    triggerMapTransition(newMap) {
        this.gameData.mapTransitioning = true;

        if (this.mapTransitionCallback) {
            this.mapTransitionCallback();
        }

        setTimeout(() => {
            this.gameData.currentMap = newMap;
            this.gameData.mapTransitioning = false;
            this.updateMapClass();
        }, 1000);
    }

    // 맵 클래스 업데이트
    updateMapClass() {
        document.body.classList.remove('normal-map', 'lava-map', 'ice-map');

        if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            document.body.classList.add('lava-map');
        } else if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.ICE) {
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

    // 난이도 업데이트
    updateDifficulty() {
        const score = this.gameData.score;
        const gameTime = this.gameData.gameTime;

        const timeLevelBonus = Math.floor(gameTime / GAME_CONSTANTS.DIFFICULTY.TIME_LEVEL_INTERVAL);

        let scoreLevel = 0;
        if (score >= 3000) scoreLevel = 4;
        else if (score >= 2000) scoreLevel = 3;
        else if (score >= 1000) scoreLevel = 2;
        else if (score >= 500) scoreLevel = 1;

        this.gameData.difficultyLevel = Math.min(1 + timeLevelBonus + scoreLevel, GAME_CONSTANTS.DIFFICULTY.MAX_LEVEL);

        const baseSpeed = GAME_CONSTANTS.DIFFICULTY.INITIAL_SPEED;
        const timeSpeedBonus = Math.floor(gameTime / GAME_CONSTANTS.DIFFICULTY.SPEED_INCREASE_INTERVAL) *
                                GAME_CONSTANTS.DIFFICULTY.SPEED_INCREASE_PER_INTERVAL;
        const scoreSpeedBonus = scoreLevel * 0.8;

        this.gameData.gameSpeed = Math.min(baseSpeed + timeSpeedBonus + scoreSpeedBonus, GAME_CONSTANTS.DIFFICULTY.MAX_SPEED);
    }

    // 게임 시간 업데이트
    updateGameTime(deltaTime) {
        if (this.isState('playing')) {
            this.gameData.gameTime += deltaTime / 1000;
            this.updateDifficulty();
            this.updateHeatGauge();
        }
    }

    // 더위 게이지 업데이트
    updateHeatGauge() {
        if (this.gameData.currentMap !== GAME_CONSTANTS.MAPS.LAVA) {
            return;
        }

        const now = Date.now();
        const timePassed = (now - this.gameData.lastHeatUpdate) / 1000;

        if (timePassed >= GAME_CONSTANTS.HEAT_GAUGE.DECAY_INTERVAL / 1000) {
            this.gameData.heatGauge = Math.max(0, this.gameData.heatGauge - GAME_CONSTANTS.HEAT_GAUGE.DECAY_RATE);
            this.gameData.lastHeatUpdate = now;

            this.updateHeatGaugeDisplay();

            if (this.gameData.heatGauge <= 0) {
                this.triggerHeatGameOver();
            }
        }
    }

    // 물 아이템 획득 시 게이지 회복
    recoverHeatGauge() {
        this.gameData.heatGauge = Math.min(GAME_CONSTANTS.HEAT_GAUGE.MAX,
            this.gameData.heatGauge + GAME_CONSTANTS.WATER_ITEM.RECOVERY_AMOUNT);
        this.updateHeatGaugeDisplay();
    }

    // 더위 게이지 UI 업데이트
    updateHeatGaugeDisplay() {
        const heatBar = document.getElementById('heatGaugeBar');
        const heatValue = document.getElementById('heatValue');

        if (heatBar && heatValue) {
            heatBar.style.width = this.gameData.heatGauge + '%';
            heatValue.textContent = Math.floor(this.gameData.heatGauge) + '%';

            heatBar.classList.remove('warning', 'critical');

            if (this.gameData.heatGauge <= GAME_CONSTANTS.HEAT_GAUGE.CRITICAL_THRESHOLD) {
                heatBar.style.background = '#666';
                heatBar.classList.add('critical');
            } else if (this.gameData.heatGauge <= GAME_CONSTANTS.HEAT_GAUGE.WARNING_THRESHOLD) {
                heatBar.style.background = '#999';
                heatBar.classList.add('warning');
            } else {
                heatBar.style.background = '#fff';
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
        this.gameData.gameSpeed = GAME_CONSTANTS.DIFFICULTY.INITIAL_SPEED;
        this.gameData.difficultyLevel = 1;
        this.gameData.gameTime = 0;
        this.gameData.currentMap = GAME_CONSTANTS.MAPS.NORMAL;
        this.gameData.mapTransitioning = false;
        this.gameData.heatGauge = GAME_CONSTANTS.HEAT_GAUGE.MAX;
        this.gameData.lastHeatUpdate = Date.now();
        this.updateScoreDisplay();
        this.updateHeatGaugeDisplay();
        this.updateMapClass();
    }

    // UI 초기화
    initializeUI() {
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

        // 게임 오버 화면 클릭 시 재시작 기능 제거 (버튼만 사용)

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.setState(this.states.MENU);
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.setState(this.previousState || this.states.MENU);
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.gameData.soundEnabled = e.target.checked;
            this.saveSetting('soundEnabled', e.target.checked);
            // 사운드 설정 변경 시 BGM 제어
            this.audioManager.toggleMute(!e.target.checked);
            if (e.target.checked && this.currentState === this.states.PLAYING) {
                this.audioManager.playBGM();
            }
        });

        document.getElementById('sfxToggle').addEventListener('change', (e) => {
            this.gameData.sfxEnabled = e.target.checked;
            this.saveSetting('sfxEnabled', e.target.checked);
        });

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // UI 업데이트
    updateUI() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        document.body.className = this.currentState;

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
            case KEY_CODES.ESCAPE:
                // ESC 키는 설정 화면 닫기에만 사용
                if (this.currentState === this.states.SETTINGS) {
                    this.setState(this.previousState || this.states.MENU);
                }
                break;

            case KEY_CODES.SPACE:
                e.preventDefault();
                if (this.currentState === this.states.MENU) {
                    this.setState(this.states.PLAYING);
                }
                // 게임 오버 시 스페이스바 비활성화 (메인 메뉴 버튼만 사용)
                break;

            case KEY_CODES.ENTER:
                if (this.currentState === this.states.MENU) {
                    this.setState(this.states.PLAYING);
                }
                break;
        }
    }

    // 로컬 스토리지 관리
    loadHighScore() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE)) || 0;
    }

    saveHighScore() {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, this.gameData.highScore.toString());
    }

    loadSetting(key, defaultValue) {
        const storageKey = `catRunner${key}`;
        const stored = localStorage.getItem(storageKey);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    }

    saveSetting(key, value) {
        const storageKey = `catRunner${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
    }

    // 게임 통계 저장
    saveGameStats() {
        const stats = {
            totalPlayTime: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_PLAY_TIME)) || 0,
            gamesPlayed: parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED)) || 0,
            totalObstaclesPassed: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_OBSTACLES)) || 0
        };

        stats.gamesPlayed++;
        stats.totalObstaclesPassed += this.gameData.obstaclesPassed;

        localStorage.setItem(STORAGE_KEYS.TOTAL_PLAY_TIME, stats.totalPlayTime.toString());
        localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, stats.gamesPlayed.toString());
        localStorage.setItem(STORAGE_KEYS.TOTAL_OBSTACLES, stats.totalObstaclesPassed.toString());
    }
}
