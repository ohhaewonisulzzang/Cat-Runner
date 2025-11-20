// 게임 상수 정의
export const GAME_CONSTANTS = {
    // 캔버스 크기
    CANVAS: {
        WIDTH: 1280,
        HEIGHT: 720,
        ASPECT_RATIO: 16 / 9
    },

    // 게임 상태
    STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver',
        SETTINGS: 'settings'
    },

    // 맵 타입
    MAPS: {
        NORMAL: 'normal',
        LAVA: 'lava',
        ICE: 'ice',
        ARGENTINA: 'argentina'
    },

    // 맵 전환 점수 기준
    MAP_TRANSITIONS: {
        LAVA_THRESHOLD: 1000,
        ICE_THRESHOLD: 3000,
        ARGENTINA_THRESHOLD: 6500
    },

    // 배경 맵 점수 기준
    BACKGROUND_TRANSITIONS: {
        GRASSLAND: {
            MAP_01: { min: 0, max: 350 },
            MAP_02: { min: 351, max: 700 },
            MAP_03: { min: 701, max: 1000 }
        },
        LAVA: {
            MAP_01: { min: 1000, max: 2000 },
            MAP_02: { min: 2001, max: 3000 }
        },
        ICE: {
            MAP_01: { min: 3001, max: 4000 },
            MAP_02: { min: 4001, max: 5000 },
            MAP_03: { min: 5001, max: 6500 }
        },
        ARGENTINA: {
            MAP_01: { min: 6500, max: 7499 },
            MAP_02: { min: 7500, max: 8499 },
            MAP_03: { min: 8500, max: 9499 },
            MAP_04: { min: 9500, max: Infinity }
        }
    },

    // 플레이어 설정
    PLAYER: {
        WIDTH: 130,
        HEIGHT: 130,
        INITIAL_X: 256,
        INITIAL_Y: 590,
        GROUND_Y: 590,

        // 물리
        GRAVITY: 0.6,
        MIN_JUMP_POWER: -10,
        MAX_JUMP_POWER: -16,
        MAX_JUMP_HEIGHT: 250,
        MAX_JUMP_HOLD_TIME: 300,

        // 애니메이션
        FRAME_COUNT: 4,
        ANIMATION_SPEED: 100,

        // 히트박스 패딩
        HITBOX_PADDING_X: 25,
        HITBOX_PADDING_Y: 20
    },

    // 장애물 설정
    OBSTACLE: {
        TYPES: {
            GROUND: 'ground',
            AIR: 'air'
        },

        SIZES: {
            SMALL: 'small',
            MEDIUM: 'medium',
            LARGE: 'large'
        },

        DIMENSIONS: {
            SMALL: { width: 60, height: 60 },
            MEDIUM: { width: 75, height: 75 },
            LARGE: { width: 95, height: 95 }
        },

        AIR_POSITIONS: {
            SMALL: 520,
            MEDIUM: 450,
            LARGE: 400
        },

        GROUND_Y: 695,

        SCORE_VALUES: {
            SMALL: 10,
            MEDIUM: 15,
            LARGE: 20
        },

        SPAWN_X: 1280 + 100,
        GROUND_RATIO: 0.6,
        INITIAL_SPAWN_INTERVAL: 1000,
        MIN_SPAWN_INTERVAL: 400
    },

    // 물 아이템 설정
    WATER_ITEM: {
        WIDTH: 80,
        HEIGHT: 80,
        SPAWN_INTERVAL: { MIN: 5000, MAX: 8000 },
        MAX_ACTIVE: 2,
        RECOVERY_AMOUNT: 25,
        Y_RANGE: { MIN: 400, MAX: 600 }
    },

    // 더위 게이지 설정
    HEAT_GAUGE: {
        MAX: 100,
        DECAY_RATE: 1, // 0.4초마다 1% 감소
        DECAY_INTERVAL: 400,
        WARNING_THRESHOLD: 50,
        CRITICAL_THRESHOLD: 30
    },

    // 난이도 설정
    DIFFICULTY: {
        INITIAL_SPEED: 6,
        MAX_SPEED: 20,
        MAX_LEVEL: 10,
        TIME_LEVEL_INTERVAL: 30,
        SPEED_INCREASE_INTERVAL: 15,
        SPEED_INCREASE_PER_INTERVAL: 0.5
    },

    // 점수 설정
    SCORE: {
        TIME_INTERVAL: 100, // 0.1초마다 1점
        TIME_POINTS: 1
    },

    // 게임 루프
    GAME_LOOP: {
        TARGET_FPS: 60,
        FIXED_TIME_STEP: 1000 / 60
    },

    // 배경 스크롤
    BACKGROUND: {
        SCROLL_SPEED_MULTIPLIER: 0.3,
        ICE_SCROLL_SPEED_MULTIPLIER: 0.05,
        TRANSITION_DURATION: 500,
        TRANSITION_SPEED: 0.002
    },

    // 길 이미지
    ROAD: {
        WIDTH: 1280,
        HEIGHT: 300
    },

    // 디버그
    DEBUG: {
        DEFAULT_ENABLED: false,
        TEST_MODE_ENABLED: false
    }
};

