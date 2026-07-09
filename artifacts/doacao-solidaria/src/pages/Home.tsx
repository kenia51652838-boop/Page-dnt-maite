import { useState, useEffect, useRef, useCallback } from "react";
import { apiUrl, safeJson, fetchWithRetry, pollPixJob } from "@/lib/api";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CampaignContent from "@/components/CampaignContent";
import DonationForm from "@/components/DonationForm";
import RecentDonors from "@/components/RecentDonors";
import PixModal from "@/components/PixModal";
import DoacaoModal from "@/components/DoacaoModal";
import PixLoadingModal from "@/components/PixLoadingModal";
import PixBankNoticeModal from "@/components/PixBankNoticeModal";
import PixLimitModal from "@/components/PixLimitModal";
import ThankYouModal from "@/components/ThankYouModal";
import PrivateFomoToast from "@/components/PrivateFomoToast";
import ToastContainer from "@/components/ToastContainer";
import Footer from "@/components/Footer";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import ExitIntentModal from "@/components/ExitIntentModal";
import FomoNotification from "@/components/FomoNotification";
import BeneficiaryMessageModal from "@/components/BeneficiaryMessageModal";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  leaving?: boolean;
};

const DONATION_VALUES = [30, 35, 40, 50, 60, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 2000];
const TOTAL_SEC = 5 * 60;

export const META = 12500;
export const ARRECADADO = 3689;
export const PCT = "29.51";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function generateAnonymousCPF() {
  const n: number[] = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  let sum = n.reduce((acc, val, i) => acc + val * (10 - i), 0);
  const d1 = (sum * 10) % 11;
  n.push(d1 < 10 ? d1 : 0);
  sum = n.reduce((acc, val, i) => acc + val * (11 - i), 0);
  const d2 = (sum * 10) % 11;
  n.push(d2 < 10 ? d2 : 0);
  return n.join("");
}

const FIRST_NAMES = [
  "Ana","Beatriz","Camila","Daniela","Eduarda","Fernanda","Gabriela","Helena","Isabel","Juliana",
  "Karen","Larissa","Mariana","Natália","Olivia","Patricia","Rafaela","Sabrina","Tatiane","Vanessa",
  "Adriana","Bruna","Carla","Débora","Elaine","Flávia","Giovana","Patrícia","Isabela","Joana",
  "Kelly","Leticia","Mônica","Nayara","Paloma","Renata","Simone","Thais","Verônica","Yasmin",
  "Carlos","Daniel","Eduardo","Felipe","Gabriel","Henrique","Igor","João","Lucas","Marcos",
  "Nicolás","Otávio","Paulo","Rafael","Sandro","Thiago","Vitor","Wagner","Yago","Zé Carlos",
  "Alexandre","Bruno","Caio","Diego","Elias","Fábio","Gustavo","Heitor","Ivan","Jorge",
  "Kevin","Leonardo","Mateus","Nathan","Pedro","Rodrigo","Samuel","Tiago","Uriel","Victor",
  "André","Bernardo","Cláudio","Davi","Emanuel","Francisco","Giovani","Humberto","Ítalo","José",
  "Kelvin","Leandro","Murilo","Neto","Plínio","Renan","Sérgio","Thalisson","Ulisses","Vinícius",
];

const LAST_NAMES = [
  "Silva","Santos","Oliveira","Souza","Lima","Costa","Ferreira","Rodrigues","Alves","Pereira",
  "Martins","Ribeiro","Carvalho","Gomes","Barbosa","Rocha","Dias","Monteiro","Nunes","Macedo",
  "Araújo","Correia","Cardoso","Melo","Moreira","Nascimento","Figueiredo","Campos","Castro","Cunha",
  "Andrade","Barros","Cavalcante","Duarte","Esteves","Freitas","Guimarães","Henriques","Ivo","Jardim",
  "Leal","Miranda","Nogueira","Pinto","Queiroz","Ramos","Siqueira","Tavares","Uchoa","Valente",
  "Xavier","Zanini","Abreu","Bezerra","Coelho","Dornelas","Evangelista","Fontes","Godoi","Lopes",
  "Leite","Mendes","Neves","Pires","Queirós","Resende","Sales","Teixeira","Vieira","Werneck",
  "Assis","Braga","Carneiro","Domingues","Estrada","Fonseca","Galvão","Hoffmann","Iglesias","Klein",
  "Lacerda","Moura","Napoleão","Osório","Paiva","Reis","Soares","Torres","Vasconcelos","Wolf",
  "Aguiar","Brito","Caldas","Delfino","Espindola","Fraga","Gonçalves","Hora","Isidoro","Jansen",
];

