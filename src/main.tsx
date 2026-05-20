import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Apps
import AdminApp from './admin/App'
import UserApp from './user/app/App'

const isAdmin = window.location.pathname.startsWith('/admin');

if (isAdmin) {
  import('./admin/index.css');
} else {
  import('./user/styles/index.css');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <UserApp />}
  </StrictMode>,
)
