import { GAME_CONSTANTS, IMAGE_PATHS, KEY_CODES, AUDIO_PATHS } from '../config/constants.js';
import { ImageLoader } from '../utils/imageLoader.js';

/**
 * 플레이어 캐릭터 엔티티
 */
export class Player {
    constructor(gameState) {
        this.gameState = gameState;

        // 위치
        this.x = GAME_CONSTANTS.PLAYER.INITIAL_X;
        this.y = GAME_CONSTANTS.PLAYER.INITIAL_Y;
        this.width = GAME_CONSTANTS.PLAYER.WIDTH;
        this.height = GAME_CONSTANTS.PLAYER.HEIGHT;
        this.groundY = GAME_CONSTANTS.PLAYER.GROUND_Y;

        // 물리 속성
        this.velocityY = 0;
        this.gravity = GAME_CONSTANTS.PLAYER.GRAVITY;
        this.isGrounded = false;

        // 점프 관련
        this.isJumping = false;
        this.maxJumpHeight = GAME_CONSTANTS.PLAYER.MAX_JUMP_HEIGHT;
        this.minJumpPower = GAME_CONSTANTS.PLAYER.MIN_JUMP_POWER;
        this.maxJumpPower = GAME_CONSTANTS.PLAYER.MAX_JUMP_POWER;
        this.jumpHoldTime = 0;
        this.maxJumpHoldTime = GAME_CONSTANTS.PLAYER.MAX_JUMP_HOLD_TIME;

        // 애니메이션
        this.frameIndex = 0;
        this.frameCount = GAME_CONSTANTS.PLAYER.FRAME_COUNT;
        this.animationSpeed = GAME_CONSTANTS.PLAYER.ANIMATION_SPEED;
        this.animationTimer = 0;

        // 입력 상태
        this.spacePressed = false;
        this.jumpStartTime = 0;

        // 이미지
        this.images = {
            run: [],
            jump: null
        };
        this.imagesLoaded = false;

        // 점프 효과음
        this.jumpSound = new Audio(AUDIO_PATHS.JUMP);
        this.jumpSound.volume = 0.5; // 볼륨 50%

        this.loadImages();
        this.initializeControls();
    }

    /**
     * 이미지 로드
     */
    async loadImages() {
        try {
            // 선택된 캐릭터 가져오기
            const selectedCharacter = this.gameState.gameData.selectedCharacter || 'cat';

            // 캐릭터 폴더 경로
            const basePath = `src/assets/images/player/${selectedCharacter}`;

            // 달리기 이미지 로드
            let runImagePaths;
            if (selectedCharacter === 'hoodiecat') {
                // hoodiecat은 cat_run1.png, cat_run2.png 형식
                runImagePaths = [1, 2, 3, 4].map(i => `${basePath}/cat_run${i}.png`);
            } else {
                // cat은 cat_run_1.png, cat_run_2.png 형식
                runImagePaths = [1, 2, 3, 4].map(i => `${basePath}/cat_run_${i}.png`);
            }
            this.images.run = await ImageLoader.loadImages(runImagePaths);

            // 점프 이미지 로드
            this.images.jump = await ImageLoader.loadImage(`${basePath}/cat_jump.png`);

            this.imagesLoaded = true;
            console.log(`플레이어 이미지 로드 완료! (${selectedCharacter})`);
        } catch (error) {
            console.error('플레이어 이미지 로드 실패:', error);
        }
    }

    /**
     * 컨트롤 초기화
     */
    initializeControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    /**
     * 키보드 입력 처리
     */
    handleKeyDown(e) {
        if (e.code === KEY_CODES.SPACE && this.gameState.isState('playing')) {
            e.preventDefault();
            if (!this.spacePressed && this.isGrounded) {
                this.spacePressed = true;
                this.jumpStartTime = Date.now();
                this.startJump();
            }
        }
    }

    handleKeyUp(e) {
        if (e.code === KEY_CODES.SPACE && this.gameState.isState('playing')) {
            e.preventDefault();
            this.spacePressed = false;
        }
    }

    /**
     * 터치 입력 처리
     */
    handleTouchStart(e) {
        if (this.gameState.isState('playing')) {
            e.preventDefault();
            if (!this.spacePressed && this.isGrounded) {
                this.spacePressed = true;
                this.jumpStartTime = Date.now();
                this.startJump();
            }
        }
    }

    handleTouchEnd(e) {
        if (this.gameState.isState('playing')) {
            e.preventDefault();
            this.spacePressed = false;
        }
    }

    /**
     * 점프 시작
     */
    startJump() {
        if (!this.isGrounded) return;

        this.velocityY = this.minJumpPower;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpHoldTime = 0;

        if (this.gameState.gameData.sfxEnabled) {
            try {
                // 1초부터 재생
                this.jumpSound.currentTime = 1.0;
                this.jumpSound.play().catch(err => {
                    console.log('점프 효과음 재생 실패:', err);
                });
            } catch (error) {
                console.error('점프 효과음 재생 오류:', error);
            }
        }
    }

