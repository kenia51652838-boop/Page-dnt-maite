import { useState } from "react";
import { ARRECADADO } from "@/pages/Home";

interface CampaignContentProps {
  onDonate: () => void;
}

const TABS = ["Sobre", "Atualizações", "Quem ajudou"] as const;
type Tab = typeof TABS[number];

const ATUALIZACOES = [
  {
    id: 1,
    data: "24 abr. 2026",
    autor: "Equipe Vakinha",
    titulo: "Conseguimos compras no mercado graças a vocês 🙏",
    texto: "Com o apoio de quem doou, conseguimos fazer compras no supermercado essa semana. As crianças puderam comer direito. O Sr. Francivaldo agradece do fundo do coração cada centavo doado. A luta continua — ainda precisamos de muito apoio.",
    reacoes: 312,
  },
  {
    id: 2,
    data: "22 abr. 2026",
    autor: "Equipe Vakinha",
    titulo: "A perna do Francivaldo piorou, mas ele não para",
    texto: "O Sr. Francivaldo foi ao hospital. O raio-x confirmou o deslocamento no osso do joelho. Mesmo assim, ele acorda cedo todo dia para trabalhar — porque parar significaria ver seus filhos passarem fome. Sua força é emocionante. Ajude essa família.",
    reacoes: 271,
  },
];

const DOADORES = [
  { nome: "Ana C.", valor: 150, tempo: "há 12 min", msg: "Meu Deus, que história difícil. Força, Sr. Francivaldo! 💚" },
  { nome: "Roberto M.", valor: 50, tempo: "há 28 min", msg: "" },
  { nome: "Fernanda Lima", valor: 200, tempo: "há 41 min", msg: "Esse pai é um herói. As crianças merecem o melhor." },
  { nome: "Carlos Eduardo", valor: 100, tempo: "há 1h", msg: "" },
  { nome: "Mariana T.", valor: 30, tempo: "há 1h 20min", msg: "Chorei muito assistindo o vídeo. Que Deus abençoe essa família 🙏" },
  { nome: "Doador anônimo", valor: 500, tempo: "há 2h", msg: "" },
  { nome: "Patricia Souza", valor: 75, tempo: "há 2h 15min", msg: "Força pro Sr. Francivaldo e pras crianças! Vocês não estão sozinhos." },
  { nome: "João Henrique", valor: 20, tempo: "há 3h", msg: "" },
  { nome: "Beatriz O.", valor: 250, tempo: "há 4h", msg: "Compartilhei com todo mundo. Vamos ajudar essa família!" },
  { nome: "Doador anônimo", valor: 1000, tempo: "há 5h", msg: "" },
];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AvatarInitial({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name === "Doador anônimo" ? "?" : name.charAt(0).toUpperCase();
  const colors = ["#24CA68", "#1aad56", "#0077b6", "#7209b7", "#e76f51", "#2a9d8f"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontSize: size * 0.38,
      color: "#fff",
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
    }}>
      {initial}
    </div>
  );
}

