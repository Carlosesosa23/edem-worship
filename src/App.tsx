import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SongsProvider } from './contexts/SongsContext';
import { MixesProvider } from './contexts/MixesContext';
import { LiveSessionProvider } from './contexts/LiveSessionContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SongList } from './pages/SongList';
import { SongViewer } from './pages/SongViewer';
import { SongEditor } from './pages/SongEditor';
import { MixList } from './pages/MixList';
import { MixEditor } from './pages/MixEditor';
import { MixViewer } from './pages/MixViewer';

function App() {
  return (
    <SongsProvider>
      <MixesProvider>
        <LiveSessionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="songs" element={<SongList />} />
                <Route path="mixes" element={<MixList />} />
              </Route>

              {/* Routes without Layout (fullscreen) */}
              <Route path="/songs/:id" element={<SongViewer />} />
              <Route path="/songs/add" element={<SongEditor />} />
              <Route path="/edit/:id" element={<SongEditor />} />
              <Route path="/mixes/add" element={<MixEditor />} />
              <Route path="/mixes/:id" element={<MixViewer />} />
            </Routes>
          </BrowserRouter>
        </LiveSessionProvider>
      </MixesProvider>
    </SongsProvider>
  );
}

export default App;
