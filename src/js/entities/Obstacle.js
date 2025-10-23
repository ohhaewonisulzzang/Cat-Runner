import { GAME_CONSTANTS, IMAGE_PATHS } from '../config/constants.js';
import { ImageLoader } from '../utils/imageLoader.js';

/**
 * 장애물 이미지 로더
 */
export class ObstacleImageLoader {
    static images = {
        ground: { small: [], medium: [], large: [] },
        air: { small: [], medium: [], large: [] }
    };

    static waterBottleImage = null;
    static loaded = false;
    static loading = false;

    static async loadImages() {
        if (this.loaded || this.loading) return;

        this.loading = true;
        console.log('장애물 이미지 로딩 시작...');

        try {
            // Ground obstacles
            for (let i = 1; i <= 4; i++) {
                const img = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.GROUND.SMALL(i));
                if (img) this.images.ground.small.push(img);
            }

            for (let i = 1; i <= 4; i++) {
                const img = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.GROUND.MEDIUM(i));
                if (img) this.images.ground.medium.push(img);
            }

            for (let i = 1; i <= 6; i++) {
                const img = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.GROUND.LARGE(i));
                if (img) this.images.ground.large.push(img);
            }

            // Air obstacles
            const airSmallImg = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.AIR.SMALL);
            if (airSmallImg) this.images.air.small.push(airSmallImg);

            const airMediumImg = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.AIR.MEDIUM);
            if (airMediumImg) this.images.air.medium.push(airMediumImg);

            const airLargeImg = await ImageLoader.loadImageSafe(IMAGE_PATHS.OBSTACLES.GRASSLAND.AIR.LARGE);
            if (airLargeImg) this.images.air.large.push(airLargeImg);

            // Water bottle image
            this.waterBottleImage = await ImageLoader.loadImageSafe(IMAGE_PATHS.ITEMS.WATER_BOTTLE);

            this.loaded = true;
            this.loading = false;
            console.log('장애물 이미지 로딩 완료!');
        } catch (error) {
            console.error('장애물 이미지 로딩 실패:', error);
            this.loading = false;
        }
    }

    static getRandomImage(type, size) {
        const images = this.images[type]?.[size];
        if (!images || images.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    }
}

/**
 * 장애물 엔티티
 */
export class Obstacle {
    constructor(x, y, type, size) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;

        this.setSizeProperties();

        this.image = ObstacleImageLoader.getRandomImage(this.type, this.size);
        this.active = true;
        this.passed = false;

        this.animationFrame = 0;
        this.animationSpeed = 0.05;
    }

    setSizeProperties() {
        const dimensions = GAME_CONSTANTS.OBSTACLE.DIMENSIONS[this.size.toUpperCase()];
        this.width = dimensions.width;
        this.height = dimensions.height;

        if (this.type === GAME_CONSTANTS.OBSTACLE.TYPES.GROUND) {
            this.y = GAME_CONSTANTS.OBSTACLE.GROUND_Y - this.height;
        } else if (this.type === GAME_CONSTANTS.OBSTACLE.TYPES.AIR) {
            this.y = GAME_CONSTANTS.OBSTACLE.AIR_POSITIONS[this.size.toUpperCase()];
        }
    }

    update(gameSpeed, deltaTime) {
        if (!this.active) return;

        this.x -= gameSpeed;
        this.animationFrame += this.animationSpeed;

        if (this.x + this.width < 0) {
            this.active = false;
        }
    }

    render(ctx, debugMode = false) {
        if (!this.active) return;

        ctx.save();

        if (this.image && ObstacleImageLoader.loaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            this.renderPlaceholder(ctx);
        }

        // 디버그 모드: 히트박스 표시
        if (debugMode) {
            const bounds = this.getBounds();

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

            // 장애물 타입 표시
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

            // 장애물 정보 텍스트
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`${this.type}`, bounds.x + 5, bounds.y + 15);
            ctx.fillText(`${this.size}`, bounds.x + 5, bounds.y + 30);
        }

        ctx.restore();
    }

    renderPlaceholder(ctx) {
        if (this.type === GAME_CONSTANTS.OBSTACLE.TYPES.GROUND) {
            ctx.fillStyle = '#8B4513';
        } else {
            ctx.fillStyle = '#FF6B6B';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    checkPassed(playerX) {
        if (!this.passed && this.x + this.width < playerX) {
            this.passed = true;
            return true;
        }
        return false;
    }

    getBounds() {
        // LARGE 사이즈 장애물은 히트박스를 약간 줄임
        if (this.size === GAME_CONSTANTS.OBSTACLE.SIZES.LARGE) {
            const sidePadding = 12; // 좌우 각 12픽셀씩 줄임
            const bottomPadding = 12; // 아래쪽만 12픽셀 줄임
            return {
                x: this.x + sidePadding,
                y: this.y, // 위쪽은 그대로 유지
                width: this.width - (sidePadding * 2),
                height: this.height - bottomPadding
            };
        }

        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getScoreValue() {
        return GAME_CONSTANTS.OBSTACLE.SCORE_VALUES[this.size.toUpperCase()];
    }
}

/**
 * 물 아이템 엔티티
 */
export class WaterItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONSTANTS.WATER_ITEM.WIDTH;
        this.height = GAME_CONSTANTS.WATER_ITEM.HEIGHT;
        this.active = true;
        this.collected = false;
        this.animationFrame = 0;
    }

    update(gameSpeed, deltaTime) {
        if (!this.active) return;

        this.x -= gameSpeed;
        this.animationFrame += 0.1;

        if (this.x + this.width < 0) {
            this.active = false;
        }
    }

    render(ctx, debugMode = false) {
        if (!this.active || this.collected) return;

        ctx.save();

        // 물병 이미지 또는 플레이스홀더
        if (ObstacleImageLoader.waterBottleImage && ObstacleImageLoader.loaded) {
            ctx.drawImage(ObstacleImageLoader.waterBottleImage, this.x, this.y, this.width, this.height);
        } else {
            // 플레이스홀더 (이미지 로딩 전)
            ctx.fillStyle = '#4FC3F7';
            ctx.fillRect(this.x + 10, this.y + 8, 20, 24);

            ctx.fillStyle = '#0288D1';
            ctx.fillRect(this.x + 12, this.y + 5, 16, 5);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(this.x + 12, this.y + 10, 6, 15);
        }

        // 디버그 모드: 히트박스 표시
        if (debugMode) {
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // 물 아이템 표시
            ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // 물 아이템 정보 텍스트
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('WATER', this.x + 5, this.y + 15);
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    collect() {
        this.collected = true;
        this.active = false;
    }
}
