import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ── Helpers ──────────────────────────────────────────────────────────────────
const pct = (c, t) => Math.min(100, Math.round((c / t) * 100));
const fmt = (n) => n >= 1000 ? "$" + (n / 1000).toFixed(1) + "K" : String(n);
const initials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
const AVATAR_PALETTE = ["#1A5F6A","#6B3A2A","#2A3F6B","#4A6B2A","#6B2A4A","#2A6B5F"];
const avatarColor = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];
const todayKey = () => new Date().toISOString().split("T")[0];
const weekKey = () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(new Date().setDate(diff)).toISOString().split("T")[0]; };
const monthKey = () => new Date().toISOString().slice(0, 7);

// ── Initial Data ──────────────────────────────────────────────────────────────
const TEAM = ["Caleb", "Madeline", "Collin"];

const INITIAL_DATA = {
  team: TEAM,
  currentUser: "Collin",
  viewMode: "owner",
  openingDate: "2025-06-15",
  wigId: 1,

  goals: [
    { id: 1, title: "Sell 75 Founding Memberships", category: "Memberships", target: 75, current: 31, owner: "Collin", status: "on-track", why: "Founding members build our community before we open. They're our believers.", notes: "" },
    { id: 2, title: "Collect 500 Email Leads", category: "Marketing", target: 500, current: 187, owner: "Collin", status: "needs-attention", why: "Email is our best tool to reach Broad Ripple before opening.", notes: "" },
    { id: 3, title: "20 Local Business Partnerships", category: "Partnerships", target: 20, current: 6, owner: "Collin", status: "off-track", why: "Local businesses amplify our reach and bring in their communities.", notes: "" },
    { id: 4, title: "Host 4 Preview Events", category: "Events", target: 4, current: 1, owner: "Madeline", status: "on-track", why: "Let people fall in love with the space before we open.", notes: "" },
    { id: 5, title: "Reach 10K Instagram Followers", category: "Marketing", target: 10000, current: 3240, owner: "Collin", status: "needs-attention", why: "Instagram is how Broad Ripple discovers us.", notes: "" },
    { id: 6, title: "Reach 300 Active Members", category: "Memberships", target: 300, current: 47, owner: "Collin", status: "on-track", why: "300 members makes Ripple Boulder sustainable and vibrant from day one.", notes: "" },
  ],

  leadMeasures: [
    { id: 1, goalId: 1, title: "Referral asks made", type: "number", target: 10, unit: "asks/week" },
    { id: 2, goalId: 1, title: "Membership tours given", type: "number", target: 5, unit: "tours/week" },
    { id: 3, goalId: 2, title: "New email signups", type: "number", target: 20, unit: "signups/week" },
    { id: 4, goalId: 5, title: "Instagram Reels posted", type: "number", target: 4, unit: "reels/week" },
    { id: 5, goalId: 3, title: "Partner outreach visits", type: "number", target: 3, unit: "visits/week" },
    { id: 6, goalId: 4, title: "Event invites sent", type: "number", target: 25, unit: "invites/event" },
  ],

  weeklyLogs: { 1: { 1: 6, 2: 3 }, 2: { 3: 12 }, 3: {}, 4: { 4: 2 }, 5: { 5: 1 } },

  meetings: [
    {
      id: 1, date: "2025-05-05",
      wins: "Sold 8 founding memberships! First preview event had 40 people — the energy was incredible.",
      moved: "Collin's personal outreach drove most sales. The preview event generated real buzz.",
      didnt: "Instagram reels only hit 2 of 4. Partnership visits fell short again.",
      commitments: [
        { person: "Caleb", commitment: "Greet every new face during shifts this week", due: "2025-05-10", done: false },
        { person: "Madeline", commitment: "Confirm July 12 event logistics", due: "2025-05-08", done: true },
        { person: "Collin", commitment: "Follow up with 10 warm leads from the preview event", due: "2025-05-10", done: false },
      ],
      ownerNotes: "We're building something special here. Partnerships need a real push this week — let's each bring one lead.",
    }
  ],

  tasks: [
    { id: 1, title: "Set up Beta membership portal", goalId: 1, assignee: "Collin", due: "2025-05-15", priority: "high", status: "in-progress", notes: "" },
    { id: 2, title: "Design welcome packet for founding members", goalId: 1, assignee: "Madeline", due: "2025-05-20", priority: "high", status: "todo", notes: "" },
    { id: 3, title: "Create partnership one-pager", goalId: 3, assignee: "Collin", due: "2025-05-12", priority: "medium", status: "in-progress", notes: "" },
    { id: 4, title: "Film first 4 Instagram reels", goalId: 5, assignee: "Caleb", due: "2025-05-10", priority: "high", status: "todo", notes: "" },
    { id: 5, title: "Plan July preview event", goalId: 4, assignee: "Madeline", due: "2025-05-18", priority: "medium", status: "todo", notes: "" },
  ],

  opsTasks: [
    { id: "o1",  freq: "opening", title: "Unlock doors & test entry system", desc: "Check front door, turnstile, and any access tech", assignee: "", completions: {}, notes: "" },
    { id: "o2",  freq: "opening", title: "Start music & set atmosphere", desc: "Queue up the playlist, set volume, check all speaker zones", assignee: "", completions: {}, notes: "" },
    { id: "o3",  freq: "opening", title: "Turn on all lighting", desc: "Main floor, bathrooms, lounge, retail display, TVs/screens", assignee: "", completions: {}, notes: "" },
    { id: "o4",  freq: "opening", title: "Front desk setup", desc: "Log into Beta, tablet ready, waivers live, POS on", assignee: "", completions: {}, notes: "" },
    { id: "o5",  freq: "opening", title: "Bathroom check & restock", desc: "Soap, paper towels, toilet paper — refill everything, clean surfaces", assignee: "", completions: {}, notes: "" },
    { id: "o6",  freq: "opening", title: "Retail display reset", desc: "Products faced, tags visible, display looks inviting", assignee: "", completions: {}, notes: "" },
    { id: "o7",  freq: "opening", title: "Rental shoe setup", desc: "Shoes paired, sized, clean, and ready at the desk", assignee: "", completions: {}, notes: "" },
    { id: "o8",  freq: "opening", title: "Gym walkthrough & safety check", desc: "Mats positioned, holds tight, no hazards on the floor", assignee: "", completions: {}, notes: "" },
    { id: "o9",  freq: "opening", title: "Mop floors", desc: "Mop all non-mat flooring — front desk, lounge, bathrooms", assignee: "", completions: {}, notes: "" },
    { id: "o10", freq: "opening", title: "Vacuum climbing pads", desc: "Quick vacuum of all crash pads and mat surfaces", assignee: "", completions: {}, notes: "" },
    { id: "o11", freq: "opening", title: "Quick wall & pad cleanliness check", desc: "Spot check walls and pads for dirt, chalk buildup, or damage", assignee: "", completions: {}, notes: "" },
    { id: "o12", freq: "opening", title: "Check lounge cleanliness", desc: "Furniture straight, surfaces wiped, space welcoming", assignee: "", completions: {}, notes: "" },
    { id: "o13", freq: "opening", title: "Check water station", desc: "Refill, wipe down, restock cups if needed", assignee: "", completions: {}, notes: "" },
    { id: "o14", freq: "opening", title: "Chalk buckets stocked", desc: "All chalk stations filled and positioned on the floor", assignee: "", completions: {}, notes: "" },

    { id: "m1",  freq: "midday", title: "Wipe down front desk", desc: "Clean surfaces, sanitize iPad and tablet, tidy retail area", assignee: "", completions: {}, notes: "" },
    { id: "m2",  freq: "midday", title: "Organize lounge areas", desc: "Straighten furniture, clear clutter, keep it welcoming", assignee: "", completions: {}, notes: "" },
    { id: "m3",  freq: "midday", title: "Restock drinks & snacks", desc: "Refill fridge or snack display if applicable", assignee: "", completions: {}, notes: "" },
    { id: "m4",  freq: "midday", title: "Clean bathrooms", desc: "Wipe surfaces, check supplies, mop if needed", assignee: "", completions: {}, notes: "" },
    { id: "m5",  freq: "midday", title: "Sweep high-traffic areas", desc: "Front desk, lounge, near the wall base", assignee: "", completions: {}, notes: "" },
    { id: "m6",  freq: "midday", title: "Check rental shoes", desc: "Shoes returned? Clean, paired, and back in order", assignee: "", completions: {}, notes: "" },
    { id: "m7",  freq: "midday", title: "Reorganize retail displays", desc: "Straighten products, face labels forward, look tidy", assignee: "", completions: {}, notes: "" },
    { id: "m8",  freq: "midday", title: "Empty trash bins", desc: "Check all bins — gym floor, front desk, bathrooms, lounge", assignee: "", completions: {}, notes: "" },
    { id: "m9",  freq: "midday", title: "Spot clean pads & walls", desc: "Wipe visible chalk, dirt, or smudges on pads and wall panels", assignee: "", completions: {}, notes: "" },
    { id: "m10", freq: "midday", title: "Check music & atmosphere", desc: "Volume right? Vibe good? Lighting comfortable?", assignee: "", completions: {}, notes: "" },
    { id: "m11", freq: "midday", title: "Walk the gym — hospitality check", desc: "Say hi to guests, offer help to new climbers, notice anything off", assignee: "", completions: {}, notes: "" },
    { id: "m12", freq: "midday", title: "Refill soap & paper products", desc: "Bathrooms, water station — restock anything running low", assignee: "", completions: {}, notes: "" },
    { id: "m13", freq: "midday", title: "Check water station", desc: "Refill, wipe down, restock cups if needed", assignee: "", completions: {}, notes: "" },
    { id: "m14", freq: "midday", title: "Engage with guests & new climbers", desc: "Welcome new faces, offer a quick intro or beta tip", assignee: "", completions: {}, notes: "" },
    { id: "m15", freq: "midday", title: "Capture social media content", desc: "One photo or video moment from the gym today", assignee: "", completions: {}, notes: "" },
    { id: "m16", freq: "midday", title: "Wipe tables & lounge surfaces", desc: "All tables, counters, and lounge surfaces wiped down", assignee: "", completions: {}, notes: "" },
    { id: "m17", freq: "midday", title: "Organize cubbies & common areas", desc: "Shoes, bags, gear — keep common areas tidy and inviting", assignee: "", completions: {}, notes: "" },

    { id: "c1",  freq: "closing", title: "Deep clean front desk", desc: "Full wipe, organize retail, clear any clutter", assignee: "", completions: {}, notes: "" },
    { id: "c2",  freq: "closing", title: "Trash removal", desc: "All bins emptied — gym, bathrooms, lounge, back of house", assignee: "", completions: {}, notes: "" },
    { id: "c3",  freq: "closing", title: "Mop & sweep floors", desc: "All non-mat areas — front desk, lounge, hallways, bathrooms", assignee: "", completions: {}, notes: "" },
    { id: "c4",  freq: "closing", title: "Rental shoe organization", desc: "All shoes cleaned, paired, and ready for tomorrow", assignee: "", completions: {}, notes: "" },
    { id: "c5",  freq: "closing", title: "Bathroom closing clean", desc: "Full clean — toilet, sink, floor, restock for tomorrow", assignee: "", completions: {}, notes: "" },
    { id: "c6",  freq: "closing", title: "Vacuum climbing pads", desc: "Final vacuum of all crash pads and mat surfaces", assignee: "", completions: {}, notes: "" },
    { id: "c7",  freq: "closing", title: "Wipe down high-touch surfaces", desc: "Door handles, front desk, iPad, POS, cubbies", assignee: "", completions: {}, notes: "" },
    { id: "c8",  freq: "closing", title: "Reset retail & front desk area", desc: "Products faced, desk organized, everything ready for tomorrow", assignee: "", completions: {}, notes: "" },
    { id: "c9",  freq: "closing", title: "Turn off music & lighting systems", desc: "All speakers, TVs, screens, and zone lighting off", assignee: "", completions: {}, notes: "" },
    { id: "c10", freq: "closing", title: "Check security & cameras", desc: "Confirm cameras are on and recording", assignee: "", completions: {}, notes: "" },
    { id: "c11", freq: "closing", title: "Shut down all systems", desc: "POS, tablets, music, lights — everything powered down", assignee: "", completions: {}, notes: "" },
    { id: "c12", freq: "closing", title: "Lock all doors", desc: "Front door, back door, any access points — all secured", assignee: "", completions: {}, notes: "" },
    { id: "c13", freq: "closing", title: "Final facility cleanliness walkthrough", desc: "One last walk — clean, safe, and ready for tomorrow", assignee: "", completions: {}, notes: "" },
    { id: "c14", freq: "closing", title: "End of day walkthrough", desc: "All clear — lights off, doors locked, equipment secure", assignee: "", completions: {}, notes: "" },
    { id: "c15", freq: "closing", title: "Log today's member count", desc: "Record total check-ins, day passes, new members in app", assignee: "", completions: {}, notes: "" },

    { id: "w1", freq: "weekly", title: "Deep clean bathrooms", desc: "Grout, fixtures, baseboards — the full treatment", assignee: "", completions: {}, notes: "" },
    { id: "w2", freq: "weekly", title: "Clean climbing walls", desc: "Wipe panels, check for loose holds, look for damage", assignee: "", completions: {}, notes: "" },
    { id: "w3", freq: "weekly", title: "Retail inventory check", desc: "Count stock, note what's low, flag for reorder", assignee: "", completions: {}, notes: "" },
    { id: "w4", freq: "weekly", title: "Check first aid kit", desc: "Restock anything used, check expiry dates", assignee: "", completions: {}, notes: "" },
    { id: "w5", freq: "weekly", title: "Hold tightness check", desc: "Spin test all holds on featured problems", assignee: "", completions: {}, notes: "" },
    { id: "w6", freq: "weekly", title: "Staff follow-up review", desc: "Any member follow-ups or leads to contact?", assignee: "", completions: {}, notes: "" },

    { id: "mo1", freq: "monthly", title: "Full equipment inspection", desc: "All holds, mats, gear, chalk brushes — documented", assignee: "", completions: {}, notes: "" },
    { id: "mo2", freq: "monthly", title: "Membership analytics review", desc: "Retention, cancellations, conversions in Beta", assignee: "", completions: {}, notes: "" },
    { id: "mo3", freq: "monthly", title: "Staff 1-on-1s", desc: "Brief check-in with each team member", assignee: "", completions: {}, notes: "" },
    { id: "mo4", freq: "monthly", title: "Community outreach", desc: "Connect with at least 3 local partners this month", assignee: "", completions: {}, notes: "" },
    { id: "mo5", freq: "monthly", title: "Route setting review", desc: "Difficulty spread, what needs resetting, plan ahead", assignee: "", completions: {}, notes: "" },
    { id: "mo6", freq: "monthly", title: "Financial snapshot review", desc: "Revenue, expenses, goal progress — the full picture", assignee: "", completions: {}, notes: "" },
  ],

  openingChecklist: [
    { id: "oc1", category: "Construction & Build", item: "Finish remaining construction", done: false, owner: "Collin", notes: "" },
    { id: "oc2", category: "Construction & Build", item: "Electrical and lighting complete", done: false, owner: "Collin", notes: "" },
    { id: "oc3", category: "Construction & Build", item: "Final painting and touch-ups", done: false, owner: "Collin", notes: "" },
    { id: "oc4", category: "Construction & Build", item: "HVAC and air filtration checked", done: false, owner: "Collin", notes: "" },
    { id: "oc5", category: "Construction & Build", item: "Bathroom completion", done: false, owner: "Collin", notes: "" },
    { id: "oc6", category: "Construction & Build", item: "Final contractor walkthrough", done: false, owner: "Collin", notes: "" },
    { id: "oc7", category: "Construction & Build", item: "Signage installed", done: false, owner: "Collin", notes: "" },
    { id: "oc8", category: "Construction & Build", item: "Door & access system tested", done: false, owner: "Collin", notes: "" },
    { id: "oc9", category: "Climbing Infrastructure", item: "Wall inspection complete", done: false, owner: "Collin", notes: "" },
    { id: "oc10", category: "Climbing Infrastructure", item: "Holds inspected and organized", done: false, owner: "Caleb", notes: "" },
    { id: "oc11", category: "Climbing Infrastructure", item: "Hold washing & prep done", done: false, owner: "Caleb", notes: "" },
    { id: "oc12", category: "Climbing Infrastructure", item: "Route setting complete", done: false, owner: "Caleb", notes: "" },
    { id: "oc13", category: "Climbing Infrastructure", item: "Routes quality tested", done: false, owner: "Caleb", notes: "" },
    { id: "oc14", category: "Climbing Infrastructure", item: "Beginner climbs ready", done: false, owner: "Caleb", notes: "" },
    { id: "oc15", category: "Climbing Infrastructure", item: "Pad alignment & safety checks", done: false, owner: "Collin", notes: "" },
    { id: "oc16", category: "Climbing Infrastructure", item: "TB2/Tension board setup tested", done: false, owner: "Caleb", notes: "" },
    { id: "oc17", category: "Front Desk & Retail", item: "Front desk construction done", done: false, owner: "Collin", notes: "" },
    { id: "oc18", category: "Front Desk & Retail", item: "Shoe & bag cubbies installed", done: false, owner: "Collin", notes: "" },
    { id: "oc19", category: "Front Desk & Retail", item: "Retail organized and stocked", done: false, owner: "Madeline", notes: "" },
    { id: "oc20", category: "Front Desk & Retail", item: "POS system set up and tested", done: false, owner: "Collin", notes: "" },
    { id: "oc21", category: "Front Desk & Retail", item: "Beta integration tested end-to-end", done: false, owner: "Collin", notes: "" },
    { id: "oc22", category: "Front Desk & Retail", item: "Rental systems set up", done: false, owner: "Madeline", notes: "" },
    { id: "oc23", category: "Operations & Systems", item: "Staff handbook complete", done: false, owner: "Collin", notes: "" },
    { id: "oc24", category: "Operations & Systems", item: "Staff trained", done: false, owner: "Collin", notes: "" },
    { id: "oc25", category: "Operations & Systems", item: "SOPs created", done: false, owner: "Collin", notes: "" },
    { id: "oc26", category: "Operations & Systems", item: "Emergency procedures reviewed", done: false, owner: "Collin", notes: "" },
    { id: "oc27", category: "Operations & Systems", item: "Security cameras set up", done: false, owner: "Collin", notes: "" },
    { id: "oc28", category: "Operations & Systems", item: "Music & audio tested", done: false, owner: "Caleb", notes: "" },
    { id: "oc29", category: "Operations & Systems", item: "Wifi tested throughout space", done: false, owner: "Collin", notes: "" },
    { id: "oc30", category: "Operations & Systems", item: "Waiver & privacy policy complete", done: false, owner: "Collin", notes: "" },
    { id: "oc31", category: "Membership & Launch", item: "Founding member push underway", done: false, owner: "Collin", notes: "" },
    { id: "oc32", category: "Membership & Launch", item: "Referral campaign live", done: false, owner: "Collin", notes: "" },
    { id: "oc33", category: "Membership & Launch", item: "Social media rollout planned", done: false, owner: "Caleb", notes: "" },
    { id: "oc34", category: "Membership & Launch", item: "Soft opening planned", done: false, owner: "Collin", notes: "" },
    { id: "oc35", category: "Membership & Launch", item: "Grand opening planned", done: false, owner: "Collin", notes: "" },
    { id: "oc36", category: "Membership & Launch", item: "Community partnerships confirmed", done: false, owner: "Collin", notes: "" },
    { id: "oc37", category: "Brand & Hospitality", item: "Plants and aesthetics in place", done: false, owner: "Madeline", notes: "" },
    { id: "oc38", category: "Brand & Hospitality", item: "Lounge setup complete", done: false, owner: "Madeline", notes: "" },
    { id: "oc39", category: "Brand & Hospitality", item: "Lighting atmosphere dialed in", done: false, owner: "Collin", notes: "" },
    { id: "oc40", category: "Brand & Hospitality", item: "Wayfinding signage in place", done: false, owner: "Madeline", notes: "" },
    { id: "oc41", category: "Brand & Hospitality", item: "Customer experience walkthrough done", done: false, owner: "Collin", notes: "" },
    { id: "oc42", category: "Safety & Readiness", item: "Final safety inspection passed", done: false, owner: "Collin", notes: "" },
    { id: "oc43", category: "Safety & Readiness", item: "Emergency drills completed", done: false, owner: "Collin", notes: "" },
    { id: "oc44", category: "Safety & Readiness", item: "ADA/accessibility checked", done: false, owner: "Collin", notes: "" },
    { id: "oc45", category: "Safety & Readiness", item: "Insurance & liability verified", done: false, owner: "Collin", notes: "" },
    { id: "oc46", category: "Safety & Readiness", item: "Mock operating day completed", done: false, owner: "Collin", notes: "" },
  ],

  contributions: {},
};

