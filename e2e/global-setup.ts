import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

async function globalSetup() {
  execSync(
    'dotnet ef database update --project src/HelpDeskApp.Infrastructure --startup-project src/HelpDeskApp.API',
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, ASPNETCORE_ENVIRONMENT: 'E2ETest' },
    }
  )

  // Reset the admin account's lockout state so repeated test runs don't
  // accumulate failed-login attempts and lock the account between runs.
  execSync(
    `psql -d helpdesk_e2etest -c "UPDATE users SET \\"AccessFailedCount\\" = 0, \\"LockoutEnd\\" = NULL WHERE \\"NormalizedEmail\\" = 'ADMIN@E2ETEST.LOCAL';"`,
    { stdio: 'inherit' }
  )
}

export default globalSetup
