// 메인 진입점
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cat Runner 게임 초기화 중...');
    
    // 게임 엔진 인스턴스 생성
    let gameEngine;
    
    try {
        gameEngine = new GameEngine();
        console.log('게임 엔진 초기화 완료');
        
        // 전역 스코프에 게임 엔진 등록 (디버깅용)
        window.gameEngine = gameEngine;
        
        // 게임 준비 완료 메시지
        console.log('Cat Runner 게임이 준비되었습니다!');
        console.log('조작법:');
        console.log('- 스페이스바: 점프 (누르는 시간에 따라 높이 조절)');
        console.log('- ESC: 일시정지/재개');
        console.log('- F12: 디버그 모드 토글');
        
        // 성능 모니터링 (개발용)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            startPerformanceMonitoring();
        }
        
    } catch (error) {
        console.error('게임 초기화 중 오류 발생:', error);
        showErrorMessage('게임 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
    }
    
    // 성능 모니터링 함수 (개발용)
    function startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function measureFPS() {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // 성능 경고
                if (fps < 45) {
                    console.warn(`낮은 FPS 감지: ${fps} FPS`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        }
        
        measureFPS();
    }
    
    // 에러 메시지 표시 함수
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <h3>오류 발생</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ff4444;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">새로고침</button>
        `;
        document.body.appendChild(errorDiv);
    }
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', function() {
        if (gameEngine) {
            gameEngine.stop();
        }
    });
    
    // 페이지 가시성 변경 시 처리 (탭 전환 등)
    document.addEventListener('visibilitychange', function() {
        if (gameEngine && gameEngine.gameState) {
            if (document.hidden && gameEngine.gameState.isState('playing')) {
                // 페이지가 숨겨지면 자동으로 일시정지
                gameEngine.gameState.setState('paused');
            }
        }
    });
    
    // 터치 디바이스 감지 및 안내
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        console.log('터치 디바이스가 감지되었습니다. 화면을 터치하여 점프할 수 있습니다.');
        
        // 터치 디바이스용 추가 안내
        const controlsDiv = document.getElementById('controls');
        if (controlsDiv) {
            const originalText = controlsDiv.textContent;
            controlsDiv.innerHTML = `
                ${originalText}<br>
                <span style="font-size: 12px; opacity: 0.8;">터치: 점프</span>
            `;
        }
    }
    
    // 브라우저 호환성 체크
    checkBrowserCompatibility();
    
    function checkBrowserCompatibility() {
        const canvas = document.createElement('canvas');
        const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        try {
            const ctx2d = canvas.getContext('2d');
            // Canvas 2D 지원 여부와 관계없이 게임 진행
        } catch (error) {
            console.log('Canvas 접근 중 오류가 있지만 게임을 계속 진행합니다.');
        }
        
        if (!window.requestAnimationFrame) {
            console.log('requestAnimationFrame 미지원 - 대체 방식 사용');
        }
        
        if (!window.localStorage) {
            console.log('localStorage 미지원 - 점수 저장 기능 제한');
        }
        
        console.log('브라우저 호환성 검사 완료 - 게임 실행');
    }
    
    // 개발자 도구 감지 및 치트 방지 (선택사항)
    let devtools = false;
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
            if (!devtools) {
                devtools = true;
                console.log('개발자 도구가 감지되었습니다.');
                console.log('게임을 즐기고 계시는군요! 소스코드도 함께 구경해보세요 😊');
            }
        } else {
            devtools = false;
        }
    }, 500);
    
    // 키보드 단축키 안내 (개발용)
    console.log('\n=== 개발자 도구 명령어 ===');
    console.log('gameEngine.debugMode = true - 디버그 모드 활성화');
    console.log('gameEngine.gameState.updateScore(1000) - 점수 추가');
    console.log('gameEngine.gameState.gameData.gameSpeed = 10 - 게임 속도 변경');
    console.log('gameEngine.resetGame() - 게임 리셋');
    console.log('gameEngine.getGameStats() - 게임 통계 확인');
    
    // 게임 로딩 완료 이벤트
    const gameLoadedEvent = new CustomEvent('gameLoaded', {
        detail: { engine: gameEngine }
    });
    document.dispatchEvent(gameLoadedEvent);
});