interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "660px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1rem",
            color: "#1a1a1a",
          }}>
            Política de Privacidade
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#999", fontSize: "1.4rem", lineHeight: 1, padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          overflowY: "auto",
          padding: "1.5rem",
          fontFamily: "'Lato', sans-serif",
          fontSize: "0.88rem",
          color: "#444",
          lineHeight: 1.75,
        }}>
          <p style={{margin:"0 0 0.5rem",fontSize:"0.75rem",color:"#aaa"}}>
            Última atualização: maio de 2026 · ONG Doação Solidária · CNPJ 19.284.731/0001-45
          </p>

          <Section title="1. Quem somos">
            Esta campanha de arrecadação é organizada pela <strong>ONG Doação Solidária</strong>, pessoa jurídica de direito privado inscrita no CNPJ sob o n.º <strong>19.284.731/0001-45</strong>, com o objetivo de apoiar famílias em situação de vulnerabilidade social. Dúvidas podem ser enviadas para <a href="mailto:contato@doacaosolidaria.com.br" style={{color:"#24CA68"}}>contato@doacaosolidaria.com.br</a>.
          </Section>

          <Section title="2. Quais dados coletamos">
            Para processar sua doação via PIX, coletamos os seguintes dados:
            <ul style={{margin:"0.5rem 0 0 1rem",display:"flex",flexDirection:"column",gap:"4px"}}>
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone</li>
              <li>CPF (exigido pela processadora de pagamento)</li>
              <li>Valor da doação</li>
              <li>Endereço IP e parâmetros de campanha (UTM)</li>
            </ul>
          </Section>

          <Section title="3. Para que usamos seus dados">
            Os dados coletados são utilizados exclusivamente para:
            <ul style={{margin:"0.5rem 0 0 1rem",display:"flex",flexDirection:"column",gap:"4px"}}>
              <li>Processar e confirmar o pagamento da sua doação via PIX</li>
              <li>Emitir confirmação da transação</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Contato relacionado à doação, se necessário</li>
            </ul>
            Seus dados <strong>não são vendidos, cedidos ou compartilhados</strong> com terceiros para fins comerciais.
          </Section>

          <Section title="4. Compartilhamento de dados">
            Seus dados podem ser compartilhados apenas com:
            <ul style={{margin:"0.5rem 0 0 1rem",display:"flex",flexDirection:"column",gap:"4px"}}>
              <li><strong>Lumina Pagamentos</strong> — processadora de pagamento PIX, sujeita à regulamentação do Banco Central do Brasil</li>
              <li>Autoridades públicas, quando exigido por lei</li>
            </ul>
          </Section>

          <Section title="5. Segurança">
            Todas as transações são realizadas por meio de conexão segura (HTTPS/TLS). Os dados de pagamento são processados diretamente pela Lumina Pagamentos, que é homologada pelo Banco Central. Não armazenamos dados de cartão ou chaves PIX pessoais dos doadores.
          </Section>

          <Section title="6. Seus direitos (LGPD)">
            Em conformidade com a Lei Geral de Proteção de Dados (Lei n.º 13.709/2018), você tem direito a:
            <ul style={{margin:"0.5rem 0 0 1rem",display:"flex",flexDirection:"column",gap:"4px"}}>
              <li>Confirmar a existência do tratamento dos seus dados</li>
              <li>Acessar os dados que temos sobre você</li>
              <li>Solicitar a correção ou exclusão dos seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>
            Para exercer esses direitos, entre em contato: <a href="mailto:contato@doacaosolidaria.com.br" style={{color:"#24CA68"}}>contato@doacaosolidaria.com.br</a>
          </Section>

          <Section title="7. Retenção de dados">
            Os dados relacionados a doações são mantidos pelo prazo mínimo exigido pela legislação fiscal brasileira (5 anos), após o qual são permanentemente excluídos.
          </Section>

          <Section title="8. Contato">
            ONG Doação Solidária<br />
            CNPJ: 19.284.731/0001-45<br />
            E-mail: <a href="mailto:contato@doacaosolidaria.com.br" style={{color:"#24CA68"}}>contato@doacaosolidaria.com.br</a>
          </Section>
        </div>

        <div style={{padding:"1rem 1.5rem",borderTop:"1px solid #f0f0f0",flexShrink:0}}>
          <button
            onClick={onClose}
            style={{
              width:"100%",
              background:"#24CA68",
              color:"#fff",
              border:"none",
              borderRadius:"999px",
              padding:"12px",
              fontFamily:"'Montserrat',sans-serif",
              fontWeight:700,
              fontSize:"0.88rem",
              cursor:"pointer",
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{marginBottom:"1.25rem"}}>
      <h3 style={{
        fontFamily:"'Montserrat',sans-serif",
        fontWeight:700,
        fontSize:"0.88rem",
        color:"#1a1a1a",
        margin:"0 0 6px",
      }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