// 키 코드 정의
export const KEY_CODES = {
    SPACE: 'Space',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    BACKQUOTE: 'Backquote',
    F12: 'F12',
    DIGIT_1: 'Digit1',
    DIGIT_2: 'Digit2',
    DIGIT_3: 'Digit3'
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
    HIGH_SCORE: 'catRunnerHighScore',
    SOUND_ENABLED: 'catRunnersoundEnabled',
    SFX_ENABLED: 'catRunnersfxEnabled',
    TOTAL_PLAY_TIME: 'catRunnerTotalPlayTime',
    GAMES_PLAYED: 'catRunnerGamesPlayed',
    TOTAL_OBSTACLES: 'catRunnerTotalObstacles'
};

// 이미지 경로
export const IMAGE_PATHS = {
    PLAYER: {
        RUN: (index) => `src/assets/images/player/cat/cat_run_${index}.png`,
        JUMP: 'src/assets/images/player/cat/cat_jump.png'
    },

    BACKGROUND: {
        GRASSLAND: {
            MAP_01: 'src/assets/images/background/glassland/map_01.png',
            MAP_02: 'src/assets/images/background/glassland/map_02.png',
            MAP_03: 'src/assets/images/background/glassland/map_03.png'
        },
        LAVA: {
            MAP_01: 'src/assets/images/background/lava/map_01.png',
            MAP_02: 'src/assets/images/background/lava/map_02.png'
        },
        ICE: {
            MAP_01: 'src/assets/images/background/ice/map_01.png',
            MAP_02: 'src/assets/images/background/ice/map_02.png',
            MAP_03: 'src/assets/images/background/ice/map_03.png'
        },
        ARGENTINA: {
            MAP_01: 'src/assets/images/background/argentina/map_01.png',
            MAP_02: 'src/assets/images/background/argentina/map_02.png',
            MAP_03: 'src/assets/images/background/argentina/map_03.png',
            MAP_04: 'src/assets/images/background/argentina/map_04.png'
        }
    },

    ROAD: {
        GRASSLAND: 'src/assets/images/load/glassland/load.png',
        LAVA: 'src/assets/images/load/lava/load.png',
        ICE: 'src/assets/images/load/ice/load.png'
    },

    OBSTACLES: {
        GRASSLAND: {
            GROUND: {
                SMALL: (index) => `./src/assets/images/obstacles/glassland/ground/small/small_0${index}.png`,
                MEDIUM: (index) => `./src/assets/images/obstacles/glassland/ground/medium/medium_0${index}.png`,
                LARGE: (index) => `./src/assets/images/obstacles/glassland/ground/large/large_0${index}.png`
            },
            AIR: {
                SMALL: './src/assets/images/obstacles/glassland/air/small/small_03.png',
                MEDIUM: './src/assets/images/obstacles/glassland/air/medium/medium_02.png',
                LARGE: './src/assets/images/obstacles/glassland/air/large/large_01.png'
            }
        }
    },

    ITEMS: {
        WATER_BOTTLE: 'src/assets/images/icons/waterbottle.png'
    }
};

// 오디오 경로
export const AUDIO_PATHS = {
    BGM: 'src/assets/sounds/bgm.mp3',
    JUMP: 'src/assets/sounds/jump.mp3',
    TANGO: 'src/assets/sounds/tango.mp3'
};
