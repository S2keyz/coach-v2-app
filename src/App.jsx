import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// COACH MILITAIRE V2 — 44+ CORRECTIONS
// ═══════════════════════════════════════════

const C = {
  bg: "#08080a", card: "#111114", border: "#1c1c22", surface: "#1c1c1e",
  accent: "#c8ff00", accentDim: "#2a3300", accentSoft: "#c8ff0018",
  red: "#ff3b30", green: "#32d74b", orange: "#ff9f0a", blue: "#0a84ff", cyan: "#64d2ff",
  text: "#f5f5f7", dim: "#56565e", mid: "#8e8e93",
};

const ST = {
  get: (k) => { try { return JSON.parse(localStorage.getItem("cm2_" + k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem("cm2_" + k, JSON.stringify(v)); } catch {} },
};

const TARGET = new Date("2026-06-21");
const daysLeft = () => Math.max(0, Math.ceil((TARGET - new Date()) / 864e5));
const weeksLeft = () => Math.max(0.1, daysLeft() / 7);
const dow = () => new Date().getDay();
const dayName = () => ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][dow()];
const todayStr = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmtD = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

const SCHED = {
  1: { type: "t", ci: 0, lb: "Jour A — Full Body" },
  2: { type: "t", ci: 1, lb: "Jour B — Upper Body" },
  3: { type: "t", ci: 4, lb: "Jour E — Hybrid Warfare" },
  4: { type: "t", ci: 2, lb: "Jour C — Lower Body" },
  5: { type: "t", ci: 3, lb: "Jour D — Cardio Métab." },
  6: { type: "r", lb: "Repos actif — LISS" },
  0: { type: "o", lb: "OFF — Récupération" },
};
const isTDay = (d) => SCHED[d === undefined ? dow() : d]?.type === "t";

const calcMacros = (pdc, training = true, refeed = false) => {
  const mul = refeed ? 26 : training ? 22 : 20;
  const cal = Math.round(pdc * mul);
  const p = Math.round(pdc * 1.5);
  const f = refeed ? 45 : 55;
  const g = Math.max(50, Math.round((cal - p * 4 - f * 9) / 4));
  return { cal, p, f, g, pdc };
};

const LP = [
  { n: "Blanc de poulet grillé", g: 250, p: 78, l: 8, c: 0, k: 390, fb: 0 },
  { n: "Steak de bœuf 5% MG", g: 200, p: 52, l: 10, c: 0, k: 310, fb: 0 },
  { n: "Escalope de dinde", g: 250, p: 72, l: 5, c: 0, k: 335, fb: 0 },
  { n: "Thon frais grillé", g: 200, p: 54, l: 2, c: 0, k: 240, fb: 0 },
  { n: "Crevettes sautées ail", g: 300, p: 60, l: 5, c: 3, k: 300, fb: 0 },
  { n: "Omelette 4 œufs épinards", g: 0, p: 30, l: 22, c: 3, k: 340, fb: 1 },
  { n: "Omelette 4 œufs champignons", g: 0, p: 30, l: 22, c: 4, k: 340, fb: 1 },
  { n: "Cabillaud poêlé citron", g: 250, p: 50, l: 3, c: 0, k: 230, fb: 0 },
];
const DP = [
  { n: "Saumon au four", g: 200, p: 46, l: 26, c: 0, k: 430, fb: 0 },
  { n: "Poulet rôti herbes", g: 250, p: 78, l: 8, c: 0, k: 390, fb: 0 },
  { n: "Omelette 5 œufs poivrons", g: 0, p: 38, l: 28, c: 4, k: 420, fb: 1 },
  { n: "Truite citronnée", g: 200, p: 44, l: 8, c: 0, k: 256, fb: 0 },
  { n: "Dinde curry doux", g: 250, p: 72, l: 6, c: 2, k: 350, fb: 0 },
  { n: "Rôti de porc maigre", g: 200, p: 48, l: 8, c: 0, k: 272, fb: 0 },
  { n: "Steak haché 5%", g: 200, p: 50, l: 10, c: 0, k: 300, fb: 0 },
  { n: "Omelette 4 œufs courgettes", g: 0, p: 30, l: 22, c: 3, k: 340, fb: 1 },
];
const CF = [
  { n: "Riz basmati (cru)", per: { p: 4, l: 0, c: 78, k: 350, fb: 1 } },
  { n: "Patate douce (crue)", per: { p: 2, l: 0, c: 20, k: 90, fb: 3 } },
  { n: "Quinoa (cru)", per: { p: 5, l: 2, c: 64, k: 368, fb: 5 } },
  { n: "Lentilles corail (crues)", per: { p: 12, l: 1, c: 52, k: 330, fb: 6 } },
  { n: "Riz complet (cru)", per: { p: 4, l: 1, c: 73, k: 350, fb: 3 } },
  { n: "Pois chiches (conserve)", per: { p: 7, l: 2, c: 18, k: 120, fb: 5 } },
  { n: "Pommes de terre (crues)", per: { p: 2, l: 0, c: 17, k: 77, fb: 2 } },
];
const CL = [CF[1], CF[3], CF[5], CF[6], CF[2]];
const VG = [
  { n: "Brocoli vapeur", g: 200, p: 6, l: 1, c: 8, k: 68, fb: 6 },
  { n: "Haricots verts", g: 200, p: 4, l: 0, c: 8, k: 56, fb: 6 },
  { n: "Épinards sautés", g: 200, p: 6, l: 1, c: 4, k: 46, fb: 5 },
  { n: "Courgettes grillées", g: 200, p: 3, l: 1, c: 6, k: 40, fb: 2 },
  { n: "Chou-fleur rôti", g: 200, p: 4, l: 1, c: 8, k: 50, fb: 4 },
  { n: "Poivrons grillés", g: 200, p: 2, l: 0, c: 10, k: 52, fb: 3 },
  { n: "Asperges vapeur", g: 200, p: 5, l: 0, c: 6, k: 44, fb: 4 },
  { n: "Salade romaine concombre", g: 200, p: 2, l: 0, c: 6, k: 34, fb: 3 },
];
const FX = [
  { n: "½ avocat", p: 1, l: 12, c: 2, k: 120, fb: 5 },
  { n: "Amandes (20g)", p: 4, l: 10, c: 2, k: 116, fb: 2 },
  { n: "Fromage blanc 0% 150g", p: 12, l: 0, c: 6, k: 72, fb: 0 },
];
const WHT = { n: "Whey post-training", p: 34, l: 1, c: 3, k: 157, fb: 0 };
const WHO = { n: "Whey Isolate", p: 25, l: 1, c: 2, k: 117, fb: 0 };

const sR = (s) => { let x = s; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
const dS = (o = 0) => { const d = new Date(); d.setDate(d.getDate() + o); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const pk = (a, r, ex = -1) => { let i; do { i = Math.floor(r() * a.length); } while (i === ex && a.length > 1); return { it: a[i], ix: i }; };

const genMeal = (off, pdc) => {
  const r = sR(dS(off));
  const d = new Date(Date.now() + off * 864e5).getDay();
  const tr = isTDay(d);
  const ref = d === 6;
  const m = calcMacros(pdc, tr, ref);
  const lp = pk(LP, r), dp = pk(DP, r);
  const lv = pk(VG, r), dv = pk(VG, r, lv.ix);
  const fx = pk(FX, r);
  const w = tr ? WHT : WHO;
  const pool = tr ? CF : CL;
  const lc = pk(pool, r), dc = pk(pool, r, lc.ix);

  const fixK = lp.it.k + dp.it.k + w.k + fx.it.k + 135 + lv.it.k + dv.it.k;
  const remK = m.cal - fixK;
  const lRat = tr ? 0.6 : 0.5;
  const lK = Math.max(100, Math.round(remK * lRat));
  const dK = Math.max(80, remK - lK);

  const sc = (it, kcal) => {
    const g = Math.round((kcal / it.per.k) * 100);
    return { n: it.n, g, p: Math.round(it.per.p * g / 100), l: Math.round(it.per.l * g / 100), c: Math.round(it.per.c * g / 100), k: Math.round(it.per.k * g / 100), fb: Math.round(it.per.fb * g / 100) };
  };
  const lcS = sc(lc.it, lK), dcS = sc(dc.it, dK);
  const o1 = { n: "Huile d'olive", g: 10, p: 0, l: 10, c: 0, k: 90, fb: 0 };
  const o2 = { n: "Huile d'olive", g: 5, p: 0, l: 5, c: 0, k: 45, fb: 0 };

  const sm = (its) => its.reduce((a, i) => ({ p: a.p + i.p, l: a.l + i.l, c: a.c + i.c, k: a.k + i.k, fb: a.fb + i.fb }), { p: 0, l: 0, c: 0, k: 0, fb: 0 });

  const li = [lp.it, lcS, lv.it, o1].map(i => ({ n: i.n, g: i.g, p: i.p, l: i.l, c: i.c, k: i.k, fb: i.fb }));
  const di = [dp.it, dcS, dv.it, o2, fx.it].map(i => ({ n: i.n, g: i.g || 0, p: i.p, l: i.l, c: i.c, k: i.k, fb: i.fb }));
  const ci = [w].map(i => ({ n: i.n, g: 0, p: i.p, l: i.l, c: i.c, k: i.k, fb: i.fb }));

  return {
    lunch: { lb: tr ? "DÉJEUNER (training day)" : "DÉJEUNER", its: li, tot: sm(li) },
    dinner: { lb: "DÎNER", its: di, tot: sm(di) },
    coll: { lb: tr ? "COLLATION POST-TRAINING" : "COLLATION", its: ci, tot: sm(ci) },
    total: sm([...li, ...di, ...ci]), m, tr, ref, d,
  };
};

const CIRCUITS = [
  { name: "FULL BODY — FORCE", tag: "Jour A", rds: 4, re: 20, rc: 90, dur: 70,
    wu: "5' rameur léger → 10 squats PDC → 10 fentes → dislocations épaules → 2×5 squats barre vide",
    cd: "Quadriceps 30s/côté → Ischio 30s/côté → Épaules 30s → Child pose 45s → Pigeon 30s/côté",
    ex: [
      { n: "Squat barre", r: "8 reps", ch: "80kg", alt: "Goblet squat 32kg" },
      { n: "Tractions pronation", r: "max (obj.8)", ch: "PDC", alt: "Tirage vertical" },
      { n: "Développé haltères", r: "10 reps", ch: "20kg/m", alt: "Pompes pieds surélevés" },
      { n: "Fentes marchées", r: "12 (6/j)", ch: "20kg/m", alt: "Step-ups 20kg" },
      { n: "Rowing barre", r: "10 reps", ch: "60kg", alt: "Rowing haltère 28kg" },
    ], fin: "Rameur 20' (5' échauff → 10' HIIT 30/30 → 5' retour)", kcal: "650-800" },
  { name: "UPPER BODY — VOLUME", tag: "Jour B", rds: 4, re: 20, rc: 90, dur: 65,
    wu: "5' rameur → bande : 10 pull-aparts + 10 rot. ext. → 2×8 dév. barre vide",
    cd: "Pectoraux mur 30s/côté → Triceps 30s/bras → Biceps 30s/bras → Trapèzes 30s",
    ex: [
      { n: "Développé couché", r: "10 reps", ch: "60kg", alt: "Dév. haltères 24kg" },
      { n: "Rowing haltère", r: "10/bras", ch: "30kg", alt: "Rowing câble" },
      { n: "Dips", r: "max reps", ch: "PDC", alt: "Dips assistés" },
      { n: "Curl barre EZ", r: "12 reps", ch: "30kg", alt: "Curl haltères 14kg" },
      { n: "Élévations latérales", r: "15 reps", ch: "10kg", alt: "Élévations câble" },
    ], fin: "Rameur 30' cadence constante", kcal: "550-700" },
  { name: "LOWER BODY — DESTRUCTION", tag: "Jour C", rds: 4, re: 20, rc: 90, dur: 70,
    wu: "5' rameur → 10 squats PDC → bande hanches 10 abductions → 2×5 SDT barre vide → mobilité chevilles",
    cd: "Foam roller quadriceps 45s → Ischio 45s → Pigeon 30s/côté → Mollets mur 30s → Twist dos 30s",
    ex: [
      { n: "Soulevé de terre", r: "8 reps", ch: "90kg", alt: "SDT trap bar" },
      { n: "Presse à cuisses", r: "12 reps", ch: "120kg", alt: "Goblet squat 36kg" },
      { n: "Fentes bulgares", r: "10/jambe", ch: "16kg/m", alt: "Split squat PDC" },
      { n: "Leg curl", r: "12 reps", ch: "40kg", alt: "Nordic curl excentrique" },
      { n: "Mollets debout", r: "20 reps", ch: "60kg", alt: "Mollets marche 24kg" },
    ], fin: "Rameur 20' HIIT", kcal: "600-750" },
  { name: "CARDIO MÉTABOLIQUE", tag: "Jour D", rds: 5, re: 15, rc: 60, dur: 80,
    wu: "5' rameur progressif → 10 squats → 10 pompes → 10 jumping jacks → mobilité",
    cd: "Marche 3' → Étirements full body : quadriceps, ischio, épaules, dos, hanches 20s chaque",
    ex: [
      { n: "Burpees", r: "10 reps", ch: "PDC", alt: "Squat thrust sans saut" },
      { n: "Kettlebell swings", r: "15 reps", ch: "20kg", alt: "Hip thrust explosif" },
      { n: "Step-ups explosifs", r: "10/jambe", ch: "PDC", alt: "Squat jumps" },
      { n: "Battle ropes", r: "30 sec", ch: "—", alt: "Jumping jacks 45s" },
      { n: "Mountain climbers", r: "20 reps", ch: "PDC", alt: "Planche genoux-coudes" },
    ], fin: "Rameur 45' endurance", kcal: "800-1000" },
  { name: "HYBRID WARFARE", tag: "Jour E", rds: 5, re: 15, rc: 75, dur: 65,
    wu: "5' rameur → 5 thrusters barre vide → 10 pompes → mobilité thoracique + hanches",
    cd: "Foam roller dos + quadriceps 60s → Épaules, ischio, hanches 20s chaque → Respiration 1'",
    ex: [
      { n: "Thruster barre", r: "8 reps", ch: "40kg", alt: "Squat + press halt. 16kg" },
      { n: "Rowing barre", r: "10 reps", ch: "60kg", alt: "Rowing TRX" },
      { n: "Rameur sprint", r: "250m", ch: "MAX", alt: "Vélo assault 30s" },
      { n: "Pompes", r: "max reps", ch: "PDC", alt: "Pompes inclinées" },
      { n: "Farmers walk", r: "40m", ch: "30kg/m", alt: "Marche halt. 24kg" },
      { n: "Planche dynamique", r: "30 sec", ch: "PDC", alt: "Dead bug 10 reps" },
    ], fin: "Tabata rameur 8×(20s/10s)", kcal: "750-900" },
];

const LISS = [
  "Marche rapide 45' (6-7 km/h) en côte si possible",
  "Marche inclinée tapis 45' — 6 km/h, inclinaison 10%",
  "Vélo léger 50' — cadence basse, résistance moyenne",
];

const PREP = (pdc) => ({
  prot: [
    { i: "Blanc de poulet", q: "1.2 kg", p: "Four 200°C 25 min, tranché" },
    { i: "Dinde", q: "750 g", p: "Poêlée, refroidie" },
    { i: "Œufs", q: "24 pcs", p: "12 durs + reste omelettes" },
  ],
  carbs: [
    { i: "Riz basmati", q: "800 g cru", p: "Cuit, portions de " + Math.round(pdc * 0.5) + "g" },
    { i: "Patate douce", q: "1.5 kg", p: "Cubes rôtis au four" },
    { i: "Lentilles corail", q: "500 g", p: "Cuites, en portions" },
  ],
  veg: [
    { i: "Brocoli", q: "1 kg", p: "Fleurettes blanchies 3'" },
    { i: "Haricots verts", q: "800 g", p: "Blanchis ou surgelés" },
    { i: "Épinards", q: "400 g", p: "Lavés" },
    { i: "Courgettes", q: "800 g", p: "Tranchées crues" },
  ],
  ext: [
    { i: "Huile d'olive", q: "1 bout." }, { i: "Avocats", q: "4 pcs" },
    { i: "Amandes nature", q: "200 g" }, { i: "Whey", q: "500 g min" },
    { i: "Fromage blanc 0%", q: "4×150g" }, { i: "Sel, poivre, ail, herbes, curry, citrons", q: "" },
  ],
});

const getWeek = () => { const s = ST.get("start") || Date.now(); return Math.floor((Date.now() - s) / (7 * 864e5)) + 1; };
const isDeload = () => getWeek() % 4 === 0;

// ─── SPARKLINE ───
const Sparkline = ({ data, color, height = 48 }) => {
  if (data.length < 2) return null;
  const vals = data.map(d => d.w);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 300, h = height, pad = 4;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const last = pts.split(" ").at(-1).split(",");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h} ${pts} ${w - pad},${h}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
};

// ─── SLEEP BARS ───
const SleepBars = ({ data }) => {
  const last7 = data.slice(-7);
  if (last7.length === 0) return <div style={{ fontSize: 11, color: "#56565e" }}>Aucune donnée</div>;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }}>
      {last7.map((s, i) => {
        const pct = Math.min(1, s.h / 9);
        const col = s.h >= 7.5 ? "#32d74b" : s.h >= 6 ? "#ff9f0a" : "#ff3b30";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", height: 28, display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", height: `${pct * 100}%`, background: col, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
            </div>
            <div style={{ fontSize: 8, color: "#56565e" }}>{s.h}h</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── TIMER ───
const Timer = ({ sec, label }) => {
  const [left, setLeft] = useState(sec);
  const [on, setOn] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (on && left > 0) ref.current = setTimeout(() => setLeft(left - 1), 1000);
    else if (left === 0) setOn(false);
    return () => clearTimeout(ref.current);
  }, [on, left]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginTop: 10, textAlign: "center" }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: C.dim, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 200, fontVariantNumeric: "tabular-nums", color: left < 6 && on ? C.red : C.text }}>{mm}:{ss}</div>
      <div style={{ width: "100%", height: 3, background: C.border, borderRadius: 2, margin: "8px 0", overflow: "hidden" }}>
        <div style={{ width: `${((sec - left) / sec) * 100}%`, height: "100%", background: left < 6 ? C.red : C.accent, transition: "width 1s linear" }} />
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        <button onClick={() => setOn(!on)} style={{ ...bs, width: 90, background: on ? C.red : C.accent, color: "#000" }}>{on ? "PAUSE" : left < sec ? "GO" : "GO"}</button>
        <button onClick={() => { setOn(false); setLeft(sec); }} style={{ ...bs, width: 70, background: "none", color: C.mid, border: `1px solid ${C.border}` }}>RESET</button>
      </div>
    </div>
  );
};

