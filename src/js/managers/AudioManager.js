import { AUDIO_PATHS } from '../config/constants.js';

/**
 * 오디오 관리자
 */
export class AudioManager {
    constructor() {
        this.bgm = null;
        this.bgmLoaded = false;
        this.isMuted = false;

        this.initializeBGM();
    }

    initializeBGM() {
        try {
            this.bgm = new Audio(AUDIO_PATHS.BGM);
            this.bgm.loop = true;
            this.bgm.volume = 0.5; // 기본 볼륨 50%

            // BGM 로드 완료 이벤트
            this.bgm.addEventListener('canplaythrough', () => {
                this.bgmLoaded = true;
                console.log('BGM 로드 완료');
            });

            // 로드 에러 처리
            this.bgm.addEventListener('error', (e) => {
                console.error('BGM 로드 실패:', e);
                this.bgmLoaded = false;
            });

            console.log('BGM 초기화 완료');
        } catch (error) {
            console.error('BGM 초기화 실패:', error);
        }
    }

    playBGM() {
        if (!this.bgm || !this.bgmLoaded || this.isMuted) return;

        // 이미 재생 중이면 무시
        if (!this.bgm.paused) return;

        const playPromise = this.bgm.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('BGM 재생 시작');
                })
                .catch(error => {
                    console.log('BGM 자동 재생 차단됨 (사용자 상호작용 필요):', error);
                });
        }
    }

    pauseBGM() {
        if (!this.bgm) return;

        if (!this.bgm.paused) {
            this.bgm.pause();
            console.log('BGM 일시정지');
        }
    }

    stopBGM() {
        if (!this.bgm) return;

        this.bgm.pause();
        this.bgm.currentTime = 0;
        console.log('BGM 정지');
    }

    setVolume(volume) {
        if (!this.bgm) return;

        // 볼륨 범위: 0.0 ~ 1.0
        this.bgm.volume = Math.max(0, Math.min(1, volume));
    }

    toggleMute(muted) {
        this.isMuted = muted;

        if (muted) {
            this.pauseBGM();
        }
    }

    // BGM이 재생 중인지 확인
    isPlaying() {
        return this.bgm && !this.bgm.paused;
    }
}