    /**
     * 업데이트
     */
    update(deltaTime) {
        if (!this.gameState.isState('playing')) return;

        this.updatePhysics();
        this.updateAnimation(deltaTime);
        this.updateJumpInput();
    }

    /**
     * 물리 업데이트
     */
    updatePhysics() {
        // 점프 홀드 중 추가 상승력 적용
        if (this.isJumping && this.spacePressed && this.velocityY < 0) {
            const holdDuration = Date.now() - this.jumpStartTime;

            if (holdDuration < this.maxJumpHoldTime) {
                const holdRatio = holdDuration / this.maxJumpHoldTime;
                const additionalPower = (this.maxJumpPower - this.minJumpPower) * holdRatio;
                const targetVelocity = this.minJumpPower + additionalPower;
                this.velocityY = Math.max(this.velocityY - 0.3, targetVelocity);
            }
        }

        // 중력 적용
        if (!this.isGrounded) {
            this.velocityY += this.gravity;
        }

        // Y 위치 업데이트
        this.y += this.velocityY;

        // 지면 충돌 검사
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isGrounded = true;
            this.isJumping = false;
            this.jumpHoldTime = 0;
        }

        // 최대 점프 높이 제한
        if (this.y < this.groundY - this.maxJumpHeight) {
            this.y = this.groundY - this.maxJumpHeight;
            this.velocityY = 0;
        }
    }

    /**
     * 애니메이션 업데이트
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;

        if (this.isGrounded && this.animationTimer >= this.animationSpeed) {
            this.frameIndex = (this.frameIndex + 1) % this.frameCount;
            this.animationTimer = 0;
        }
    }

    /**
     * 점프 입력 상태 업데이트
     */
    updateJumpInput() {
        if (this.spacePressed && this.isJumping) {
            this.jumpHoldTime = Date.now() - this.jumpStartTime;
        }
    }

    /**
     * 렌더링
     */
    render(ctx, debugMode = false) {
        ctx.save();

        if (this.imagesLoaded) {
            // 점프 중일 때 점프 이미지
            if (this.isJumping && this.images.jump) {
                ctx.drawImage(this.images.jump, this.x, this.y, this.width, this.height);
            }
            // 지면에 있을 때 달리기 애니메이션
            else if (this.images.run.length > 0) {
                const currentFrame = this.images.run[this.frameIndex];
                if (currentFrame) {
                    ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
                } else {
                    this.renderPlaceholder(ctx);
                }
            } else {
                this.renderPlaceholder(ctx);
            }
        } else {
            this.renderPlaceholder(ctx);
        }

        if (debugMode) {
            this.renderHitbox(ctx);
        }

        ctx.restore();
    }

    /**
     * 히트박스 렌더링 (디버그용)
     */
    renderHitbox(ctx) {
        const bounds = this.getBounds();

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 플레이스홀더 렌더링 (이미지 로드 전)
     */
    renderPlaceholder(ctx) {
        ctx.fillStyle = this.isJumping ? '#FFB74D' : '#FF6B6B';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 눈
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 10, this.y + 10, 8, 8);
        ctx.fillRect(this.x + 25, this.y + 10, 8, 8);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 12, this.y + 12, 4, 4);
        ctx.fillRect(this.x + 27, this.y + 12, 4, 4);
    }

    /**
     * 충돌 박스 반환
     */
    getBounds() {
        return {
            x: this.x + GAME_CONSTANTS.PLAYER.HITBOX_PADDING_X,
            y: this.y + GAME_CONSTANTS.PLAYER.HITBOX_PADDING_Y,
            width: this.width - GAME_CONSTANTS.PLAYER.HITBOX_PADDING_X * 2,
            height: this.height - GAME_CONSTANTS.PLAYER.HITBOX_PADDING_Y * 2
        };
    }

    /**
     * 리셋
     */
    reset() {
        this.x = GAME_CONSTANTS.PLAYER.INITIAL_X;
        this.y = this.groundY;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.spacePressed = false;
        this.frameIndex = 0;
        this.animationTimer = 0;

        // 캐릭터가 변경되었을 수 있으므로 이미지 다시 로드
        this.loadImages();
    }

    /**
     * 디버그 정보
     */
    getDebugInfo() {
        return {
            position: `(${Math.round(this.x)}, ${Math.round(this.y)})`,
            velocity: Math.round(this.velocityY * 10) / 10,
            grounded: this.isGrounded,
            jumping: this.isJumping,
            holding: this.spacePressed,
            holdTime: Math.round(this.jumpHoldTime)
        };
    }
}
