import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box, Container, Button } from '@mui/material'
import ReportPage from './pages/ReportPage'
import ReviewPage from './pages/ReviewPage'
import GeneratePage from './pages/GeneratePage'
import PosterPage from './pages/PosterPage'
import DispatchPage from './pages/DispatchPage'
import FoundChildPage from './pages/FoundChildPage'

const STEPS = [
  { path: '/report', label: '1. Report' },
  { path: '/review', label: '2. Review' },
  { path: '/generate', label: '3. Generate' },
  { path: '/posters', label: '4. Posters' },
  { path: '/dispatch', label: '5. Dispatch' },
]

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
          <Toolbar className="gap-6">
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', flexGrow: { xs: 1, md: 0 } }}>
              MissingMesh
            </Typography>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1, justifyContent: 'center' }}>
              {STEPS.map((s) => (
                <NavLink
                  key={s.path}
                  to={s.path}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? 'contained' : 'text'}
                      color={isActive ? 'primary' : 'inherit'}
                      sx={{ 
                        borderRadius: 8, 
                        px: 3, 
                        py: 0.5,
                        color: isActive ? '#fff' : 'text.secondary',
                        '&:hover': {
                          color: isActive ? '#fff' : 'text.primary',
                        }
                      }}
                    >
                      {s.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </Box>
            <Box>
              <NavLink to="/found-child" style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'contained' : 'outlined'}
                    color={isActive ? 'primary' : 'inherit'}
                    sx={{ borderRadius: 8, whiteSpace: 'nowrap' }}
                  >
                    Found Child Matcher
                  </Button>
                )}
              </NavLink>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Container maxWidth="lg">
            <Routes>
              <Route path="/" element={<Navigate to="/report" replace />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/posters" element={<PosterPage />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route path="/found-child" element={<FoundChildPage />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </BrowserRouter>
  )
}
