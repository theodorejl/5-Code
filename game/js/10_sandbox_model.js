// ================================================================
//  MODÈLE « BAC À SABLE » : barge à gravier de 40 m sur le Léman, vue de travers
//  Simplifié mais aux bons ordres de grandeur : résistance ∝ V², puissance ∝ V³, carburant par trajet ∝ V².
// ================================================================
const CFG = {
  VREF: 8,         // vitesse de référence (nœuds)
  PREF: 450,       // puissance moteur à la vitesse de référence (kW)
  ETA: 0.65,       // rendement propulsif
  SFOC: 0.215,     // consommation spécifique (t de gazole / MWh)
  CO2F: 3.17,      // t de CO2 / t de gazole
  DIST: 39,        // Villeneuve → Genève (milles nautiques)
  AF: 70,          // surface frontale au vent : timonerie + tas de gravier (m²)
  CX: 0.9,         // coefficient de traînée aérienne
  KA: 90,          // surface du kite (m²)
  KC: 4.0,         // coefficient de traction en vol dynamique (en 8)
  TMAX: 40,        // limite de traction de la ligne (kN)
  ELEV: 30,        // élévation moyenne du kite (°)
  SHEAR: 1.3,      // vent plus fort à l'altitude du kite
  KMAXSHARE: 0.6,  // le kite fournit au plus 60 % de la poussée
  STORM: 32,       // au-delà (nœuds), le kite est rentré
  CALM: 6          // en deçà (nœuds de vent apparent), il ne vole pas
};
CFG.RREF = CFG.PREF * CFG.ETA / (CFG.VREF * KN);   // résistance de carène à la vitesse de référence (kN)

// Efficacité de la traction vers l'avant selon l'angle du vent apparent (0° = vent de face)
function kiteEfficiency(awaAbs) {
  if (awaAbs < 45) return 0;
  if (awaAbs < 100) return 0.85 * smooth((awaAbs - 45) / 55);
  return 0.85 + 0.15 * smooth((awaAbs - 100) / 50);
}
function apparent(windVec, shipVec) {
  const ax = windVec[0] - shipVec[0], ay = windVec[1] - shipVec[1];
  return { ax, ay, speed: Math.hypot(ax, ay), fromBearing: norm360(deg(Math.atan2(-ax, -ay))) };
}
function simulate(p, vKn, kiteOn) {
  const V = vKn * KN;
  const hd = rad(p.heading), wd = rad(p.windDir);
  const ship = [V * Math.sin(hd), V * Math.cos(hd)];
  const tw = p.windSpeed * KN;
  const wind = [-tw * Math.sin(wd), -tw * Math.cos(wd)];
  const windAlt = [wind[0] * CFG.SHEAR, wind[1] * CFG.SHEAR];
  const deck = apparent(wind, ship);
  const awa = norm180(deck.fromBearing - p.heading);
  const alt = apparent(windAlt, ship);
  const awaK = norm180(alt.fromBearing - p.heading);
  const Rhull = CFG.RREF * Math.pow(vKn / CFG.VREF, 2);
  const Rair = 0.5 * RHO * CFG.AF * CFG.CX * deck.speed * deck.speed * Math.cos(rad(awa)) / 1000;
  const R0 = Math.max(Rhull + Rair, 0);
  let state = "flying", T = 0, fwd = 0, eff = 0;
  const vaKkn = alt.speed / KN;
  if (!kiteOn) state = "off";
  else if (p.windSpeed > CFG.STORM) state = "storm";
  else if (vaKkn < CFG.CALM) state = "calm";
  else if (Math.abs(awaK) < 45) state = "headwind";
  if (state === "flying") {
    eff = kiteEfficiency(Math.abs(awaK));
    T = Math.min(0.5 * RHO * CFG.KA * CFG.KC * alt.speed * alt.speed / 1000, CFG.TMAX);
    const Th = T * Math.cos(rad(CFG.ELEV));
    const lat = Th * Math.sqrt(1 - eff * eff);
    fwd = clamp(Th * eff - 0.06 * lat, 0, CFG.KMAXSHARE * R0);
  }
  const flowRel = norm180(awaK + 180);
  const pullAz = Math.sign(flowRel || 1) * Math.min(Math.abs(flowRel), deg(Math.acos(clamp(eff, 0, 1))));
  const R = Math.max(R0 - fwd, 0);
  const Pbrake = R * V / CFG.ETA;                 // kW
  const hours = CFG.DIST / vKn;
  const fuel = Pbrake / 1000 * CFG.SFOC * hours;  // t
  return { vKn, V, deck, awa, alt, awaK, vaKkn, Rhull, Rair, R0, R, state, T, fwd, eff, pullAz,
    flowRelDeck: norm180(awa + 180), Pbrake, hours, fuel, co2: fuel * CFG.CO2F };
}
// Décomposition équitable du gain (moyenne des deux ordres : ralentir puis kite, kite puis ralentir)
function decompose(p, vKn, kiteOn) {
  const E0 = simulate(p, CFG.VREF, false).co2, E1 = simulate(p, vKn, false).co2;
  const E2 = simulate(p, CFG.VREF, kiteOn).co2, E3 = simulate(p, vKn, kiteOn).co2;
  return { E0, E3, speed: ((E0 - E1) + (E2 - E3)) / 2, kite: ((E0 - E2) + (E1 - E3)) / 2, total: E0 - E3 };
}
