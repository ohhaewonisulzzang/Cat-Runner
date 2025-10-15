// 장애물 이미지 로딩 시스템
class ObstacleImageLoader {
    static images = {
        ground: {
            small: [],
            medium: [],
            large: []
        },
        air: {
            small: [],
            medium: [],
            large: []
        }
    };

    static loaded = false;
    static loading = false;

    static async loadImages() {
        if (this.loaded || this.loading) return;

        this.loading = true;
        console.log('장애물 이미지 로딩 시작...');

        try {
            // Ground 장애물 로드
            // ground small 이미지 로드 (4개)
            for (let i = 1; i <= 4; i++) {
                const img = new Image();
                img.src = `./src/assets/images/obstacles/glassland/ground/small/small_0${i}.png`;
                await this.loadImage(img);
                this.images.ground.small.push(img);
            }

            // ground medium 이미지 로드 (4개)
            for (let i = 1; i <= 4; i++) {
                const img = new Image();
                img.src = `./src/assets/images/obstacles/glassland/ground/medium/medium_0${i}.png`;
                await this.loadImage(img);
                this.images.ground.medium.push(img);
            }

            // ground large 이미지 로드 (6개)
            for (let i = 1; i <= 6; i++) {
                const img = new Image();
                img.src = `./src/assets/images/obstacles/glassland/ground/large/large_0${i}.png`;
                await this.loadImage(img);
                this.images.ground.large.push(img);
            }

            // Air 장애물 로드 (파일이 있는 경우에만)
            // air small 이미지 로드 시도
            try {
                for (let i = 1; i <= 4; i++) {
                    const img = new Image();
                    img.src = `./src/assets/images/obstacles/glassland/air/small/small_0${i}.png`;
                    await this.loadImage(img);
                    this.images.air.small.push(img);
                }
            } catch (e) {
                console.log('Air small 이미지 없음 - 기본 렌더링 사용');
            }

            // air medium 이미지 로드 시도
            try {
                for (let i = 1; i <= 4; i++) {
                    const img = new Image();
                    img.src = `./src/assets/images/obstacles/glassland/air/medium/medium_0${i}.png`;
                    await this.loadImage(img);
                    this.images.air.medium.push(img);
                }
            } catch (e) {
                console.log('Air medium 이미지 없음 - 기본 렌더링 사용');
            }

            // air large 이미지 로드 시도
            try {
                for (let i = 1; i <= 6; i++) {
                    const img = new Image();
                    img.src = `./src/assets/images/obstacles/glassland/air/large/large_0${i}.png`;
                    await this.loadImage(img);
                    this.images.air.large.push(img);
                }
            } catch (e) {
                console.log('Air large 이미지 없음 - 기본 렌더링 사용');
            }

            this.loaded = true;
            this.loading = false;
            console.log('장애물 이미지 로딩 완료!', {
                ground: {
                    small: this.images.ground.small.length,
                    medium: this.images.ground.medium.length,
                    large: this.images.ground.large.length
                },
                air: {
                    small: this.images.air.small.length,
                    medium: this.images.air.medium.length,
                    large: this.images.air.large.length
                }
            });
        } catch (error) {
            console.error('장애물 이미지 로딩 실패:', error);
            this.loading = false;
        }
    }

