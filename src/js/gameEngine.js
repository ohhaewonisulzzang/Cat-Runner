import { GAME_CONSTANTS, KEY_CODES } from './config/constants.js';
import { GameStateManager } from './managers/StateManager.js';
import { ObstacleManager } from './managers/ObstacleManager.js';
import { Player } from './entities/Player.js';
import { BackgroundRenderer } from './renderers/BackgroundRenderer.js';
import { ImageLoader } from './utils/imageLoader.js';

/**
 * 메인 게임 엔진
 */
export class GameEngine {
    constructor() {
        // 캔버스 초기화
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 게임 상태 관리자
        this.gameState = new GameStateManager();

        // 게임 객체들
        this.player = new Player(this.gameState);
        this.obstacleManager = new ObstacleManager(this.gameState);

        // 렌더러
        this.backgroundRenderer = new BackgroundRenderer(this.ctx);

        // 타이밍
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = GAME_CONSTANTS.GAME_LOOP.FIXED_TIME_STEP;

        // 게임 루프 상태
        this.isRunning = false;

        // 지면 스크롤
        this.groundX = 0;

        // 길 이미지
        this.roadImages = { grassland: null, lava: null, ice: null };
        this.roadImagesLoaded = { grassland: false, lava: false, ice: false };
        this.roadPositions = [];

        // 스코어 타이머
        this.scoreTimer = 0;

        // 맵 전환 효과
        this.transitionAlpha = 0;

        // 디버그/테스트
        this.debugMode = GAME_CONSTANTS.DEBUG.DEFAULT_ENABLED;
        this.testMode = GAME_CONSTANTS.DEBUG.TEST_MODE_ENABLED;
        this.invincible = false;

        // 상태 변경 콜백 설정
        this.setupStateCallbacks();

        // 이미지 로딩 및 초기화
        this.loadImages();
    }

    async loadImages() {
        try {
            // 길 이미지 로드
            this.roadImages.grassland = await ImageLoader.loadImage('src/assets/images/load/glassland/load.png');
            this.roadImagesLoaded.grassland = true;

            this.roadImages.lava = await ImageLoader.loadImageSafe('src/assets/images/load/lava/load.png');
            this.roadImagesLoaded.lava = !!this.roadImages.lava;

            this.roadImages.ice = await ImageLoader.loadImageSafe('src/assets/images/load/ice/load.png');
            this.roadImagesLoaded.ice = !!this.roadImages.ice;

            console.log('길 이미지 로딩 완료');

            this.initialize();
        } catch (error) {
            console.error('이미지 로딩 실패:', error);
            this.initialize();
        }
    }

    initialize() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 디버그/테스트 키 등록
        document.addEventListener('keydown', (e) => {
            if (e.code === KEY_CODES.BACKQUOTE) {
                e.preventDefault();
                this.debugMode = !this.debugMode;
                console.log(`디버그 모드: ${this.debugMode ? 'ON' : 'OFF'}`);
            }

            if (e.code === KEY_CODES.F12) {
                e.preventDefault();
                this.testMode = !this.testMode;
                if (!this.testMode) this.invincible = false;
                console.log(`테스트 모드: ${this.testMode ? 'ON' : 'OFF'}`);
            }

            if (this.testMode) {
                if (e.code === KEY_CODES.DIGIT_1) {
                    this.gameState.updateScore(100);
                }
                if (e.code === KEY_CODES.DIGIT_2) {
                    this.invincible = !this.invincible;
                }
                if (e.code === KEY_CODES.DIGIT_3) {
                    this.gameState.gameData.heatGauge = 10;
                    this.gameState.updateHeatGaugeDisplay();
                }
            }
        });

