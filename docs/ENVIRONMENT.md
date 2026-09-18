# Environment configuration

**Create:** `.env.example` (committed template).

**Never commit:**

- `.env`
- API keys
- Passwords
- Secret keys
- Database credentials
- Private tokens

Map: `src/lib/env/catalog.ts`. Copy `.env.example` → `.env` locally. Production must set `SESSION_SECRET` or `DJANGO_SECRET_KEY`. Guest `/check` needs no account. Papers stay on the phone.
