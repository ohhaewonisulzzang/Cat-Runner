import { GAME_CONSTANTS, STORAGE_KEYS, KEY_CODES } from '../config/constants.js';
import { AudioManager } from './AudioManager.js';

/**
 * 게임 상태 관리 시스템
 */
export class GameStateManager {
    constructor(storyScreen) {
        this.states = GAME_CONSTANTS.STATES;
        this.currentState = this.states.MENU;
        this.previousState = null;

        // 스토리 화면
        this.storyScreen = storyScreen;

        // 게임 데이터
        this.gameData = {
            score: 0,
            obstaclesPassed: 0,
            gameSpeed: GAME_CONSTANTS.DIFFICULTY.INITIAL_SPEED,
            difficultyLevel: 1,
            gameTime: 0,
            soundEnabled: this.loadSetting('soundEnabled', true),
            sfxEnabled: this.loadSetting('sfxEnabled', true),
            selectedAccessory: this.loadSetting('selectedAccessory', 'none'),
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
            // 게임 플레이 시작 시 음악 재생
            if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.ARGENTINA) {
                // 아르헨티나 맵에서는 탱고 재생
                this.audioManager.playTango();
            } else {
                // 일반 맵에서는 BGM 재생
                this.audioManager.playBGM();
            }
        } else {
            // 게임 플레이 중이 아닐 때 모든 음악 일시정지
            this.audioManager.pauseBGM();
            this.audioManager.pauseTango();
        }

