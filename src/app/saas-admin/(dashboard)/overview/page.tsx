export default function OverviewDashboard() {
  return (
    <>
      {/* Canvas Area */}
      <div className="p-lg space-y-lg max-w-[1440px] mx-auto w-full">
        {/* Hero Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Revenue */}
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-sm">
              <span className="text-on-surface-variant font-label-sm">Revenu Mensuel Total</span>
              <span className="text-secondary font-label-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="trending_up">trending_up</span>
                <span>+12%</span>
              </span>
            </div>
            <div className="font-headline-lg text-headline-lg">$428,190</div>
            <div className="mt-md h-1 bg-surface-container-low rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[72%]"></div>
            </div>
          </div>
          {/* Tenants */}
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-sm">
              <span className="text-on-surface-variant font-label-sm">Locataires Actifs</span>
              <span className="text-secondary font-label-sm flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" data-icon="add">add</span>
                <span>8 ce mois</span>
              </span>
            </div>
            <div className="font-headline-lg text-headline-lg">154</div>
            <div className="mt-md flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-variant"></div>
              <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container-highest"></div>
              <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-primary-container text-[8px] flex items-center justify-center text-on-primary-container font-bold">+12</div>
            </div>
          </div>
          {/* Fleet */}
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-sm">
              <span className="text-on-surface-variant font-label-sm">Flotte Globale</span>
              <span className="text-on-surface-variant font-label-sm">84% en service</span>
            </div>
            <div className="font-headline-lg text-headline-lg">3,892</div>
            <div className="mt-md flex items-center gap-sm">
              <div className="flex-1 h-1 bg-surface-container-low rounded-full overflow-hidden flex">
                <div className="bg-secondary h-full w-[84%]"></div>
                <div className="bg-surface-variant h-full w-[16%]"></div>
              </div>
            </div>
          </div>
          {/* System Health */}
          <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-sm">
              <span className="text-on-surface-variant font-label-sm">Santé du Système</span>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            </div>
            <div className="font-headline-lg text-headline-lg">99.9%</div>
            <p className="font-label-sm text-on-surface-variant mt-md">Uptime stable sur 30 jours</p>
          </div>
        </section>
        
        {/* Main Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Performance Table */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-title-md text-title-md">Performance des Locataires</h3>
              <button className="text-label-sm font-semibold flex items-center gap-xs hover:bg-surface-container-low px-sm py-xs rounded transition-colors">
                <span>Voir tout</span> <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/30">
                    <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Nom du Locataire</th>
                    <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Plan</th>
                    <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Flotte</th>
                    <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Revenu</th>
                    <th className="px-lg py-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-xs">ER</div>
                        <span className="font-body-md font-medium">Elite Rentals Paris</span>
                      </div>
                    </td>
                    <td className="px-lg py-md"><span className="px-sm py-xs bg-secondary/5 border border-secondary/20 text-secondary text-[10px] font-bold rounded uppercase">Enterprise</span></td>
                    <td className="px-lg py-md text-body-md">450 véhicules</td>
                    <td className="px-lg py-md text-body-md font-medium">$42,200</td>
                    <td className="px-lg py-md">
                      <span className="inline-flex items-center gap-xs px-sm py-xs bg-green-500/5 border border-green-500/20 text-green-700 text-[10px] font-bold rounded uppercase">Actif</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-xs">SV</div>
                        <span className="font-body-md font-medium">SafetY Vehicles Ltd</span>
                      </div>
                    </td>
                    <td className="px-lg py-md"><span className="px-sm py-xs bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold rounded uppercase">Premium</span></td>
                    <td className="px-lg py-md text-body-md">120 véhicules</td>
                    <td className="px-lg py-md text-body-md font-medium">$18,450</td>
                    <td className="px-lg py-md">
                      <span className="inline-flex items-center gap-xs px-sm py-xs bg-green-500/5 border border-green-500/20 text-green-700 text-[10px] font-bold rounded uppercase">Actif</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-xs">NM</div>
                        <span className="font-body-md font-medium">Nordic Mobility</span>
                      </div>
                    </td>
                    <td className="px-lg py-md"><span className="px-sm py-xs bg-surface-container-highest border border-outline-variant text-on-surface-variant text-[10px] font-bold rounded uppercase">Basic</span></td>
                    <td className="px-lg py-md text-body-md">45 véhicules</td>
                    <td className="px-lg py-md text-body-md font-medium">$5,200</td>
                    <td className="px-lg py-md">
                      <span className="inline-flex items-center gap-xs px-sm py-xs bg-error-container border border-error/20 text-error text-[10px] font-bold rounded uppercase">En attente</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-xs">AR</div>
                        <span className="font-body-md font-medium">Atlas Rent Morocco</span>
                      </div>
                    </td>
                    <td className="px-lg py-md"><span className="px-sm py-xs bg-secondary/5 border border-secondary/20 text-secondary text-[10px] font-bold rounded uppercase">Enterprise</span></td>
                    <td className="px-lg py-md text-body-md">310 véhicules</td>
                    <td className="px-lg py-md text-body-md font-medium">$29,800</td>
                    <td className="px-lg py-md">
                      <span className="inline-flex items-center gap-xs px-sm py-xs bg-green-500/5 border border-green-500/20 text-green-700 text-[10px] font-bold rounded uppercase">Actif</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Analytics Sidebar */}
          <div className="lg:col-span-4 space-y-lg">
            {/* Donut Utilization */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <h3 className="font-title-md text-title-md mb-lg">Utilisation de la Flotte</h3>
              <div className="relative w-48 h-48 mx-auto mb-lg">
                {/* Simulated SVG Donut */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f4f2fd" strokeWidth="12"></circle>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#000000" strokeDasharray="180 251" strokeDashoffset="0" strokeWidth="12"></circle>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#4648d4" strokeDasharray="40 251" strokeDashoffset="-180" strokeWidth="12"></circle>
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#e3e1ec" strokeDasharray="31 251" strokeDashoffset="-220" strokeWidth="12"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-headline-lg font-bold">84%</span>
                  <span className="text-[10px] uppercase text-on-surface-variant font-bold">Occupé</span>
                </div>
              </div>
              <div className="space-y-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-body-md">Loué</span>
                  </div>
                  <span className="font-bold">2,840</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <span className="text-body-md">Disponible</span>
                  </div>
                  <span className="font-bold">852</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                    <span className="text-body-md">Maintenance</span>
                  </div>
                  <span className="font-bold">200</span>
                </div>
              </div>
            </div>
            {/* Recent Alerts */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <h3 className="font-title-md text-title-md mb-lg">Alertes Critiques</h3>
              <div className="space-y-md">
                <div className="flex gap-md">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
                    <span className="material-symbols-outlined" data-icon="priority_high">priority_high</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold">Échec de paiement : Atlas Rent</p>
                    <p className="text-label-sm text-on-surface-variant">Il y a 14 min • Facture #INV-9201</p>
                  </div>
                </div>
                <div className="flex gap-md">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined" data-icon="person_add">person_add</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold">Nouveau locataire : Lyon Drive</p>
                    <p className="text-label-sm text-on-surface-variant">Il y a 2 heures • En attente d'approbation</p>
                  </div>
                </div>
                <div className="flex gap-md">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined" data-icon="construction">construction</span>
                  </div>
                  <div>
                    <p className="font-body-md font-semibold">Maintenance Serveur</p>
                    <p className="text-label-sm text-on-surface-variant">Demain à 02:00 CET • Durée: 15 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Revenue Analytics (Full Width) */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h3 className="font-title-md text-title-md">Croissance des Revenus de la Plateforme</h3>
              <p className="text-on-surface-variant text-body-md">Total cumulé des 12 derniers mois</p>
            </div>
            <div className="flex gap-sm">
              <button className="px-md py-xs text-label-sm font-bold bg-primary text-on-primary rounded">Annuel</button>
              <button className="px-md py-xs text-label-sm font-bold border border-outline-variant hover:bg-surface-container-low rounded">Trimestriel</button>
            </div>
          </div>
          {/* Line Chart Placeholder */}
          <div className="relative h-64 w-full">
            <div className="absolute inset-0 flex items-end justify-between px-md">
              {/* Bar chart elements mimicking a trend */}
              <div className="w-12 bg-surface-container-low h-[40%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[45%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[42%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[55%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[58%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[65%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[62%] rounded-t-sm"></div>
              <div className="w-12 bg-surface-container-low h-[78%] rounded-t-sm"></div>
              <div className="w-12 bg-primary h-[82%] rounded-t-sm"></div>
              <div className="w-12 bg-primary h-[85%] rounded-t-sm"></div>
              <div className="w-12 bg-primary h-[92%] rounded-t-sm"></div>
              <div className="w-12 bg-secondary h-[98%] rounded-t-sm"></div>
            </div>
            {/* Overlay Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between border-b border-outline-variant">
              <div className="w-full border-t border-outline-variant/30"></div>
              <div className="w-full border-t border-outline-variant/30"></div>
              <div className="w-full border-t border-outline-variant/30"></div>
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
          </div>
          <div className="flex justify-between mt-md px-md text-on-surface-variant font-label-sm uppercase tracking-tighter">
            <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span><span>Juil</span><span>Août</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
          </div>
        </section>
      </div>
      
      {/* FAB for Global Actions */}
      <div className="fixed bottom-lg right-lg z-50">
        <button className="bg-primary text-on-primary w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[32px]" data-icon="add">add</span>
        </button>
      </div>
    </>
  );
}