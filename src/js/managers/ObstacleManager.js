import { GAME_CONSTANTS } from '../config/constants.js';
import { Obstacle, WaterItem, ObstacleImageLoader } from '../entities/Obstacle.js';
import { CollisionDetector } from '../utils/collision.js';

/**
 * 장애물 관리자
 */
export class ObstacleManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.obstacles = [];
        this.waterItems = [];
        this.spawnTimer = 0;
        this.spawnInterval = GAME_CONSTANTS.OBSTACLE.INITIAL_SPAWN_INTERVAL;
        this.waterSpawnTimer = 0;
        this.lastObstacleType = null;
        this.consecutiveCount = 0;

        // 장애물 이미지 로드
        ObstacleImageLoader.loadImages();

        console.log('ObstacleManager 초기화 완료');
    }

    update(deltaTime) {
        if (!this.gameState.isState('playing')) return;

        const gameSpeed = this.gameState.gameData.gameSpeed;
        const currentMap = this.gameState.gameData.currentMap;

        // 장애물 업데이트
        this.obstacles.forEach(obstacle => obstacle.update(gameSpeed, deltaTime));

        // 물 아이템 업데이트
        if (currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            this.waterItems.forEach(item => item.update(gameSpeed, deltaTime));
        }

        // 비활성화된 제거
        this.obstacles = this.obstacles.filter(o => o.active);
        this.waterItems = this.waterItems.filter(i => i.active);

        // 장애물 생성
        this.spawnTimer += deltaTime;
        const difficulty = this.gameState.gameData.difficultyLevel;

        // 기본 간격 계산
        const baseInterval = Math.max(
            GAME_CONSTANTS.OBSTACLE.MIN_SPAWN_INTERVAL,
            1200 - (difficulty * 80)
        );

        // 게임 속도에 비례해서 간격 조정 (속도가 빠를수록 간격을 더 넓힘)
        const speedMultiplier = gameSpeed / GAME_CONSTANTS.DIFFICULTY.INITIAL_SPEED;
        this.spawnInterval = baseInterval * Math.max(1, speedMultiplier * 0.85);

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
        }

        // 물 아이템 생성
        if (currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            this.waterSpawnTimer += deltaTime;
            const randomInterval = GAME_CONSTANTS.WATER_ITEM.SPAWN_INTERVAL.MIN +
                Math.random() * (GAME_CONSTANTS.WATER_ITEM.SPAWN_INTERVAL.MAX - GAME_CONSTANTS.WATER_ITEM.SPAWN_INTERVAL.MIN);

            if (this.waterSpawnTimer >= randomInterval) {
                const activeCount = this.waterItems.filter(i => i.active).length;
                if (activeCount < GAME_CONSTANTS.WATER_ITEM.MAX_ACTIVE) {
                    this.spawnWaterItem();
                }
                this.waterSpawnTimer = 0;
            }
        }
    }

    spawnObstacle() {
        const x = GAME_CONSTANTS.OBSTACLE.SPAWN_X;
        const type = this.determineType();
        const size = this.determineSize();
        const y = type === GAME_CONSTANTS.OBSTACLE.TYPES.GROUND ? 620 : 400;

        const obstacle = new Obstacle(x, y, type, size);
        this.obstacles.push(obstacle);

        this.updateConsecutiveCount(type);
    }

    spawnWaterItem() {
        const x = GAME_CONSTANTS.OBSTACLE.SPAWN_X;
        const y = GAME_CONSTANTS.WATER_ITEM.Y_RANGE.MIN +
            Math.random() * (GAME_CONSTANTS.WATER_ITEM.Y_RANGE.MAX - GAME_CONSTANTS.WATER_ITEM.Y_RANGE.MIN);

        const waterItem = new WaterItem(x, y);
        this.waterItems.push(waterItem);
    }

    determineType() {
        if (this.consecutiveCount >= 2 && this.lastObstacleType) {
            return this.lastObstacleType === GAME_CONSTANTS.OBSTACLE.TYPES.GROUND ?
                GAME_CONSTANTS.OBSTACLE.TYPES.AIR : GAME_CONSTANTS.OBSTACLE.TYPES.GROUND;
        }

        return Math.random() < GAME_CONSTANTS.OBSTACLE.GROUND_RATIO ?
            GAME_CONSTANTS.OBSTACLE.TYPES.GROUND : GAME_CONSTANTS.OBSTACLE.TYPES.AIR;
    }

    determineSize() {
        const difficulty = this.gameState.gameData.difficultyLevel;
        const gameTime = this.gameState.gameData.gameTime;

        let largeProbability = Math.min(difficulty * 0.1, 0.85);
        const timeBonus = Math.min(gameTime / 20, 5) * 0.06;
        largeProbability = Math.min(largeProbability + timeBonus, 0.9);

        const rand = Math.random();

        if (rand < largeProbability) return GAME_CONSTANTS.OBSTACLE.SIZES.LARGE;
        else if (rand < largeProbability + 0.15) return GAME_CONSTANTS.OBSTACLE.SIZES.MEDIUM;
        else return GAME_CONSTANTS.OBSTACLE.SIZES.SMALL;
    }

    updateConsecutiveCount(type) {
        if (this.lastObstacleType === type) {
            this.consecutiveCount++;
        } else {
            this.consecutiveCount = 1;
        }
        this.lastObstacleType = type;
    }

    checkCollisions(player) {
        const playerBounds = player.getBounds();

        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;

            const obstacleBounds = obstacle.getBounds();

            if (CollisionDetector.checkAABB(playerBounds, obstacleBounds)) {
                return true;
            }
        }

        return false;
    }

    checkWaterCollection(player) {
        const playerBounds = player.getBounds();

        for (const waterItem of this.waterItems) {
            if (!waterItem.active || waterItem.collected) continue;

            const itemBounds = waterItem.getBounds();

            if (CollisionDetector.checkAABB(playerBounds, itemBounds)) {
                waterItem.collect();
                this.gameState.recoverHeatGauge();
                this.showWaterEffect();
                return true;
            }
        }

        return false;
    }

    showWaterEffect() {
        const heatGauge = document.getElementById('heatGauge');
        if (heatGauge) {
            heatGauge.classList.add('recovered');
            setTimeout(() => {
                heatGauge.classList.remove('recovered');
            }, 300);
        }
    }

    checkPassedObstacles(playerX) {
        let passedCount = 0;

        this.obstacles.forEach(obstacle => {
            if (obstacle.checkPassed(playerX)) {
                passedCount++;
                this.gameState.updateScore(obstacle.getScoreValue());
                this.gameState.incrementObstacles();
            }
        });

        return passedCount;
    }

    render(ctx, debugMode = false) {
        this.obstacles.forEach(obstacle => obstacle.render(ctx, debugMode));
        this.waterItems.forEach(waterItem => waterItem.render(ctx, debugMode));
    }

    reset() {
        this.obstacles = [];
        this.waterItems = [];
        this.spawnTimer = 0;
        this.waterSpawnTimer = 0;
        this.lastObstacleType = null;
        this.consecutiveCount = 0;
    }

    getDebugInfo() {
        return {
            obstacleCount: this.obstacles.length,
            activeObstacles: this.obstacles.filter(o => o.active).length,
            spawnTimer: Math.round(this.spawnTimer),
            spawnInterval: this.spawnInterval
        };
    }
}