        // 게임 오버 시 모든 음악 정지 및 초기화 (처음부터 재생되도록)
        if (newState === 'gameOver') {
            this.audioManager.stopBGM();
            this.audioManager.stopTango();
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

        if (prevScore < GAME_CONSTANTS.MAP_TRANSITIONS.ARGENTINA_THRESHOLD &&
            this.gameData.score >= GAME_CONSTANTS.MAP_TRANSITIONS.ARGENTINA_THRESHOLD &&
            this.gameData.currentMap === GAME_CONSTANTS.MAPS.ICE) {
            this.triggerArgentinaStory();
        }

        // 엔딩 체크 (10000점)
        if (prevScore < 10000 && this.gameData.score >= 10000) {
            this.triggerEnding();
            return; // 엔딩 트리거 후 더 이상 진행하지 않음
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

    // 아르헨티나 스토리 트리거
    triggerArgentinaStory() {
        // 게임 일시 정지
        this.previousState = this.currentState;
        this.currentState = 'story';

        // 탱고 음악 재생
        this.audioManager.playTango();

        // 스토리 화면 표시
        this.storyScreen.show();
        this.storyScreen.start(() => {
            // 스토리 완료 후 탱고는 계속 재생 (아르헨티나 맵 BGM)
            // BGM 재개하지 않음

            // 맵 전환 및 게임 재개
            this.triggerMapTransition(GAME_CONSTANTS.MAPS.ARGENTINA);
            this.currentState = this.previousState;
        }, 'argentina');
    }

    // 엔딩 트리거 (10000점)
    triggerEnding() {
        // 게임 상태를 엔딩으로 변경
        this.currentState = 'ending';

        // BGM과 Tango 정지
        this.audioManager.stopBGM();
        this.audioManager.stopTango();

        // 엔딩 스토리 화면 표시
        this.storyScreen.show();
        this.storyScreen.start(() => {
            // 엔딩 스토리 완료 후 크레딧 표시
            this.showCredits();
        }, 'ending');
    }

    // 크레딧 화면 표시
    showCredits() {
        // 스토리 화면 숨김
        this.storyScreen.hide();

        // 크레딧 화면 표시
        const creditsScreen = document.getElementById('creditsScreen');
        creditsScreen.classList.add('active');

        // 크레딧 버튼 이벤트 (메인 메뉴로)
        const creditsToMenuBtn = document.getElementById('creditsToMenuBtn');
        creditsToMenuBtn.onclick = () => {
            creditsScreen.classList.remove('active');
            this.setState(this.states.MENU);
        };
    }

    // 맵 클래스 업데이트
    updateMapClass() {
        document.body.classList.remove('normal-map', 'lava-map', 'ice-map', 'argentina-map');

        if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            document.body.classList.add('lava-map');
        } else if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.ICE) {
            document.body.classList.add('ice-map');
        } else if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.ARGENTINA) {
            document.body.classList.add('argentina-map');
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
            // 메뉴 화면 숨기기
            document.getElementById('menuScreen').classList.remove('active');

            // 스토리 재생 후 게임 시작
            this.storyScreen.show();
            this.storyScreen.start(() => {
                this.setState(this.states.PLAYING);
            });
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
            // 사운드 설정 변경 시 음악 제어
            this.audioManager.toggleMute(!e.target.checked);
            if (e.target.checked && this.currentState === this.states.PLAYING) {
                // 아르헨티나 맵이면 탱고, 아니면 BGM
                if (this.gameData.currentMap === GAME_CONSTANTS.MAPS.ARGENTINA) {
                    this.audioManager.playTango();
                } else {
                    this.audioManager.playBGM();
                }
            }
        });

        document.getElementById('sfxToggle').addEventListener('change', (e) => {
            this.gameData.sfxEnabled = e.target.checked;
            this.saveSetting('sfxEnabled', e.target.checked);
        });

        // 장신구 캐러셀 이벤트
        this.accessories = [
            { id: 'none', name: '없음', previewImage: null },
            { id: 'halo', name: '천사 링', previewImage: 'src/assets/images/accessories/halo.png' },
            { id: 'crown', name: '왕관', previewImage: 'src/assets/images/accessories/crown.png' },
            { id: 'glass', name: '인싸 안경', previewImage: 'src/assets/images/accessories/glass.png' },
            { id: 'chefhat', name: '셰프 모자', previewImage: 'src/assets/images/accessories/chef hat.png' }
        ];
        this.currentAccessoryIndex = 0;

        document.getElementById('carouselPrev').addEventListener('click', () => {
            this.navigateAccessory(-1);
        });

        document.getElementById('carouselNext').addEventListener('click', () => {
            this.navigateAccessory(1);
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
    }

    // 게임 오버 화면 업데이트
    updateGameOverScreen() {
        document.querySelector('#finalScore span').textContent = this.gameData.score;
        document.querySelector('#obstacleCount span').textContent = this.gameData.obstaclesPassed;
    }

    // 설정 화면 업데이트
    updateSettingsScreen() {
        document.getElementById('soundToggle').checked = this.gameData.soundEnabled;
        document.getElementById('sfxToggle').checked = this.gameData.sfxEnabled;
        this.updateAccessorySelection();
    }

    // 장신구 네비게이션
    navigateAccessory(direction) {
        this.currentAccessoryIndex += direction;

        // 순환 처리
        if (this.currentAccessoryIndex < 0) {
            this.currentAccessoryIndex = this.accessories.length - 1;
        } else if (this.currentAccessoryIndex >= this.accessories.length) {
            this.currentAccessoryIndex = 0;
        }

        const accessory = this.accessories[this.currentAccessoryIndex];
        this.selectAccessory(accessory.id);
    }

    // 장신구 선택
    selectAccessory(accessoryType) {
        this.gameData.selectedAccessory = accessoryType;
        this.saveSetting('selectedAccessory', accessoryType);
        this.updateAccessorySelection();
    }

    // 장신구 선택 UI 업데이트
    updateAccessorySelection() {
        // 현재 선택된 장신구 찾기
        const accessory = this.accessories.find(a => a.id === this.gameData.selectedAccessory);
        if (!accessory) return;

        // 캐러셀 이름 업데이트
        const carouselName = document.getElementById('carouselName');
        if (carouselName) {
            carouselName.textContent = accessory.name;
        }

        // 캐러셀 이미지 업데이트
        const carouselImage = document.getElementById('carouselImage');
        if (carouselImage) {
            if (accessory.previewImage) {
                carouselImage.src = accessory.previewImage;
                carouselImage.style.display = 'block';
            } else {
                carouselImage.style.display = 'none';
            }
        }

        // currentAccessoryIndex 동기화
        this.currentAccessoryIndex = this.accessories.findIndex(a => a.id === this.gameData.selectedAccessory);
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
                    // 메뉴 화면 숨기기
                    document.getElementById('menuScreen').classList.remove('active');

                    // 스토리 재생 후 게임 시작
                    this.storyScreen.show();
                    this.storyScreen.start(() => {
                        this.setState(this.states.PLAYING);
                    });
                }
                // 게임 오버 시 스페이스바 비활성화 (메인 메뉴 버튼만 사용)
                break;

            case KEY_CODES.ENTER:
                if (this.currentState === this.states.MENU) {
                    // 메뉴 화면 숨기기
                    document.getElementById('menuScreen').classList.remove('active');

                    // 스토리 재생 후 게임 시작
                    this.storyScreen.show();
                    this.storyScreen.start(() => {
                        this.setState(this.states.PLAYING);
                    });
                }
                break;
        }
    }

    // 로컬 스토리지 관리
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
