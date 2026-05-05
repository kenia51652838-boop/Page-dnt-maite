import { useState } from "react";

interface NavbarProps {
  onCreateCampaign: () => void;
}

export default function Navbar({ onCreateCampaign }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const prevent = (e: React.MouseEvent) => e.preventDefault();

  const navLinks = [
    { label: "Como funciona", href: "#" },
    { label: "Explorar", href: "#" },
    { label: "Blog", href: "#" },
  ];

  return (
    <>
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #ebebeb",
        position: "sticky",
        top: 0,
        zIndex: 300,
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "0 20px",
          height: "62px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>

          {/* Logo */}
          <a href="#" onClick={prevent} style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <img
              src={`${import.meta.env.BASE_URL}img/logo-clara.png`}
              alt="Vakinha"
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
            />
          </a>

          {/* Centro — links desktop */}
          <div className="only-desktop" style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={prevent} style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 600,
                fontSize: "0.88rem",
                color: "#444",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "background 0.15s, color 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; (e.currentTarget as HTMLElement).style.color = "#24CA68"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#444"; }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Direita */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>

            {/* Busca */}
            <button
              aria-label="Buscar"
              onClick={() => setSearchOpen(s => !s)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#666", display: "flex", alignItems: "center", borderRadius: "6px" }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Entrar — desktop */}
            <a href="#" onClick={prevent} className="only-desktop" style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: "0.83rem",
              color: "#24CA68",
              textDecoration: "none",
              padding: "7px 14px",
              borderRadius: "999px",
              border: "1.5px solid #24CA68",
              transition: "background 0.15s, color 0.15s",
              letterSpacing: "0.01em",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#e8faf2"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              Entrar
            </a>

            {/* Criar campanha — desktop */}
            <button
              type="button"
              onClick={onCreateCampaign}
              className="only-desktop"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "0.83rem",
                color: "#fff",
                background: "#24CA68",
                border: "none",
                borderRadius: "999px",
                padding: "8px 16px",
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "background 0.15s",
                boxShadow: "0 2px 8px rgba(0,157,78,0.2)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1aad56"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#24CA68"; }}
            >
              Criar campanha
            </button>

            {/* Hambúrguer — mobile */}
            <button
              aria-label="Menu"
              onClick={() => setMenuOpen(s => !s)}
              className="only-mobile"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#444", display: "flex", alignItems: "center", borderRadius: "6px" }}
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Barra de busca expandível */}
        {searchOpen && (
          <div style={{
            borderTop: "1px solid #ebebeb",
            padding: "10px 20px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Buscar campanhas..."
              style={{
                border: "none",
                outline: "none",
                fontFamily: "'Lato', sans-serif",
                fontSize: "0.95rem",
                color: "#282828",
                flex: 1,
                background: "transparent",
              }}
            />
          </div>
        )}
      </nav>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: "fixed",
          top: "62px",
          left: 0,
          right: 0,
          background: "#fff",
          zIndex: 299,
          borderBottom: "1px solid #ebebeb",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "8px 0 16px",
        }}>
          {[...navLinks, { label: "Entrar", href: "#" }, { label: "Cadastrar", href: "#" }].map(l => (
            <a key={l.label} href={l.href} onClick={prevent} style={{
              display: "block",
              fontFamily: "'Lato', sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "#282828",
              textDecoration: "none",
              padding: "12px 24px",
              borderBottom: "1px solid #f5f5f5",
            }}>
              {l.label}
            </a>
          ))}
          <div style={{ padding: "14px 20px 0" }}>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onCreateCampaign(); }}
              style={{
                width: "100%",
                background: "#24CA68",
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                padding: "13px",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Criar campanha
            </button>
          </div>
        </div>
      )}
    </>
  );
}
