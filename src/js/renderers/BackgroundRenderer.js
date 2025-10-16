import { GAME_CONSTANTS, IMAGE_PATHS } from '../config/constants.js';
import { ImageLoader } from '../utils/imageLoader.js';

/**
 * 배경 렌더링 관리 클래스
 */
export class BackgroundRenderer {
    constructor(ctx) {
        this.ctx = ctx;

        // 배경 이미지 저장소
        this.backgroundImages = {};
        this.imagesLoaded = {};

        // 스크롤 위치
        this.backgroundX = 0;

        // 맵 전환 관련
        this.currentBackgroundMap = null;
        this.previousBackgroundMap = null;
        this.isTransitioning = false;
        this.transitionAlpha = 0;

        // 이미지 로딩
        this.loadAllBackgrounds();
    }

    /**
     * 모든 배경 이미지 로드
     */
    async loadAllBackgrounds() {
        const imagesToLoad = [
            { key: 'grassland1', path: IMAGE_PATHS.BACKGROUND.GRASSLAND.MAP_01 },
            { key: 'grassland2', path: IMAGE_PATHS.BACKGROUND.GRASSLAND.MAP_02 },
            { key: 'grassland3', path: IMAGE_PATHS.BACKGROUND.GRASSLAND.MAP_03 },
            { key: 'lava1', path: IMAGE_PATHS.BACKGROUND.LAVA.MAP_01 },
            { key: 'lava2', path: IMAGE_PATHS.BACKGROUND.LAVA.MAP_02 },
            { key: 'ice1', path: IMAGE_PATHS.BACKGROUND.ICE.MAP_01 },
            { key: 'ice2', path: IMAGE_PATHS.BACKGROUND.ICE.MAP_02 },
            { key: 'ice3', path: IMAGE_PATHS.BACKGROUND.ICE.MAP_03 }
        ];

        for (const { key, path } of imagesToLoad) {
            try {
                const img = await ImageLoader.loadImage(path);
                this.backgroundImages[key] = img;
                this.imagesLoaded[key] = true;
                console.log(`배경 이미지 로드 완료: ${key}`);
            } catch (error) {
                console.warn(`배경 이미지 로드 실패: ${key}`, error);
                this.imagesLoaded[key] = false;
            }
        }
    }

    /**
     * 배경 스크롤 업데이트
     */
    updateScroll(gameSpeed, currentMap) {
        const multiplier = currentMap === GAME_CONSTANTS.MAPS.ICE
            ? GAME_CONSTANTS.BACKGROUND.ICE_SCROLL_SPEED_MULTIPLIER
            : GAME_CONSTANTS.BACKGROUND.SCROLL_SPEED_MULTIPLIER;

        this.backgroundX -= gameSpeed * multiplier;
    }

    /**
     * 전환 효과 업데이트
     */
    updateTransition(deltaTime) {
        if (this.isTransitioning) {
            this.transitionAlpha += deltaTime * GAME_CONSTANTS.BACKGROUND.TRANSITION_SPEED;

            if (this.transitionAlpha >= 1) {
                this.transitionAlpha = 1;
                this.isTransitioning = false;
                this.previousBackgroundMap = null;
            }
        }
    }

    /**
     * 맵 전환 시작
     */
    startTransition(newMap) {
        if (this.currentBackgroundMap !== newMap) {
            this.previousBackgroundMap = this.currentBackgroundMap;
            this.currentBackgroundMap = newMap;
            this.isTransitioning = true;
            this.transitionAlpha = 0;
            this.backgroundX = 0;

            console.log(`배경 전환: ${this.previousBackgroundMap} → ${newMap}`);
        }
    }

    /**
     * 배경 렌더링
     */
    render(currentMap, score) {
        if (currentMap === GAME_CONSTANTS.MAPS.LAVA) {
            this.renderLavaBackground(score);
        } else if (currentMap === GAME_CONSTANTS.MAPS.ICE) {
            this.renderIceBackground(score);
        } else {
            this.renderNormalBackground(score);
        }
    }

    /**
     * 일반 배경 렌더링
     */
    renderNormalBackground(score) {
        let targetMap = this.selectGrasslandMap(score);

        if (targetMap && targetMap !== this.currentBackgroundMap) {
            this.startTransition(targetMap);
        }

        if (this.isTransitioning && this.previousBackgroundMap) {
            this.renderBackgroundByName(this.previousBackgroundMap);
            this.ctx.globalAlpha = this.transitionAlpha;
            this.renderBackgroundByName(this.currentBackgroundMap);
            this.ctx.globalAlpha = 1.0;
        } else {
            this.renderBackgroundByName(targetMap || this.currentBackgroundMap || 'default');
        }
    }

    /**
     * 초원 맵 선택
     */
    selectGrasslandMap(score) {
        const transitions = GAME_CONSTANTS.BACKGROUND_TRANSITIONS.GRASSLAND;

        if (score >= transitions.MAP_01.min && score <= transitions.MAP_01.max) {
            return this.imagesLoaded.grassland1 ? 'grassland1' : null;
        } else if (score >= transitions.MAP_02.min && score <= transitions.MAP_02.max) {
            return this.imagesLoaded.grassland2 ? 'grassland2' : null;
        } else if (score >= transitions.MAP_03.min && score <= transitions.MAP_03.max) {
            return this.imagesLoaded.grassland3 ? 'grassland3' : null;
        }
        return 'default';
    }

