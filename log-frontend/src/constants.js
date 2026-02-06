// Renkler, tipler ve sabit metinler burada yönetilir.

export const LOG_SOURCES = {
    WEB: 'WEB',
    MOBILE: 'MOBILE',
    API: 'API'
};

export const LOG_REASONS = {
    SUCCESS: 'SUCCESS',
    TIMEOUT: 'TIMEOUT',
    DB_ERROR: 'DB_ERROR',
    AUTH_FAIL: 'AUTH_FAIL'
};

export const SEARCH_MODES = {
    ELASTIC: 'Elasticsearch (Arama)',
    CLICKHOUSE: 'ClickHouse (Liste)'
};

// UI ile ilgili sabitler
export const UI_COLORS = {
    LIGHT_BG: '#f0f2f5',
    DARK_BG: '#141414',
    CODE_LIGHT: '#f5f5f5',
    CODE_DARK: '#333'
};