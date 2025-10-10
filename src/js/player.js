// 플레이어 캐릭터 클래스
class Player {
    constructor(x, y, gameState) {
        this.x = x;
        this.y = y;
        this.width = 90;
        this.height = 90;
        this.gameState = gameState;

        // 물리 속성
        this.velocityY = 0;
        this.gravity = 0.6;
        this.isGrounded = false;
        this.groundY = y;

        // 점프 관련
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPower = 0;
        this.maxJumpHeight = 250;

        // 애니메이션
        this.frameIndex = 0;
        this.frameCount = 4;
        this.animationSpeed = 100; // 밀리초 단위 (100ms = 0.1초)
        this.animationTimer = 0;

        // 입력 상태
        this.spacePressed = false;
        this.spaceDownTime = 0;

        // 이미지 로드
        this.images = {
            run: [],
            jump: null
        };
        this.imagesLoaded = false;
        this.loadImages();

        // 이벤트 리스너 등록
        this.initializeControls();
    }

    // 이미지 로드
    loadImages() {
        const imagesToLoad = 5; // run_1 ~ run_4 + jump
        let loadedCount = 0;

        // 달리기 이미지 로드
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === imagesToLoad) {
                    this.imagesLoaded = true;
                    console.log('플레이어 이미지 로드 완료!');
                }
            };
            img.onerror = () => {
                console.error(`이미지 로드 실패: cat_run_${i}.png`);
                loadedCount++;
            };
            img.src = `src/assets/images/player/cat_run_${i}.png`;
            this.images.run.push(img);
        }

        // 점프 이미지 로드
        const jumpImg = new Image();
        jumpImg.onload = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad) {
                this.imagesLoaded = true;
                console.log('플레이어 이미지 로드 완료!');
            }
        };
        jumpImg.onerror = () => {
            console.error('이미지 로드 실패: cat_jump.png');
            loadedCount++;
        };
        jumpImg.src = 'src/assets/images/player/cat_jump.png';
        this.images.jump = jumpImg;
    }
    
    // 컨트롤 초기화
    initializeControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 터치 이벤트 (모바일 지원)
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    // 키보드 입력 처리
    handleKeyDown(e) {
        if (e.code === 'Space' && this.gameState.isState('playing')) {
            e.preventDefault();
            if (!this.spacePressed && this.isGrounded) {
                this.startJump();
            }
        }
    }
    
    handleKeyUp(e) {
        if (e.code === 'Space' && this.gameState.isState('playing')) {
            e.preventDefault();
            if (this.spacePressed) {
                this.executeJump();
            }
        }
    }
    
    // 터치 입력 처리
    handleTouchStart(e) {
        if (this.gameState.isState('playing')) {
            e.preventDefault();
            if (!this.spacePressed && this.isGrounded) {
                this.startJump();
            }
        }
    }
    
    handleTouchEnd(e) {
        if (this.gameState.isState('playing')) {
            e.preventDefault();
            if (this.spacePressed) {
                this.executeJump();
            }
        }
    }
    
    // 점프 시작
    startJump() {
        this.spacePressed = true;
        this.spaceDownTime = Date.now();
    }
    
    // 점프 실행
    executeJump() {
        if (!this.isGrounded) return;
        
        const pressDuration = Date.now() - this.spaceDownTime;
        
        // 점프 파워 계산 (누른 시간에 따라)
        if (pressDuration < 100) {
            this.jumpPower = -10; // 짧은 점프
        } else if (pressDuration < 300) {
            this.jumpPower = -13; // 중간 점프
        } else {
            this.jumpPower = -16; // 높은 점프
        }
        
        this.velocityY = this.jumpPower;
        this.isGrounded = false;
        this.isJumping = true;
        this.spacePressed = false;
        
        // 점프 사운드 재생 (사운드 구현 시)
        if (this.gameState.gameData.sfxEnabled) {
            // playSound('jump');
        }
    }
    
    // 업데이트
    update(deltaTime) {
        if (!this.gameState.isState('playing')) return;
        
        // 물리 업데이트
        this.updatePhysics();
        
        // 애니메이션 업데이트
        this.updateAnimation(deltaTime);
        
        // 점프 입력 상태 확인
        this.updateJumpInput();
    }
    
    // 물리 업데이트
    updatePhysics() {
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
        }
        
        // 최대 점프 높이 제한
        if (this.y < this.groundY - this.maxJumpHeight) {
            this.y = this.groundY - this.maxJumpHeight;
            this.velocityY = 0;
        }
    }
    
    // 애니메이션 업데이트
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // 지면에 있을 때만 달리기 애니메이션
        if (this.isGrounded && this.animationTimer >= this.animationSpeed) {
            this.frameIndex = (this.frameIndex + 1) % this.frameCount;
            this.animationTimer = 0;
        }
    }
    
    // 점프 입력 상태 업데이트
    updateJumpInput() {
        // 점프 차징 표시 (선택사항)
        if (this.spacePressed && this.isGrounded) {
            const chargeDuration = Date.now() - this.spaceDownTime;
            // 차징 표시 로직 (UI에서 처리)
        }
    }
    
    // 렌더링
    render(ctx) {
        ctx.save();

        // 이미지가 로드되었으면 이미지 렌더링
        if (this.imagesLoaded) {
            // 점프 중일 때 점프 이미지 사용
            if (this.isJumping && this.images.jump && this.images.jump.complete) {
                ctx.drawImage(this.images.jump, this.x, this.y, this.width, this.height);
            }
            // 지면에 있을 때 달리기 애니메이션
            else if (this.images.run.length > 0) {
                const currentFrame = this.images.run[this.frameIndex];
                if (currentFrame && currentFrame.complete) {
                    ctx.drawImage(currentFrame, this.x, this.y, this.width, this.height);
                } else {
                    this.renderPlaceholder(ctx);
                }
            } else {
                this.renderPlaceholder(ctx);
            }
        } else {
            // 이미지 로드 전 임시 렌더링
            this.renderPlaceholder(ctx);
        }

        // 점프 차징 표시
        if (this.spacePressed && this.isGrounded) {
            this.renderJumpCharge(ctx);
        }

        ctx.restore();
    }

    // 임시 플레이스홀더 렌더링
    renderPlaceholder(ctx) {
        // 플레이어 색상 (이미지 로드 전 임시)
        ctx.fillStyle = '#FF6B6B';

        // 점프 중일 때 색상 변경
        if (this.isJumping) {
            ctx.fillStyle = '#FFB74D';
        }

        // 점프 차징 중일 때 색상 변경
        if (this.spacePressed && this.isGrounded) {
            const chargeDuration = Date.now() - this.spaceDownTime;
            if (chargeDuration > 300) {
                ctx.fillStyle = '#4CAF50'; // 최대 차지
            } else if (chargeDuration > 100) {
                ctx.fillStyle = '#FFC107'; // 중간 차지
            } else {
                ctx.fillStyle = '#FF9800'; // 최소 차지
            }
        }

        // 캐릭터 그리기
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 눈 그리기
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 10, this.y + 10, 8, 8);
        ctx.fillRect(this.x + 25, this.y + 10, 8, 8);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 12, this.y + 12, 4, 4);
        ctx.fillRect(this.x + 27, this.y + 12, 4, 4);
    }
    
    // 점프 차징 표시
    renderJumpCharge(ctx) {
        const chargeDuration = Date.now() - this.spaceDownTime;
        const chargeRatio = Math.min(chargeDuration / 300, 1); // 최대 300ms
        
        // 차징 바 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y - 15, this.width, 5);
        
        // 차징 바
        if (chargeRatio < 0.33) {
            ctx.fillStyle = '#FF9800'; // 주황색
        } else if (chargeRatio < 0.67) {
            ctx.fillStyle = '#FFC107'; // 노란색
        } else {
            ctx.fillStyle = '#4CAF50'; // 녹색
        }
        
        ctx.fillRect(this.x, this.y - 15, this.width * chargeRatio, 5);
    }
    
    // 충돌 박스 반환
    getBounds() {
        // 실제 충돌 판정을 위해 약간 작게 설정
        const padding = 5;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
    
    // 리셋
    reset() {
        this.x = 256; // 화면 왼쪽 20% 지점
        this.y = this.groundY;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.spacePressed = false;
        this.frameIndex = 0;
        this.animationTimer = 0;
    }
    
    // 디버그 정보 출력
    getDebugInfo() {
        return {
            position: `(${Math.round(this.x)}, ${Math.round(this.y)})`,
            velocity: Math.round(this.velocityY * 10) / 10,
            grounded: this.isGrounded,
            jumping: this.isJumping,
            charging: this.spacePressed
        };
    }
}