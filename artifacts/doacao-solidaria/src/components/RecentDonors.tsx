interface Donor {
  nome: string;
  initials: string;
  color: string;
  valorNum: number;
  minsAgo: number;
  isNew?: boolean;
}

interface RecentDonorsProps {
  donors: Donor[];
  formatBRL: (v: number) => string;
}

export default function RecentDonors({ donors, formatBRL }: RecentDonorsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-8" id="section-atualizacoes">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px justify-center" aria-label="Tabs">
          <button
            type="button"
            className="py-4 px-6 text-center border-b-2 font-medium text-sm"
            style={{borderColor:"#24CA68",color:"#24CA68"}}
          >
            Doadores recentes
          </button>
        </nav>
      </div>

      <div className="p-6">
        <div className="atualizacoes-scroll-wrap" id="atualizacoes-scroll-wrap">
          <div id="atualizacoes-list" className="max-w-none">
            {donors.map((donor, i) => (
              <div
                key={`${donor.nome}-${i}`}
                className={`atualizacao-pix-msg${donor.isNew ? " vaq-donor-new" : ""}`}
              >
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",minWidth:0}}>
                    {/* SVG Avatar */}
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 36 36"
                      aria-hidden="true"
                      style={{flexShrink:0}}
                    >
                      <circle cx="18" cy="18" r="18" fill={donor.color} />
                      <text
                        x="18"
                        y="19.5"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="13"
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fill="#ffffff"
                      >
                        {donor.initials}
                      </text>
                    </svg>

                    <div style={{minWidth:0}}>
                      <strong className="atualizacao-pix-msg__nome">{donor.nome}</strong>
                      <div className="atualizacao-pix-msg__text">
                        {donor.minsAgo <= 0
                          ? "Agora mesmo"
                          : `há ${donor.minsAgo} minuto${donor.minsAgo === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}>
                    <div className="atualizacao-pix-msg__valor">{formatBRL(donor.valorNum)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