    /**
     * 용암 배경 렌더링
     */
    renderLavaBackground(score) {
        let targetMap = this.selectLavaMap(score);

        if (targetMap && targetMap !== this.currentBackgroundMap) {
            this.startTransition(targetMap);
        }

        if (this.isTransitioning && this.previousBackgroundMap) {
            this.renderLavaBackgroundByName(this.previousBackgroundMap);
            this.ctx.globalAlpha = this.transitionAlpha;
            this.renderLavaBackgroundByName(this.currentBackgroundMap);
            this.ctx.globalAlpha = 1.0;
        } else {
            this.renderLavaBackgroundByName(targetMap || this.currentBackgroundMap || 'lavaDefault');
        }
    }

    /**
     * 용암 맵 선택
     */
    selectLavaMap(score) {
        const transitions = GAME_CONSTANTS.BACKGROUND_TRANSITIONS.LAVA;

        if (score >= transitions.MAP_01.min && score <= transitions.MAP_01.max) {
            return this.imagesLoaded.lava1 ? 'lava1' : null;
        } else if (score >= transitions.MAP_02.min && score <= transitions.MAP_02.max) {
            return this.imagesLoaded.lava2 ? 'lava2' : null;
        }
        return 'lavaDefault';
    }

    /**
     * 빙하 배경 렌더링
     */
    renderIceBackground(score) {
        let targetMap = this.selectIceMap(score);

        if (targetMap && targetMap !== this.currentBackgroundMap) {
            this.startTransition(targetMap);
        }

        if (this.isTransitioning && this.previousBackgroundMap) {
            this.renderIceBackgroundByName(this.previousBackgroundMap);
            this.ctx.globalAlpha = this.transitionAlpha;
            this.renderIceBackgroundByName(this.currentBackgroundMap);
            this.ctx.globalAlpha = 1.0;
        } else {
            this.renderIceBackgroundByName(targetMap || this.currentBackgroundMap || 'iceDefault');
        }
    }

    /**
     * 빙하 맵 선택
     */
    selectIceMap(score) {
        const transitions = GAME_CONSTANTS.BACKGROUND_TRANSITIONS.ICE;

        if (score >= transitions.MAP_01.min && score <= transitions.MAP_01.max) {
            return this.imagesLoaded.ice1 ? 'ice1' : null;
        } else if (score >= transitions.MAP_02.min && score <= transitions.MAP_02.max) {
            return this.imagesLoaded.ice2 ? 'ice2' : null;
        } else if (score >= transitions.MAP_03.min && score <= transitions.MAP_03.max) {
            return this.imagesLoaded.ice3 ? 'ice3' : null;
        }
        return 'iceDefault';
    }

    /**
     * 이름으로 배경 렌더링
     */
    renderBackgroundByName(mapName) {
        const img = this.backgroundImages[mapName];

        if (img) {
            this.renderScrollingBackground(img);
        } else {
            this.renderDefaultBackground();
        }
    }

    /**
     * 용암 배경 이름으로 렌더링
     */
    renderLavaBackgroundByName(mapName) {
        const img = this.backgroundImages[mapName];

        if (img) {
            this.renderScrollingBackground(img);
        } else {
            this.renderLavaDefaultBackground();
        }
    }

    /**
     * 빙하 배경 이름으로 렌더링
     */
    renderIceBackgroundByName(mapName) {
        const img = this.backgroundImages[mapName];

        if (img) {
            this.renderScrollingBackground(img);
        } else {
            this.renderIceDefaultBackground();
        }
    }

    /**
     * 스크롤링 배경 렌더링
     */
    renderScrollingBackground(img) {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const scaleY = GAME_CONSTANTS.CANVAS.HEIGHT / imgHeight;
        const scaledWidth = imgWidth * scaleY;

        const scrollDistance = this.backgroundX * 0.3;
        const normalizedScroll = ((scrollDistance % scaledWidth) + scaledWidth) % scaledWidth;

        const x1 = normalizedScroll;
        const x2 = normalizedScroll - scaledWidth;

        this.ctx.drawImage(img, x1, 0, scaledWidth, GAME_CONSTANTS.CANVAS.HEIGHT);
        this.ctx.drawImage(img, x2, 0, scaledWidth, GAME_CONSTANTS.CANVAS.HEIGHT);

        if (x1 > 0 || x2 + scaledWidth < GAME_CONSTANTS.CANVAS.WIDTH) {
            this.ctx.drawImage(img, x2 - scaledWidth, 0, scaledWidth, GAME_CONSTANTS.CANVAS.HEIGHT);
        }
    }

    /**
     * 기본 배경 렌더링 (이미지 없을 경우)
     */
    renderDefaultBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#87CEEB');
        gradient.addColorStop(0.6, '#90EE90');
        gradient.addColorStop(1, '#8FBC8F');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
    }

    /**
     * 용암 기본 배경 렌더링
     */
    renderLavaDefaultBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#1a0000');
        gradient.addColorStop(0.6, '#4a0000');
        gradient.addColorStop(0.6, '#8B0000');
        gradient.addColorStop(1, '#FF4500');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
    }

    /**
     * 빙하 기본 배경 렌더링
     */
    renderIceDefaultBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(0.7, '#0f3460');
        gradient.addColorStop(1, '#53a8b6');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
    }

    /**
     * 리셋
     */
    reset() {
        this.backgroundX = 0;
        this.currentBackgroundMap = null;
        this.previousBackgroundMap = null;
        this.isTransitioning = false;
        this.transitionAlpha = 0;
    }
}
