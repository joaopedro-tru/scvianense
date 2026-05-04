import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEG0WMa1hJHL9IPb2_oJdekFuk482ZwWk",
  authDomain: "scv-bilhetes.firebaseapp.com",
  projectId: "scv-bilhetes",
  storageBucket: "scv-bilhetes.firebasestorage.app",
  messagingSenderId: "172607429510",
  appId: "1:172607429510:web:e759d9a09d3a1b0f056a07",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const LOCAIS = ["Sede do SCV", "Lojinha do SCV"];

const JOGOS = [
  { id: "j0", adversario: "Leça FC", data: "26 Abril", hora: "16:00", fora: true, iso: "2026-04-26T16:00:00" },
  { id: "j1", adversario: "GD Bragança",      data: "3 Maio",  hora: "16:00", iso: "2026-05-03T16:00:00" },
  { id: "j2", adversario: "Leça FC",           data: "17 Maio", hora: "17:00", iso: "2026-05-17T17:00:00" },
  { id: "j3", adversario: "Rebordosa Atl. C.", data: "31 Maio", hora: "17:00", iso: "2026-05-31T17:00:00" },
];

const fmt = (iso) => {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
  };
};

export default function App() {
  const [jogo, setJogo] = useState(null);
  const [socios, setSocios] = useState({});
  const [historico, setHistorico] = useState([]);
  const [local, setLocal] = useState(LOCAIS[0]);
  const [input, setInput] = useState("");
  const [resultado, setResultado] = useState(null);
  const [tab, setTab] = useState("venda");
  const [loading, setLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // número de sócio a remover

  const storageKey = jogo ? jogo.id : null;

  useEffect(() => {
    if (!jogo) return;
    setLoading(true);
    setResultado(null);
    setInput("");
    setConfirmRemove(null);

    const ref = doc(db, "jogos", jogo.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSocios(d.socios || {});
        setHistorico(d.historico || []);
      } else {
        setSocios({});
        setHistorico([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [jogo]);

  const save = async (novosSocios, novoHistorico) => {
    const ref = doc(db, "jogos", jogo.id);
    await setDoc(ref, { socios: novosSocios, historico: novoHistorico });
  };

  const handleSubmit = async () => {
    const num = input.trim().replace(/\D/g, "");
    if (!num || !jogo) return;

    const ref = doc(db, "jogos", jogo.id);
    const snap = await getDoc(ref);
    const dadosActuais = snap.exists() ? snap.data() : { socios: {}, historico: [] };

    if (dadosActuais.socios[num]) {
      setResultado({ tipo: "dup", socio: num, ...dadosActuais.socios[num] });
    } else {
      const agora = new Date().toISOString();
      const novosSocios = { ...dadosActuais.socios, [num]: { local, timestamp: agora } };
      const novoHist = [{ socio: num, local, timestamp: agora }, ...(dadosActuais.historico || [])];
      await save(novosSocios, novoHist);
      setResultado({ tipo: "ok", socio: num, local, timestamp: agora });
    }
    setInput("");
  };

  const handleRemove = async (num) => {
    const ref = doc(db, "jogos", jogo.id);
    const snap = await getDoc(ref);
    const dadosActuais = snap.exists() ? snap.data() : { socios: {}, historico: [] };

    const novosSocios = { ...dadosActuais.socios };
    delete novosSocios[num];

    const novoHist = (dadosActuais.historico || []).filter((h) => h.socio !== num);
    await save(novosSocios, novoHist);
    setConfirmRemove(null);
    if (resultado?.socio === num) setResultado(null);
  };

  const handleClear = async () => {
    if (!jogo) return;
    if (window.confirm("Apagar todos os registos deste jogo?")) {
      const ref = doc(db, "jogos", jogo.id);
      await setDoc(ref, { socios: {}, historico: [] });
      setResultado(null);
    }
  };

  const total = Object.keys(socios).length;
  const porLocal = LOCAIS.map((l) => ({ l, n: Object.values(socios).filter((v) => v.local === l).length }));

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0a", fontFamily: "'Georgia', serif", color: "#e8e4d9" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
        borderBottom: "2px solid #2d5a1b",
        padding: "20px 24px 16px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, background: "#2d5a1b", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: "bold", color: "#fff", border: "2px solid #4a8a2a", flexShrink: 0,
        }}>SCV</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#c8e6a0", letterSpacing: 1 }}>Controlo de Bilhetes</div>
          <div style={{ fontSize: 11, color: "#7a9a6a", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
            {jogo ? (jogo.fora ? `${jogo.adversario} vs SCV · ${jogo.data} · ${jogo.hora}` : `vs ${jogo.adversario} · ${jogo.data} · ${jogo.hora}`) : "Sport Clube Vianense"}
          </div>
        </div>
        {jogo && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#c8e6a0" }}>{total}</div>
            <div style={{ fontSize: 11, color: "#7a9a6a", textTransform: "uppercase", letterSpacing: 1 }}>Vendidos</div>
          </div>
        )}
      </div>

      {/* ECRÃ: SELECÇÃO DE JOGO */}
      {!jogo && (
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "#5a7a5a", letterSpacing: 3, textTransform: "uppercase" }}>Selecciona o jogo</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {JOGOS.filter((j) => new Date(j.iso) > new Date()).map((j) => (
              <button key={j.id} onClick={() => setJogo(j)} style={{
                background: "#111d11", border: "1px solid #2d5a1b", borderRadius: 12,
                padding: "20px 24px", color: "#e8e4d9", cursor: "pointer", textAlign: "left",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 16,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#162a16"}
              onMouseLeave={e => e.currentTarget.style.background = "#111d11"}>
                <div style={{
                  width: 50, height: 50, background: "#1a3a1a", borderRadius: 8,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 18, fontWeight: "bold", color: "#c8e6a0", lineHeight: 1 }}>{j.data.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, color: "#7a9a6a", lineHeight: 1.4 }}>{j.data.split(" ")[1]}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: "bold", color: "#c8e6a0" }}>{j.fora ? j.adversario : "SC Vianense SAD"}</div>
                  <div style={{ fontSize: 13, color: "#7a9a6a" }}>vs {j.fora ? "SC Vianense SAD" : j.adversario}</div>
                  <div style={{ fontSize: 11, color: "#4a6a4a", marginTop: 3 }}>{j.hora} · Campeonato de Portugal{j.fora ? " · Fora" : ""}</div>
                </div>
                <div style={{ color: "#4a8a2a", fontSize: 22, lineHeight: 1 }}>›</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ECRÃ PRINCIPAL */}
      {jogo && (
        <div>
          {/* Mudar jogo */}
          <div style={{ background: "#0c150c", borderBottom: "1px solid #1a2e1a", padding: "6px 20px" }}>
            <button onClick={() => { setJogo(null); setResultado(null); setInput(""); setConfirmRemove(null); }} style={{
              background: "transparent", border: "none", color: "#4a6a4a", cursor: "pointer",
              fontSize: 12, fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase", padding: "4px 0",
            }}>← Mudar jogo</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e3a1e", background: "#0d160d" }}>
            {["venda", "historico"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setConfirmRemove(null); }} style={{
                padding: "12px 28px", background: tab === t ? "#1a2e1a" : "transparent",
                border: "none", borderBottom: tab === t ? "2px solid #4a8a2a" : "2px solid transparent",
                color: tab === t ? "#c8e6a0" : "#5a7a5a", cursor: "pointer", fontSize: 13,
                letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit", transition: "all 0.2s",
              }}>
                {t === "venda" ? "Registo" : "Histórico"}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4a6a4a", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
              A carregar...
            </div>
          ) : (
            <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 20px" }}>

              {/* ABA: REGISTO */}
              {tab === "venda" && (
                <div>
                  {/* Stats por local */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    {porLocal.map(({ l, n }) => (
                      <div key={l} style={{
                        flex: 1, background: "#111d11", border: "1px solid #1e3a1e",
                        borderRadius: 8, padding: "12px 16px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 26, fontWeight: "bold", color: "#c8e6a0" }}>{n}</div>
                        <div style={{ fontSize: 11, color: "#5a7a5a", marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <div style={{ background: "#111d11", border: "1px solid #1e3a1e", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 11, color: "#7a9a6a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                        Local de Venda
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {LOCAIS.map((l) => (
                          <button key={l} onClick={() => setLocal(l)} style={{
                            flex: 1, padding: "10px 8px",
                            background: local === l ? "#2d5a1b" : "#0a0f0a",
                            border: local === l ? "1px solid #4a8a2a" : "1px solid #1e3a1e",
                            borderRadius: 8, color: local === l ? "#c8e6a0" : "#5a7a5a",
                            cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s",
                          }}>{l}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 11, color: "#7a9a6a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                        Número de Sócio
                      </label>
                      <input
                        type="text" inputMode="numeric" value={input}
                        onChange={(e) => { setInput(e.target.value); setResultado(null); setConfirmRemove(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Ex: 1234"
                        autoFocus
                        style={{
                          width: "100%", padding: "14px 16px", background: "#0a0f0a",
                          border: "1px solid #2d5a1b", borderRadius: 8, color: "#e8e4d9",
                          fontSize: 26, fontFamily: "inherit", outline: "none",
                          boxSizing: "border-box", letterSpacing: 6,
                        }}
                      />
                    </div>

                    <button onClick={handleSubmit} style={{
                      width: "100%", padding: 14,
                      background: "linear-gradient(135deg, #2d5a1b, #1e3d12)",
                      border: "1px solid #4a8a2a", borderRadius: 8,
                      color: "#c8e6a0", fontSize: 15, fontFamily: "inherit",
                      cursor: "pointer", letterSpacing: 2, textTransform: "uppercase",
                    }}>
                      Registar Compra
                    </button>
                  </div>

                  {/* Resultado */}
                  {resultado && (
                    <div style={{
                      padding: 20, borderRadius: 10, textAlign: "center",
                      background: resultado.tipo === "ok" ? "#0d2210" : "#1f0d0d",
                      border: resultado.tipo === "ok" ? "1px solid #2d7a1b" : "1px solid #7a1b1b",
                      animation: "fadeIn 0.3s ease",
                    }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>{resultado.tipo === "ok" ? "✅" : "🚫"}</div>
                      {resultado.tipo === "ok" ? (
                        <div>
                          <div style={{ color: "#7adb6a", fontWeight: "bold", fontSize: 16 }}>Bilhete registado com sucesso</div>
                          <div style={{ color: "#5a9a5a", marginTop: 4, fontSize: 13 }}>Sócio #{resultado.socio} · {resultado.local}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ color: "#db6a6a", fontWeight: "bold", fontSize: 16 }}>Compra já efectuada!</div>
                          <div style={{ color: "#9a5a5a", marginTop: 8, fontSize: 13, lineHeight: 1.7 }}>
                            O sócio <strong style={{ color: "#db8a8a" }}>#{resultado.socio}</strong> já comprou bilhete<br />
                            em <strong style={{ color: "#db8a8a" }}>{resultado.local}</strong><br />
                            no dia <strong style={{ color: "#db8a8a" }}>{fmt(resultado.timestamp).data}</strong> às <strong style={{ color: "#db8a8a" }}>{fmt(resultado.timestamp).hora}</strong>
                          </div>
                          {/* Botão de remover no resultado de duplicado */}
                          {confirmRemove === resultado.socio ? (
                            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
                              <button onClick={() => handleRemove(resultado.socio)} style={{
                                padding: "8px 20px", background: "#5a1a1a", border: "1px solid #9a2a2a",
                                borderRadius: 6, color: "#db8a8a", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                              }}>Confirmar remoção</button>
                              <button onClick={() => setConfirmRemove(null)} style={{
                                padding: "8px 20px", background: "transparent", border: "1px solid #3a5a3a",
                                borderRadius: 6, color: "#5a7a5a", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                              }}>Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmRemove(resultado.socio)} style={{
                              marginTop: 16, padding: "8px 20px", background: "transparent",
                              border: "1px solid #5a2a2a", borderRadius: 6,
                              color: "#9a5a5a", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                            }}>Remover compra por engano</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ABA: HISTÓRICO */}
              {tab === "historico" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: "#5a7a5a" }}>{historico.length} registo{historico.length !== 1 ? "s" : ""}</div>
                    {historico.length > 0 && (
                      <button onClick={handleClear} style={{
                        padding: "6px 14px", background: "transparent", border: "1px solid #5a2a2a",
                        borderRadius: 6, color: "#9a5a5a", cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                      }}>Limpar tudo</button>
                    )}
                  </div>
                  {historico.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#3a5a3a", padding: "40px 0", fontSize: 14 }}>Sem registos ainda</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {historico.map((h, i) => (
                        <div key={i} style={{
                          background: confirmRemove === h.socio ? "#1f0d0d" : "#111d11",
                          border: confirmRemove === h.socio ? "1px solid #7a1b1b" : "1px solid #1e3a1e",
                          borderRadius: 8, padding: "12px 16px",
                          transition: "all 0.2s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, background: "#1a2e1a", borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, color: "#7a9a6a", fontWeight: "bold", flexShrink: 0,
                            }}>#{h.socio}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: "#c8e6a0" }}>{h.local}</div>
                              <div style={{ fontSize: 11, color: "#5a7a5a", marginTop: 2 }}>
                                {fmt(h.timestamp).data} · {fmt(h.timestamp).hora}
                              </div>
                            </div>
                            {/* Botão remover */}
                            {confirmRemove === h.socio ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => handleRemove(h.socio)} style={{
                                  padding: "5px 10px", background: "#5a1a1a", border: "1px solid #9a2a2a",
                                  borderRadius: 5, color: "#db8a8a", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                                }}>✓ Confirmar</button>
                                <button onClick={() => setConfirmRemove(null)} style={{
                                  padding: "5px 10px", background: "transparent", border: "1px solid #2a3a2a",
                                  borderRadius: 5, color: "#5a7a5a", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                                }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmRemove(h.socio)} style={{
                                padding: "5px 10px", background: "transparent", border: "1px solid #2a1a1a",
                                borderRadius: 5, color: "#5a3a3a", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7a2a2a"; e.currentTarget.style.color = "#9a5a5a"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a1a1a"; e.currentTarget.style.color = "#5a3a3a"; }}>
                                Remover
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        input::placeholder { color: #2d4a2d; }
        button:active { opacity: 0.8; }
      `}</style>
    </div>
  );
}