        this.initializeRoadPositions();
        this.start();
    }

    setupStateCallbacks() {
        this.gameState.onStateChange('playing', () => this.startGame());
        this.gameState.onStateChange('paused', () => {});
        this.gameState.onStateChange('gameOver', () => this.endGame());
        this.gameState.onStateChange('menu', () => this.resetGame());
        this.gameState.onMapTransition(() => this.startMapTransition());
        this.gameState.onHeatGameOver(() => {
            this.gameState.setState('gameOver');
        });
    }

    startMapTransition() {
        this.transitionAlpha = 0;
        const transitionInterval = setInterval(() => {
            this.transitionAlpha += 0.05;
            if (this.transitionAlpha >= 1) {
                clearInterval(transitionInterval);
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

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();

        this.canvas.style.width = containerRect.width + 'px';
        this.canvas.style.height = containerRect.height + 'px';

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH * dpr;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT * dpr;

        this.ctx.scale(dpr, dpr);
    }

    start() {
        this.isRunning = true;
        this.gameLoop(0);
    }

    stop() {
        this.isRunning = false;
    }

    startGame() {
        this.scoreTimer = 0;
    }

    endGame() {
        this.gameState.saveGameStats();
    }

    resetGame() {
        console.log('게임 리셋 중...');
        this.player.reset();
        this.obstacleManager.reset();
        this.backgroundRenderer.reset();
        this.groundX = 0;
        this.scoreTimer = 0;
        this.roadPositions = [];
        this.initializeRoadPositions();
        this.gameState.resetGame();
        console.log('게임 리셋 완료');
    }

    initializeRoadPositions() {
        const currentMap = this.gameState.gameData.currentMap;
        let roadImage = null;

        if (currentMap === GAME_CONSTANTS.MAPS.LAVA && this.roadImagesLoaded.lava) {
            roadImage = this.roadImages.lava;
        } else if (currentMap === GAME_CONSTANTS.MAPS.ICE && this.roadImagesLoaded.ice) {
            roadImage = this.roadImages.ice;
        } else if (this.roadImagesLoaded.grassland) {
            roadImage = this.roadImages.grassland;
        }

        if (roadImage) {
            this.roadPositions = [];
            for (let i = 0; i < 3; i++) {
                this.roadPositions.push({
                    x: i * GAME_CONSTANTS.ROAD.WIDTH,
                    width: GAME_CONSTANTS.ROAD.WIDTH,
                    height: GAME_CONSTANTS.ROAD.HEIGHT
                });
            }
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }

        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameState.isState('playing')) {
            this.gameState.updateGameTime(deltaTime);
            this.player.update(deltaTime);
            this.obstacleManager.update(deltaTime);

            if (!this.invincible && this.obstacleManager.checkCollisions(this.player)) {
                this.gameState.setState('gameOver');
                return;
            }

            this.obstacleManager.checkWaterCollection(this.player);
            this.obstacleManager.checkPassedObstacles(this.player.x);

            this.updateBackground(deltaTime);
            this.updateTimeScore(deltaTime);
        }
    }

    updateBackground(deltaTime) {
        const gameSpeed = this.gameState.gameData.gameSpeed;
        const currentMap = this.gameState.gameData.currentMap;

        // 배경 스크롤
        this.backgroundRenderer.updateScroll(gameSpeed, currentMap);
        this.backgroundRenderer.updateTransition(deltaTime);

        // 지면 스크롤
        this.groundX -= gameSpeed;
        if (this.groundX <= -GAME_CONSTANTS.CANVAS.WIDTH) {
            this.groundX = 0;
        }

        // 길 스크롤
        if (this.roadPositions.length > 0) {
            this.roadPositions.forEach(road => {
                road.x -= gameSpeed;
            });

            if (this.roadPositions[0].x + this.roadPositions[0].width < 0) {
                const firstRoad = this.roadPositions.shift();
                const lastRoad = this.roadPositions[this.roadPositions.length - 1];
                firstRoad.x = lastRoad.x + lastRoad.width;
                this.roadPositions.push(firstRoad);
            }
        }
    }

    updateTimeScore(deltaTime) {
        this.scoreTimer += deltaTime;

        if (this.scoreTimer >= GAME_CONSTANTS.SCORE.TIME_INTERVAL) {
            this.gameState.updateScore(GAME_CONSTANTS.SCORE.TIME_POINTS);
            this.scoreTimer = 0;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        // 배경 렌더링
        this.backgroundRenderer.render(
            this.gameState.gameData.currentMap,
            this.gameState.gameData.score
        );

        // 길 렌더링
        this.renderRoad();

        if (this.gameState.isState('playing') || this.gameState.isState('paused')) {
            this.obstacleManager.render(this.ctx, this.debugMode);
            this.player.render(this.ctx, this.debugMode);
        }

        // 전환 효과
        if (this.transitionAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
        }

        if (this.debugMode) {
            this.renderDebugInfo();
        }

        if (this.testMode) {
            this.renderTestModeLabel();
        }
    }

    renderRoad() {
        if (this.roadPositions.length === 0) return;

        const currentMap = this.gameState.gameData.currentMap;
        let roadImage = null;

        if (currentMap === GAME_CONSTANTS.MAPS.LAVA && this.roadImagesLoaded.lava) {
            roadImage = this.roadImages.lava;
        } else if (currentMap === GAME_CONSTANTS.MAPS.ICE && this.roadImagesLoaded.ice) {
            roadImage = this.roadImages.ice;
        } else if (this.roadImagesLoaded.grassland) {
            roadImage = this.roadImages.grassland;
        }

        if (!roadImage) return;

        const roadY = GAME_CONSTANTS.CANVAS.HEIGHT - this.roadPositions[0].height;

        this.roadPositions.forEach(road => {
            if (road.x + road.width > 0 && road.x < GAME_CONSTANTS.CANVAS.WIDTH) {
                this.ctx.drawImage(roadImage, road.x, roadY, road.width, road.height);
            }
        });
    }

    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 180);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';

        const obsDebug = this.obstacleManager.getDebugInfo();
        const debugInfo = [
            `State: ${this.gameState.currentState}`,
            `Score: ${this.gameState.gameData.score}`,
            `Speed: ${this.gameState.gameData.gameSpeed.toFixed(1)}`,
            `Difficulty: ${this.gameState.gameData.difficultyLevel}`,
            `Time: ${this.gameState.gameData.gameTime.toFixed(1)}s`,
            '',
            'Player:',
            `  ${this.player.getDebugInfo().position}`,
            `  Velocity: ${this.player.getDebugInfo().velocity}`,
            '',
            'Obstacles:',
            `  Count: ${obsDebug.obstacleCount}`,
            `  Active: ${obsDebug.activeObstacles}`
        ];

        debugInfo.forEach((line, index) => {
            this.ctx.fillText(line, 20, 30 + index * 16);
        });
    }

    renderTestModeLabel() {
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        this.ctx.fillRect(1080, 10, 190, 80);

        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(1080, 10, 190, 80);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('TEST MODE', 1100, 35);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('1: +100 Score', 1095, 58);
        this.ctx.fillText(`2: Invincible ${this.invincible ? 'ON' : 'OFF'}`, 1095, 78);
    }

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
