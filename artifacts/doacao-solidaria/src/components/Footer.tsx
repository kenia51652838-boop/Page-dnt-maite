interface FooterProps {
  onPrivacyClick?: () => void;
}

export default function Footer({ onPrivacyClick }: FooterProps) {
  function prevent(e: React.MouseEvent) { e.preventDefault(); }

  const col2 = ["Fazer uma vakinha","Apoiar uma vakinha","Taxas do Vakinha","Resgatar dinheiro","Categorias"];
  const col3 = ["Saúde e bem-estar","Causas sociais","Educação","Animais","Esporte"];
  const col4 = ["Pagamento seguro","Dados protegidos","Suporte","Central de ajuda"];

  return (
    <footer style={{background:"#282a35",color:"#aaa",fontFamily:"'Lato',sans-serif",marginBottom:"80px"}}>
      <div style={{maxWidth:"1120px",margin:"0 auto",padding:"2.5rem 1.25rem 1.5rem"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
          <a href="#" onClick={prevent} style={{display:"flex",alignItems:"center",textDecoration:"none"}}>
            <img
              src={`${import.meta.env.BASE_URL}img/logo-escura.png`}
              alt="Vakinha"
              style={{height:"34px",width:"auto",objectFit:"contain"}}
            />
          </a>

          <div style={{display:"flex",gap:"18px"}}>
            {[
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>,
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="#282a35" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>,
            ].map((icon, i) => (
              <a key={i} href="#" onClick={prevent} style={{color:"#888",display:"flex",alignItems:"center"}}>{icon}</a>
            ))}
          </div>
        </div>

        {/* Bloco da ONG organizadora */}
        <div style={{
          background:"rgba(255,255,255,0.05)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:"10px",
          padding:"1rem 1.25rem",
          marginBottom:"2rem",
          display:"flex",
          flexWrap:"wrap",
          gap:"0.5rem 2rem",
          alignItems:"center",
        }}>
          <div>
            <p style={{margin:0,fontSize:"0.7rem",color:"#666",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>Campanha organizada por</p>
            <p style={{margin:"2px 0 0",fontSize:"0.85rem",color:"#ddd",fontWeight:700}}>ONG Abelhinhas do Amor</p>
          </div>
          <div>
            <p style={{margin:0,fontSize:"0.7rem",color:"#666",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>CNPJ</p>
            <p style={{margin:"2px 0 0",fontSize:"0.85rem",color:"#ddd",fontWeight:700}}>62.669.301/0001-60</p>
          </div>
          <div>
            <p style={{margin:0,fontSize:"0.7rem",color:"#666",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700}}>Contato</p>
            <a href="mailto:contato@abelhinhasdoamor.com.br" style={{display:"block",margin:"2px 0 0",fontSize:"0.85rem",color:"#24CA68",textDecoration:"none",fontWeight:600}}>
              contato@abelhinhasdoamor.com.br
            </a>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"1.5rem",marginBottom:"2rem"}}>
          {[
            {title:"Sobre o Vakinha", links: [
              {label:"Quem somos", onClick: prevent},
              {label:"Como funciona", onClick: prevent},
              {label:"Política de privacidade", onClick: onPrivacyClick ? (e: React.MouseEvent) => { e.preventDefault(); onPrivacyClick(); } : prevent},
              {label:"Termos de uso", onClick: prevent},
              {label:"Fale conosco", onClick: prevent},
            ]},
            {title:"Dúvidas Frequentes", links: col2.map(l => ({label:l, onClick: prevent}))},
            {title:"Blog Vakinha", links: col3.map(l => ({label:l, onClick: prevent}))},
            {title:"Segurança", links: col4.map(l => ({label:l, onClick: prevent}))},
          ].map(({title, links}) => (
            <div key={title}>
              <p style={{fontWeight:700,color:"#fff",fontSize:"0.75rem",marginBottom:"0.75rem",textTransform:"uppercase",letterSpacing:"0.07em",margin:"0 0 0.75rem"}}>{title}</p>
              <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                {links.map(({label, onClick}) => (
                  <li key={label}><a href="#" onClick={onClick} style={{color:"#888",textDecoration:"none",fontSize:"0.82rem",lineHeight:1.4}}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"1.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
          <p style={{fontSize:"0.73rem",color:"#666",margin:0}}>© 2026 ONG Abelhinhas do Amor · CNPJ 62.669.301/0001-60 · Todos os direitos reservados.</p>
          <div style={{display:"flex",gap:"8px"}}>
            {["📱 App Store","🤖 Google Play"].map(label => (
              <a key={label} href="#" onClick={prevent} style={{
                background:"#3a3a4a",borderRadius:"6px",padding:"6px 12px",
                fontSize:"0.68rem",color:"#bbb",textDecoration:"none",
                fontFamily:"'Lato',sans-serif",whiteSpace:"nowrap",
              }}>{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
