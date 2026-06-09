// ESLint flat config (ESLint 9 + Next.js 16). Replaces the legacy
// .eslintrc.json — `next lint` was removed in Next 16, so we run the ESLint
// CLI directly (`npm run lint`). eslint-config-next/core-web-vitals ships a
// ready-made flat-config array, so we spread it and add ignores.
import coreWebVitals from 'eslint-config-next/core-web-vitals'

// The Next 16 ruleset (newer @next/eslint-plugin-next + react-hooks v5) is
// stricter than the Next 14 config we came from. These rules flag pre-existing,
// working patterns — homepage hash-anchor nav (`<a href="/#chat">`) and
// data-loading effects. Rewriting them would change runtime behavior, which is
// out of scope for a version bump, so they're surfaced as warnings (not errors)
// and tracked for a separate, behavior-aware cleanup. `next build` does not run
// lint in Next 16, so none of these affect the build/deploy.
const upgradeSurfaced = {
  rules: {
    '@next/next/no-html-link-for-pages': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/immutability': 'warn',
  },
}

const config = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  upgradeSurfaced,
]

export default config