const bs = { border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const cs = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10 };
const ts = { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.dim, textTransform: "uppercase", marginBottom: 8 };
const ps = (col) => ({ flex: 1, textAlign: "center", padding: "7px 2px", borderRadius: 9, background: `${col}10`, border: `1px solid ${col}20` });

// ─── APP ───
export default function App() {
  const [tab, setTab] = useState("board");
  const [wt, setWt] = useState(() => ST.get("wt") || 111);
  const [wLog, setWLog] = useState(() => ST.get("wl") || []);
  const [waist, setWaist] = useState(() => ST.get("wa") || []);
  const [comp, setComp] = useState(() => ST.get("cp") || {});
  const [water, setWater] = useState(() => { const w = ST.get("h2o"); return w && isToday(w.d) ? w.v : 0; });
  const [slp, setSlp] = useState(() => ST.get("sl") || []);
  const [inp, setInp] = useState("");
  const [modal, setModal] = useState(null);
  const [mDay, setMDay] = useState(0);
  const [tI, setTI] = useState(() => { const s = SCHED[dow()]; return s?.type === "t" ? s.ci : 0; });
  const [alt, setAlt] = useState(false);
  const [sub, setSub] = useState("circuit");

  useEffect(() => { if (!ST.get("start")) ST.set("start", Date.now()); }, []);

  const S = 111, G = 93;
  const tr = isTDay();
  const mac = calcMacros(wt, tr);
  const lost = S - wt, rem = wt - G;
  const prog = Math.min(100, Math.max(0, (lost / (S - G)) * 100));
  const dl = daysLeft(), wks = weeksLeft();
  const rate = rem > 0 ? (rem / wks).toFixed(1) : 0;
  const deload = isDeload(), wkN = getWeek();

  const avg7 = wLog.length >= 2 ? (wLog.slice(-7).reduce((a, e) => a + e.w, 0) / Math.min(7, wLog.length)).toFixed(1) : null;

  const pred = () => {
    if (wLog.length < 3) return null;
    const r = wLog.slice(-14);
    const days = (new Date(r[r.length - 1].d) - new Date(r[0].d)) / 864e5;
    if (days < 3) return null;
    const rpd = (r[0].w - r[r.length - 1].w) / days;
    return Math.max(G - 5, wt - rpd * dl).toFixed(1);
  };

  const streak = () => {
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().split("T")[0];
      const c = comp[k];
      if (c && (c.m || c.t || d.getDay() === 0)) s++; else if (i > 0) break;
    }
    return s;
  };

  const save = (k, v) => ST.set(k, v);
  const logW = () => {
    const w = parseFloat(inp.replace(",", ".")); if (isNaN(w) || w < 50 || w > 200) return;
    const nl = [...wLog, { d: new Date().toISOString(), w }];
    setWLog(nl); setWt(w); setInp(""); setModal(null);
    save("wt", w); save("wl", nl);
  };
  const logWa = () => {
    const v = parseFloat(inp.replace(",", ".")); if (isNaN(v) || v < 50) return;
    const nw = [...waist, { d: new Date().toISOString(), v }];
    setWaist(nw); setInp(""); setModal(null); save("wa", nw);
  };
  const logSl = () => {
    const v = parseFloat(inp.replace(",", ".")); if (isNaN(v) || v < 1 || v > 16) return;
    const ns = [...slp, { d: new Date().toISOString(), h: v }];
    setSlp(ns); setInp(""); setModal(null); save("sl", ns);
  };
  const addH2O = (delta = 1) => { const n = Math.max(0, water + delta); setWater(n); save("h2o", { d: new Date().toISOString(), v: n }); };
  const togC = (t) => {
    const k = new Date().toISOString().split("T")[0];
    const u = { ...comp, [k]: { ...comp[k], [t]: !(comp[k] || {})[t] } };
    setComp(u); save("cp", u);
  };
  const tC = comp[new Date().toISOString().split("T")[0]] || {};

  const meal = genMeal(mDay, wt);
  const prep = PREP(wt);

  const MB = ({ d }) => (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.accent, textTransform: "uppercase", marginBottom: 5 }}>{d.lb}</div>
      {d.its.map((i, x) => (
        <div key={x} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
          <span style={{ flex: 1 }}>{i.n}</span>
          {i.g > 0 && <span style={{ color: C.dim, fontSize: 11 }}>{i.g}g</span>}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 5, fontSize: 10, color: C.mid }}>
        <span>P:{d.tot.p}g</span><span>L:{d.tot.l}g</span><span>G:{d.tot.c}g</span>
        <span style={{ color: C.accent }}>{d.tot.k}kcal</span>
        <span style={{ color: C.green }}>🌿{d.tot.fb}g</span>
      </div>
    </div>
  );

  // ═══ BOARD ═══
  const Board = () => (
    <div>
      <div style={{ ...cs, background: `linear-gradient(135deg,${C.card},${C.accentDim}40)`, border: `1px solid ${C.accent}30`, textAlign: "center", padding: 22 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, textTransform: "uppercase" }}>🎯 MISSION</div>
        <div style={{ fontSize: 26, fontWeight: 200, marginTop: 6, lineHeight: 1.3 }}>21 Juin — 93kg</div>
        <div style={{ fontSize: 12, color: C.mid, marginTop: 6 }}>Plus d'excuses.</div>
      </div>

      <div style={cs}>
        <div style={ts}>Poids</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div><span style={{ fontSize: 42, fontWeight: 200 }}>{wt}</span><span style={{ color: C.dim, marginLeft: 3 }}>kg</span></div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 300, color: lost > 0 ? C.green : C.dim }}>{lost > 0 ? `−${lost.toFixed(1)}` : "—"}</div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1 }}>PERDU</div>
          </div>
        </div>
        {avg7 && <div style={{ fontSize: 11, color: C.cyan, marginTop: 5 }}>📊 Moy. 7j : {avg7} kg</div>}
        <div style={{ width: "100%", height: 5, background: C.border, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${prog}%`, height: "100%", background: `linear-gradient(90deg,${C.accent},${C.green})`, borderRadius: 3, transition: "width .8s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: C.dim }}><span>{S}kg</span><span>{Math.round(prog)}%</span><span>{G}kg</span></div>
        {pred() && <div style={{ fontSize: 11, color: C.orange, marginTop: 6 }}>📈 Projection 21 juin : {pred()} kg</div>}
        <button onClick={() => { setInp(""); setModal("wt"); }} style={{ ...bs, background: C.accent, color: "#000", width: "100%", marginTop: 10, padding: "12px 14px" }}>⚖️ Pesée</button>
      </div>

      <div style={cs}>
        <div style={ts}>Compte à rebours</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: dl, l: "JOURS", c: dl < 30 ? C.red : C.text }, { v: rem.toFixed(1), l: "KG REST.", c: C.orange }, { v: rate, l: "KG/SEM", c: parseFloat(rate) > 1.5 ? C.red : C.accent }].map((x, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 200, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 9, color: C.dim }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={cs}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={ts}>Macros {tr ? "🏋️ Training" : "🛋️ Repos"}</div>
          {deload && <span style={{ fontSize: 9, color: C.orange, fontWeight: 600 }}>DELOAD S{wkN}</span>}
        </div>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 200 }}>{mac.cal}</span><span style={{ fontSize: 13, color: C.dim }}> kcal</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <div style={ps(C.red)}><div style={{ fontSize: 15, fontWeight: 600 }}>{mac.p}g</div><div style={{ fontSize: 8, color: C.dim, marginTop: 2 }}>PROT</div></div>
          <div style={ps(C.orange)}><div style={{ fontSize: 15, fontWeight: 600 }}>{mac.f}g</div><div style={{ fontSize: 8, color: C.dim, marginTop: 2 }}>LIP</div></div>
          <div style={ps(C.green)}><div style={{ fontSize: 15, fontWeight: 600 }}>{mac.g}g</div><div style={{ fontSize: 8, color: C.dim, marginTop: 2 }}>GLUC</div></div>
        </div>
        {!tr && <div style={{ fontSize: 10, color: C.mid, marginTop: 6, textAlign: "center" }}>Jour off : PDC×20 (−{Math.round(wt * 2)} kcal)</div>}
      </div>

      <div style={cs}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={ts}>Compliance</div>
          <div style={{ fontSize: 11, color: C.accent }}>🔥 {streak()}j</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[
            { k: "m", ic: "🥗", lb: "Menu", on: tC.m },
            { k: "t", ic: "⚔️", lb: "Séance", on: tC.t },
            { k: "s", ic: "😴", lb: "Sommeil", on: slp.some(s => isToday(s.d)) },
          ].map(x => (
            <button key={x.k} onClick={() => x.k === "s" ? (setInp(""), setModal("sl")) : togC(x.k)} style={{
              flex: 1, padding: "8px 2px", borderRadius: 9, fontSize: 9, fontWeight: 600, cursor: "pointer", textAlign: "center",
              background: x.on ? C.accentDim : C.surface, border: `1px solid ${x.on ? C.accent : C.border}`, color: x.on ? C.accent : C.dim,
            }}>
              <div style={{ fontSize: 16 }}>{x.ic}</div>
              <div style={{ marginTop: 3 }}>{x.lb}</div>
            </button>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.dim, textTransform: "uppercase" }}>💧 Hydratation</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: water >= 8 ? C.green : C.text }}>{water}/8 verres</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < water ? C.blue : C.border, transition: "background .2s" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => addH2O(-1)} style={{ ...bs, flex: 1, background: "none", color: C.dim, border: `1px solid ${C.border}`, fontSize: 14 }}>−</button>
            <button onClick={() => addH2O(1)} style={{ ...bs, flex: 2, background: water >= 8 ? C.accentDim : C.surface, color: water >= 8 ? C.accent : C.text, border: `1px solid ${water >= 8 ? C.accent : C.border}` }}>+ 1 verre</button>
          </div>
        </div>
      </div>

      <div style={cs}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={ts}>Tour de taille</div>
          <button onClick={() => { setInp(""); setModal("wa"); }} style={{ ...bs, background: "none", color: C.accent, border: `1px solid ${C.accent}30`, padding: "5px 10px", fontSize: 9 }}>+ Mesure</button>
        </div>
        {waist.length > 0 ? (
          <div>
            <span style={{ fontSize: 24, fontWeight: 200 }}>{waist[waist.length - 1].v}</span><span style={{ color: C.dim }}> cm</span>
            {waist.length > 1 && <span style={{ fontSize: 12, color: C.green, marginLeft: 8 }}>{(waist[0].v - waist[waist.length - 1].v) > 0 ? `−${(waist[0].v - waist[waist.length - 1].v).toFixed(1)}cm` : ""}</span>}
          </div>
        ) : <div style={{ fontSize: 12, color: C.dim }}>Au nombril, debout, à jeun</div>}
      </div>

      {dow() === 1 && <div style={{ ...cs, borderColor: C.orange + "40", background: C.orange + "06" }}>
        <div style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>📸 LUNDI = PHOTO</div>
        <div style={{ fontSize: 11, color: C.mid, marginTop: 3 }}>Face + profil, même endroit, à jeun.</div>
      </div>}

      {wLog.length > 0 && <div style={cs}>
        <div style={ts}>Courbe de poids</div>
        {wLog.length >= 2 && <Sparkline data={wLog} color={C.accent} />}
        <div style={{ marginTop: 10 }}>
          {[...wLog].reverse().slice(0, 5).map((e, i, arr) => {
            const prev = arr[i + 1];
            const diff = prev ? (e.w - prev.w).toFixed(1) : null;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.dim }}>{fmtD(e.d)}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {diff !== null && <span style={{ fontSize: 10, color: parseFloat(diff) < 0 ? C.green : parseFloat(diff) > 0 ? C.red : C.dim }}>{parseFloat(diff) > 0 ? `+${diff}` : diff} kg</span>}
                  <span style={{ fontWeight: 600 }}>{e.w} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {slp.length > 0 && <div style={cs}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={ts}>Sommeil (7 dernières nuits)</div>
          <div style={{ fontSize: 11, color: C.mid }}>
            moy. {(slp.slice(-7).reduce((a, s) => a + s.h, 0) / Math.min(7, slp.length)).toFixed(1)}h
          </div>
        </div>
        <SleepBars data={slp} />
      </div>}

      <div style={{ fontSize: 10, color: C.dim, textAlign: "center", padding: "10px 14px", lineHeight: 1.5, borderTop: `1px solid ${C.border}` }}>
        💡 Le poids fluctue ±1.5kg/jour. Fie-toi à la moyenne 7j.
      </div>
      <button onClick={() => {
        const data = { poids: wLog, tailleDeCeinture: waist, sommeil: slp, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "coach-data.json"; a.click();
      }} style={{ ...bs, width: "100%", background: "none", color: C.dim, border: `1px solid ${C.border}`, marginBottom: 10, fontSize: 9 }}>
        ⬇️ Exporter mes données
      </button>
    </div>
  );

  // ═══ MEALS ═══
  const Meals = () => {
    const lb = mDay === 0 ? todayStr() : mDay > 0 ? `dans ${mDay}j` : `il y a ${Math.abs(mDay)}j`;
    return (
      <div>
        <div style={cs}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={ts}>🎯 {meal.tr ? "Training" : "Repos"}</div>
            {meal.ref && <span style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>♻️ REFEED</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{lb}</div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{meal.m.cal}kcal | P:{meal.m.p}g | L:{meal.m.f}g | G:{meal.m.g}g</div>
          <MB d={meal.lunch} /><MB d={meal.dinner} /><MB d={meal.coll} />
          <div style={{ background: C.accentSoft, borderRadius: 9, padding: 10, marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>📊 TOTAL</div>
            <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.mid }}>
              <span>P:{meal.total.p}g</span><span>L:{meal.total.l}g</span><span>G:{meal.total.c}g</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>{meal.total.k}kcal</span>
              <span style={{ color: C.green }}>🌿{meal.total.fb}g</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: Math.abs(meal.total.k - meal.m.cal) < 80 ? C.green : C.orange }}>
              {Math.abs(meal.total.k - meal.m.cal) < 80 ? `✅ Cible OK (±${Math.abs(meal.total.k - meal.m.cal)})` : meal.total.k < meal.m.cal ? `⚡ −${meal.m.cal - meal.total.k}kcal` : `⚠️ +${meal.total.k - meal.m.cal}kcal`}
            </div>
            {meal.total.fb < 25 && <div style={{ fontSize: 9, color: C.orange, marginTop: 3 }}>⚠️ Fibres basses — ajoute légumes/lentilles</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          <button onClick={() => setMDay(mDay - 1)} style={{ ...bs, flex: 1, background: "none", color: C.accent, border: `1px solid ${C.accent}25` }}>←</button>
          {mDay !== 0 && <button onClick={() => setMDay(0)} style={{ ...bs, flex: 1, background: C.accent, color: "#000" }}>Auj.</button>}
          <button onClick={() => setMDay(mDay + 1)} style={{ ...bs, flex: 1, background: "none", color: C.accent, border: `1px solid ${C.accent}25` }}>→</button>
        </div>
        {meal.tr && <div style={{ ...cs, borderColor: C.cyan + "25", background: C.cyan + "05" }}>
          <div style={{ fontSize: 10, color: C.cyan }}>🧂 Training : pincée de sel sur chaque repas + potassium (patate douce, épinards).</div>
        </div>}
        {(meal.d === 0 || meal.d === 6) && <div style={cs}>
          <div style={ts}>🍳 Express weekend</div>
          <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>Restaurant : viande/poisson grillé + légumes, pas de féculent, pas de dessert. Burger : sans pain, double steak, salade.</div>
        </div>}
      </div>
    );
  };

  // ═══ TRAINING ═══
  const Training = () => {
    const ci = CIRCUITS[tI];
    const td = SCHED[dow()];
    return (
      <div>
        <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
          {[{ id: "circuit", lb: "Séance" }, { id: "prep", lb: "Meal Prep" }, { id: "sched", lb: "Planning" }].map(t => (
            <button key={t.id} onClick={() => setSub(t.id)} style={{ ...bs, flex: 1, background: sub === t.id ? C.accentDim : "none", color: sub === t.id ? C.accent : C.dim, border: `1px solid ${sub === t.id ? C.accent : C.border}` }}>{t.lb}</button>
          ))}
        </div>

        {sub === "circuit" && <>
          <div style={{ ...cs, borderColor: td?.type === "t" ? C.accent + "35" : C.dim + "20", background: td?.type === "t" ? C.accentSoft : C.surface, textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: C.dim, textTransform: "uppercase" }}>{dayName()}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: td?.type === "t" ? C.accent : C.mid, marginTop: 3 }}>{td?.lb}</div>
            {deload && <div style={{ fontSize: 10, color: C.orange, marginTop: 3 }}>⚠️ DELOAD — charges -40%</div>}
          </div>

          {td?.type === "r" && <div style={cs}>
            <div style={ts}>REPOS ACTIF — LISS</div>
            {LISS.map((o, i) => <div key={i} style={{ fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}`, color: C.text }}>• {o}</div>)}
            <div style={{ fontSize: 10, color: C.cyan, marginTop: 6 }}>FC cible : 110-130 bpm</div>
          </div>}

          <div style={cs}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={ts}>⚔️ {ci.tag}</div>
              <span style={{ fontSize: 10, color: C.mid }}>~{ci.dur}'</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{ci.name}</div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>{ci.rds} rounds{deload ? " (DELOAD)" : ""} • {ci.re}s exos • {ci.rc}s circuits</div>
            <div style={{ background: C.surface, borderRadius: 9, padding: 8, marginTop: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: C.green, textTransform: "uppercase", marginBottom: 3 }}>🔥 ÉCHAUFFEMENT</div>
              <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>{ci.wu}</div>
            </div>
            {ci.ex.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accentDim, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, marginRight: 8, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{e.n}</div>
                    <div style={{ fontSize: 10, color: C.dim }}>{e.r}</div>
                    {alt && <div style={{ fontSize: 9, color: C.cyan, marginTop: 1 }}>↳ {e.alt}</div>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{e.ch}</div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: C.red, textTransform: "uppercase", marginBottom: 3 }}>🔥 FINISHER</div>
              <div style={{ fontSize: 12 }}>{ci.fin}</div>
              <div style={{ fontSize: 10, color: C.accent, marginTop: 4 }}>~{ci.kcal} kcal</div>
            </div>
            <div style={{ background: C.surface, borderRadius: 9, padding: 8, marginTop: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: C.blue, textTransform: "uppercase", marginBottom: 3 }}>🧊 ÉTIREMENTS</div>
              <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>{ci.cd}</div>
            </div>
          </div>

          <button onClick={() => setAlt(!alt)} style={{ ...bs, width: "100%", background: "none", color: alt ? C.cyan : C.dim, border: `1px solid ${alt ? C.cyan : C.border}`, marginBottom: 10 }}>
            {alt ? "Masquer alternatives" : "Alternatives (équipement indispo)"}
          </button>

          <Timer sec={ci.re} label={`Repos exercice ${ci.re}s`} />
          <Timer sec={ci.rc} label={`Repos circuit ${ci.rc}s`} />

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
            {CIRCUITS.map((c, i) => (
              <button key={i} onClick={() => setTI(i)} style={{
                flex: "1 1 30%", padding: "9px 4px", background: i === tI ? C.accentDim : C.card,
                border: `1px solid ${i === tI ? C.accent : C.border}`, borderRadius: 8,
                color: i === tI ? C.accent : C.dim, fontSize: 9, fontWeight: 600, cursor: "pointer", textTransform: "uppercase",
              }}>{c.tag}</button>
            ))}
          </div>
          <div style={{ ...cs, marginTop: 10, borderColor: C.blue + "25" }}>
            <div style={{ fontSize: 10, color: C.blue }}>💧 250ml toutes les 15 min. Minimum 1L sur la session.</div>
          </div>
        </>}

        {sub === "prep" && <div>
          <div style={cs}>
            <div style={ts}>🛒 Meal Prep Dimanche (~2h)</div>
            {[{ t: "Protéines", its: prep.prot, c: C.red }, { t: "Féculents", its: prep.carbs, c: C.orange }, { t: "Légumes", its: prep.veg, c: C.green }, { t: "Extras", its: prep.ext, c: C.cyan }].map(({ t, its, c: col }) => (
              <div key={t} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: col, textTransform: "uppercase", marginBottom: 4 }}>{t}</div>
                {its.map((x, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                    <span>{x.i}</span><span style={{ color: C.dim }}>{x.q}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.dim, textAlign: "center", fontStyle: "italic" }}>Frigo 4j max. Au-delà, congèle.</div>
        </div>}

        {sub === "sched" && <div>
          <div style={cs}>
            <div style={ts}>📅 Semaine {wkN} {deload ? "— DELOAD" : ""}</div>
            {[1, 2, 3, 4, 5, 6, 0].map(d => {
              const s = SCHED[d], now = dow() === d;
              return (
                <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, background: now ? C.accentSoft : "none", borderRadius: now ? 6 : 0, paddingLeft: now ? 6 : 0, paddingRight: now ? 6 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.type === "t" ? C.accent : C.dim, width: 50 }}>{["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d]}{now ? " ←" : ""}</span>
                  <span style={{ fontSize: 11, color: s.type === "t" ? C.text : C.dim, flex: 1, textAlign: "right" }}>{s.lb}</span>
                </div>
              );
            })}
          </div>
          <div style={cs}>
            <div style={ts}>🔄 Cycle</div>
            <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>S1-3 : charges normales. S4 : <span style={{ color: C.orange, fontWeight: 600 }}>DELOAD -40%</span>. Actuel : <span style={{ color: C.accent }}>S{wkN}</span></div>
          </div>
          <div style={cs}>
            <div style={ts}>♻️ Refeed samedi</div>
            <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>Samedi : PDC×26. Plus de glucides. Relance la leptine, évite le plateau. Ce n'est PAS un cheat day.</div>
          </div>
        </div>}
      </div>
    );
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'SF Pro Text',-apple-system,BlinkMacSystemFont,sans-serif", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 82, WebkitFontSmoothing: "antialiased" }}>
      <div style={{ padding: "14px 16px 8px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: "rgba(8,8,10,.92)", backdropFilter: "blur(20px)", zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 11, fontWeight: 800, letterSpacing: 5, color: C.accent, textTransform: "uppercase", margin: 0 }}>Coach Militaire</h1>
        <span style={{ fontSize: 9, color: C.dim }}>S{wkN}{deload ? " DELOAD" : ""}</span>
      </div>
      <div style={{ padding: "12px 14px" }}>
        {tab === "board" && <Board />}
        {tab === "meals" && <Meals />}
        {tab === "training" && <Training />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "flex", background: "rgba(8,8,10,.94)", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`, zIndex: 100 }}>
        {[{ id: "board", ic: "📊", lb: "Board" }, { id: "meals", ic: "🥗", lb: "Repas" }, { id: "training", ic: "⚔️", lb: "Training" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px 0 16px", textAlign: "center", fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            color: tab === t.id ? C.accent : C.dim, background: "none", border: "none", cursor: "pointer",
            borderTop: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
          }}>{t.ic} {t.lb}</button>
        ))}
      </div>
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, width: "100%", maxWidth: 320 }}>
            <div style={ts}>{modal === "wt" ? "⚖️ Pesée" : modal === "wa" ? "📏 Tour de taille" : "😴 Sommeil"}</div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 5 }}>
              {modal === "wt" ? "Matin, à jeun, après toilettes." : modal === "wa" ? "Au nombril, debout, expiré." : "Heures dormies."}
            </div>
            <input type="number" step="0.1" placeholder={modal === "wt" ? "108.5" : modal === "wa" ? "102" : "7.5"} value={inp} onChange={e => setInp(e.target.value)} autoFocus
              style={{ width: "100%", padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 20, fontWeight: 300, textAlign: "center", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => modal === "wt" ? logW() : modal === "wa" ? logWa() : logSl()} style={{ ...bs, background: C.accent, color: "#000", width: "100%", marginTop: 8, padding: "11px 14px" }}>Enregistrer</button>
            <button onClick={() => setModal(null)} style={{ ...bs, background: "none", color: C.dim, border: `1px solid ${C.border}`, width: "100%", marginTop: 6, padding: "9px 14px" }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
