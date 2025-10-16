// 이미지 로딩 유틸리티
export class ImageLoader {
    /**
     * 단일 이미지 로드
     * @param {string} src - 이미지 경로
     * @returns {Promise<HTMLImageElement>}
     */
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
            img.src = src;
        });
    }

    /**
     * 여러 이미지를 병렬로 로드
     * @param {string[]} srcs - 이미지 경로 배열
     * @returns {Promise<HTMLImageElement[]>}
     */
    static loadImages(srcs) {
        return Promise.all(srcs.map(src => this.loadImage(src)));
    }

    /**
     * 이미지 로드 (실패 시 null 반환)
     * @param {string} src - 이미지 경로
     * @returns {Promise<HTMLImageElement|null>}
     */
    static loadImageSafe(src) {
        return this.loadImage(src).catch(error => {
            console.warn(`이미지 로드 실패 (무시): ${src}`);
            return null;
        });
    }

    /**
     * 여러 이미지를 안전하게 로드 (실패한 이미지는 null)
     * @param {string[]} srcs - 이미지 경로 배열
     * @returns {Promise<(HTMLImageElement|null)[]>}
     */
    static loadImagesSafe(srcs) {
        return Promise.all(srcs.map(src => this.loadImageSafe(src)));
    }

    /**
     * 이미지 캐시 관리자
     */
    static cache = new Map();

    /**
     * 캐시된 이미지 로드 (이미 로드된 이미지는 캐시에서 반환)
     * @param {string} src - 이미지 경로
     * @returns {Promise<HTMLImageElement>}
     */
    static loadImageCached(src) {
        if (this.cache.has(src)) {
            return Promise.resolve(this.cache.get(src));
        }

        return this.loadImage(src).then(img => {
            this.cache.set(src, img);
            return img;
        });
    }

    /**
     * 캐시 클리어
     */
    static clearCache() {
        this.cache.clear();
    }
}
