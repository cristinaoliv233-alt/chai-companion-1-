/** Rotas da aplicação e perfil partilhado (nome da companheira, personalidade, etc.). */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api.js";
import Chat from "./pages/Chat.jsx";
import Personality from "./pages/Personality.jsx";
import Memory from "./pages/Memory.jsx";
import Settings from "./pages/Settings.jsx";

const ProfileContext = createContext(null);
export const useProfile = () => useContext(ProfileContext);

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getProfile().then(setProfile).catch((e) => setError(e.message));
  }, []);

  const save = useCallback(async (patch) => {
    const next = await api.saveProfile(patch);
    setProfile(next);
    return next;
  }, []);

  if (error) return <p className="boot">Não consegui ligar ao servidor da Chai. Corre <code>npm run dev</code>.</p>;
  if (!profile) return <p className="boot">A acordar a Chai…</p>;

  return (
    <ProfileContext.Provider value={{ profile, save }}>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/personalidade" element={<Personality />} />
        <Route path="/memoria" element={<Memory />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </ProfileContext.Provider>
  );
}
