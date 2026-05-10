import { useEffect, useState, useCallback, useRef } from "react";

interface Props {
  onDonate: (amount: number) => void;
}

const FOMO_KEY = "fomo_shown_v1";
const FOMO_AMOUNTS = [30, 35, 40, 50, 60, 75, 100];

const FIRST_NAMES = [
  "Ana","Beatriz","Camila","Fernanda","Gabriela","Helena","Isabel","Juliana","Larissa","Mariana",
  "Natália","Patricia","Rafaela","Sabrina","Tatiane","Adriana","Bruna","Carla","Débora","Elaine",
  "Carlos","Daniel","Eduardo","Felipe","Gabriel","Henrique","Lucas","Marcos","Rafael","Thiago",
  "Alexandre","Bruno","Diego","Fábio","Gustavo","Leonardo","Mateus","Pedro","Rodrigo","Samuel",
  "José","João","Paulo","André","Vitor","Caio","Renan","Murilo","Leandro","Sandro",
];

const LAST_NAMES = [
  "Silva","Santos","Oliveira","Souza","Lima","Costa","Ferreira","Rodrigues","Alves","Pereira",
  "Martins","Ribeiro","Carvalho","Gomes","Barbosa","Rocha","Araújo","Nunes","Macedo","Cunha",
  "Andrade","Barros","Freitas","Guimarães","Leal","Miranda","Nogueira","Pinto","Ramos","Soares",
  "Teixeira","Vieira","Tavares","Duarte","Cardoso","Melo","Moreira","Nascimento","Lopes","Leite",
];

const CONNECTORS = ["dos", "das", "de", "da"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  const first = pick(FIRST_NAMES);
  const last1 = pick(LAST_NAMES);
  let last2 = pick(LAST_NAMES);
  while (last2 === last1) last2 = pick(LAST_NAMES);
  const useConnector = Math.random() > 0.4;
  if (useConnector) {
    return `${first} ${pick(CONNECTORS)} ${last1} ${last2}`;
  }
  return `${first} ${last1} ${last2}`;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(p => p.length > 2);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default function FomoNotification({ onDonate }: Props) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [amount, setAmount] = useState(0);
  const onDonateRef = useRef(onDonate);
  onDonateRef.current = onDonate;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => setVisible(false), 380);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(FOMO_KEY)) return;

    const timer = setTimeout(async () => {
      const fakeName = generateName();
      const fakeAmount = pick(FOMO_AMOUNTS);

      setName(fakeName);
      setAmount(fakeAmount);

      // Busca cidade pelo IP
      let cityStr = "";
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 4500);
        const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        clearTimeout(to);
        const data = await res.json();
        if (data.city && data.region_code) {
          cityStr = `${data.city}, ${data.region_code}`;
        } else if (data.city) {
          cityStr = data.city;
        }
      } catch {
        // sem cidade se falhar
      }

      setCity(cityStr);
      setVisible(true);
      localStorage.setItem(FOMO_KEY, "1");
      onDonateRef.current(fakeAmount);

      // Auto-dismiss após 7 segundos
      setTimeout(() => dismiss(), 7000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [dismiss]);

  if (!visible) return null;

  const initials = getInitials(name);

  return (
    <div className="fomo-toast-wrap" style={{
      position: "fixed",
      left: "16px",
      right: "16px",
      zIndex: 9998,
      maxWidth: "340px",
      animation: leaving
        ? "fomoOut 0.38s ease forwards"
        : "fomoIn 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards",
    }}>
      <style>{`
        .fomo-toast-wrap {
          top: 16px;
        }
        @keyframes fomoIn {
          from { opacity: 0; transform: translateY(-18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fomoOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-14px) scale(0.96); }
        }
        @keyframes fomoTimer {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div style={{
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 10px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf6, #e8faf2)",
          padding: "9px 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderBottom: "1px solid #d1fae5",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#24CA68"/>
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#15803d",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            Doação confirmada
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "0",
              lineHeight: 1,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: "12px 14px 13px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}>
          {/* Avatar */}
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #24CA68, #15944a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(36,202,104,0.32)",
          }}>
            <span style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.88rem",
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {initials}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#111827",
              lineHeight: 1.3,
            }}>
              {name}
            </p>
            {city && (
              <p style={{
                margin: "3px 0 0",
                fontFamily: "'Lato', sans-serif",
                fontSize: "0.73rem",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}>
                <span style={{ fontSize: "0.82rem" }}>📍</span> {city}
              </p>
            )}
            <p style={{
              margin: "6px 0 0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "0.8rem",
              color: "#374151",
            }}>
              acabou de contribuir{" "}
              <span style={{
                fontWeight: 800,
                color: "#24CA68",
                fontSize: "0.92rem",
              }}>
                {formatBRL(amount)}
              </span>
            </p>
          </div>
        </div>

        {/* Barra de tempo */}
        <div style={{ height: "3px", background: "#f3f4f6" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #1aad56, #24CA68)",
            animation: "fomoTimer 7s linear forwards",
          }} />
        </div>
      </div>
    </div>
  );
}
