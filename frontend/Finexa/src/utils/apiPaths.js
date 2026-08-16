export const API_PATHS = {
  AUTH: {
    REGISTER: "/auth/register",
    REGISTER_SEND_OTP: "/auth/register/send-otp",
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    GOOGLE: "/auth/google",
    GOOGLE_SEND_OTP: "/auth/google/send-otp",
    GOOGLE_VERIFY_OTP: "/auth/google/verify",
    ME: "/auth/me",
    UPDATE_ME: "/auth/me",
    UPDATE_PROFILE: "/auth/me/profile",
    CHANGE_PASSWORD: "/auth/me/password",
    UPDATE_SETTINGS: "/auth/me/settings",
    EXPORT: "/auth/me/export",
    DELETE_ACCOUNT: "/auth/me",
    SEND_EMAIL_OTP: "/auth/me/send-email-otp",
  },
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  TRANSACTIONS: {
    LIST: "/transactions",
    CREATE: "/transactions",
    GET_BY_ID: (id) => `/transactions/${id}`,
    UPDATE: (id) => `/transactions/${id}`,
    DELETE: (id) => `/transactions/${id}`,
    ANALYZE: "/transactions/analyze",
  },
  BUDGETS: {
    LIST: "/budgets",
    CREATE: "/budgets",
    UPDATE: (id) => `/budgets/${id}`,
    DELETE: (id) => `/budgets/${id}`,
    ANALYZE: "/budgets/analyze",
  },
  DASHBOARD: {
    SUMMARY: "/dashboard/summary",
    CATEGORY_BREAKDOWN: "/dashboard/category-breakdown",
    MONTHLY_TREND: "/dashboard/monthly-trend",
  },
  INSIGHTS: {
    LIST: "/insights",
    GENERATE: "/insights/generate",
  },
  PLAID: {
    LINK_TOKEN: "/plaid/link-token",
    EXCHANGE_TOKEN: "/plaid/exchange-token",
    CONNECTIONS: "/plaid/connections",
    ACCOUNTS: "/plaid/accounts",
    SYNC: (connectionId) => `/plaid/sync/${connectionId}`,
  },
  ACCOUNTS: {
    IMPORT: (connectionId) => `/accounts/import/${connectionId}`,
    SYNC: (connectionId) => `/accounts/sync/${connectionId}`,
    LINK: (provider) => `/accounts/link/${provider}`,
    CALLBACK: (provider) => `/accounts/callback/${provider}`,
  },
};

export default API_PATHS;