    static loadImage(img) {
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${img.src}`));
        });
    }

    static getRandomImage(type, size) {
        const images = this.images[type]?.[size];

        if (!images || images.length === 0) {
            console.warn(`${type}/${size} 이미지가 로드되지 않음 - 기본 렌더링 사용`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * images.length);
        return images[randomIndex];
    }
}

// 장애물 클래스
class Obstacle {
    constructor(x, y, type, size) {
        this.x = x;
        this.y = y;
        this.type = type; // 'ground' 또는 'air'
        this.size = size; // 'small', 'medium', 'large'

        // 크기 설정
        this.setSizeProperties();

        // 랜덤 이미지 선택 (타입과 크기에 따라)
        this.image = ObstacleImageLoader.getRandomImage(this.type, this.size);

        // 상태
        this.active = true;
        this.passed = false;

        // 애니메이션 (선택사항)
        this.animationFrame = 0;
        this.animationSpeed = 0.05;
    }
    
    // 크기에 따른 속성 설정
    setSizeProperties() {
        switch (this.size) {
            case 'small':
                this.width = 45;
                this.height = 45;
                break;
            case 'medium':
                this.width = 50;
                this.height = 50;
                break;
            case 'large':
                this.width = 70;
                this.height = 70;
                break;
            default:
                this.width = 50;
                this.height = 50;
        }

        // Ground 장애물의 Y 위치 조정 (플레이어 히트박스 아래 변과 동일)
        if (this.type === 'ground') {
            // 플레이어 히트박스 아래 변 Y = 695
            this.y = 695 - this.height;
        }

        // Air 장애물의 Y 위치 조정 (살짝 아래로 이동)
        if (this.type === 'air') {
            switch (this.size) {
                case 'small':
                    this.y = 530; // 점프로 닿을 수 있는 높이 (480 → 530)
                    break;
                case 'medium':
                    this.y = 470; // 중간 점프 높이 (420 → 470)
                    break;
                case 'large':
                    this.y = 430; // 높은 점프 필요 (380 → 430)
                    break;
            }
        }
    }
    
    // 업데이트
    update(gameSpeed, deltaTime) {
        if (!this.active) return;
        
        // 왼쪽으로 이동
        this.x -= gameSpeed;
        
        // 애니메이션 업데이트 (선택사항)
        this.animationFrame += this.animationSpeed;
        
        // 화면을 벗어나면 비활성화
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }
    
    // 렌더링
    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // 이미지가 있으면 이미지 렌더링, 없으면 기본 도형 렌더링
        if (this.image && ObstacleImageLoader.loaded) {
            this.renderImage(ctx);
        } else {
            // 장애물 색상 설정
            if (this.type === 'ground') {
                this.renderGroundObstacle(ctx);
            } else {
                this.renderAirObstacle(ctx);
            }
        }

        ctx.restore();
    }

    // 이미지 렌더링
    renderImage(ctx) {
        ctx.drawImage(
            this.image,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
    
    // 지면 장애물 렌더링
    renderGroundObstacle(ctx) {
        // 크기별 색상
        switch (this.size) {
            case 'small':
                ctx.fillStyle = '#8B4513'; // 갈색
                break;
            case 'medium':
                ctx.fillStyle = '#A0522D'; // 새들브라운
                break;
            case 'large':
                ctx.fillStyle = '#654321'; // 다크브라운
                break;
        }
        
        // 장애물 본체
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 그림자 효과
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // 장애물 다시 그리기 (그림자 위에)
        switch (this.size) {
            case 'small':
                ctx.fillStyle = '#8B4513';
                break;
            case 'medium':
                ctx.fillStyle = '#A0522D';
                break;
            case 'large':
                ctx.fillStyle = '#654321';
                break;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 텍스처 효과
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        ctx.fillRect(this.x, this.y, 3, this.height);
    }
    
    // 공중 장애물 렌더링
    renderAirObstacle(ctx) {
        // 크기별 색상
        switch (this.size) {
            case 'small':
                ctx.fillStyle = '#FF6B6B'; // 빨간색
                break;
            case 'medium':
                ctx.fillStyle = '#FF5722'; // 주황빨강
                break;
            case 'large':
                ctx.fillStyle = '#D32F2F'; // 진빨강
                break;
        }
        
        // 원형 장애물 (새 모양)
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 날개 효과 (애니메이션)
        const wingOffset = Math.sin(this.animationFrame * 5) * 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(centerX - radius * 0.3, centerY + wingOffset, radius * 0.4, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(centerX + radius * 0.3, centerY - wingOffset, radius * 0.4, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 눈
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.2, centerY - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.15, centerY - radius * 0.2, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 충돌 박스 반환
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // 통과 여부 확인
    checkPassed(playerX) {
        if (!this.passed && this.x + this.width < playerX) {
            this.passed = true;
            return true;
        }
        return false;
    }
    
    // 점수 값 반환
    getScoreValue() {
        switch (this.size) {
            case 'small': return 10;
            case 'medium': return 15;
            case 'large': return 20;
            default: return 10;
        }
    }
}

// 물 아이템 클래스
class WaterItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40; // 장애물의 70% 크기
        this.height = 40;
        this.active = true;
        this.collected = false;
        this.animationFrame = 0;
    }

    update(gameSpeed, deltaTime) {
        if (!this.active) return;

        this.x -= gameSpeed;
        this.animationFrame += 0.1;

        // 화면을 벗어나면 비활성화
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active || this.collected) return;

        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // 반짝이는 효과
        const glowRadius = this.width / 2 + Math.sin(this.animationFrame * 3) * 3;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 물병 본체
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(this.x + 10, this.y + 8, 20, 24);

        // 물병 뚜껑
        ctx.fillStyle = '#0288D1';
        ctx.fillRect(this.x + 12, this.y + 5, 16, 5);

        // 물병 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(this.x + 12, this.y + 10, 6, 15);

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

// 장애물 관리자 클래스
class ObstacleManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.obstacles = [];
        this.waterItems = []; // 물 아이템 배열
        this.spawnTimer = 0; // 생성 타이머
        this.spawnInterval = 1000; // 초기 생성 간격 (ms)
        this.waterSpawnTimer = 0; // 물 아이템 생성 타이머
        this.waterSpawnInterval = 6000; // 5-8초 평균 (6초)
        this.lastObstacleType = null;
        this.consecutiveCount = 0;
        this.groundRatio = 0.6; // 60% 지면, 40% 공중

        console.log('ObstacleManager 초기화 완료');
    }

    // 업데이트
    update(deltaTime) {
        if (!this.gameState.isState('playing')) return;

        const gameSpeed = this.gameState.gameData.gameSpeed;
        const currentMap = this.gameState.gameData.currentMap;

        // 기존 장애물 업데이트
        for (let i = 0; i < this.obstacles.length; i++) {
            this.obstacles[i].update(gameSpeed, deltaTime);
        }

        // 물 아이템 업데이트 (용암 맵에서만)
        if (currentMap === 'lava') {
            for (let i = 0; i < this.waterItems.length; i++) {
                this.waterItems[i].update(gameSpeed, deltaTime);
            }
        }

        // 비활성화된 장애물 제거
        const beforeCount = this.obstacles.length;
        this.obstacles = this.obstacles.filter(obstacle => obstacle.active);
        this.waterItems = this.waterItems.filter(item => item.active);
        const afterCount = this.obstacles.length;

        if (beforeCount !== afterCount) {
            console.log(`장애물 제거됨: ${beforeCount} -> ${afterCount}`);
        }

        // 타이머 기반 장애물 생성
        this.spawnTimer += deltaTime;

        // 난이도에 따라 생성 간격 조정
        const difficulty = this.gameState.gameData.difficultyLevel;
        this.spawnInterval = Math.max(400, 1200 - (difficulty * 80));

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            console.log(`장애물 생성! 현재 개수: ${this.obstacles.length}, 난이도: ${difficulty}`);
        }

        // 물 아이템 생성 (용암 맵에서만)
        if (currentMap === 'lava') {
            this.waterSpawnTimer += deltaTime;

            // 5-8초마다 랜덤 생성
            const randomInterval = 5000 + Math.random() * 3000;
            if (this.waterSpawnTimer >= randomInterval) {
                // 최대 2개까지만 화면에 존재
                const activeWaterItems = this.waterItems.filter(item => item.active).length;
                if (activeWaterItems < 2) {
                    this.spawnWaterItem();
                }
                this.waterSpawnTimer = 0;
            }
        }
    }

    // 물 아이템 생성
    spawnWaterItem() {
        const x = 1280 + 100; // 화면 밖
        const y = 400 + Math.random() * 200; // 랜덤 높이 (400-600)

        const waterItem = new WaterItem(x, y);
        this.waterItems.push(waterItem);
        console.log(`물 아이템 생성! Y: ${y}`);
    }

    // 장애물 생성
    spawnObstacle() {
        // 화면 우측에서 생성
        const x = 1280 + 100; // 화면 밖 100px

        // 타입 결정
        const type = this.determineType();

        // 크기 결정
        const size = this.determineSize();

        // Y 위치 결정
        const y = type === 'ground' ? 620 : 400;

        // 장애물 생성
        const obstacle = new Obstacle(x, y, type, size);
        this.obstacles.push(obstacle);

        this.updateConsecutiveCount(type);
    }
    
    // 거리 계산 (점진적 난이도 증가)
    calculateDistance() {
        const difficulty = this.gameState.gameData.difficultyLevel;
        const gameTime = this.gameState.gameData.gameTime;

        // 기본 거리 설정 (적당한 난이도로 시작)
        let minDist, maxDist;

        // 난이도별 기본 거리
        switch (difficulty) {
            case 1: // 처음 (쉬움)
                minDist = 300;
                maxDist = 450;
                break;
            case 2: // 약간 쉬움
                minDist = 250;
                maxDist = 400;
                break;
            case 3: // 보통
                minDist = 220;
                maxDist = 350;
                break;
            case 4: // 약간 어려움
                minDist = 180;
                maxDist = 300;
                break;
            case 5: // 어려움
                minDist = 150;
                maxDist = 250;
                break;
            case 6: // 매우 어려움
                minDist = 120;
                maxDist = 200;
                break;
            case 7: // 극도로 어려움
                minDist = 100;
                maxDist = 170;
                break;
            case 8: // 최고 난이도
                minDist = 80;
                maxDist = 140;
                break;
            case 9: // 극한 난이도
                minDist = 70;
                maxDist = 110;
                break;
            case 10: // 악몽 난이도
                minDist = 60;
                maxDist = 90;
                break;
            default:
                minDist = 300;
                maxDist = 450;
        }

        // 시간 기반 점진적 감소
        // 30초마다 12% 감소, 최대 48% 감소
        const timeReduction = Math.min(gameTime / 30, 4) * 0.12;
        minDist = Math.max(minDist * (1 - timeReduction), minDist * 0.5);
        maxDist = Math.max(maxDist * (1 - timeReduction), maxDist * 0.5);

        return Math.random() * (maxDist - minDist) + minDist;
    }
    
    // 타입 결정
    determineType() {
        // 연속 방지
        if (this.consecutiveCount >= 2 && this.lastObstacleType) {
            return this.lastObstacleType === 'ground' ? 'air' : 'ground';
        }
        
        // 확률 기반 선택
        return Math.random() < this.groundRatio ? 'ground' : 'air';
    }
    
    // 크기 결정 (점진적 난이도 증가)
    determineSize() {
        const difficulty = this.gameState.gameData.difficultyLevel;
        const gameTime = this.gameState.gameData.gameTime;
        const rand = Math.random();

        // 기본 큰 장애물 확률
        let largeProbability, mediumProbability;

        switch (difficulty) {
            case 1: // 처음 (작은 장애물 위주)
                largeProbability = 0.0;
                mediumProbability = 0.15;
                break;
            case 2: // 쉬움
                largeProbability = 0.05;
                mediumProbability = 0.2;
                break;
            case 3: // 보통
                largeProbability = 0.1;
                mediumProbability = 0.25;
                break;
            case 4: // 약간 어려움
                largeProbability = 0.15;
                mediumProbability = 0.3;
                break;
            case 5: // 어려움
                largeProbability = 0.25;
                mediumProbability = 0.3;
                break;
            case 6: // 매우 어려움
                largeProbability = 0.35;
                mediumProbability = 0.3;
                break;
            case 7: // 극도로 어려움
                largeProbability = 0.45;
                mediumProbability = 0.3;
                break;
            case 8: // 최고 난이도
                largeProbability = 0.55;
                mediumProbability = 0.3;
                break;
            case 9: // 극한 난이도
                largeProbability = 0.7;
                mediumProbability = 0.2;
                break;
            case 10: // 악몽 난이도
                largeProbability = 0.85;
                mediumProbability = 0.1;
                break;
            default:
                largeProbability = 0.0;
                mediumProbability = 0.15;
        }

        // 시간 기반 점진적 증가
        // 20초마다 6% 증가, 최대 30%
        const timeBonus = Math.min(gameTime / 20, 5) * 0.06;
        largeProbability = Math.min(largeProbability + timeBonus, 0.9);

        if (rand < largeProbability) {
            return 'large';
        } else if (rand < largeProbability + mediumProbability) {
            return 'medium';
        } else {
            return 'small';
        }
    }
    
    // 연속 카운트 업데이트
    updateConsecutiveCount(type) {
        if (this.lastObstacleType === type) {
            this.consecutiveCount++;
        } else {
            this.consecutiveCount = 1;
        }
        this.lastObstacleType = type;
    }
    
    // 충돌 검사
    checkCollisions(player) {
        const playerBounds = player.getBounds();

        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;

            const obstacleBounds = obstacle.getBounds();

            if (this.isColliding(playerBounds, obstacleBounds)) {
                return true;
            }
        }

        return false;
    }

    // 물 아이템 획득 검사
    checkWaterCollection(player) {
        const playerBounds = player.getBounds();

        for (const waterItem of this.waterItems) {
            if (!waterItem.active || waterItem.collected) continue;

            const itemBounds = waterItem.getBounds();

            if (this.isColliding(playerBounds, itemBounds)) {
                waterItem.collect();
                this.gameState.recoverHeatGauge();
                this.showWaterEffect();
                console.log('물 아이템 획득! 게이지 +25%');
                return true;
            }
        }

        return false;
    }

    // 물 아이템 획득 효과
    showWaterEffect() {
        const heatGauge = document.getElementById('heatGauge');
        if (heatGauge) {
            heatGauge.classList.add('recovered');
            setTimeout(() => {
                heatGauge.classList.remove('recovered');
            }, 300);
        }
    }
    
    // 충돌 판정
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 통과한 장애물 확인
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
    
    // 렌더링
    render(ctx) {
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx);
        });

        // 물 아이템 렌더링
        this.waterItems.forEach(waterItem => {
            waterItem.render(ctx);
        });
    }
    
    // 리셋
    reset() {
        this.obstacles = [];
        this.waterItems = [];
        this.spawnTimer = 0;
        this.waterSpawnTimer = 0;
        this.lastObstacleType = null;
        this.consecutiveCount = 0;
        console.log('ObstacleManager 리셋 완료');
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            obstacleCount: this.obstacles.length,
            activeObstacles: this.obstacles.filter(o => o.active).length,
            spawnTimer: Math.round(this.spawnTimer),
            spawnInterval: this.spawnInterval,
            consecutiveType: `${this.lastObstacleType} x${this.consecutiveCount}`
        };
    }
}