const sc = {
  "on-track":        { bg: "#E8F5E9", text: "#2E7D32", bar: "#4CAF50", dot: "#4CAF50" },
  "needs-attention": { bg: "#FFF8E1", text: "#F57F17", bar: "#FFC107", dot: "#FFC107" },
  "off-track":       { bg: "#FFEBEE", text: "#C62828", bar: "#EF5350", dot: "#EF5350" },
};
const pc = {
  high:   { bg: "#FFEBEE", text: "#C62828" },
  medium: { bg: "#FFF8E1", text: "#F57F17" },
  low:    { bg: "#E8F5E9", text: "#2E7D32" },
};

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [nav, setNav] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    // Set default nav based on view mode after load
    if (!loading) {
      setNav(data.viewMode === "staff" ? "ops" : "home");
    }
  }, [loading]);

  useEffect(() => {
    async function load() {
      try {
        const { data: rows } = await supabase.from("app_data").select("*").eq("id", 1).single();
        if (rows?.payload) setData({ ...INITIAL_DATA, ...rows.payload });
      } catch {}
      setLoading(false);
    }
    load();
    const channel = supabase.channel("app_data_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_data", filter: "id=eq.1" }, (payload) => {
        if (payload.new?.payload) setData(cur => {
          const inc = JSON.stringify(payload.new.payload);
          return inc !== JSON.stringify(cur) ? { ...INITIAL_DATA, ...payload.new.payload } : cur;
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("app_data").upsert({ id: 1, payload: data });
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data, loading]);

  const isOwner = data.viewMode === "owner";
  const TEAM = data.team || ["Caleb", "Madeline", "Collin"];

  const updateGoal = (id, f, v) => setData(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, [f]: v } : g) }));
  const updateLog = (gid, mid, v) => setData(d => ({ ...d, weeklyLogs: { ...d.weeklyLogs, [gid]: { ...d.weeklyLogs[gid], [mid]: v } } }));
  const updateTask = (id, f, v) => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, [f]: v } : t) }));

  const ownerNav = [
    { key: "home",       label: "Home" },
    { key: "ops",        label: "Ops" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "goals",      label: "Goals" },
    { key: "work",       label: "Work" },
    { key: "opening",    label: "Opening" },
    { key: "settings",   label: "Settings" },
  ];
  const staffNav = [
    { key: "ops",        label: "My Shift" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "home",       label: "Home" },
    { key: "goals",      label: "Goals" },
    { key: "work",       label: "Work" },
  ];
  const navItems = isOwner ? ownerNav : staffNav;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#FAFAF8", minHeight: "100vh", color: "#1C1C1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAFAF8; }
        .lora { font-family: 'Lora', Georgia, serif; }
        .inter { font-family: 'Inter', system-ui, sans-serif; }
        .card { background: #fff; border: 1px solid #E8E6E0; border-radius: 14px; padding: 20px 22px; }
        .card-warm { background: #FDF9F4; border: 1px solid #E8E2D8; border-radius: 14px; padding: 20px 22px; }
        .btn { border: 1px solid #D8D4CC; background: #fff; border-radius: 9px; padding: 9px 18px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; color: #2C2C28; transition: all 0.12s; }
        .btn:hover { background: #F4F2EC; }
        .btn-teal { background: #1A5F6A; color: #fff; border-color: #1A5F6A; }
        .btn-teal:hover { background: #164F58; }
        .pbar { height: 5px; border-radius: 99px; background: #EDE9E0; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0.01em; }
        input[type=text], input[type=number], input[type=date], select, textarea { border: 1px solid #D8D4CC; border-radius: 9px; padding: 8px 11px; font-family: 'Inter', sans-serif; font-size: 13px; background: #fff; color: #1C1C1A; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #1A5F6A; box-shadow: 0 0 0 3px rgba(26,95,106,0.1); }
        input[type=checkbox] { width: 17px; height: 17px; cursor: pointer; accent-color: #1A5F6A; flex-shrink: 0; }
        .sec-label { font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9C9888; margin-bottom: 10px; }
        hr.divider { border: none; border-top: 1px solid #EDE9E0; margin: 16px 0; }
        .avatar { display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; font-family: 'Inter', sans-serif; font-weight: 700; color: #fff; }
        @media(max-width:680px) { .g2{grid-template-columns:1fr!important} .g3{grid-template-columns:1fr 1fr!important} .hide-sm{display:none!important} }
      `}</style>

      {/* Loading */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center" }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 56, marginBottom: 16, opacity: 0.8 }} />
            <div className="inter" style={{ fontSize: 13, color: "#9C9888" }}>Getting things ready…</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #EDE9E0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 36, width: "auto" }} />
            <span className="inter" style={{ fontSize: 10, color: "#1A5F6A", background: "#E8F2F4", padding: "2px 9px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.06em" }}>
              {isOwner ? "OWNER" : "STAFF"}
            </span>
          </div>
          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="hide-sm">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setNav(item.key)}
                style={{ background: "none", border: "none", borderBottom: `2px solid ${nav === item.key ? "#1A5F6A" : "transparent"}`, cursor: "pointer", padding: "6px 13px", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: nav === item.key ? 600 : 500, color: nav === item.key ? "#1A5F6A" : "#666", transition: "all 0.12s" }}>
                {item.label}
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: "#E8E6E0", margin: "0 8px" }} />
            <button onClick={() => { setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" })); setNav(isOwner ? "ops" : "home"); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9C9888", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Switch view
            </button>
          </nav>
          {/* Mobile */}
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ display: "none", background: "none", border: "1px solid #E8E6E0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 20, color: "#555", lineHeight: 1 }}
            className="hide-sm" id="mobile-toggle">
            {menuOpen ? "✕" : "☰"}
          </button>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "1px solid #E8E6E0", borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontSize: 18, color: "#555", lineHeight: 1 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div style={{ borderTop: "1px solid #EDE9E0", background: "#fff" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setNav(item.key); setMenuOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: nav === item.key ? "#F0F8F9" : "none", border: "none", borderBottom: "1px solid #F4F2EC", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 15, color: nav === item.key ? "#1A5F6A" : "#1C1C1A", fontWeight: nav === item.key ? 600 : 400 }}>
                {item.label}
              </button>
            ))}
            <button onClick={() => { setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" })); setNav(isOwner ? "ops" : "home"); setMenuOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 15, color: "#1A5F6A", fontWeight: 500 }}>
              Switch to {isOwner ? "Staff" : "Owner"} view
            </button>
          </div>
        )}
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 20px" }}>
        {nav === "home"     && (isOwner ? <OwnerHome data={data} setData={setData} updateGoal={updateGoal} TEAM={TEAM} setNav={setNav} /> : <StaffHome data={data} setData={setData} updateLog={updateLog} updateTask={updateTask} TEAM={TEAM} setNav={setNav} />)}
        {nav === "ops"      && <OpsPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "goals"    && <GoalsPage data={data} setData={setData} updateGoal={updateGoal} updateLog={updateLog} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "work"     && <WorkPage data={data} setData={setData} updateTask={updateTask} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "opening"    && <OpeningPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "scoreboard" && <ScoreboardPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "settings"   && isOwner && <SettingsPage data={data} setData={setData} />}
      </main>

      <footer style={{ borderTop: "1px solid #EDE9E0", padding: "24px 20px", textAlign: "center", marginTop: 40 }}>
        <p className="inter" style={{ fontSize: 12, color: "#C4C0B4" }}>Ripple Boulder · Broad Ripple, Indianapolis · built for the team 🌊</p>
      </footer>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 28, ring }) {
  return (
    <div className="avatar" title={name}
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36, boxShadow: ring ? `0 0 0 2px ${ring}` : "none" }}>
      {initials(name)}
    </div>
  );
}

// ── Owner Home ────────────────────────────────────────────────────────────────
function OwnerHome({ data, setData, updateGoal, TEAM, setNav }) {
  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];
  const openTasks = data.tasks.filter(t => t.status !== "done").length;
  const today = todayKey();
  const dailyOps = (data.opsTasks || []).filter(t => t.freq === "opening" || t.freq === "midday" || t.freq === "closing");
  const dailyDone = dailyOps.filter(t => t.completions?.[today]).length;
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const openingDays = data.openingDate ? Math.ceil((new Date(data.openingDate) - new Date()) / 86400000) : null;
  const totalChecklist = data.openingChecklist?.length || 0;
  const doneChecklist = data.openingChecklist?.filter(i => i.done).length || 0;
  const now = new Date();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 28, fontStyle: "italic", color: "#1C1C1A", marginBottom: 4 }}>
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, Collin.
        </h1>
        <p className="inter" style={{ fontSize: 14, color: "#9C9888" }}>Here's where Ripple Boulder stands today.</p>
      </div>

      {/* Opening countdown */}
      {openingDays !== null && openingDays > 0 && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Until Opening Day</div>
            <div className="lora" style={{ fontSize: 36, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{openingDays}</div>
            <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>days to go · {data.openingDate}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Launch readiness</div>
            <div className="lora" style={{ fontSize: 28, color: "#7DD3B8" }}>{Math.round((doneChecklist / totalChecklist) * 100)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{doneChecklist}/{totalChecklist} items</div>
          </div>
        </div>
      )}

      {/* WIG */}
      {wigGoal && (
        <div className="card-warm" style={{ marginBottom: 16 }}>
          <div className="sec-label">Wildly Important Goal</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div className="lora" style={{ fontSize: 18, color: "#1C1C1A", fontStyle: "italic" }}>{wigGoal.title}</div>
              <div className="inter" style={{ fontSize: 12, color: "#9C9888", marginTop: 3 }}>{wigGoal.why}</div>
            </div>
            <select value={data.wigId} onChange={e => setData(d => ({ ...d, wigId: Number(e.target.value) }))}
              style={{ width: "auto", fontSize: 12, border: "1px solid #E8E6E0", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer", marginLeft: 12, flexShrink: 0 }}>
              {data.goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="pbar" style={{ flex: 1 }}>
              <div className="pfill" style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, background: "#1A5F6A" }} />
            </div>
            <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#1A5F6A", whiteSpace: "nowrap" }}>
              {fmt(wigGoal.current)} / {fmt(wigGoal.target)} · {pct(wigGoal.current, wigGoal.target)}%
            </span>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Goals on track", value: data.goals.filter(g => g.status === "on-track").length + "/" + data.goals.length, color: "#2E7D32" },
          { label: "Open tasks", value: openTasks, color: openTasks > 5 ? "#F57F17" : "#1A5F6A" },
          { label: "Ops done today", value: `${dailyDone}/${dailyOps.length}`, color: dailyDone === dailyOps.length ? "#2E7D32" : "#F57F17" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #E8E6E0", borderRadius: 12, padding: "16px 18px" }}>
            <div className="sec-label">{s.label}</div>
            <div className="lora" style={{ fontSize: 26, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Goals overview */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="sec-label">All Goals</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.goals.map(g => {
            const p = pct(g.current, g.target);
            const s = sc[g.status];
            return (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#1C1C1A" }}>{g.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{p}%</span>
                    <span className="badge" style={{ background: s.bg, color: s.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                      {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Watch" : "Off track"}
                    </span>
                  </div>
                </div>
                <div className="pbar">
                  <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last check-in */}
      {lastMeeting && (
        <div className="card">
          <div className="sec-label">Last Check-in · {lastMeeting.date}</div>
          {lastMeeting.wins && (
            <div style={{ background: "#E8F5E9", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <span className="inter" style={{ fontSize: 13, color: "#2E7D32" }}>🌱 {lastMeeting.wins}</span>
            </div>
          )}
          {lastMeeting.ownerNotes && (
            <div style={{ borderLeft: "3px solid #1A5F6A", paddingLeft: 12, marginBottom: 12 }}>
              <p className="inter" style={{ fontSize: 13, color: "#444", fontStyle: "italic", lineHeight: 1.6 }}>{lastMeeting.ownerNotes}</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lastMeeting.commitments.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={c.person} size={24} />
                <span className="inter" style={{ fontSize: 13, color: c.done ? "#9C9888" : "#1C1C1A", textDecoration: c.done ? "line-through" : "none", flex: 1 }}>{c.commitment}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.done ? "#4CAF50" : "#EDE9E0" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Home ────────────────────────────────────────────────────────────────
function StaffHome({ data, setData, updateLog, updateTask, TEAM }) {
  const today = todayKey();
  const now = new Date();
  const [picker, setPicker] = useState(null);

  const hour = now.getHours();
  const shiftType = hour < 11 ? "opening" : hour < 16 ? "midday" : "closing";
  const shiftLabel = { opening: "Opening Tasks", midday: "Midday Tasks", closing: "Closing Tasks" }[shiftType];
  const shiftEmoji = { opening: "☀️", midday: "🌤", closing: "🌙" }[shiftType];

  const shiftOps = (data.opsTasks || []).filter(t => t.freq === shiftType);
  const shiftDone = shiftOps.filter(t => t.completions?.[today]).length;

  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];
  const openTasks = data.tasks.filter(t => t.status !== "done");
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const commitments = lastMeeting?.commitments || [];

  const completeOps = (id, person) => {
    setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, completions: { ...t.completions, [today]: { at: new Date().toISOString(), by: person } } } : t) }));
    setPicker(null);
  };
  const uncompleteOps = (id) => setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, completions: { ...t.completions, [today]: null } } : t) }));

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>
            {shiftEmoji} {hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}
          </h1>
          <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 3 }}>
            {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {wigGoal && (
          <div style={{ textAlign: "right", background: "#E8F2F4", borderRadius: 10, padding: "8px 14px" }}>
            <div className="inter" style={{ fontSize: 10, color: "#1A5F6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>The Score</div>
            <div className="lora" style={{ fontSize: 20, color: "#1A5F6A" }}>{pct(wigGoal.current, wigGoal.target)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{fmt(wigGoal.current)} / {fmt(wigGoal.target)}</div>
          </div>
        )}
      </div>

      {/* Current shift ops */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1A" }}>{shiftLabel}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 72, height: 4, background: "#EDE9E0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${shiftOps.length ? Math.round((shiftDone/shiftOps.length)*100) : 0}%`, height: "100%", background: shiftDone === shiftOps.length ? "#4CAF50" : "#1A5F6A", borderRadius: 99 }} />
            </div>
            <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: shiftDone === shiftOps.length ? "#2E7D32" : "#1A5F6A" }}>{shiftDone}/{shiftOps.length}</span>
          </div>
        </div>

        {shiftDone === shiftOps.length && shiftOps.length > 0 && (
          <div style={{ background: "#E8F5E9", border: "1px solid #C8E6C9", borderRadius: 10, padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#2E7D32" }}>All {shiftLabel.toLowerCase()} done — great work!</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shiftOps.map(t => {
            const completion = t.completions?.[today];
            const isDone = !!completion;
            const isOpen = picker === t.id;
            return (
              <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#E8E6E0"}`, borderRadius: 12, overflow: "hidden", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <button onClick={() => isDone ? uncompleteOps(t.id) : setPicker(isOpen ? null : t.id)}
                    style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${isDone ? "#4CAF50" : isOpen ? "#1A5F6A" : "#D4D0C8"}`, background: isDone ? "#4CAF50" : isOpen ? "#E8F2F4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {isDone
                      ? <svg width="14" height="11" fill="none" viewBox="0 0 14 11"><path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOpen ? "#1A5F6A" : "#D4D0C8" }} />
                    }
                  </button>
                  <div style={{ flex: 1 }}>
                    <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: isDone ? "#9C9888" : "#1C1C1A", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</div>
                    {t.desc && !isDone && <div className="inter" style={{ fontSize: 12, color: "#B0AAA0", marginTop: 2 }}>{t.desc}</div>}
                    {isDone && completion?.at && (
                      <div className="inter" style={{ fontSize: 11, color: "#4CAF50", marginTop: 2 }}>
                        ✓ {completion.by} · {new Date(completion.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    {isOpen && <div className="inter" style={{ fontSize: 12, color: "#1A5F6A", marginTop: 2, fontWeight: 600 }}>Who completed this?</div>}
                  </div>
                  {isDone && completion?.by
                    ? <Avatar name={completion.by} size={30} ring="#4CAF50" />
                    : !isOpen && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 14 }}>👤</span></div>
                  }
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid #E8F2F4", paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {TEAM.map(person => (
                      <button key={person} onClick={() => completeOps(t.id, person)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, border: "1.5px solid #1A5F6A", background: "#fff", cursor: "pointer" }}>
                        <Avatar name={person} size={24} />
                        <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1A5F6A" }}>{person}</span>
                      </button>
                    ))}
                    <button onClick={() => setPicker(null)}
                      style={{ padding: "8px 14px", borderRadius: 99, border: "1.5px solid #E8E6E0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#9C9888", fontFamily: "Inter, sans-serif" }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      {openTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1A", marginBottom: 12 }}>📌 Your Tasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openTasks.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1px solid #E8E6E0", borderRadius: 10 }}>
                <input type="checkbox" checked={false} onChange={() => updateTask(t.id, "status", "done")} style={{ width: 20, height: 20 }} />
                <div style={{ flex: 1 }}>
                  <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1A" }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text }}>{t.priority}</span>
                    {t.due && <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>Due {t.due}</span>}
                  </div>
                </div>
                {t.assignee && <Avatar name={t.assignee} size={28} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead measures */}
      <div>
        <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1A", marginBottom: 12 }}>📊 This Week's Focus</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.leadMeasures.map(m => {
            const val = data.weeklyLogs[m.goalId]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
            const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: done ? "#F0FBF0" : "#fff", border: `1px solid ${done ? "#C8E6C9" : "#E8E6E0"}`, borderRadius: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: done ? "#4CAF50" : "#D4D0C8", flexShrink: 0 }} />
                <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                {m.type === "checkbox"
                  ? <input type="checkbox" checked={!!val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} style={{ width: 20, height: 20 }} />
                  : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" value={val} min={0} onChange={e => updateLog(m.goalId, m.id, Number(e.target.value))}
                        style={{ width: 58, fontSize: 15, fontWeight: 700, textAlign: "center", padding: "4px 6px" }} />
                      <span className="inter" style={{ fontSize: 12, color: "#9C9888" }}>/ {m.target}</span>
                    </div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Ops Page ──────────────────────────────────────────────────────────────────
function OpsPage({ data, setData, isOwner, TEAM }) {
  const freqs = [
    { key: "opening", label: "Opening", emoji: "☀️" },
    { key: "midday",  label: "Midday",  emoji: "🌤" },
    { key: "closing", label: "Closing", emoji: "🌙" },
    { key: "weekly",  label: "Weekly",  emoji: "📅" },
    { key: "monthly", label: "Monthly", emoji: "🗓️" },
  ];

  const now = new Date();
  const hour = now.getHours();
  const defaultFreq = hour < 11 ? "opening" : hour < 16 ? "midday" : "closing";

  const [activeFreq, setActiveFreq] = useState(defaultFreq);
  const [editing, setEditing] = useState(null);
  const [picker, setPicker] = useState(null);

  const today = todayKey();
  const wk = weekKey();
  const mo = monthKey();
  const getKey = (freq) => ["opening","midday","closing"].includes(freq) ? today : freq === "weekly" ? wk : mo;

  const tasks = (data.opsTasks || []).filter(t => t.freq === activeFreq);
  const key = getKey(activeFreq);
  const doneCount = tasks.filter(t => t.completions?.[key]).length;
  const pctDone = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];

  const complete = (id, person) => {
    setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, completions: { ...t.completions, [key]: { at: new Date().toISOString(), by: person } } } : t) }));
    setPicker(null);
  };
  const uncomplete = (id) => setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, completions: { ...t.completions, [key]: null } } : t) }));
  const updateOps = (id, f, v) => setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, [f]: v } : t) }));
  const addOps = () => { const id = `${activeFreq[0]}${Date.now()}`; setData(d => ({ ...d, opsTasks: [...(d.opsTasks||[]), { id, freq: activeFreq, title: "New task", desc: "", assignee: "", completions: {}, notes: "" }] })); };
  const deleteOps = (id) => setData(d => ({ ...d, opsTasks: d.opsTasks.filter(t => t.id !== id) }));

  return (
    <div>
      {/* WIG — always visible for staff */}
      {wigGoal && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="inter" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 4 }}>The Score · {wigGoal.category}</div>
            <div className="lora" style={{ fontSize: 15, color: "#fff", fontStyle: "italic", lineHeight: 1.3 }}>{wigGoal.title}</div>
            <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#7DD3B8", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="lora" style={{ fontSize: 26, color: "#7DD3B8", lineHeight: 1 }}>{pct(wigGoal.current, wigGoal.target)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{fmt(wigGoal.current)} / {fmt(wigGoal.target)}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 24, fontStyle: "italic", color: "#1C1C1A" }}>Ops Tasks</h1>
          <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Keep the space excellent. Every shift.</p>
        </div>
        {isOwner && <button className="btn btn-teal" onClick={addOps}>+ Add task</button>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
        {freqs.map(f => {
          const fTasks = (data.opsTasks||[]).filter(t => t.freq === f.key);
          const fDone = fTasks.filter(t => t.completions?.[getKey(f.key)]).length;
          const fp = fTasks.length ? Math.round((fDone/fTasks.length)*100) : 0;
          return (
            <button key={f.key} onClick={() => setActiveFreq(f.key)}
              style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${activeFreq === f.key ? "#1A5F6A" : "#E8E6E0"}`, background: activeFreq === f.key ? "#1A5F6A" : "#fff", cursor: "pointer", flexShrink: 0, textAlign: "left", transition: "all 0.12s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{f.emoji}</span>
                <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: activeFreq === f.key ? "#fff" : "#2C2C28" }}>{f.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 3, background: activeFreq === f.key ? "rgba(255,255,255,0.25)" : "#EDE9E0", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${fp}%`, height: "100%", background: activeFreq === f.key ? "#7DD3B8" : "#1A5F6A", borderRadius: 99 }} />
                </div>
                <span className="inter" style={{ fontSize: 10, color: activeFreq === f.key ? "rgba(255,255,255,0.7)" : "#9C9888" }}>{fDone}/{fTasks.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#F4F2EC", borderRadius: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 5, background: "#E0DDD6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pctDone}%`, height: "100%", background: pctDone === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: pctDone === 100 ? "#2E7D32" : "#1A5F6A", minWidth: 80, textAlign: "right" }}>{doneCount}/{tasks.length} done</span>
        {pctDone === 100 && <span style={{ fontSize: 16 }}>✅</span>}
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {tasks.map(t => {
          const completion = t.completions?.[key];
          const isDone = !!completion;
          const isOpen = picker === t.id;
          const isEditing = editing === t.id && isOwner;

          return (
            <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#E8E6E0"}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px" }}>
                <button onClick={() => isDone ? uncomplete(t.id) : setPicker(isOpen ? null : t.id)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${isDone ? "#4CAF50" : isOpen ? "#1A5F6A" : "#D4D0C8"}`, background: isDone ? "#4CAF50" : isOpen ? "#E8F2F4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {isDone
                    ? <svg width="13" height="10" fill="none" viewBox="0 0 13 10"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOpen ? "#1A5F6A" : "#D4D0C8" }} />
                  }
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing
                    ? <input value={t.title} onChange={e => updateOps(t.id, "title", e.target.value)} style={{ fontSize: 14, fontWeight: 600, border: "none", padding: 0, background: "transparent" }} autoFocus />
                    : <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: isDone ? "#9C9888" : "#1C1C1A", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</div>
                  }
                  {t.desc && !isDone && !isEditing && <div className="inter" style={{ fontSize: 12, color: "#B0AAA0", marginTop: 2 }}>{t.desc}</div>}
                  {isDone && completion?.at && (
                    <div className="inter" style={{ fontSize: 11, color: "#4CAF50", marginTop: 2 }}>
                      {completion.by} · {new Date(completion.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isDone && completion?.by
                    ? <Avatar name={completion.by} size={28} ring="#4CAF50" />
                    : t.assignee
                      ? <Avatar name={t.assignee} size={28} />
                      : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 13 }}>👤</span></div>
                  }
                  {isOwner && (
                    <button onClick={() => setEditing(editing === t.id ? null : t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#C4C0B4", fontSize: 14, padding: "0 2px" }}>✎</button>
                  )}
                </div>
              </div>

              {/* Picker */}
              {isOpen && (
                <div style={{ padding: "0 16px 13px", borderTop: "1px solid #E8F2F4", paddingTop: 11, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TEAM.map(person => (
                    <button key={person} onClick={() => complete(t.id, person)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 99, border: "1.5px solid #1A5F6A", background: "#fff", cursor: "pointer" }}>
                      <Avatar name={person} size={22} />
                      <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1A5F6A" }}>{person}</span>
                    </button>
                  ))}
                  <button onClick={() => setPicker(null)} style={{ padding: "7px 13px", borderRadius: 99, border: "1.5px solid #E8E6E0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#9C9888", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                </div>
              )}

              {/* Edit panel */}
              {isEditing && (
                <div style={{ padding: "0 16px 14px", borderTop: "1px solid #EDE9E0", paddingTop: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div>
                      <div className="sec-label">Description</div>
                      <input value={t.desc} onChange={e => updateOps(t.id, "desc", e.target.value)} placeholder="Details..." />
                    </div>
                    <div>
                      <div className="sec-label">Assigned to</div>
                      <select value={t.assignee} onChange={e => updateOps(t.id, "assignee", e.target.value)} style={{ width: "auto" }}>
                        <option value="">Anyone</option>
                        {TEAM.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditing(null)} className="btn btn-teal" style={{ padding: "7px 14px" }}>Done</button>
                    <button onClick={() => { deleteOps(t.id); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#C62828", fontFamily: "Inter, sans-serif" }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="lora" style={{ fontSize: 18, color: "#C4C0B4", fontStyle: "italic" }}>No {activeFreq} tasks yet.</div>
          {isOwner && <button className="btn btn-teal" onClick={addOps} style={{ marginTop: 14 }}>+ Add one</button>}
        </div>
      )}
    </div>
  );
}

// ── Goals Page ────────────────────────────────────────────────────────────────
function GoalsPage({ data, setData, updateGoal, updateLog, isOwner, TEAM }) {
  const [adding, setAdding] = useState(false);
  const [ng, setNg] = useState({ title: "", category: "Memberships", target: "", current: 0, owner: "Collin", status: "on-track", why: "" });

  const save = () => {
    if (!ng.title || !ng.target) return;
    const id = Math.max(...data.goals.map(g => g.id)) + 1;
    setData(d => ({ ...d, goals: [...d.goals, { ...ng, id, target: Number(ng.target), notes: "" }] }));
    setAdding(false);
  };

  const allMeasures = data.leadMeasures.map(m => {
    const val = data.weeklyLogs[m.goalId]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
    const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
    const progress = m.type === "checkbox" ? (done ? 100 : 0) : Math.min(100, Math.round((Number(val) / m.target) * 100));
    return { ...m, val, done, progress };
  });

  const addMeasure = (goalId) => {
    const id = Math.max(...data.leadMeasures.map(m => m.id), 0) + 1;
    setData(d => ({ ...d, leadMeasures: [...d.leadMeasures, { id, goalId, title: "New action", type: "number", target: 1, unit: "per week" }] }));
  };
  const updateMeasure = (id, f, v) => setData(d => ({ ...d, leadMeasures: d.leadMeasures.map(m => m.id === id ? { ...m, [f]: v } : m) }));
  const deleteMeasure = (id) => setData(d => ({ ...d, leadMeasures: d.leadMeasures.filter(m => m.id !== id) }));

  const CATS = ["Memberships","Marketing","Community","Events","Retail","Operations","Partnerships"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Goals & Focus</h1>
          <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>What we're building and the actions that get us there.</p>
        </div>
        {isOwner && <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New goal</button>}
      </div>

      {adding && (
        <div className="card-warm" style={{ marginBottom: 20 }}>
          <div className="sec-label">New Goal</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Goal title" value={ng.title} onChange={e => setNg(g => ({ ...g, title: e.target.value }))} />
            <select value={ng.category} onChange={e => setNg(g => ({ ...g, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" placeholder="Target number" value={ng.target} onChange={e => setNg(g => ({ ...g, target: e.target.value }))} />
            <select value={ng.owner} onChange={e => setNg(g => ({ ...g, owner: e.target.value }))}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <textarea placeholder="Why does this goal matter to Ripple Boulder?" rows={2} value={ng.why} onChange={e => setNg(g => ({ ...g, why: e.target.value }))} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={save}>Save</button>
            <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.goals.map((g, idx) => {
          const p = pct(g.current, g.target);
          const s = sc[g.status];
          const measures = allMeasures.filter(m => m.goalId === g.id);
          const measuresDone = measures.filter(m => m.done).length;

          return (
            <div key={g.id} className="card">
              {/* Goal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, paddingRight: 12 }}>
                  {isOwner
                    ? <input value={g.title} onChange={e => updateGoal(g.id, "title", e.target.value)}
                        style={{ border: "none", padding: 0, fontSize: 16, fontWeight: 600, fontFamily: "Lora, serif", fontStyle: "italic", background: "transparent", color: "#1C1C1A", width: "100%" }} />
                    : <div className="lora" style={{ fontSize: 16, fontStyle: "italic", fontWeight: 600, color: "#1C1C1A" }}>{g.title}</div>
                  }
                  {g.why && <p className="inter" style={{ fontSize: 12, color: "#9C9888", marginTop: 3, lineHeight: 1.5 }}>{g.why}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span className="badge" style={{ background: s.bg, color: s.text }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                    {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Watch" : "Off track"}
                  </span>
                  {isOwner && (
                    <button onClick={() => setData(d => ({ ...d, goals: d.goals.filter(x => x.id !== g.id) }))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 16 }}>✕</button>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
                </div>
                {isOwner
                  ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" value={g.current} onChange={e => updateGoal(g.id, "current", Number(e.target.value))}
                        style={{ width: 64, fontSize: 14, fontWeight: 700, textAlign: "center", padding: "4px 6px" }} />
                      <span className="inter" style={{ fontSize: 13, color: "#9C9888" }}>/ {fmt(g.target)}</span>
                    </div>
                  : <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1A", whiteSpace: "nowrap" }}>{fmt(g.current)} / {fmt(g.target)}</span>
                }
              </div>

              {/* Status & owner */}
              {isOwner && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <select value={g.status} onChange={e => updateGoal(g.id, "status", e.target.value)} style={{ width: "auto", fontSize: 12 }}>
                    <option value="on-track">On track</option>
                    <option value="needs-attention">Needs attention</option>
                    <option value="off-track">Off track</option>
                  </select>
                  <select value={g.owner} onChange={e => updateGoal(g.id, "owner", e.target.value)} style={{ width: "auto", fontSize: 12 }}>
                    {TEAM.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <hr className="divider" />

              {/* Lead measures */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="sec-label" style={{ marginBottom: 0 }}>Weekly actions · {measuresDone}/{measures.length} done</div>
                {isOwner && <button onClick={() => addMeasure(g.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+ Add action</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {measures.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: m.done ? "#F0FBF0" : "#FAFAF8", borderRadius: 8, border: `1px solid ${m.done ? "#C8E6C9" : "#EDE9E0"}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.done ? "#4CAF50" : "#D4D0C8", flexShrink: 0 }} />
                    {isOwner
                      ? <input value={m.title} onChange={e => updateMeasure(m.id, "title", e.target.value)} style={{ flex: 1, border: "none", padding: 0, fontSize: 13, fontWeight: 500, background: "transparent", fontFamily: "Inter, sans-serif" }} />
                      : <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                    }
                    {isOwner && <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{m.unit}</span>}
                    {m.type === "checkbox"
                      ? <input type="checkbox" checked={!!m.val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} />
                      : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="number" value={m.val} min={0} onChange={e => updateLog(m.goalId, m.id, Number(e.target.value))}
                            style={{ width: 54, fontSize: 14, fontWeight: 700, textAlign: "center", padding: "3px 5px" }} />
                          <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>/ {m.target}</span>
                        </div>
                    }
                    {isOwner && <button onClick={() => deleteMeasure(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14 }}>✕</button>}
                  </div>
                ))}
                {measures.length === 0 && isOwner && (
                  <p className="inter" style={{ fontSize: 13, color: "#C4C0B4", fontStyle: "italic" }}>No weekly actions yet — add one above.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Work Page ─────────────────────────────────────────────────────────────────
function WorkPage({ data, setData, updateTask, isOwner, TEAM }) {
  const [tab, setTab] = useState("tasks");
  const today = todayKey();
  const oneWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const open = data.tasks.filter(t => t.status !== "done");
  const done = data.tasks.filter(t => t.status === "done");
  const overdue = open.filter(t => t.due && t.due < today);
  const thisWeek = open.filter(t => t.due && t.due >= today && t.due <= oneWeek);
  const later = open.filter(t => !t.due || t.due > oneWeek);

  const lastMeeting = data.meetings[data.meetings.length - 1];
  const commitsDone = (lastMeeting?.commitments || []).filter(c => c.done).length;
  const commitsTotal = (lastMeeting?.commitments || []).length;

  const tabs = [
    { key: "tasks",    label: "Tasks",      emoji: "✅", stat: `${open.length} open` },
    { key: "checkins", label: "Check-ins",  emoji: "💬", stat: commitsTotal ? `${commitsDone}/${commitsTotal}` : "No meeting yet" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Work</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Projects, tasks, and team check-ins.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${tab === t.key ? "#1A5F6A" : "#E8E6E0"}`, background: tab === t.key ? "#1A5F6A" : "#fff", cursor: "pointer", flexShrink: 0, minWidth: 130, transition: "all 0.12s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 15 }}>{t.emoji}</span>
              <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: tab === t.key ? "#fff" : "#2C2C28" }}>{t.label}</span>
            </div>
            <span className="inter" style={{ fontSize: 11, color: tab === t.key ? "rgba(255,255,255,0.65)" : "#9C9888" }}>{t.stat}</span>
          </button>
        ))}
      </div>

      {tab === "tasks" && <TasksTab data={data} setData={setData} updateTask={updateTask} isOwner={isOwner} TEAM={TEAM} open={open} done={done} overdue={overdue} thisWeek={thisWeek} later={later} today={today} />}
      {tab === "checkins" && <CheckinsTab data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
    </div>
  );
}

function TasksTab({ data, setData, updateTask, isOwner, TEAM, open, done, overdue, thisWeek, later, today }) {
  const [filter, setFilter] = useState("all");
  const filteredOpen = filter === "all" ? open : open.filter(t => t.assignee === filter);

  const addTask = () => {
    const id = Math.max(...data.tasks.map(t => t.id), 0) + 1;
    setData(d => ({ ...d, tasks: [...d.tasks, { id, title: "New task", goalId: data.goals[0]?.id || 1, assignee: TEAM[0], due: "", priority: "medium", status: "todo", notes: "" }] }));
  };

  const TaskRow = ({ t }) => {
    const isOverdue = t.due && t.due < today;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: `1px solid ${isOverdue ? "#FFCDD2" : "#E8E6E0"}`, borderRadius: 10, opacity: t.status === "done" ? 0.45 : 1 }}>
        <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} style={{ width: 18, height: 18 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {isOwner
            ? <input value={t.title} onChange={e => updateTask(t.id, "title", e.target.value)}
                style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", color: "#1C1C1A", textDecoration: t.status === "done" ? "line-through" : "none" }} />
            : <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1A", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
          }
          <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
            <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text }}>{t.priority}</span>
            {t.due && <span className="inter" style={{ fontSize: 11, color: isOverdue ? "#C62828" : "#9C9888" }}>{isOverdue ? "⚠ " : ""}Due {t.due}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isOwner ? (
            <>
              <select value={t.assignee} onChange={e => updateTask(t.id, "assignee", e.target.value)} style={{ width: "auto", fontSize: 12 }}>{TEAM.map(p => <option key={p}>{p}</option>)}</select>
              <input type="date" value={t.due || ""} onChange={e => updateTask(t.id, "due", e.target.value)} style={{ width: 120, fontSize: 12 }} />
              <button onClick={() => setData(d => ({ ...d, tasks: d.tasks.filter(x => x.id !== t.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 16 }}>✕</button>
            </>
          ) : (
            <>{t.assignee && <Avatar name={t.assignee} size={28} />}{t.due && <span className="inter" style={{ fontSize: 11, color: isOverdue ? "#C62828" : "#9C9888" }}>{t.due}</span>}</>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ label, tasks, accent }) => tasks.length === 0 ? null : (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
        <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <span className="inter" style={{ fontSize: 12, color: "#C4C0B4" }}>{tasks.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{tasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
    </div>
  );

  const filteredOverdue = filter === "all" ? overdue : overdue.filter(t => t.assignee === filter);
  const filteredThisWeek = filter === "all" ? thisWeek : thisWeek.filter(t => t.assignee === filter);
  const filteredLater = filter === "all" ? later : later.filter(t => t.assignee === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All team</option>
          {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {isOwner && <button className="btn btn-teal" onClick={addTask}>+ Task</button>}
      </div>
      {filteredOpen.length === 0 && <div style={{ textAlign: "center", padding: "32px 0" }}><div className="lora" style={{ fontSize: 18, color: "#C4C0B4", fontStyle: "italic" }}>All clear! 🌊</div></div>}
      <Section label="Overdue / Today" tasks={filteredOverdue} accent="#EF5350" />
      <Section label="This Week" tasks={filteredThisWeek} accent="#FFC107" />
      <Section label="Later" tasks={filteredLater} accent="#B0B0A8" />
      {done.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="inter" style={{ fontSize: 12, color: "#C4C0B4", cursor: "pointer", padding: "8px 0" }}>Show {done.length} completed</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>{done.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </details>
      )}
    </div>
  );
}

function CheckinsTab({ data, setData, isOwner, TEAM }) {
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ date: todayKey(), wins: "", moved: "", didnt: "", ownerNotes: "", commitments: [] });

  const save = () => {
    if (!form.date) return;
    const id = Math.max(...data.meetings.map(m => m.id), 0) + 1;
    setData(d => ({ ...d, meetings: [...d.meetings, { ...form, id }] }));
    setAdding(false); setStep(0);
    setForm({ date: todayKey(), wins: "", moved: "", didnt: "", ownerNotes: "", commitments: [] });
  };

  const updateMeeting = (id, f, v) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === id ? { ...m, [f]: v } : m) }));
  const updateCF = (mid, idx, f, v) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.map((c, i) => i === idx ? { ...c, [f]: v } : c) } : m) }));
  const addC = (mid) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: [...(m.commitments||[]), { person: TEAM[0], commitment: "", due: "", done: false }] } : m) }));
  const removeC = (mid, idx) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.filter((_, i) => i !== idx) } : m) }));

  const steps = [
    { prompt: "What went well this week? Any wins worth celebrating? 🌱", field: "wins", placeholder: "Sold 8 memberships, event had 40 people..." },
    { prompt: "What actually moved the goal forward?", field: "moved", placeholder: "Personal outreach, warm follow-ups..." },
    { prompt: "Be honest — what didn't happen?", field: "didnt", placeholder: "Instagram posts, partnership visits..." },
    { prompt: "What is each person committing to this week?", field: "commitments" },
  ];

  return (
    <div>
      {isOwner && !adding && (
        <button className="btn btn-teal" onClick={() => setAdding(true)} style={{ marginBottom: 20 }}>+ New Check-in</button>
      )}

      {adding && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 16, padding: "26px 28px", marginBottom: 24, color: "#fff" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? "#7DD3B8" : "rgba(255,255,255,0.2)", cursor: "pointer" }} onClick={() => setStep(i)} />
            ))}
          </div>
          <div className="inter" style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Step {step + 1} of {steps.length}</div>
          <div className="lora" style={{ fontSize: 18, color: "#fff", fontStyle: "italic", marginBottom: 12 }}>{steps[step].prompt}</div>

          {steps[step].field !== "commitments" ? (
            <textarea rows={3} value={form[steps[step].field]} placeholder={steps[step].placeholder}
              onChange={e => setForm(f => ({ ...f, [steps[step].field]: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "Inter, sans-serif", resize: "none", outline: "none" }} />
          ) : (
            <div>
              {form.commitments.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
                  <select value={c.person} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, person: e.target.value } : x) }))}
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                    {TEAM.map(t => <option key={t} style={{ background: "#0F3D45" }}>{t}</option>)}
                  </select>
                  <input value={c.commitment} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, commitment: e.target.value } : x) }))}
                    placeholder="I'll..." style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 13 }} />
                  <button onClick={() => setForm(f => ({ ...f, commitments: f.commitments.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, commitments: [...f.commitments, { person: TEAM[0], commitment: "", due: "", done: false }] }))}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif", width: "100%", marginTop: 4 }}>
                + Add person
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center" }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13, color: "#fff", fontFamily: "Inter, sans-serif" }}>Back</button>}
            {step < steps.length - 1
              ? <button onClick={() => setStep(s => s + 1)} style={{ background: "#7DD3B8", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0F3D45", fontFamily: "Inter, sans-serif" }}>Next →</button>
              : <button onClick={save} style={{ background: "#7DD3B8", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0F3D45", fontFamily: "Inter, sans-serif" }}>Save ✓</button>
            }
            <button onClick={() => { setAdding(false); setStep(0); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...data.meetings].reverse().map(m => {
          const doneC = (m.commitments||[]).filter(c => c.done).length;
          const totalC = (m.commitments||[]).length;
          return (
            <div key={m.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  {isOwner
                    ? <input type="date" value={m.date} onChange={e => updateMeeting(m.id, "date", e.target.value)}
                        style={{ border: "none", padding: 0, fontSize: 15, fontFamily: "Lora, serif", fontStyle: "italic", fontWeight: 500, background: "transparent", color: "#1C1C1A" }} />
                    : <div className="lora" style={{ fontSize: 15, fontStyle: "italic", color: "#1C1C1A" }}>{m.date}</div>
                  }
                  {totalC > 0 && <div className="inter" style={{ fontSize: 12, color: doneC === totalC ? "#2E7D32" : "#9C9888", marginTop: 2 }}>{doneC}/{totalC} commitments done</div>}
                </div>
                {isOwner && <button onClick={() => { if (window.confirm("Delete?")) setData(d => ({ ...d, meetings: d.meetings.filter(x => x.id !== m.id) })); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontFamily: "Inter, sans-serif", fontSize: 13 }}>Delete</button>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }} className="g2">
                {[
                  { label: "Wins", field: "wins", bg: "#E8F5E9", border: "#C8E6C9", text: "#2E7D32" },
                  { label: "What worked", field: "moved", bg: "#E8F2F4", border: "#B2D8DD", text: "#1A5F6A" },
                  { label: "Fell short", field: "didnt", bg: "#FFF8E1", border: "#FFE082", text: "#F57F17" },
                ].map(col => (
                  <div key={col.field} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div className="sec-label" style={{ color: col.text, marginBottom: 5 }}>{col.label}</div>
                    {isOwner
                      ? <textarea rows={2} value={m[col.field]||""} onChange={e => updateMeeting(m.id, col.field, e.target.value)} placeholder="Add notes..."
                          style={{ width: "100%", background: "transparent", border: "none", fontSize: 12, color: "#333", fontFamily: "Inter, sans-serif", resize: "none", outline: "none", lineHeight: 1.5 }} />
                      : <p className="inter" style={{ fontSize: 12, color: "#444", lineHeight: 1.55, margin: 0 }}>{m[col.field] || "—"}</p>
                    }
                  </div>
                ))}
              </div>

              <hr className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div className="sec-label" style={{ marginBottom: 0 }}>Commitments</div>
                {isOwner && <button onClick={() => addC(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+ Add</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(m.commitments||[]).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: c.done ? "#F0FBF0" : "#FAFAF8", borderRadius: 8, border: `1px solid ${c.done ? "#C8E6C9" : "#EDE9E0"}` }}>
                    <input type="checkbox" checked={c.done} onChange={e => updateCF(m.id, i, "done", e.target.checked)} />
                    {isOwner
                      ? <>
                          <select value={c.person} onChange={e => updateCF(m.id, i, "person", e.target.value)} style={{ width: "auto", fontSize: 12, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer" }}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
                          <input value={c.commitment} onChange={e => updateCF(m.id, i, "commitment", e.target.value)}
                            style={{ flex: 1, border: "none", padding: 0, fontSize: 13, background: "transparent", textDecoration: c.done ? "line-through" : "none", color: c.done ? "#9C9888" : "#1C1C1A", fontFamily: "Inter, sans-serif" }} />
                          <button onClick={() => removeC(m.id, i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14 }}>✕</button>
                        </>
                      : <>
                          <Avatar name={c.person} size={22} />
                          <span className="inter" style={{ flex: 1, fontSize: 13, color: c.done ? "#9C9888" : "#1C1C1A", textDecoration: c.done ? "line-through" : "none" }}>{c.commitment}</span>
                        </>
                    }
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, borderTop: "1px solid #EDE9E0", paddingTop: 12 }}>
                <div className="sec-label" style={{ color: "#1A5F6A", marginBottom: 5 }}>Owner Note</div>
                <textarea value={m.ownerNotes||""} onChange={e => updateMeeting(m.id, "ownerNotes", e.target.value)} readOnly={!isOwner}
                  placeholder="A note for the team..." rows={isOwner ? 2 : 1}
                  style={{ width: "100%", background: "transparent", border: "none", fontSize: 13, fontStyle: "italic", color: m.ownerNotes ? "#444" : "#C4C0B4", fontFamily: "Lora, serif", resize: "none", outline: "none", lineHeight: 1.6 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Opening Page ──────────────────────────────────────────────────────────────
function OpeningPage({ data, setData, isOwner, TEAM }) {
  const [filter, setFilter] = useState("all");
  const items = data.openingChecklist || [];
  const filtered = filter === "all" ? items : items.filter(i => i.owner === filter);
  const cats = [...new Set(items.map(i => i.category))];
  const doneCount = items.filter(i => i.done).length;
  const pctDone = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const openingDays = data.openingDate ? Math.ceil((new Date(data.openingDate) - new Date()) / 86400000) : null;

  const toggle = (id) => setData(d => ({ ...d, openingChecklist: d.openingChecklist.map(i => i.id === id ? { ...i, done: !i.done } : i) }));
  const updateItem = (id, f, v) => setData(d => ({ ...d, openingChecklist: d.openingChecklist.map(i => i.id === id ? { ...i, [f]: v } : i) }));
  const addItem = (cat) => { const id = `oc${Date.now()}`; setData(d => ({ ...d, openingChecklist: [...d.openingChecklist, { id, category: cat, item: "New item", done: false, owner: TEAM[0], notes: "" }] })); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Opening Roadmap</h1>
          <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Everything that needs to happen before we open the doors.</p>
        </div>
        {openingDays !== null && (
          <div style={{ textAlign: "right", background: openingDays <= 14 ? "#FFEBEE" : "#E8F2F4", border: `1px solid ${openingDays <= 14 ? "#FFCDD2" : "#B2D8DD"}`, borderRadius: 12, padding: "10px 16px" }}>
            <div className="lora" style={{ fontSize: 28, color: openingDays <= 14 ? "#C62828" : "#1A5F6A", lineHeight: 1 }}>{openingDays > 0 ? openingDays : "🎉"}</div>
            <div className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 2 }}>{openingDays > 0 ? "days to go" : "Open!"}</div>
            {isOwner && <input type="date" value={data.openingDate||""} onChange={e => setData(d => ({ ...d, openingDate: e.target.value }))}
              style={{ fontSize: 10, border: "none", background: "transparent", color: "#9C9888", marginTop: 4, cursor: "pointer", textAlign: "right" }} />}
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ background: "#fff", border: "1px solid #E8E6E0", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Overall readiness — {doneCount} of {items.length} complete</span>
          <span className="lora" style={{ fontSize: 22, color: pctDone === 100 ? "#2E7D32" : "#1A5F6A" }}>{pctDone}%</span>
        </div>
        <div style={{ height: 8, background: "#EDE9E0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pctDone}%`, height: "100%", background: pctDone === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        {pctDone === 100 && <p className="inter" style={{ fontSize: 13, color: "#2E7D32", marginTop: 8, fontWeight: 600 }}>🎉 Ready to open — let's go!</p>}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All owners</option>
          {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {cats.map(cat => {
          const catItems = filtered.filter(i => i.category === cat);
          if (!catItems.length) return null;
          const catDone = catItems.filter(i => i.done).length;
          const cp = Math.round((catDone / catItems.length) * 100);
          return (
            <div key={cat}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1A" }}>{cat}</span>
                  <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{catDone}/{catItems.length}</span>
                  <div style={{ width: 48, height: 3, background: "#EDE9E0", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${cp}%`, height: "100%", background: cp === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99 }} />
                  </div>
                </div>
                {isOwner && <button onClick={() => addItem(cat)} style={{ background: "none", border: "1px solid #E8E6E0", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, color: "#666", fontFamily: "Inter, sans-serif" }}>+ Add</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: item.done ? "#F0FBF0" : "#fff", border: `1px solid ${item.done ? "#C8E6C9" : "#E8E6E0"}`, borderRadius: 10, opacity: item.done ? 0.75 : 1 }}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} style={{ width: 18, height: 18, accentColor: "#1A5F6A" }} />
                    <div style={{ flex: 1 }}>
                      {isOwner
                        ? <input value={item.item} onChange={e => updateItem(item.id, "item", e.target.value)}
                            style={{ border: "none", padding: 0, fontSize: 13, fontWeight: item.done ? 400 : 500, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", color: item.done ? "#9C9888" : "#1C1C1A", textDecoration: item.done ? "line-through" : "none" }} />
                        : <div className="inter" style={{ fontSize: 13, fontWeight: item.done ? 400 : 500, color: item.done ? "#9C9888" : "#1C1C1A", textDecoration: item.done ? "line-through" : "none" }}>{item.item}</div>
                      }
                      {item.notes && <div className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 2 }}>{item.notes}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {isOwner
                        ? <>
                            <select value={item.owner} onChange={e => updateItem(item.id, "owner", e.target.value)} style={{ fontSize: 12, width: "auto", border: "1px solid #E8E6E0", borderRadius: 6 }}>
                              {TEAM.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <button onClick={() => setData(d => ({ ...d, openingChecklist: d.openingChecklist.filter(x => x.id !== item.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14 }}>✕</button>
                          </>
                        : <Avatar name={item.owner} size={26} />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────
function ScoreboardPage({ data, setData, isOwner, TEAM }) {
  const wk = weekKey();
  const today = todayKey();
  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];
  const contributions = data.contributions || {};
  const weekContribs = contributions[wk] || {};

  const addAction = (person, text) => {
    if (!text.trim()) return;
    setData(d => {
      const wkData = d.contributions?.[wk] || {};
      const personData = wkData[person] || { actions: [], note: "" };
      return {
        ...d,
        contributions: {
          ...d.contributions,
          [wk]: {
            ...wkData,
            [person]: {
              ...personData,
              actions: [...personData.actions, { text: text.trim(), timestamp: new Date().toISOString() }],
            }
          }
        }
      };
    });
  };

  const removeAction = (person, idx) => {
    setData(d => {
      const wkData = d.contributions?.[wk] || {};
      const personData = wkData[person] || { actions: [], note: "" };
      return {
        ...d,
        contributions: {
          ...d.contributions,
          [wk]: {
            ...wkData,
            [person]: {
              ...personData,
              actions: personData.actions.filter((_, i) => i !== idx),
            }
          }
        }
      };
    });
  };

  const updateNote = (person, note) => {
    setData(d => {
      const wkData = d.contributions?.[wk] || {};
      const personData = wkData[person] || { actions: [], note: "" };
      return {
        ...d,
        contributions: {
          ...d.contributions,
          [wk]: { ...wkData, [person]: { ...personData, note } }
        }
      };
    });
  };

  // Count lead measures done by goal this week
  const wigMeasures = data.leadMeasures.filter(m => m.goalId === wigGoal?.id);
  const wigMeasuresDone = wigMeasures.filter(m => {
    const val = data.weeklyLogs[m.goalId]?.[m.id];
    return m.type === "checkbox" ? !!val : Number(val) >= m.target;
  }).length;

  // Ops completions this week per person
  const opsCompletionsByPerson = {};
  TEAM.forEach(p => { opsCompletionsByPerson[p] = 0; });
  (data.opsTasks || []).forEach(t => {
    const completion = t.completions?.[today];
    if (completion?.by && opsCompletionsByPerson[completion.by] !== undefined) {
      opsCompletionsByPerson[completion.by]++;
    }
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Scoreboard</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Are we winning? Here's the honest picture — together.</p>
      </div>

      {/* WIG big score */}
      {wigGoal && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
          <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 8 }}>Wildly Important Goal</div>
          <div className="lora" style={{ fontSize: 22, fontStyle: "italic", color: "#fff", marginBottom: 6 }}>{wigGoal.title}</div>
          <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20, lineHeight: 1.5 }}>{wigGoal.why}</div>

          {/* Big number */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 16 }}>
            <div>
              <div className="lora" style={{ fontSize: 52, color: "#7DD3B8", lineHeight: 1 }}>{fmt(wigGoal.current)}</div>
              <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>of {fmt(wigGoal.target)} goal</div>
            </div>
            <div style={{ flex: 1, paddingBottom: 12 }}>
              <div style={{ height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#7DD3B8", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
              <div className="inter" style={{ fontSize: 13, color: "#7DD3B8", fontWeight: 700 }}>{pct(wigGoal.current, wigGoal.target)}% there</div>
            </div>
          </div>

          {/* Weekly lead measures */}
          {wigMeasures.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px" }}>
              <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>This week's key actions</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {wigMeasures.map(m => {
                  const val = data.weeklyLogs[m.goalId]?.[m.id] ?? 0;
                  const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: done ? "rgba(125,211,184,0.2)" : "rgba(255,255,255,0.08)", padding: "5px 12px", borderRadius: 99, border: `1px solid ${done ? "rgba(125,211,184,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: done ? "#7DD3B8" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                      <span className="inter" style={{ fontSize: 12, color: done ? "#7DD3B8" : "rgba(255,255,255,0.6)" }}>
                        {m.title} {m.type === "number" ? `· ${val}/${m.target}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All goals summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="sec-label">All Goals This Week</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.goals.map(g => {
            const p = pct(g.current, g.target);
            const s = sc[g.status];
            return (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#1C1C1A" }}>{g.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: s.text }}>{p}%</span>
                    <span className="badge" style={{ background: s.bg, color: s.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                      {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Watch" : "Off track"}
                    </span>
                  </div>
                </div>
                <div className="pbar">
                  <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-person scorecards */}
      <div className="sec-label">Team This Week</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {TEAM.map(person => {
          const personData = weekContribs[person] || { actions: [], note: "" };
          const opsCount = opsCompletionsByPerson[person] || 0;
          const totalOps = (data.opsTasks || []).filter(t => ["opening","midday","closing"].includes(t.freq)).length;
          const [input, setInput] = useState("");
          const [showInput, setShowInput] = useState(false);

          return (
            <div key={person} style={{ background: "#fff", border: "1px solid #E8E6E0", borderRadius: 16, overflow: "hidden" }}>
              {/* Person header */}
              <div style={{ background: avatarColor(person), padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
                  <span className="inter" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{initials(person)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="lora" style={{ fontSize: 18, color: "#fff", fontStyle: "italic" }}>{person}</div>
                  <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                    {personData.actions.length} contribution{personData.actions.length !== 1 ? "s" : ""} this week
                    {opsCount > 0 ? ` · ${opsCount}/${totalOps} ops done today` : ""}
                  </div>
                </div>
                {/* Ops mini score */}
                <div style={{ textAlign: "right" }}>
                  <div className="lora" style={{ fontSize: 22, color: "#fff", lineHeight: 1 }}>{opsCount}</div>
                  <div className="inter" style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>ops today</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "16px 20px" }}>
                {/* Contributions list */}
                {personData.actions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    {personData.actions.map((a, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "#F4F8F4", borderRadius: 8, border: "1px solid #DCF0DC" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4CAF50", marginTop: 5, flexShrink: 0 }} />
                        <span className="inter" style={{ flex: 1, fontSize: 13, color: "#1C1C1A", lineHeight: 1.5 }}>{a.text}</span>
                        <span className="inter" style={{ fontSize: 10, color: "#B0C8B0", whiteSpace: "nowrap", marginTop: 2 }}>
                          {new Date(a.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                        {isOwner && (
                          <button onClick={() => removeAction(person, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14, padding: "0 2px", lineHeight: 1 }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="inter" style={{ fontSize: 13, color: "#C4C0B4", fontStyle: "italic", marginBottom: 12 }}>
                    Nothing logged yet this week — add something that moved the goal!
                  </p>
                )}

                {/* Note from person */}
                {(personData.note || isOwner) && (
                  <div style={{ background: "#FDF9F4", border: "1px solid #E8E2D8", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                    <div className="sec-label" style={{ color: avatarColor(person), marginBottom: 4 }}>Note</div>
                    <textarea
                      value={personData.note || ""}
                      onChange={e => updateNote(person, e.target.value)}
                      readOnly={!isOwner}
                      placeholder={isOwner ? `Add a note for ${person}...` : ""}
                      rows={2}
                      style={{ width: "100%", background: "transparent", border: "none", fontSize: 13, fontStyle: "italic", color: personData.note ? "#555" : "#C4C0B4", fontFamily: "Lora, serif", resize: "none", outline: "none", lineHeight: 1.6 }}
                    />
                  </div>
                )}

                {/* Add contribution */}
                {showInput ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      autoFocus
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && input.trim()) { addAction(person, input); setInput(""); setShowInput(false); } if (e.key === "Escape") setShowInput(false); }}
                      placeholder="What did you do to move the goal?"
                      style={{ flex: 1, fontSize: 14, color: "#1C1C1A", background: "#fff", border: "2px solid " + avatarColor(person), borderRadius: 9, padding: "10px 13px", fontFamily: "Inter, sans-serif", outline: "none", fontWeight: 500 }}
                    />
                    <button onClick={() => { if (input.trim()) { addAction(person, input); setInput(""); } setShowInput(false); }}
                      style={{ background: avatarColor(person), color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600, flexShrink: 0 }}>Save</button>
                    <button onClick={() => { setShowInput(false); setInput(""); }}
                      style={{ background: "none", border: "1px solid #E8E6E0", borderRadius: 9, padding: "10px 12px", cursor: "pointer", fontSize: 14, color: "#9C9888", flexShrink: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowInput(true)}
                    style={{ background: "#FAFAF8", border: `1.5px dashed ${avatarColor(person)}60`, borderRadius: 9, padding: "10px 16px", cursor: "pointer", fontSize: 13, color: avatarColor(person), fontFamily: "Inter, sans-serif", fontWeight: 600, width: "100%", textAlign: "center" }}>
                    + Log a contribution for {person}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Team ops summary today */}
      <div className="card">
        <div className="sec-label">Today's Ops — Team Summary</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TEAM.map(person => {
            const count = opsCompletionsByPerson[person] || 0;
            const totalOps = (data.opsTasks || []).filter(t => ["opening","midday","closing"].includes(t.freq)).length;
            const p = totalOps ? Math.round((count / totalOps) * 100) : 0;
            return (
              <div key={person} style={{ flex: 1, minWidth: 140, background: "#FAFAF8", border: "1px solid #E8E6E0", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Avatar name={person} size={28} />
                  <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1A" }}>{person}</span>
                </div>
                <div className="pbar" style={{ marginBottom: 5 }}>
                  <div className="pfill" style={{ width: `${p}%`, background: p === 100 ? "#4CAF50" : avatarColor(person) }} />
                </div>
                <div className="inter" style={{ fontSize: 12, color: "#9C9888" }}>{count} / {totalOps} tasks</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ data, setData }) {
  const team = data.team || TEAM;
  const updateName = (idx, val) => { const next = [...team]; next[idx] = val; setData(d => ({ ...d, team: next })); };
  const addPerson = () => setData(d => ({ ...d, team: [...(d.team||TEAM), "New person"] }));
  const removePerson = (idx) => setData(d => ({ ...d, team: (d.team||TEAM).filter((_, i) => i !== idx) }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Settings</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Manage your team and preferences.</p>
      </div>
      <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
        <div className="sec-label">Your name</div>
        <input value={data.currentUser} onChange={e => setData(d => ({ ...d, currentUser: e.target.value }))} style={{ marginBottom: 4 }} />
        <p className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 4 }}>Shown in greetings and the staff view.</p>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="sec-label" style={{ marginBottom: 0 }}>Team members</div>
          <button className="btn btn-teal" onClick={addPerson} style={{ padding: "6px 14px", fontSize: 12 }}>+ Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {team.map((name, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={name} size={32} />
              <input value={name} onChange={e => updateName(idx, e.target.value)} style={{ flex: 1, fontWeight: 500 }} />
              <button onClick={() => removePerson(idx)} style={{ background: "none", border: "1px solid #EDE9E0", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#C62828", fontFamily: "Inter, sans-serif" }}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
