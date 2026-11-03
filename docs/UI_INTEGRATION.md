# Figma UI integration notes

Reviewed: 2026-11-03

## Scope

The submitted exports were inspected and mapped into the existing React/Vite application. The login/authentication page and the primary home dashboard design were explicitly retained rather than replaced.

| Export | Treatment |
|---|---|
| `تكرار التصميم الحالي (1) (2).zip` | Existing login visual reference; not imported over production authentication. |
| `Untitled (1) (2).zip` | Duplicate login design reference; not used to replace the live AuthPage. |
| `Create my design (3).zip` | Leaderboard visual source; mapped to the existing app shell and connected to real leaderboard data. |
| `AI Assistant Chat-html (1).zip` | AI Assistant reference mockup; implemented as a React page connected to the existing `ai.ask` API. The exported HTML/runtime files are not shipped as production code. |
| `settings_without_background_style (1).png` | Settings visual reference; mapped to the existing app shell and existing profile/theme capabilities. |

## Implemented screens

- Leaderboard: all-time points from `users.points`. Day/week/month filters open Coming Soon until the production Worker supports them. No mock names, avatars or point totals are shipped.
- Settings: name and bio save through `profile.update`; accent color persists in localStorage; dark theme preference uses ThemeContext.
- NEXUS Assistant: reuses the protected `ai.ask` mutation and its existing platform context. New chat clears the current in-memory thread.

## Coming Soon actions

The shared Coming Soon modal is used for settings tabs/actions that have no backend implementation, including security activity, 2FA, notification preferences, billing, connected accounts, account deletion, theme modes not supported by the current app shell, AI attachments and chat-history persistence.

## Integration constraints

- Reuse the current Home application shell and navigation instead of adding nested sidebars/topbars from the standalone exports.
- Do not replace AuthPage or the existing dashboard component.
- Do not introduce sample leaderboard members or fixed demo XP values.
- Keep AI provider credentials on the server.
- No database schema migration is required for these UI additions.