function generateAnonymousCustomer() {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const phone = `119${String(Math.floor(10000000 + Math.random() * 89999999))}`;
  return {
    name,
    email: `${slug}${Math.floor(100 + Math.random() * 900)}@gmail.com`,
    phone,
    cpf: generateAnonymousCPF(),
  };
}

function generateDonors() {
  const firstNames = ["Ana","Bruno","Carla","Diego","Eduarda","Felipe","Gabi","Helena","Igor","João","Karina","Luana","Marcos","Nathalia","Otávio","Paula","Rafael","Sofia","Thiago","Vitória"];
  const lastNames = ["Silva","Santos","Oliveira","Souza","Lima","Costa","Ferreira","Rodrigues","Alves","Pereira","Martins","Ribeiro","Carvalho","Gomes","Barbosa","Rocha","Dias","Monteiro","Nunes","Macedo"];
  const values = [30,35,40,50,60,75,100,150,200,300];
  const colors = ["#0ea5e9","#22c55e","#f97316","#a855f7","#ef4444","#14b8a6","#f59e0b","#6366f1"];
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  // Donors históricos: sempre anteriores a qualquer sessão razoável (mín. 25 min)
  // Somente FOMO em tempo real adiciona entradas recentes ("Agora mesmo")
  const minsAgoList = [25, 37, 50, 65, 82, 101, 124, 150];
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const name = pick(firstNames) + " " + pick(lastNames);
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || "") + (parts[parts.length-1]?.[0] || "")).toUpperCase();
    return { nome: name, initials, color: pick(colors), valorNum: pick(values), addedAt: now - minsAgoList[i] * 60 * 1000 };
  });
}

function readUtmParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    src:          p.get("src"),
    sck:          p.get("sck"),
    utm_source:   p.get("utm_source"),
    utm_campaign: p.get("utm_campaign"),
    utm_medium:   p.get("utm_medium"),
    utm_content:  p.get("utm_content"),
    utm_term:     p.get("utm_term"),
  };
}

