import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const oauthTarget = window.localStorage.getItem('oauth_target')
const url = new URL(window.location.href)
let isAdmin = url.pathname.startsWith('/admin')

const oauthError = url.searchParams.get('error_description') || url.hash.match(/error_description=([^&]+)/)?.[1]

if (oauthError) {
  window.localStorage.removeItem('oauth_target')
}

if (!isAdmin && oauthTarget === 'admin') {
  // OAuth callback often lands on the site root. Preserve admin context.
  const nextPath = '/admin'
  window.history.replaceState({}, '', `${nextPath}${url.search}${url.hash}`)
  isAdmin = true
}

if (oauthTarget) {
  window.localStorage.removeItem('oauth_target')
}

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!)

  if (isAdmin) {
    const [{ default: AdminApp }] = await Promise.all([
      import('./admin/App'),
      import('./admin/index.css'),
    ])

    root.render(
      <StrictMode>
        <AdminApp />
      </StrictMode>,
    )
    return
  }

  const [{ default: UserApp }] = await Promise.all([
    import('./user/app/App'),
    import('./user/styles/index.css'),
  ])

  root.render(
    <StrictMode>
      <UserApp />
    </StrictMode>,
  )
}

bootstrap().catch((error) => {
  console.error('App bootstrap failed:', error)
  const root = document.getElementById('root')
  if (root) {
    const message = error instanceof Error ? error.message : 'Please refresh.'
    root.innerHTML = `<div style="padding:16px;font-family:system-ui,sans-serif;color:#b91c1c">Failed to load application. ${message}</div>`
  }
})

if (oauthError) {
  console.error('OAuth callback failed:', decodeURIComponent(oauthError.replace(/\+/g, ' ')))
}
