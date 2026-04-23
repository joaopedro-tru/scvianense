import { useState, useEffect } from "react";

const LOCAIS = ["Sede do SCV", "Lojinha do SCV"];

const JOGOS = [
  { id: "j1", adversario: "GD Bragança",      data: "2025-05-03", hora: "16:00" },
  { id: "j2", adversario: "Leça FC",           data: "2025-05-17", hora: "17:00" },
  { id: "j3", adversario: "Rebordosa Atl. C.", data: "2025-05-31", hora: "17:00" },
];

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const formatDateTime = (iso) => {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
  };
};

const STORAGE_KEY = "scv_sad_bilhetes_v2";

export default function App() {
  // state: { [jogoId]: { socios: { [num]: { local, timestamp } }, historico: [] } }
  const [dados, setDados] = useState({});
  const [jogoAtivo, setJogoAtivo] = useState(null);
  const [input, setInput] = useState("");
  const [localSelecionado, setLocalSelecionado] = useState(LOCAIS[0]);
  const [resultado, setResultado] = useState(null);
  const [tab, setTab] = useState("venda");

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await window.storage.get(STORAGE_KEY);
        if (stored) setDados(JSON.parse(stored.value));
      } catch {}
    };
    load();
  }, []);

  const save = async (novosDados) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(novosDados));
    } catch {}
  };

  const jogoData = jogoAtivo ? (dados[jogoAtivo] || { socios: {}, historico: [] }) : null;
  const socios = jogoData?.socios || {};
  const historico = jogoData?.historico || [];
  const jogo = JOGOS.find((j) => j.id === jogoAtivo);

  const totalVendidos = Object.keys(socios).length;
  const porLocal = LOCAIS.map((l) => ({
    local: l,
    count: Object.values(socios).filter((v) => v.local === l).length,
  }));

  const handleSubmit = () => {
    const num = input.trim().replace(/\D/g, "");
    if (!num || !jogoAtivo) return;

    if (socios[num]) {
      const compra = socios[num];
      setResultado({ tipo: "duplicado", socio: num, local: compra.local, data: compra.timestamp });
    } else {
      const agora = new Date().toISOString();
      const novaCompra = { local: localSelecionado, timestamp: agora };
      const jogoAnterior = dados[jogoAtivo] || { socios: {}, historico: [] };
      const novoJogo = {
        socios: { ...jogoAnterior.socios, [num]: novaCompra },
        historico: [{ socio: num, ...novaCompra }, ...jogoAnterior.historico],
      };
      const novosDados = { ...dados, [jogoAtivo]: novoJogo };
      setDados(novosDados);
      save(novosDados);
      setResultado({ tipo: "sucesso", socio: num, local: localSelecionado, data: agora });
    }
    setInput("");
  };

  const handleClear = async () => {
    if (!jogoAtivo) return;
    if (window.confirm(`Apagar todos os registos do jogo vs ${jogo?.adversario}?`)) {
      const novosDados = { ...dados, [jogoAtivo]: { socios: {}, historico: [] } };
      setDados(novosDados);
      setResultado(null);
      save(novosDados);
    }
  };

  // ── ECRÃ DE SELECÇÃO DE JOGO ──────────────────────────────────────────────
  if (!jogoAtivo) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0f0a",
        fontFamily: "'Georgia', serif", color: "#e8e4d9",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
          borderBottom: "2px solid #2d5a1b",
          padding: "20px 24px 16px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, background: "#2d5a1b", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: "bold", color: "#fff", border: "2px solid #4a8a2a", flexShrink: 0,
          }}>SCV</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#c8e6a0", letterSpacing: 1 }}>Controlo de Bilhetes</div>
            <div style={{ fontSize: 11, color: "#7a9a6a", letterSpacing: 2, textTransform: "uppercase" }}>SC Vianense SAD</div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px", width: "100%" }}>
          <div style={{ fontSize: 12, color: "#5a7a5a", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, textAlign: "center" }}>
            Selecciona o jogo
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {JOGOS.map((j) => {
              const vendidos = Object.keys(dados[j.id]?.socios || {}).length;
              return (
                <button key={j.id} onClick={() => { setJogoAtivo(j.id); setResultado(null); setInput(""); }} style={{
                  background: "#111d11",
                  border: "1px solid #2d5a1b",
                  borderRadius: 12,
                  padding: "20px 22px",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "#e8e4d9",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: "#1a2e1a", border: "1px solid #2d5a1b",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: "bold", color: "#c8e6a0", lineHeight: 1 }}>
                      {j.data.split("-")[2]}
                    </div>
                    <div style={{ fontSize: 10, color: "#7a9a6a", textTransform: "uppercase" }}>
                      {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][parseInt(j.data.split("-")[1]) - 1]}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: "bold", color: "#c8e6a0" }}>
                      SCV vs {j.adversario}
                    </div>
                    <div style={{ fontSize: 12, color: "#5a7a5a", marginTop: 3 }}>
                      {formatDate(j.data)} · {j.hora}
                    </div>
                  </div>
                  {vendidos > 0 && (
                    <div style={{
                      background: "#1a3a10", border: "1px solid #3a6a20",
                      borderRadius: 20, padding: "4px 12px",
                      fontSize: 12, color: "#8aca6a",
                    }}>{vendidos} bil.</div>
                  )}
                  <div style={{ color: "#3a6a2a", fontSize: 18 }}>›</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── ECRÃ PRINCIPAL (com jogo seleccionado) ────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0a", fontFamily: "'Georgia', serif", color: "#e8e4d9" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)",
        borderBottom: "2px solid #2d5a1b",
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => { setJogoAtivo(null); setResultado(null); }} style={{
          background: "none", border: "1px solid #2d5a1b", borderRadius: 6,
          color: "#7a9a6a", cursor: "pointer", fontSize: 16, padding: "4px 10px",
          fontFamily: "inherit",
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#c8e6a0" }}>
            SCV vs {jogo?.adversario}
          </div>
          <div style={{ fontSize: 11, color: "#5a7a5a" }}>
            {formatDate(jogo?.data)} · {jogo?.hora}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: "bold", color: "#c8e6a0" }}>{totalVendidos}</div>
          <div style={{ fontSize: 10, color: "#5a7a5a", textTransform: "uppercase", letterSpacing: 1 }}>Vendidos</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e3a1e", background: "#0d160d" }}>
        {["venda", "historico"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "11px 28px", background: tab === t ? "#1a2e1a" : "transparent",
            border: "none", borderBottom: tab === t ? "2px solid #4a8a2a" : "2px solid transparent",
            color: tab === t ? "#c8e6a0" : "#5a7a5a", cursor: "pointer",
            fontSize: 13, letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit",
          }}>
            {t === "venda" ? "Registo" : "Histórico"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 16px" }}>

        {tab === "venda" && (
          <>
            {/* Stats por local */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {porLocal.map((p) => (
                <div key={p.local} style={{
                  flex: 1, background: "#111d11", border: "1px solid #1e3a1e",
                  borderRadius: 8, padding: "10px 14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#c8e6a0" }}>{p.count}</div>
                  <div style={{ fontSize: 11, color: "#5a7a5a", marginTop: 2 }}>{p.local}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{
              background: "#111d11", border: "1px solid #1e3a1e",
              borderRadius: 12, padding: "20px", marginBottom: 18,
            }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: "#7a9a6a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                  Local de Venda
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {LOCAIS.map((l) => (
                    <button key={l} onClick={() => setLocalSelecionado(l)} style={{
                      flex: 1, padding: "10px 6px",
                      background: localSelecionado === l ? "#2d5a1b" : "#0a0f0a",
                      border: localSelecionado === l ? "1px solid #4a8a2a" : "1px solid #1e3a1e",
                      borderRadius: 8, color: localSelecionado === l ? "#c8e6a0" : "#5a7a5a",
                      cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: "#7a9a6a", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                  Número de Sócio
                </label>
                <input
                  type="text" inputMode="numeric"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setResultado(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Ex: 1234"
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "#0a0f0a", border: "1px solid #2d5a1b",
                    borderRadius: 8, color: "#e8e4d9", fontSize: 26,
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box", letterSpacing: 4,
                  }}
                  autoFocus
                />
              </div>

              <button onClick={handleSubmit} style={{
                width: "100%", padding: "13px",
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
                padding: "18px", borderRadius: 10,
                background: resultado.tipo === "sucesso" ? "#0d2210" : "#1f0d0d",
                border: resultado.tipo === "sucesso" ? "1px solid #2d7a1b" : "1px solid #7a1b1b",
                animation: "fadeIn 0.3s ease",
              }}>
                <div style={{ fontSize: 26, textAlign: "center", marginBottom: 8 }}>
                  {resultado.tipo === "sucesso" ? "✅" : "🚫"}
                </div>
                {resultado.tipo === "sucesso" ? (
                  <>
                    <div style={{ color: "#7adb6a", fontWeight: "bold", fontSize: 15, textAlign: "center" }}>
                      Bilhete registado com sucesso
                    </div>
                    <div style={{ color: "#5a9a5a", textAlign: "center", marginTop: 4, fontSize: 13 }}>
                      Sócio #{resultado.socio} — {resultado.local}
                    </div>
                  </>
                ) : (() => {
                  const { data, hora } = formatDateTime(resultado.data);
                  return (
                    <>
                      <div style={{ color: "#db6a6a", fontWeight: "bold", fontSize: 15, textAlign: "center" }}>
                        Compra já efectuada!
                      </div>
                      <div style={{ color: "#9a5a5a", textAlign: "center", marginTop: 6, fontSize: 13, lineHeight: 1.7 }}>
                        O sócio <strong style={{ color: "#db8a8a" }}>#{resultado.socio}</strong> já comprou bilhete
                        <br />em <strong style={{ color: "#db8a8a" }}>{resultado.local}</strong>
                        <br />no dia <strong style={{ color: "#db8a8a" }}>{data}</strong> às <strong style={{ color: "#db8a8a" }}>{hora}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {tab === "historico" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#5a7a5a" }}>{historico.length} registos</div>
              {historico.length > 0 && (
                <button onClick={handleClear} style={{
                  padding: "5px 12px", background: "transparent",
                  border: "1px solid #5a2a2a", borderRadius: 6,
                  color: "#9a5a5a", cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                }}>Limpar jogo</button>
              )}
            </div>

            {historico.length === 0 ? (
              <div style={{ textAlign: "center", color: "#3a5a3a", padding: "36px 0", fontSize: 14 }}>
                Sem registos ainda
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historico.map((h, i) => {
                  const { data, hora } = formatDateTime(h.timestamp);
                  return (
                    <div key={i} style={{
                      background: "#111d11", border: "1px solid #1e3a1e",
                      borderRadius: 8, padding: "11px 14px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, background: "#1a2e1a", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#7a9a6a", fontWeight: "bold", flexShrink: 0,
                      }}>#{h.socio}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#c8e6a0" }}>{h.local}</div>
                        <div style={{ fontSize: 11, color: "#5a7a5a", marginTop: 2 }}>{data} · {hora}</div>
                      </div>
                      <div style={{ width: 8, height: 8, background: "#4a8a2a", borderRadius: "50%" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        input::placeholder { color: #2d4a2d; }
        button:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}