export default function CampaignContent({ onDonate }: CampaignContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Sobre");

  return (
    <div style={{
      background: "#fff",
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
      marginBottom: "1.5rem",
    }}>

      {/* Tab nav */}
      <div style={{ borderBottom: "1px solid #f0f0f0", display: "flex", overflowX: "auto" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "14px 22px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: "0.85rem",
              color: activeTab === tab ? "#24CA68" : "#999",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2.5px solid #24CA68" : "2.5px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginBottom: "-1px",
              letterSpacing: "0.01em",
              transition: "color 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── ABA: SOBRE ── */}
      {activeTab === "Sobre" && (
        <div style={{ padding: "1.75rem 1.5rem", fontFamily: "'Lato', sans-serif" }}>

          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "#1a1a1a",
            margin: "0 0 14px",
            lineHeight: 1.35,
          }}>
            🎥 Esse vídeo vai te fazer entender por que essa família precisa de você
          </h2>

          <div style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "1.75rem",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
          }}>
            <iframe
              src="https://www.youtube.com/embed/3IxzJUcXsPs"
              title="A história do Sr. Francivaldo e seus filhos"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>

          <SectionHeading>💔 Um pai de 46 anos, 4 filhos pequenos e nenhuma ajuda</SectionHeading>

          <p className="paragrafo-historia">
            O <b className="destacar-no-texto">Sr. Francivaldo tem 46 anos</b> e do dia para a noite se viu completamente sozinho — sua esposa foi embora e o deixou com <b className="destacar-no-texto">quatro filhos pequenos</b> para criar: Eduardo (14 anos), Maria Gabriele (11 anos), Maurício (8 anos) e Maria Julia, a caçulinha de apenas <b className="destacar-no-texto">6 anos</b>.
          </p>
          <br />
          <p className="paragrafo-historia">
            Sem renda suficiente, sem apoio, e sem ter a quem recorrer, esse pai acorda todo dia com uma única missão: <b className="destacar-no-texto">garantir que seus filhos não passem fome</b>. E ele cumpre essa missão mesmo quando dói — literalmente.
          </p>
          <br />
          <p className="paragrafo-historia">
            O Sr. Francivaldo tem um <b className="destacar-no-texto">deslocamento no osso do joelho</b>. O raio-x comprovou. O médico disse que ele precisa de tratamento urgente. Mas parar de trabalhar para ele não é uma opção — porque parar significa ver seus filhos passarem fome.
          </p>

          <div style={{
            margin: "1rem 0",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}>
            <img
              src={`${import.meta.env.BASE_URL}img/raio-x.png`}
              alt="Raio-X do joelho do Sr. Francivaldo mostrando o deslocamento ósseo"
              style={{ width: "100%", display: "block" }}
            />
            <div style={{
              background: "#1a1a2e",
              padding: "8px 14px",
              fontSize: "0.75rem",
              color: "#c0c0d0",
              textAlign: "center",
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "0.02em",
            }}>
              🩻 Raio-X oficial — Francivaldo Pereira Ricardo — UPA 24h — 27/02/2026
            </div>
          </div>

          <br />
          <p className="paragrafo-historia">
            Então ele vai. Dia após dia. Com a perna fora do lugar, <b className="destacar-no-texto">mancando, arrastando o pé</b>, saindo de casa cedo para trabalhar. E muitas vezes, ao final do dia, <b className="destacar-no-texto">ele mesmo fica sem comer para que as crianças possam se alimentar</b>.
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR O SR. FRANCIVALDO</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          <SectionHeading>😢 O que essas crianças precisam agora</SectionHeading>

          <p className="paragrafo-historia">
            Não estamos falando de luxo. Estamos falando do básico que qualquer criança merece:
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Comida na mesa.</b> Eduardo, Maria Gabriele, Maurício e Maria Julia enfrentam dias sem ter o que comer. O pai faz o impossível, mas a renda não alcança.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Itens de higiene.</b> Produtos básicos como sabonete, pasta de dente e shampoo faltam com frequência nessa casa.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Itens pessoais para Maria Gabriele.</b> A mocinha de 11 anos está crescendo e precisa de produtos de higiene feminina que a família não tem condições de comprar. Isso é dignidade. Isso é urgente.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Tratamento para a perna do pai.</b> Se o Sr. Francivaldo não cuidar do joelho, pode perder permanentemente a capacidade de trabalhar — e então toda a família ficará desamparada.
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR ESSA FAMÍLIA</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          <SectionHeading>🙏 Você pode mudar a história dessa família hoje</SectionHeading>

          <p className="paragrafo-historia">
            O Sr. Francivaldo não pediu para estar nessa situação. Ele não desistiu dos filhos. Ele não parou de lutar. <b className="destacar-no-texto">Mas ele não consegue fazer isso sozinho.</b>
          </p>
          <br />
          <p className="paragrafo-historia">
            Qualquer valor que você puder contribuir vai diretamente para alimentar essas crianças, comprar itens de higiene e ajudar no tratamento da perna desse pai guerreiro.
          </p>
          <br />
          <p className="paragrafo-historia">
            Não precisa ser muito. <b className="destacar-no-texto">R$ 30 já garante uma refeição para toda a família.</b> R$ 50 garante itens de higiene por uma semana. Cada real faz diferença real na vida dessas crianças.
          </p>
          <br />
          <p className="paragrafo-historia">
            Se você não puder contribuir agora, <b className="destacar-no-texto">compartilhe essa história</b>. Um compartilhamento pode chegar até a pessoa certa — e salvar esses quatro filhos que só têm o pai.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Eduardo, Maria Gabriele, Maurício e a pequena Maria Julia precisam de você hoje.</b>
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR AGORA</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          {/* Bloco de transparência */}
          <div style={{
            marginTop: "2rem",
            background: "#f8fdf9",
            border: "1.5px solid #d1f0de",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
          }}>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: "0.8rem",
              color: "#24CA68",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              margin: "0 0 10px",
            }}>
              🛡️ Transparência da campanha
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              <Row label="Organizador" value="ONG Abelhinhas do Amor" />
              <Row label="CNPJ" value="62.669.301/0001-60" />
              <Row label="Contato" value="contato@abelhinhasdoamor.com.br" isEmail />
              <Row label="Beneficiário" value="Francivaldo (pai solo, 46 anos, 4 filhos)" />
            </div>
            <p style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "0.75rem",
              color: "#aaa",
              margin: "10px 0 0",
              lineHeight: 1.5,
            }}>
              Todas as doações são processadas com segurança via PIX. Os recursos arrecadados são repassados integralmente ao beneficiário. Em caso de dúvidas, entre em contato pelo e-mail acima.
            </p>
          </div>
        </div>
      )}

      {/* ── ABA: ATUALIZAÇÕES ── */}
      {activeTab === "Atualizações" && (
        <div style={{ padding: "1.5rem" }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.85rem", color: "#aaa", marginBottom: "1.25rem" }}>
            {ATUALIZACOES.length} atualizações publicadas pelo organizador
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {ATUALIZACOES.map(u => (
              <div key={u.id} style={{
                border: "1px solid #f0f0f0",
                borderRadius: "10px",
                padding: "1.25rem",
                background: "#fafafa",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <AvatarInitial name="Equipe Vakinha" size={34} />
                  <div>
                    <p style={{ margin: 0, fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#222" }}>
                      {u.autor}
                    </p>
                    <p style={{ margin: 0, fontFamily: "'Lato', sans-serif", fontSize: "0.72rem", color: "#bbb" }}>
                      {u.data}
                    </p>
                  </div>
                </div>

                <h3 style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#1a1a1a",
                  margin: "0 0 10px",
                  lineHeight: 1.35,
                }}>
                  {u.titulo}
                </h3>
                <p style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.88rem",
                  color: "#555",
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {u.texto}
                </p>

                <div style={{
                  marginTop: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.78rem",
                  color: "#aaa",
                }}>
                  <span>❤️</span>
                  <span>{u.reacoes} pessoas reagiram</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA: QUEM AJUDOU ── */}
      {activeTab === "Quem ajudou" && (
        <div style={{ padding: "1.5rem" }}>
          <p style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.85rem",
            color: "#aaa",
            marginBottom: "1.25rem",
          }}>
            {Math.round(ARRECADADO / 52).toLocaleString("pt-BR")} apoiadores · ordenado por mais recente
          </p>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {DOADORES.map((d, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 0",
                borderBottom: i < DOADORES.length - 1 ? "1px solid #f5f5f5" : "none",
              }}>
                <AvatarInitial name={d.nome} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#222" }}>
                      {d.nome}
                    </span>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "0.88rem", color: "#24CA68", whiteSpace: "nowrap" }}>
                      {formatBRL(d.valor)}
                    </span>
                  </div>
                  {d.msg && (
                    <p style={{ margin: "4px 0 0", fontFamily: "'Lato', sans-serif", fontSize: "0.8rem", color: "#777", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{d.msg}"
                    </p>
                  )}
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.72rem", color: "#bbb", display: "block", marginTop: "3px" }}>
                    {d.tempo}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", paddingTop: "1.25rem" }}>
            <button
              type="button"
              onClick={onDonate}
              style={{
                background: "#24CA68",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                padding: "12px 32px",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Fazer parte dessa lista 💚
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, isEmail }: { label: string; value: string; isEmail?: boolean }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:"4px 8px",alignItems:"baseline"}}>
      <span style={{fontFamily:"'Lato',sans-serif",fontSize:"0.78rem",color:"#aaa",flexShrink:0}}>{label}:</span>
      {isEmail ? (
        <a href={`mailto:${value}`} style={{fontFamily:"'Lato',sans-serif",fontSize:"0.82rem",color:"#24CA68",fontWeight:600,textDecoration:"none"}}>{value}</a>
      ) : (
        <span style={{fontFamily:"'Lato',sans-serif",fontSize:"0.82rem",color:"#333",fontWeight:600}}>{value}</span>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "14px", marginTop: "8px" }}>
      <div style={{ width: "3px", minHeight: "24px", background: "#24CA68", borderRadius: "999px", flexShrink: 0, marginTop: "4px" }} />
      <h2 style={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 800,
        fontSize: "1.05rem",
        color: "#1a1a1a",
        margin: 0,
        lineHeight: 1.35,
      }}>
        {children}
      </h2>
    </div>
  );
}
