import { useState } from "react";

const CTA_MAP: Record<number, string> = {
  30:   "Garantir o jantar de hoje",
  35:   "Colocar comida na mesa",
  40:   "Garantir 2 dias de refeição",
  50:   "Garantir 3 dias de refeição",
  60:   "Alimentar a família por 4 dias",
  75:   "Garantir 4 dias de comida",
  100:  "Garantir 6 dias de alimentação",
  150:  "Garantir 1 semana de comida",
  200:  "Mais de 1 semana garantida",
  300:  "Garantir quase 2 semanas",
  400:  "Garantir 2 semanas completas",
  500:  "Garantir 3 semanas de cuidado",
  750:  "Garantir mais de 1 mês",
  1000: "Transformar a realidade deles",
};

interface CustomerFormProps {
  amount: number;
  formatBRL: (v: number) => string;
  onSubmit: (data: CustomerData) => void;
  onBack: () => void;
  loading: boolean;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
    .replace(/(\d{3})(\d{3})/, "$1.$2")
    .replace(/(\d{3})/, "$1");
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CustomerForm({ amount, formatBRL, onSubmit, onBack, loading }: CustomerFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().split(" ").length < 2) e.name = "Digite o nome completo";
    if (!email.includes("@")) e.email = "E-mail inválido";
    if (phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ""),
      cpf: cpf.replace(/\D/g, ""),
    });
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-400 bg-red-50"
        : "border-gray-200 bg-gray-50 focus:border-green-400 focus:bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} style={{userSelect:"text"}}>
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={onBack} style={{background:"#f1f5f9",border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"1rem",color:"#64748b"}}>
          ←
        </button>
        <div>
          <p className="text-xs text-gray-500 m-0">Doação de</p>
          <p className="font-bold m-0" style={{color:"#24CA68",fontSize:"1.1rem"}}>{formatBRL(amount)}</p>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 mb-4" style={{fontSize:"1rem"}}>Seus dados para gerar o PIX</h3>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Nome completo *</label>
          <input
            type="text"
            className={inputCls("name")}
            placeholder="Ex: Maria Silva"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">E-mail *</label>
          <input
            type="email"
            className={inputCls("email")}
            placeholder="Ex: maria@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Telefone *</label>
          <input
            type="tel"
            className={inputCls("phone")}
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            autoComplete="tel"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">CPF *</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputCls("cpf")}
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCPF(e.target.value))}
          />
          {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="btn-donation mt-4"
        disabled={loading}
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}
      >
        {loading ? (
          <>
            <span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}} />
            Gerando PIX...
          </>
        ) : (
          <>
            <span>{CTA_MAP[amount] ?? "Fazer minha doação"}</span>
            <span style={{opacity: 0.75, fontWeight: 600, fontSize: "0.85em"}}>
              → PIX de {formatBRL(amount)}
            </span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center mt-2">
        🔒 Seus dados são usados apenas para emissão do PIX
      </p>
    </form>
  );
}
