import { defineConfig, devices } from '@playwright/test';

const PORTA_API = process.env.E2E_API_PORT || '5055';
const PORTA_WEB = process.env.E2E_WEB_PORT || '3055';

/**
 * Testes de sistema (E2E) — capítulo 10 do roteiro.
 * Sobe a API (banco temporário) e o frontend e executa os fluxos no navegador.
 *
 *   npx playwright install chromium   # uma vez, ou use o Chrome já instalado:
 *   PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA_WEB}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined }
    }
  ],
  webServer: [
    {
      command: 'node e2e/servidor-api.cjs',
      url: `http://localhost:${PORTA_API}/api/status`,
      env: { E2E_API_PORT: PORTA_API },
      reuseExistingServer: false,
      timeout: 60000
    },
    {
      command: `npx vite --port ${PORTA_WEB} --strictPort`,
      url: `http://localhost:${PORTA_WEB}`,
      env: { VITE_API_PROXY: `http://localhost:${PORTA_API}` },
      reuseExistingServer: false,
      timeout: 60000
    }
  ]
});
