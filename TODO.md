# Settings Page Expansion + Full App i18n (EN/KA/RU)

## Backend

- [x] Migration: add `language` + `preferences` columns to users
- [x] authController: updateProfile (name + email w/ OTP)
- [x] authController: changePassword
- [x] authController: updateSettings (language + notification prefs)
- [x] authController: exportData
- [x] authController: deleteAccount
- [x] authController: sendEmailChangeOtp
- [x] authRoutes: wire new endpoints

## Frontend i18n infra

- [x] utils/i18n.js (EN/KA/RU dictionaries + t())
- [x] context/LanguageContext.jsx
- [x] Wire LanguageContext into main.jsx / App.jsx

## Settings page

- [x] Rebuild Settings.jsx with tabs (Profile, Password, Notifications, Language, Data & Privacy)
- [x] AuthContext: add updateProfile, changePassword, updateSettings, exportData, deleteAccount, sendEmailChangeOtp
- [x] apiPaths: add new endpoints

## Translate app (full EN/KA/RU)

- [ ] Starter, Login, Register
- [ ] Dashboard, Transactions, Categories, Budgets
- [ ] Cards, Insights, AIChat, BankConnections
- [x] Components (Sidebar, Topbar)

## Verify

- [ ] Frontend build
- [ ] Backend sanity check
