// 충돌 검사 유틸리티
export class CollisionDetector {
    /**
     * AABB (Axis-Aligned Bounding Box) 충돌 검사
     * @param {Object} rect1 - {x, y, width, height}
     * @param {Object} rect2 - {x, y, width, height}
     * @returns {boolean}
     */
    static checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 원형 충돌 검사
     * @param {Object} circle1 - {x, y, radius}
     * @param {Object} circle2 - {x, y, radius}
     * @returns {boolean}
     */
    static checkCircle(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }

    /**
     * 점이 사각형 안에 있는지 검사
     * @param {Object} point - {x, y}
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
}