export default function Home() {
  const utmParams = readUtmParams();
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [fomoBonus, setFomoBonus] = useState(0);
  const [realBonus, setRealBonus] = useState(0);
  const [donors] = useState(generateDonors);
  const [liveDonors, setLiveDonors] = useState(donors);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pixLoadingOpen, setPixLoadingOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [doacaoModalOpen, setDoacaoModalOpen] = useState(false);
  const [bankNoticeOpen, setBankNoticeOpen] = useState(false);
  const [pixLimitOpen, setPixLimitOpen] = useState(false);
  const [thankYouOpen, setThankYouOpen] = useState(() =>
    new URLSearchParams(window.location.search).get("thanks") === "1"
  );
  const [thankYouOpenOnUpsell, setThankYouOpenOnUpsell] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const [hasDonated, setHasDonated] = useState(false);
  const [donorCity, setDonorCity] = useState("");
  const [privateFomo, setPrivateFomo] = useState(false);
  const [privateFomoData, setPrivateFomoData] = useState<{ name: string; city: string; amount: number } | null>(null);
  const donorCityFetchedRef = useRef(false);
  const _urlAmount = Number(new URLSearchParams(window.location.search).get("amount")) || null;
  const [generatingPix, setGeneratingPix] = useState(false);

  const [pixCode, setPixCode] = useState("");
  const [pixTxId, setPixTxId] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [pixExpired, setPixExpired] = useState(false);
  const [hasActivePix, setHasActivePix] = useState(false);
  const [countdownText, setCountdownText] = useState("5:00");
  const [copiedMsg, setCopiedMsg] = useState<{text:string;err:boolean}|null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);
  const paidAmountRef = useRef<number>(0);
  const clientIpRef = useRef<string | undefined>(undefined);

  const showToast = useCallback((t: Omit<ToastItem,"id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    const dur = t.type === "warning" ? 5000 : 4000;
    setTimeout(() => {
      setToasts(prev => prev.map(x => x.id === id ? {...x, leaving: true} : x));
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 400);
    }, dur);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(x => x.id === id ? {...x, leaving: true} : x));
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 400);
  };

  // Captura o IP real do browser (IPv6-aware) no mount para usar no CAPI — evita mismatch IPv4/IPv6
  useEffect(() => {
    (async () => {
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://api64.ipify.org?format=json", { signal: controller.signal });
        clearTimeout(to);
        const data = await res.json() as { ip: string };
        if (data.ip) clientIpRef.current = data.ip;
      } catch {}
    })();
  }, []);

  // Fetch donor city when ThankYouModal opens (once per session)
  useEffect(() => {
    const ping = () => fetch(apiUrl("/api/healthz"), { method: "GET" }).catch(() => {});
    ping();
    const id = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!thankYouOpen || donorCityFetchedRef.current) return;
    donorCityFetchedRef.current = true;
    (async () => {
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 4500);
        const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
        clearTimeout(to);
        const data = await res.json();
        if (data.city && data.region_code) {
          setDonorCity(`${data.city}, ${data.region_code}`);
        } else if (data.city) {
          setDonorCity(data.city);
        }
      } catch {
        // sem cidade se falhar
      }
    })();
  }, [thankYouOpen]);

  // Callback quando o lead escolhe se identificar ou ficar anônimo
  function handleIdentify(name: string | null) {
    const displayName = name && name.trim() ? name.trim() : "Doador Anônimo";
    const amount = selectedValue || _urlAmount || 0;

    // Mostra o toast privado idêntico ao FOMO
    setPrivateFomoData({ name: displayName, city: donorCity, amount });
    setPrivateFomo(true);

    let initials: string;
    let color: string;
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      initials = ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
      const colors = ["#24CA68", "#0ea5e9", "#a855f7", "#f59e0b"];
      color = colors[Math.floor(Math.random() * colors.length)];
      setLiveDonors(prev => [{ nome: name.trim(), initials, color, valorNum: amount, addedAt: Date.now(), isNew: true }, ...prev.slice(0, 9)]);
    } else {
      initials = "DA";
      color = "#6b7280";
      setLiveDonors(prev => [{ nome: "Doador Anônimo", initials, color, valorNum: amount, addedAt: Date.now(), isNew: true }, ...prev.slice(0, 9)]);
    }

    // Persiste o doador no localStorage para reaparecer na lista ao voltar para o início
    try {
      localStorage.setItem("ds_recent_donor", JSON.stringify({
        nome: displayName, initials, color, valorNum: amount,
        city: donorCity, timestamp: Date.now(),
      }));
    } catch {}
  }

  // Ao montar o Home, verifica se há um doador recente salvo e coloca no topo da lista
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ds_recent_donor");
      if (!raw) return;
      const donor = JSON.parse(raw) as { nome: string; initials: string; color: string; valorNum: number; city?: string; timestamp: number };
      if (Date.now() - donor.timestamp < 30 * 60 * 1000) {
        setLiveDonors(prev => [{ nome: donor.nome, initials: donor.initials, color: donor.color, valorNum: donor.valorNum, addedAt: donor.timestamp, isNew: true }, ...prev.slice(0, 9)]);
      } else {
        localStorage.removeItem("ds_recent_donor");
      }
    } catch {}
  }, []);

  // Live donors: alimentado exclusivamente pelo FOMO, doações reais e retorno de doador salvo
  // (interval silencioso removido — evita "Agora mesmo" fantasma sem toast correspondente)

  // Countdown
  function startCountdown(expiresAt: number) {
    expiresAtRef.current = expiresAt;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const rem = expiresAtRef.current - Date.now();
      if (rem <= 0) {
        setCountdownText("0:00");
        if (countdownRef.current) clearInterval(countdownRef.current);
        setPixExpired(true);
        setHasActivePix(false);
        stopPolling();
        return;
      }
      const s = Math.ceil(rem / 1000);
      const m = Math.floor(s / 60);
      const r = s % 60;
      setCountdownText(`${m}:${r < 10 ? "0" : ""}${r}`);
    }, 250);
  }

  // Status polling
  function startPolling(txId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/pix/status/${txId}`));
        const data = await res.json() as { status?: string };
        if (data.status === "paid") {
          stopPolling();
          if (countdownRef.current) clearInterval(countdownRef.current);
          try { (window as any).fbq?.("track", "Purchase", { value: paidAmountRef.current, currency: "BRL" }, { eventID: txId }); } catch {}
          setPixConfirmed(true);
          setHasActivePix(false);
          setPixModalOpen(false);
          setRealBonus(prev => prev + paidAmountRef.current);
          setThankYouOpen(true);
          document.body.style.overflow = "hidden";
        } else if (data.status === "expired") {
          stopPolling();
          setPixExpired(true);
          setHasActivePix(false);
        }
      } catch (err) {
        console.warn("[polling] erro ao checar status PIX:", err);
      }
    }, 5000);
  }

  async function handleVerifyPayment() {
    if (!pixTxId) return;
    try {
      const res = await fetch(apiUrl(`/api/pix/status/${pixTxId}`));
      const data = await safeJson<{ status?: string }>(res);
      if (data.status === "paid") {
        stopPolling();
        if (countdownRef.current) clearInterval(countdownRef.current);
        try { (window as any).fbq?.("track", "Purchase", { value: paidAmountRef.current, currency: "BRL" }, { eventID: pixTxId }); } catch {}
        setPixConfirmed(true);
        setHasActivePix(false);
        setPixModalOpen(false);
        setRealBonus(prev => prev + paidAmountRef.current);
        setThankYouOpen(true);
        document.body.style.overflow = "hidden";
      } else {
        return "pending";
      }
    } catch (err) {
      console.warn("[verificar] erro ao checar status:", err);
      throw err;
    }
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function generatePix(value: number) {
    if (generatingPix) return;

    // Se já tem um PIX ativo (não pago, não expirado), bloqueia e mostra aviso
    if (hasActivePix && !pixConfirmed && !pixExpired) {
      setPixModalOpen(true);         // reabre o modal do PIX caso esteja fechado
      closeDoacaoModal();
      document.body.style.overflow = "hidden";
      setTimeout(() => setPixLimitOpen(true), 150);
      return;
    }

    setSelectedValue(value);
    paidAmountRef.current = value;
    setGeneratingPix(true);
    setPixLoadingOpen(true);
    setPixExpired(false);
    setPixConfirmed(false);
    setCountdownText("5:00");

    const customer = generateAnonymousCustomer();

    const readFbp = (): string | undefined => { try { const m = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/); return m ? m[2] : undefined; } catch { return undefined; } };
    const readFbc = (): string | undefined => { try { const m = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/); if (m) return m[2]; const c = new URLSearchParams(window.location.search).get("fbclid"); return c ? `fb.1.${Date.now()}.${c}` : undefined; } catch { return undefined; } };

    try {
      const res = await fetchWithRetry(apiUrl("/api/pix/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          amount: value,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_cpf: customer.cpf,
          utm: utmParams,
          fbp: readFbp(),
          fbc: readFbc(),
          client_ip: clientIpRef.current,
        }),
      });
      const rawData = await safeJson<{
        pix_code?: string;
        transaction_id?: string;
        expires_at?: string;
        error?: string;
        job_id?: string;
        status?: string;
      }>(res);

      if (!res.ok || rawData.error) {
        const errMsg = (rawData.error || "").toLowerCase();
        if (errMsg.includes("limit") || errMsg.includes("limite") || errMsg.includes("ativo") || res.status === 422) {
          setPixLoadingOpen(false);
          setPixModalOpen(true);
          closeDoacaoModal();
          document.body.style.overflow = "hidden";
          setTimeout(() => setPixLimitOpen(true), 300);
          return;
        }
        throw new Error(rawData.error || "Erro ao gerar PIX");
      }

      // Job em background — frontend aguarda via polling (PixLoadingModal continua aberto)
      const data = (rawData.job_id && rawData.status === "processing")
        ? { ...rawData, ...(await pollPixJob(rawData.job_id)) }
        : rawData;

      const expAt = Date.now() + TOTAL_SEC * 1000;

      setPixCode(data.pix_code || "");
      setPixTxId(data.transaction_id || "");
      setHasActivePix(true);
      setPixLoadingOpen(false);
      closeDoacaoModal();
      try {
        // Re-init dos 3 pixels com dados do cliente para correspondência avançada no browser
        const FB_PIXEL_IDS = ["1507785031003753", "1308311710742436", "2382122502268128", "2008889186664643", "1678939216734559"];
        const nameParts = customer.name.trim().split(/\s+/);
        const advData = {
          em: customer.email,
          ph: customer.phone.replace(/\D/g, ""),
          fn: nameParts[0] || "",
          ln: nameParts.slice(1).join(" ") || "",
        };
        for (const pid of FB_PIXEL_IDS) {
          (window as any).fbq?.("init", pid, advData);
        }
      } catch {}
      try { (window as any).fbq?.("track", "InitiateCheckout", { value, currency: "BRL", num_items: 1, content_ids: ["hot-assinatura-semanal-francis"] }, { eventID: `checkout_${data.transaction_id || ""}` }); } catch {}
      setPixModalOpen(true);
      document.body.style.overflow = "hidden";
      startCountdown(expAt);
      startPolling(data.transaction_id || "");
    } catch (err) {
      setPixLoadingOpen(false);
      const msg = err instanceof Error ? err.message : "Erro ao gerar PIX";
      showToast({ title: "Erro", message: msg, type: "error" });
    } finally {
      setGeneratingPix(false);
    }
  }

  function closeThankYouModal() {
    setThankYouOpen(false);
    setThankYouOpenOnUpsell(false);
    setPixConfirmed(false);
    setPixExpired(false);
    if (paidAmountRef.current > 0) {
      setFomoBonus(prev => prev + paidAmountRef.current);
      paidAmountRef.current = 0;
    }
    setHasDonated(true);
    setSelectedValue(null);
    document.body.style.overflow = "";
  }

  function openVipUpsell() {
    setThankYouOpenOnUpsell(true);
    setThankYouOpen(true);
    document.body.style.overflow = "hidden";
  }

  function openDoacaoModal() {
    setDoacaoModalOpen(true);
    document.body.style.overflow = "hidden";
  }
  function closeDoacaoModal() {
    setDoacaoModalOpen(false);
    document.body.style.overflow = "";
  }
  function closePixModal() {
    setPixModalOpen(false);
    document.body.style.overflow = "";
    // Se o PIX já foi pago ou expirou, reseta tudo
    // Se ainda está ativo, mantém polling/countdown rodando em background
    if (pixConfirmed || pixExpired) {
      stopPolling();
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPixConfirmed(false);
      setPixExpired(false);
      setHasActivePix(false);
      setSelectedValue(null);
    }
  }

  function handleCopyPixCode() {
    if (!pixCode) return;
    navigator.clipboard?.writeText(pixCode).then(() => {
      setCopiedMsg({ text: "Código PIX copiado!", err: false });
      setBankNoticeOpen(true);
      setTimeout(() => setCopiedMsg(null), 3000);
    }).catch(() => {
      setCopiedMsg({ text: "Não foi possível copiar.", err: true });
      setTimeout(() => setCopiedMsg(null), 3000);
    });
  }

  const efectivoArrecadado = ARRECADADO + fomoBonus + realBonus;

  const donationForm = (
    <DonationForm
      selectedValue={selectedValue}
      onValueClick={setSelectedValue}
      onGeneratePix={generatePix}
      donationValues={DONATION_VALUES}
      formatBRL={formatBRL}
      loading={generatingPix}
      arrecadado={efectivoArrecadado}
    />
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onCreateCampaign={() => showToast({title:"Em breve", message:"Funcionalidade em desenvolvimento.", type:"info"})} />

      <main className="flex-grow">
        <div style={{background:"#f5f5f5",minHeight:"100vh"}}>
          <HeroSection onDonate={openDoacaoModal} formatBRL={formatBRL} arrecadado={efectivoArrecadado} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 layout-campanha">
            <div className="col-left">
              <CampaignContent onDonate={openDoacaoModal} />
              <RecentDonors donors={liveDonors} formatBRL={formatBRL} />
            </div>
            <aside className="col-right">
              <div style={{background:"#fff",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"1.5rem",position:"sticky",top:"72px"}}>
                {donationForm}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer onPrivacyClick={() => setPrivacyOpen(true)} />

      {/* Sticky bottom bar — mobile only */}
      <div className="only-mobile" style={{
        position:"fixed",
        bottom:0,
        left:0,
        right:0,
        zIndex:150,
        background:"#fff",
        borderTop:"1px solid #e8e8e8",
        padding:"12px 16px calc(16px + env(safe-area-inset-bottom))",
        boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",
      }}>
        {hasDonated ? (
          <button
            type="button"
            onClick={openVipUpsell}
            style={{
              width:"100%",
              background:"linear-gradient(135deg, #f59e0b, #d97706)",
              color:"#fff",
              border:"none",
              borderRadius:"999px",
              padding:"15px",
              fontFamily:"'Montserrat',sans-serif",
              fontWeight:800,
              fontSize:"0.9rem",
              cursor:"pointer",
              letterSpacing:"0.01em",
              boxShadow:"0 4px 14px rgba(245,158,11,0.4)",
            }}
          >
            👑 Ser Doador VIP — Acesso Direto ao Beneficiário
          </button>
        ) : (
          <button
            type="button"
            onClick={openDoacaoModal}
            style={{
              width:"100%",
              background:"#24CA68",
              color:"#fff",
              border:"none",
              borderRadius:"999px",
              padding:"15px",
              fontFamily:"'Montserrat',sans-serif",
              fontWeight:800,
              fontSize:"1rem",
              cursor:"pointer",
              letterSpacing:"0.02em",
              boxShadow:"0 4px 14px rgba(0,157,78,0.35)",
            }}
          >
            Quero Ajudar 💚
          </button>
        )}
        <a
          href={`https://wa.me/?text=${encodeURIComponent("Olha só isso... Um pai de 47 anos, com a perna fraturada, cria 4 filhos SOZINHO e ainda deixa de comer para que eles possam jantar. Você pode ajudar com qualquer valor, até R$30 já garante o jantar dessa família hoje 💚\n\n" + window.location.href)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:"block",
            width:"100%",
            textAlign:"center",
            background:"transparent",
            color:"#24CA68",
            border:"1.5px solid #24CA68",
            borderRadius:"999px",
            padding:"11px",
            fontFamily:"'Montserrat',sans-serif",
            fontWeight:700,
            fontSize:"0.88rem",
            cursor:"pointer",
            marginTop:"8px",
            letterSpacing:"0.01em",
            textDecoration:"none",
            boxSizing:"border-box",
          }}
        >
          Compartilhar
        </a>
      </div>

      <PixLoadingModal isOpen={pixLoadingOpen} />

      <PixModal
        isOpen={pixModalOpen}
        pixCode={pixCode}
        amount={formatBRL(selectedValue || 0)}
        countdownText={countdownText}
        confirmed={pixConfirmed}
        expired={pixExpired}
        onClose={closePixModal}
        onCopy={handleCopyPixCode}
        copiedMsg={copiedMsg}
        onConfirmedClose={closePixModal}
        onVerify={handleVerifyPayment}
      />

      <PixLimitModal
        isOpen={pixLimitOpen}
        onClose={() => setPixLimitOpen(false)}
      />

      <DoacaoModal isOpen={doacaoModalOpen} onClose={closeDoacaoModal}>
        {donationForm}
      </DoacaoModal>

      <ThankYouModal
        isOpen={thankYouOpen}
        donationAmount={selectedValue || _urlAmount || 0}
        arrecadado={efectivoArrecadado}
        onClose={closeThankYouModal}
        onIdentify={handleIdentify}
        donorCity={donorCity}
        openOnUpsell={thankYouOpenOnUpsell}
      />

      {privateFomo && privateFomoData && (
        <PrivateFomoToast
          name={privateFomoData.name}
          city={privateFomoData.city}
          amount={privateFomoData.amount}
          onDismiss={() => setPrivateFomo(false)}
        />
      )}

      <PixBankNoticeModal isOpen={bankNoticeOpen} onClose={() => setBankNoticeOpen(false)} />

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      <BeneficiaryMessageModal onDonate={openDoacaoModal} />

      <ExitIntentModal onDonate={openDoacaoModal} />

      <FomoNotification onDonate={(amount, donor) => {
        setFomoBonus(prev => prev + amount);
        const colors = ["#0ea5e9","#22c55e","#f97316","#a855f7","#ef4444","#14b8a6","#f59e0b","#6366f1"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        setLiveDonors(prev => [{ nome: donor.name, initials: donor.initials, color, valorNum: amount, addedAt: Date.now(), isNew: true }, ...prev.slice(0, 9)]);
      }} />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
