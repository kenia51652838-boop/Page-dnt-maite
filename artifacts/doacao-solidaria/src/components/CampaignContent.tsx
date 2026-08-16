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
    data: "15 ago. 2026",
    autor: "Equipe Vakinha",
    titulo: "A Glaice conseguiu a consulta com o neurologista 🙏",
    texto: "Graças às doações recebidas, a Glaice conseguiu agendar a consulta com o neurologista infantil que a Maíte precisava com urgência. O médico confirmou que com fisioterapia intensiva e acompanhamento especializado, a Maíte tem grandes chances de evolução. Cada real doado está fazendo diferença real na vida dessa criança.",
    reacoes: 428,
  },
  {
    id: 2,
    data: "13 ago. 2026",
    autor: "Equipe Vakinha",
    titulo: "Maíte começou as sessões de fisioterapia 💪",
    texto: "Nesta semana a Maíte iniciou as primeiras sessões de fisioterapia. A fisiatra disse que ela tem potencial de melhora significativa, mas precisa de tratamento contínuo e sem interrupção. O tratamento é caro e a família não tem condições de arcar. Cada doação garante que a Maíte não perca uma sessão sequer.",
    reacoes: 312,
  },
];

const DOADORES = [
  { nome: "Ana C.", valor: 150, tempo: "há 8 min", msg: "Meu Deus, que história difícil. Força, pequena Maíte! 💚" },
  { nome: "Roberto M.", valor: 50, tempo: "há 23 min", msg: "" },
  { nome: "Fernanda Lima", valor: 200, tempo: "há 37 min", msg: "Essa mãe é uma guerreira. A Maíte merece todo o tratamento do mundo." },
  { nome: "Carlos Eduardo", valor: 100, tempo: "há 58 min", msg: "" },
  { nome: "Mariana T.", valor: 75, tempo: "há 1h 15min", msg: "Chorei muito vendo o vídeo da Glaice. Que Deus abençoe essa família 🙏" },
  { nome: "Doador anônimo", valor: 500, tempo: "há 2h", msg: "" },
  { nome: "Patricia Souza", valor: 100, tempo: "há 2h 30min", msg: "Força pro tratamento da Maíte! Vocês não estão sozinhos." },
  { nome: "João Henrique", valor: 50, tempo: "há 3h", msg: "" },
  { nome: "Beatriz O.", valor: 300, tempo: "há 4h", msg: "Compartilhei com todo mundo. Vamos ajudar a Maíte!" },
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

          {/* Badge categoria */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#edfaf3",
            border: "1px solid #b8edcf",
            borderRadius: "6px",
            padding: "4px 10px",
            marginBottom: "1rem",
          }}>
            <span style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.7rem", color: "#1aad56", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🏥 Saúde · Criança
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "#1a1a1a",
            margin: "0 0 14px",
            lineHeight: 1.35,
          }}>
            🎥 Assista ao vídeo da mãe da Maíte e entenda por que ela precisa de você
          </h2>

          {/* Foto da campanha */}
          <div style={{
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "1.75rem",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            lineHeight: 0,
          }}>
            <img
              src={`${import.meta.env.BASE_URL}img/maite.png`}
              alt="Maíte e sua mãe Glaice"
              loading="lazy"
              decoding="async"
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <SectionHeading>💔 Um erro médico mudou a vida da Maíte antes mesmo dela começar</SectionHeading>

          <p className="paragrafo-historia">
            Nenhuma mãe imagina que o nascimento do seu filho será o início de uma batalha diária pela vida. Mas foi exatamente isso que aconteceu com <b className="destacar-no-texto">Glaice</b>, mãe da pequena <b className="destacar-no-texto">Maíte</b>.
          </p>
          <br />
          <p className="paragrafo-historia">
            Durante o fim de semana, <b className="destacar-no-texto">a bebê parou de se mexer</b>. A família foi ao hospital, mas os médicos não quiseram fazer a cesárea. Preferiram esperar. Esperaram o fim de semana inteiro. E quando chegou a segunda-feira — já era tarde demais.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Maíte chegou sem vida.</b> Os médicos precisaram ressuscitá-la. Ela sobreviveu — mas ficou com <b className="destacar-no-texto">graves sequelas neurológicas</b> causadas pela falta de oxigênio no parto. Sequelas que poderiam ter sido evitadas. Sequelas que hoje fazem parte do cotidiano dessa família.
          </p>
          <br />
          <p className="paragrafo-historia">
            Maíte hoje tem <b className="destacar-no-texto">2 anos</b>. E luta todos os dias. Sua mãe Glaice está processando o hospital, mas enquanto a Justiça não resolve, <b className="destacar-no-texto">o tratamento precisa continuar</b> — e ele custa caro.
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR A MAÍTE</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          <SectionHeading>👩 A mãe que vende açaí para salvar a filha</SectionHeading>

          <p className="paragrafo-historia">
            Para pagar o tratamento da Maíte, <b className="destacar-no-texto">Glaice abriu uma açaiteria</b> no bairro Marcinhos. Ela está lá todos os dias, trabalhando com o marido Michel, com a esperança de conseguir dinheiro suficiente para pagar as consultas, as sessões de fisioterapia e os exames da filha.
          </p>
          <br />
          <p className="paragrafo-historia">
            Mas a loja está fraca. O movimento é pouco. E a conta do tratamento não espera. É por isso que um influencer que conhecia a história da Glaice entrou na açaiteria e perguntou se ela trocava um açaí por uma divulgação. Ela disse que sim.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Esse vídeo viralizou.</b> E agora essa história chegou até você.
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR ESSA FAMÍLIA</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          <SectionHeading>🩺 O que a Maíte precisa agora</SectionHeading>

          <p className="paragrafo-historia">
            Não estamos falando de luxo. Estamos falando do tratamento básico que qualquer criança com sequelas neurológicas precisa:
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Fisioterapia intensiva.</b> As sessões precisam ser contínuas, sem interrupção. Cada semana sem fisioterapia é um retrocesso no desenvolvimento da Maíte.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Acompanhamento neurológico.</b> Consultas com especialistas são caras e precisam acontecer regularmente para acompanhar a evolução da Maíte.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Exames e avaliações.</b> Ressonâncias, eletroencefalogramas e avaliações multidisciplinares são essenciais para guiar o tratamento correto.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">Fonoaudiologia e terapia ocupacional.</b> Para que a Maíte possa se comunicar, interagir e ter uma vida com mais dignidade e qualidade.
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>QUERO AJUDAR AGORA</span>
                <span aria-hidden="true">💖</span>
              </span>
            </button>
          </div>

          <SectionHeading>🙏 Você pode mudar a história da Maíte hoje</SectionHeading>

          <p className="paragrafo-historia">
            A Glaice não pediu para estar nessa situação. Ela não escolheu o erro médico que mudou a vida da filha. Ela não desistiu da Maíte. <b className="destacar-no-texto">Mas ela não consegue fazer isso sozinha.</b>
          </p>
          <br />
          <p className="paragrafo-historia">
            Qualquer valor que você puder contribuir vai diretamente para as sessões de fisioterapia, consultas com especialistas e exames da Maíte.
          </p>
          <br />
          <p className="paragrafo-historia">
            Não precisa ser muito. <b className="destacar-no-texto">R$50 já paga uma sessão de fisioterapia.</b> R$100 garante uma semana de tratamento. Cada real faz diferença real na vida dessa criança.
          </p>
          <br />
          <p className="paragrafo-historia">
            Se você não puder contribuir agora, <b className="destacar-no-texto">compartilhe essa história</b>. Um compartilhamento pode chegar até a pessoa certa — e garantir que a Maíte não perca nem um dia de tratamento.
          </p>
          <br />
          <p className="paragrafo-historia">
            <b className="destacar-no-texto">A Maíte lutou para sobreviver. Agora ela precisa de você para viver com dignidade.</b>
          </p>

          <div className="btn-donation-centro-wrap">
            <button type="button" className="btn-donation btn-donation--cta-centro" onClick={onDonate}>
              <span className="btn-donation__inner">
                <span>ESTENDA SUAS MÃOS PELA MAÍTE</span>
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
              <Row label="Organizador" value="ONG Doação Solidária" />
              <Row label="CNPJ" value="19.284.731/0001-45" />
              <Row label="Contato" value="contato@doacaosolidaria.com.br" isEmail />
              <Row label="Beneficiária" value="Maíte (2 anos, sequelas neurológicas de parto)" />
              <Row label="Responsável" value="Glaice (mãe da Maíte)" />
            </div>
            <p style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "0.75rem",
              color: "#aaa",
              margin: "10px 0 0",
              lineHeight: 1.5,
            }}>
              Todas as doações são processadas com segurança via PIX. Os recursos arrecadados são repassados integralmente para o tratamento da Maíte. Em caso de dúvidas, entre em contato pelo e-mail acima.
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
            {Math.round(ARRECADADO / 50).toLocaleString("pt-BR")} apoiadores · ordenado por mais recente
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
