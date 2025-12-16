/**
 * 玩家身份管理工具
 * 用于生成和管理玩家的唯一标识
 */

const PLAYER_USERNAME_KEY = 'racing_game_player_username';

/**
 * 生成随机玩家名称
 */
function generatePlayerName(): string {
    const adjectives = [
        '闪电', '疾风', '烈焰', '冰霜', '雷霆', '暗影', '光明', '钢铁',
        '幻影', '狂野', '神秘', '勇敢', '无畏', '传奇', '终极', '超级'
    ];

    const nouns = [
        '赛车手', '车神', '驾驶者', '飞行者', '冠军', '战士', '英雄', '传奇',
        '王者', '领袖', '大师', '专家', '先锋', '破坏者', '征服者', '挑战者'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999);

    return `${adjective}${noun}${number}`;
}

/**
 * 获取或创建玩家用户名
 * 如果本地存储中没有用户名，则生成一个新的
 */
export function getPlayerUsername(): string {
    if (typeof window === 'undefined') {
        // 服务端渲染时返回默认值
        return 'Player';
    }

    let username = localStorage.getItem(PLAYER_USERNAME_KEY);

    if (!username) {
        username = generatePlayerName();
        localStorage.setItem(PLAYER_USERNAME_KEY, username);
    }

    return username;
}

/**
 * 设置玩家用户名
 */
export function setPlayerUsername(username: string): void {
    if (typeof window === 'undefined') return;

    if (!username || username.trim().length < 3) {
        throw new Error('用户名至少需要3个字符');
    }

    localStorage.setItem(PLAYER_USERNAME_KEY, username.trim());
}

/**
 * 检查是否有已保存的玩家用户名
 */
export function hasPlayerUsername(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PLAYER_USERNAME_KEY) !== null;
}

/**
 * 清除玩家用户名（用于测试或重置）
 */
export function clearPlayerUsername(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PLAYER_USERNAME_KEY);
}