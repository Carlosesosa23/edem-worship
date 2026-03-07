import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SongsProvider } from './contexts/SongsContext';
import { MixesProvider } from './contexts/MixesContext';
import { LiveSessionProvider } from './contexts/LiveSessionContext';
import { AgendaProvider } from './contexts/AgendaContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SongList } from './pages/SongList';
import { SongViewer } from './pages/SongViewer';
import { SongEditor } from './pages/SongEditor';
import { MixList } from './pages/MixList';
import { MixEditor } from './pages/MixEditor';
import { MixViewer } from './pages/MixViewer';
import { AgendaList } from './pages/AgendaList';
import { AgendaEditor } from './pages/AgendaEditor';
import { AgendaViewer } from './pages/AgendaViewer';
import { FinanceList } from './pages/FinanceList';
import { FinanceEditor } from './pages/FinanceEditor';

function App() {
  return (
    <SongsProvider>
      <MixesProvider>
        <LiveSessionProvider>
          <AgendaProvider>
            <FinanceProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="songs" element={<SongList />} />
                    <Route path="mixes" element={<MixList />} />
                    <Route path="agenda" element={<AgendaList />} />
                    <Route path="finanzas" element={<FinanceList />} />
                  </Route>

                  {/* Routes without Layout (fullscreen) */}
                  <Route path="/songs/:id" element={<SongViewer />} />
                  <Route path="/songs/add" element={<SongEditor />} />
                  <Route path="/edit/:id" element={<SongEditor />} />
                  <Route path="/mixes/add" element={<MixEditor />} />
                  <Route path="/mixes/edit/:id" element={<MixEditor />} />
                  <Route path="/mixes/:id" element={<MixViewer />} />
                  <Route path="/agenda/add" element={<AgendaEditor />} />
                  <Route path="/agenda/edit/:id" element={<AgendaEditor />} />
                  <Route path="/agenda/:id" element={<AgendaViewer />} />
                  <Route path="/finanzas/add" element={<FinanceEditor />} />
                </Routes>
              </BrowserRouter>
            </FinanceProvider>
          </AgendaProvider>
        </LiveSessionProvider>
      </MixesProvider>
    </SongsProvider>
  );
}

export default App;
