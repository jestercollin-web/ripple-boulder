import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const INITIAL_DATA = {
  goals: [
    { id: 1, title: "Reach 300 Active Members", category: "Memberships", startDate: "2025-06-01", endDate: "2025-09-01", target: 300, current: 47, owner: "Collin", team: ["Mia", "Jordan"], status: "on-track", why: "Members are our foundation. 300 gives us a sustainable, vibrant community from day one.", notes: "" },
    { id: 2, title: "Sell 75 Founding Memberships", category: "Memberships", startDate: "2025-06-01", endDate: "2025-07-15", target: 75, current: 31, owner: "Collin", team: ["Mia"], status: "on-track", why: "Founding members create early momentum and a loyal core community before we open.", notes: "Focus on pre-launch email list" },
    { id: 3, title: "Collect 500 Local Email Leads", category: "Marketing", startDate: "2025-06-01", endDate: "2025-08-01", target: 500, current: 187, owner: "Jordan", team: ["Collin", "Sam"], status: "needs-attention", why: "Email leads are our most valuable marketing asset for the opening push.", notes: "" },
    { id: 4, title: "Build 20 Local Business Partnerships", category: "Partnerships", startDate: "2025-06-01", endDate: "2025-08-15", target: 20, current: 6, owner: "Collin", team: ["Sam"], status: "off-track", why: "Local businesses amplify our reach and create community goodwill.", notes: "Need to prioritize outreach this week" },
    { id: 5, title: "Host 4 Community Preview Events", category: "Events", startDate: "2025-06-01", endDate: "2025-08-31", target: 4, current: 1, owner: "Mia", team: ["Jordan", "Collin"], status: "on-track", why: "Preview events create buzz, collect leads, and let people fall in love with the space.", notes: "Next event July 12" },
    { id: 6, title: "Generate $5K in Retail Sales", category: "Retail", startDate: "2025-09-01", endDate: "2025-09-30", target: 5000, current: 320, owner: "Sam", team: ["Mia"], status: "on-track", why: "Opening month retail sales fund operations and build brand loyalty.", notes: "" },
    { id: 7, title: "Reach 10K Instagram Followers", category: "Marketing", startDate: "2025-06-01", endDate: "2025-09-01", target: 10000, current: 3240, owner: "Jordan", team: [], status: "needs-attention", why: "Instagram is our primary awareness channel for the Fort Wayne community.", notes: "" },
    { id: 8, title: "Book 10 Birthday/Group Events", category: "Events", startDate: "2025-07-01", endDate: "2025-09-30", target: 10, current: 2, owner: "Mia", team: ["Sam"], status: "on-track", why: "Group events create recurring revenue and introduce new climbers to Ripple.", notes: "" },
  ],
  leadMeasures: [
    { id: 1, goalId: 1, title: "Outreach contacts made", type: "number", target: 20, unit: "contacts/week" },
    { id: 2, goalId: 1, title: "Membership tours given", type: "number", target: 5, unit: "tours/week" },
    { id: 3, goalId: 2, title: "Founding member follow-ups", type: "number", target: 10, unit: "calls/week" },
    { id: 4, goalId: 3, title: "Instagram Reels posted", type: "number", target: 4, unit: "reels/week" },
    { id: 5, goalId: 3, title: "Email campaign sent", type: "checkbox", target: 1, unit: "per week" },
    { id: 6, goalId: 4, title: "Local business visits", type: "number", target: 3, unit: "visits/week" },
    { id: 7, goalId: 5, title: "Event invites sent", type: "number", target: 20, unit: "invites/event" },
    { id: 8, goalId: 7, title: "Member referral asks", type: "number", target: 10, unit: "asks/week" },
  ],
  weeklyLogs: { 1: { 1: 14, 2: 3 }, 2: { 3: 7 }, 3: { 4: 3, 5: true }, 4: { 6: 1 }, 5: { 7: 15 }, 6: {}, 7: { 8: 6 }, 8: {} },
  meetings: [
    {
      id: 1, date: "2025-06-30",
      wins: "Sold 8 founding memberships this week. First preview event had 40 attendees!",
      moved: "Personal outreach by Collin drove 6 of the 8 sales.",
      didnt: "Instagram reels only hit 2 of 4. Business partnership visits fell short.",
      commitments: [
        { person: "Jordan", commitment: "Post 4 reels this week — themes ready to go", due: "2025-07-06", done: false },
        { person: "Sam", commitment: "Visit 3 businesses on the north side", due: "2025-07-05", done: true },
        { person: "Mia", commitment: "Confirm July 12 event logistics with venue", due: "2025-07-03", done: true },
        { person: "Collin", commitment: "Follow up with 10 warm leads from the preview event", due: "2025-07-06", done: false },
      ],
      ownerNotes: "We're ahead on memberships but need to push partnerships harder. Jordan — let's talk content strategy this week.",
      followUp: "Review partnership outreach strategy in next meeting."
    }
  ],
  tasks: [
    { id: 1, title: "Design membership sign-up flow", goalId: 1, assignee: "Jordan", due: "2025-07-08", priority: "high", status: "in-progress", notes: "" },
    { id: 2, title: "Order opening month retail inventory", goalId: 6, assignee: "Sam", due: "2025-07-15", priority: "high", status: "todo", notes: "Budget approved" },
    { id: 3, title: "Create birthday party booking page", goalId: 8, assignee: "Jordan", due: "2025-07-10", priority: "medium", status: "todo", notes: "" },
    { id: 4, title: "Draft July email campaign", goalId: 3, assignee: "Jordan", due: "2025-07-05", priority: "high", status: "done", notes: "" },
    { id: 5, title: "Finalize partnership pitch deck", goalId: 4, assignee: "Collin", due: "2025-07-07", priority: "medium", status: "in-progress", notes: "" },
    { id: 6, title: "Set up BETA turnstile integration", goalId: 1, assignee: "Collin", due: "2025-07-20", priority: "low", status: "todo", notes: "" },
  ],
  currentUser: "Pineapple guy",
  viewMode: "owner",
  team: ["Collin","Jordan","Mia","Sam"],
  openingDate: "2025-09-01",
  opsTasks: [
    { id: "d1", freq: "daily", title: "Opening walkthrough", desc: "Check all walls, mats, holds, and flooring for hazards", assignee: "", completions: {}, notes: "" },
    { id: "d2", freq: "daily", title: "Clean bathrooms", desc: "Wipe surfaces, restock supplies, mop floors", assignee: "", completions: {}, notes: "" },
    { id: "d3", freq: "daily", title: "Wipe down front desk", desc: "Clean desk, sanitize iPad/tablet, tidy retail display", assignee: "", completions: {}, notes: "" },
    { id: "d4", freq: "daily", title: "Check crash pads & mats", desc: "Ensure all pads are properly positioned and undamaged", assignee: "", completions: {}, notes: "" },
    { id: "d5", freq: "daily", title: "Restock chalk buckets", desc: "Refill any empty chalk buckets on the floor", assignee: "", completions: {}, notes: "" },
    { id: "d6", freq: "daily", title: "Empty trash bins", desc: "All bins throughout gym and bathrooms", assignee: "", completions: {}, notes: "" },
    { id: "d7", freq: "daily", title: "Closing walkthrough", desc: "Check all lights off, doors locked, equipment secure", assignee: "", completions: {}, notes: "" },
    { id: "d8", freq: "daily", title: "End of day member count", desc: "Log total visitors, members, and day passes in the app", assignee: "", completions: {}, notes: "" },
    { id: "w1", freq: "weekly", title: "Deep clean bathrooms", desc: "Full scrub including grout, fixtures, and baseboards", assignee: "", completions: {}, notes: "" },
    { id: "w2", freq: "weekly", title: "Clean climbing walls", desc: "Wipe down wall panels, check for loose holds", assignee: "", completions: {}, notes: "" },
    { id: "w3", freq: "weekly", title: "Retail inventory check", desc: "Count current stock, note what needs reordering", assignee: "", completions: {}, notes: "" },
    { id: "w4", freq: "weekly", title: "Staff follow-up review", desc: "Review any member follow-ups or leads needing contact", assignee: "", completions: {}, notes: "" },
    { id: "w5", freq: "weekly", title: "Check first aid kit", desc: "Restock any used items, check expiry dates", assignee: "", completions: {}, notes: "" },
    { id: "w6", freq: "weekly", title: "Social media post", desc: "Post at least 2 Instagram reels or feed posts this week", assignee: "", completions: {}, notes: "" },
    { id: "w7", freq: "weekly", title: "Mop gym floor", desc: "Full mop of all non-mat flooring areas", assignee: "", completions: {}, notes: "" },
    { id: "w8", freq: "weekly", title: "Check hold tightness", desc: "Spin test all holds on featured routes", assignee: "", completions: {}, notes: "" },
    { id: "m1", freq: "monthly", title: "Equipment inspection", desc: "Full check of all holds, mats, chalk brushes, and gear", assignee: "", completions: {}, notes: "" },
    { id: "m2", freq: "monthly", title: "Deep clean gym floor", desc: "Steam clean or scrub all mat and flooring surfaces", assignee: "", completions: {}, notes: "" },
    { id: "m3", freq: "monthly", title: "Review membership analytics", desc: "Check retention, cancellations, and conversion rates in Beta", assignee: "", completions: {}, notes: "" },
    { id: "m4", freq: "monthly", title: "Community outreach", desc: "Visit or connect with at least 3 local business partners", assignee: "", completions: {}, notes: "" },
    { id: "m5", freq: "monthly", title: "Staff 1-on-1s", desc: "Brief check-in with each team member on performance and wellbeing", assignee: "", completions: {}, notes: "" },
    { id: "m6", freq: "monthly", title: "Retail reorder", desc: "Place orders for any inventory running low", assignee: "", completions: {}, notes: "" },
    { id: "m7", freq: "monthly", title: "Route setting review", desc: "Assess current problem difficulty spread and plan resets", assignee: "", completions: {}, notes: "" },
    { id: "m8", freq: "monthly", title: "Review financial snapshot", desc: "Check revenue, expenses, and goal progress for the month", assignee: "", completions: {}, notes: "" },
  ],
  checklists: {
    preopen: [
      { id: "p1", category: "Legal & Business", item: "LLC or business entity filed", done: false, owner: "Collin", notes: "" },
      { id: "p2", category: "Legal & Business", item: "EIN obtained from IRS", done: false, owner: "Collin", notes: "" },
      { id: "p3", category: "Legal & Business", item: "Business bank account opened", done: false, owner: "Collin", notes: "" },
      { id: "p4", category: "Legal & Business", item: "General liability insurance in place", done: false, owner: "Collin", notes: "" },
      { id: "p5", category: "Legal & Business", item: "Waiver/liability forms created and reviewed by attorney", done: false, owner: "Collin", notes: "" },
      { id: "p6", category: "Legal & Business", item: "Business license obtained", done: false, owner: "Collin", notes: "" },
      { id: "p7", category: "Legal & Business", item: "Certificate of occupancy secured", done: false, owner: "Collin", notes: "" },
      { id: "p8", category: "Space & Build-Out", item: "Lease signed", done: false, owner: "Collin", notes: "" },
      { id: "p9", category: "Space & Build-Out", item: "Contractor hired and timeline confirmed", done: false, owner: "Collin", notes: "" },
      { id: "p10", category: "Space & Build-Out", item: "Wall setting complete", done: false, owner: "Collin", notes: "" },
      { id: "p11", category: "Space & Build-Out", item: "Flooring installed (mats, turf, etc.)", done: false, owner: "Collin", notes: "" },
      { id: "p12", category: "Space & Build-Out", item: "Bathrooms and changing areas finished", done: false, owner: "Collin", notes: "" },
      { id: "p13", category: "Space & Build-Out", item: "Signage installed (exterior + interior)", done: false, owner: "Collin", notes: "" },
      { id: "p14", category: "Space & Build-Out", item: "Retail display area set up", done: false, owner: "Collin", notes: "" },
      { id: "p15", category: "Space & Build-Out", item: "Lighting and ambiance dialed in", done: false, owner: "Collin", notes: "" },
      { id: "p16", category: "Technology & Systems", item: "Beta software account created and configured", done: false, owner: "Collin", notes: "" },
      { id: "p17", category: "Technology & Systems", item: "Online membership sign-up flow live and tested", done: false, owner: "Collin", notes: "" },
      { id: "p18", category: "Technology & Systems", item: "Turnstile or door access system installed", done: false, owner: "Collin", notes: "" },
      { id: "p19", category: "Technology & Systems", item: "POS system set up and tested", done: false, owner: "Collin", notes: "" },
      { id: "p20", category: "Technology & Systems", item: "Waiver system integrated with Beta", done: false, owner: "Collin", notes: "" },
      { id: "p21", category: "Technology & Systems", item: "Website live with pricing, hours, and sign-up", done: false, owner: "Jordan", notes: "" },
      { id: "p22", category: "Technology & Systems", item: "Google Business profile created and verified", done: false, owner: "Jordan", notes: "" },
      { id: "p23", category: "Technology & Systems", item: "Instagram and social accounts active", done: false, owner: "Jordan", notes: "" },
      { id: "p24", category: "Staffing", item: "Staff hired and onboarded", done: false, owner: "Collin", notes: "" },
      { id: "p25", category: "Staffing", item: "Staff trained on Beta software", done: false, owner: "Collin", notes: "" },
      { id: "p26", category: "Staffing", item: "Opening week schedule built", done: false, owner: "Collin", notes: "" },
      { id: "p27", category: "Staffing", item: "Staff trained on waiver and check-in flow", done: false, owner: "Collin", notes: "" },
      { id: "p28", category: "Staffing", item: "Emergency procedures and first aid reviewed", done: false, owner: "Collin", notes: "" },
      { id: "p29", category: "Memberships & Presales", item: "Founding membership pricing and perks finalized", done: false, owner: "Collin", notes: "" },
      { id: "p30", category: "Memberships & Presales", item: "Founding member sales target hit (75)", done: false, owner: "Collin", notes: "" },
      { id: "p31", category: "Memberships & Presales", item: "Email list built (500+ leads)", done: false, owner: "Jordan", notes: "" },
      { id: "p32", category: "Memberships & Presales", item: "Opening week promo and offer confirmed", done: false, owner: "Collin", notes: "" },
      { id: "p33", category: "Community & Marketing", item: "4 preview events hosted", done: false, owner: "Mia", notes: "" },
      { id: "p34", category: "Community & Marketing", item: "20 local business partnerships confirmed", done: false, owner: "Collin", notes: "" },
      { id: "p35", category: "Community & Marketing", item: "Press outreach done (local papers, bloggers)", done: false, owner: "Jordan", notes: "" },
      { id: "p36", category: "Community & Marketing", item: "Opening day event planned", done: false, owner: "Mia", notes: "" },
      { id: "p37", category: "Community & Marketing", item: "Email announcement campaign ready to send", done: false, owner: "Jordan", notes: "" },
      { id: "p38", category: "Retail & Inventory", item: "Opening retail inventory ordered and received", done: false, owner: "Sam", notes: "" },
      { id: "p39", category: "Retail & Inventory", item: "Products priced and tagged", done: false, owner: "Sam", notes: "" },
      { id: "p40", category: "Retail & Inventory", item: "Retail display fully stocked and photographed", done: false, owner: "Sam", notes: "" },
    ],
    opening: [
      { id: "o1", category: "Day Before", item: "Final walkthrough of entire facility", done: false, owner: "Collin", notes: "" },
      { id: "o2", category: "Day Before", item: "All staff confirmed for opening shift", done: false, owner: "Collin", notes: "" },
      { id: "o3", category: "Day Before", item: "Retail fully stocked and displays ready", done: false, owner: "Sam", notes: "" },
      { id: "o4", category: "Day Before", item: "Beta system tested end-to-end (checkin, payment, waiver)", done: false, owner: "Collin", notes: "" },
      { id: "o5", category: "Day Before", item: "Opening email sent to full list", done: false, owner: "Jordan", notes: "" },
      { id: "o6", category: "Day Before", item: "Social posts scheduled for opening day", done: false, owner: "Jordan", notes: "" },
      { id: "o7", category: "Day Before", item: "Cleaning and final setup complete", done: false, owner: "Mia", notes: "" },
      { id: "o8", category: "Day Before", item: "Snacks, drinks, or welcome gifts ready for opening day guests", done: false, owner: "Mia", notes: "" },
      { id: "o9", category: "Opening Morning", item: "Doors unlocked and gym fully ready by 30 min before open", done: false, owner: "Collin", notes: "" },
      { id: "o10", category: "Opening Morning", item: "Music playing, lighting set, energy good", done: false, owner: "Mia", notes: "" },
      { id: "o11", category: "Opening Morning", item: "All staff at their stations", done: false, owner: "Collin", notes: "" },
      { id: "o12", category: "Opening Morning", item: "Waiver tablets or devices charged and ready", done: false, owner: "Collin", notes: "" },
      { id: "o13", category: "Opening Morning", item: "Founding member packets or welcome gifts ready", done: false, owner: "Mia", notes: "" },
      { id: "o14", category: "Opening Morning", item: "Photo and video coverage arranged", done: false, owner: "Jordan", notes: "" },
      { id: "o15", category: "Opening Day Operations", item: "Every guest signed in through Beta", done: false, owner: "Collin", notes: "" },
      { id: "o16", category: "Opening Day Operations", item: "Every guest offered a tour", done: false, owner: "Mia", notes: "" },
      { id: "o17", category: "Opening Day Operations", item: "Every guest asked about membership", done: false, owner: "Collin", notes: "" },
      { id: "o18", category: "Opening Day Operations", item: "Retail sales tracked in POS", done: false, owner: "Sam", notes: "" },
      { id: "o19", category: "Opening Day Operations", item: "Staff collecting emails from non-members", done: false, owner: "Jordan", notes: "" },
      { id: "o20", category: "Opening Day Operations", item: "Referral asks made to every new member", done: false, owner: "Collin", notes: "" },
      { id: "o21", category: "End of Day", item: "Member count and day pass count recorded", done: false, owner: "Collin", notes: "" },
      { id: "o22", category: "End of Day", item: "Revenue totaled and logged", done: false, owner: "Collin", notes: "" },
      { id: "o23", category: "End of Day", item: "Social post recapping opening day published", done: false, owner: "Jordan", notes: "" },
      { id: "o24", category: "End of Day", item: "Team debrief done — wins, issues, tomorrow's focus", done: false, owner: "Collin", notes: "" },
      { id: "o25", category: "End of Day", item: "Thank you message sent to opening day members", done: false, owner: "Mia", notes: "" },
    ]
  },
};

const CATEGORIES = ["Memberships","Marketing","Community","Events","Retail","Operations","Staff","Retention","Partnerships"];
const DEFAULT_TEAM = ["Collin","Jordan","Mia","Sam"];

const sc = {
  "on-track":        { bg: "#EEFAF4", text: "#1E7A4A", bar: "#2ECC71", dot: "#2ECC71" },
  "needs-attention": { bg: "#FFF8EC", text: "#9A6200", bar: "#F5A623", dot: "#F5A623" },
  "off-track":       { bg: "#FFF0F0", text: "#C0392B", bar: "#E74C3C", dot: "#E74C3C" },
};
const pc = {
  high:   { bg: "#FFF0F0", text: "#C0392B" },
  medium: { bg: "#FFF8EC", text: "#9A6200" },
  low:    { bg: "#EEFAF4", text: "#1E7A4A" },
};

function pct(current, target) { return Math.min(100, Math.round((current / target) * 100)); }
function fmt(n) { return n >= 1000 ? "$" + (n / 1000).toFixed(1) + "K" : String(n); }

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [nav, setNav] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const { data: rows } = await supabase
          .from('app_data')
          .select('*')
          .eq('id', 1)
          .single();
        if (rows?.payload) {
          setData({ ...INITIAL_DATA, ...rows.payload });
        }
      } catch (e) {
        // table may not exist yet, use initial data
      }
      setLoading(false);
    }
    load();

    // Real-time subscription — picks up changes from any device
    const channel = supabase
      .channel('app_data_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new?.payload) {
            setData(current => {
              // Only update if the incoming data is different to avoid loops
              const incoming = JSON.stringify(payload.new.payload);
              const current_ = JSON.stringify(current);
              return incoming !== current_ ? { ...INITIAL_DATA, ...payload.new.payload } : current;
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Save to Supabase whenever data changes (debounced)
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('app_data').upsert({ id: 1, payload: data });
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data, loading]);

  const updateGoal = (id, f, v) => setData(d => ({ ...d, goals: d.goals.map(g => g.id === id ? { ...g, [f]: v } : g) }));
  const updateLog  = (gid, mid, v) => setData(d => ({ ...d, weeklyLogs: { ...d.weeklyLogs, [gid]: { ...d.weeklyLogs[gid], [mid]: v } } }));
  const updateCommitment = (mid, idx, f, v) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.map((c, i) => i === idx ? { ...c, [f]: v } : c) } : m) }));
  const updateTask = (id, f, v) => setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, [f]: v } : t) }));
  const wigGoal = data.goals.reduce((a, b) => pct(b.current, b.target) < pct(a.current, a.target) ? b : a, data.goals[0]);

  const TEAM = data.team || DEFAULT_TEAM;
  const isOwner = data.viewMode === "owner";

  const ownerNavItems = [
    { key: "dashboard", label: "Home" },
    { key: "goals", label: "Goals" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "leads", label: "Lead Measures" },
    { key: "work", label: "Work" },
    { key: "settings", label: "Settings" },
  ];

  const staffNavItems = [
    { key: "staff_home", label: "My Week" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "leads", label: "Lead Measures" },
    { key: "work", label: "Work" },
  ];

  const navItems = isOwner ? ownerNavItems : staffNavItems;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center" }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 60, marginBottom: 16 }} />
            <div className="inter" style={{ fontSize: 13, color: "#888" }}>Loading...</div>
          </div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        .lora { font-family: 'Lora', Georgia, serif; }
        .inter { font-family: 'Inter', system-ui, sans-serif; }
        .nav-link { background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; padding: 6px 14px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #666; transition: all 0.12s; }
        .nav-link:hover { color: #1a1a1a; }
        .nav-link.active { color: #005764; border-bottom-color: #005764; }
        .card { background: #fff; border: 1px solid #ebebeb; border-radius: 12px; padding: 24px; }
        .card-teal { background: #f4fbfb; border: 1px solid #c8e8e8; border-radius: 12px; padding: 24px; }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0.02em; }
        .btn { border: 1px solid #e0e0e0; background: #fff; border-radius: 8px; padding: 9px 18px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.12s; color: #333; }
        .btn:hover { background: #f5f5f5; }
        .btn-teal { background: #005764; color: #fff; border-color: #005764; }
        .btn-teal:hover { background: #004450; }
        .pbar { height: 6px; border-radius: 99px; background: #f0f0f0; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        input[type=number], input[type=text], input[type=date], select, textarea { border: 1px solid #e0e0e0; border-radius: 8px; padding: 9px 12px; font-family: 'Inter', sans-serif; font-size: 13px; background: #fff; color: #1a1a1a; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #005764; box-shadow: 0 0 0 3px rgba(0,87,100,0.08); }
        input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: #005764; flex-shrink: 0; }
        .lbl { font-size: 11px; color: #444; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }
        .metric { background: #f4f4f4; border-radius: 10px; padding: 18px 20px; }
        hr { border: none; border-top: 1px solid #ebebeb; margin: 18px 0; }
        @media(max-width:680px){ .g4{grid-template-columns:1fr 1fr!important} .g2{grid-template-columns:1fr!important} }
        @media(max-width:680px){ .desktop-nav{ display: none !important; } .mobile-menu-btn{ display: flex !important; } }
        @media(min-width:681px){ .mobile-menu-btn{ display: none !important; } .mobile-dropdown{ display: none !important; } }
      `}</style>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #ebebeb", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 34, width: "auto" }} />
            <span className="inter" style={{ fontSize: 10, color: "#005764", background: "#e6f4f5", padding: "2px 8px", borderRadius: 99, fontWeight: 700, letterSpacing: "0.06em" }}>
              {data.viewMode === "owner" ? "OWNER" : "STAFF"}
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {navItems.map(item => (
              <button key={item.key} className={`nav-link${nav === item.key ? " active" : ""}`} onClick={() => setNav(item.key)}>{item.label}</button>
            ))}
            <div style={{ width: 1, height: 18, background: "#e8e8e8", margin: "0 8px" }} />
            <button onClick={() => { setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" })); setNav(data.viewMode === "owner" ? "staff_home" : "dashboard"); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#333", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Switch view
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)}
            style={{ display: "none", background: "none", border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333" }}>
            <span style={{ fontSize: 16 }}>{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="mobile-dropdown" style={{ borderTop: "1px solid #ebebeb", background: "#fff" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setNav(item.key); setMenuOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: nav === item.key ? "#f0fafa" : "none", border: "none", borderBottom: "1px solid #f5f5f5", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 15, color: nav === item.key ? "#005764" : "#1a1a1a", fontWeight: nav === item.key ? 600 : 400 }}>
                {item.label}
              </button>
            ))}
            <button onClick={() => { setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" })); setNav(data.viewMode === "owner" ? "staff_home" : "dashboard"); setMenuOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 15, color: "#005764", fontWeight: 500 }}>
              Switch to {data.viewMode === "owner" ? "Staff" : "Owner"} view
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px" }}>
        {nav === "dashboard"  && <Dashboard data={data} setData={setData} wigGoal={wigGoal} setNav={setNav} updateGoal={updateGoal} TEAM={TEAM} isOwner={isOwner} />}
        {nav === "staff_home" && <StaffHome data={data} updateLog={updateLog} updateTask={updateTask} TEAM={TEAM} />}
        {nav === "goals"      && <Goals data={data} setData={setData} updateGoal={updateGoal} TEAM={TEAM} isOwner={isOwner} />}
        {nav === "scoreboard" && <Scoreboard data={data} />}
        {nav === "leads"      && <LeadMeasures data={data} updateLog={updateLog} setData={setData} isOwner={isOwner} />}
        {nav === "work"       && <WorkPage data={data} setData={setData} updateTask={updateTask} updateCommitment={updateCommitment} TEAM={TEAM} isOwner={isOwner} />}
        {nav === "settings"   && isOwner && <Settings data={data} setData={setData} />}
        {nav === "settings"   && !isOwner && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="lora" style={{ fontSize: 22, color: "#888", fontStyle: "italic" }}>Settings are owner-only.</div>
            <p className="inter" style={{ fontSize: 14, color: "#aaa", marginTop: 8 }}>Switch to Owner view to manage settings.</p>
          </div>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #ebebeb", padding: "28px", textAlign: "center", marginTop: 40 }}>
        <p className="inter" style={{ fontSize: 12, color: "#222" }}>Ripple Boulder · Fort Wayne, Indiana</p>
      </footer>
    </div>
  );
}

function Dashboard({ data, setData, wigGoal: autoWig, setNav, updateGoal, TEAM }) {
  const overallPct = Math.round(data.goals.reduce((s, g) => s + pct(g.current, g.target), 0) / data.goals.length);
  const onTrack   = data.goals.filter(g => g.status === "on-track").length;
  const atRisk    = data.goals.filter(g => g.status !== "on-track").length;
  const openTasks = data.tasks.filter(t => t.status !== "done").length;
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const wigId = data.wigId || autoWig.id;
  const wigGoal = data.goals.find(g => g.id === wigId) || autoWig;
  const setWigId = (id) => setData(d => ({ ...d, wigId: id }));

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 className="lora" style={{ fontSize: 34, fontWeight: 600, color: "#111", lineHeight: 1.2, marginBottom: 8 }}>
          Good morning, {data.currentUser}.
        </h1>
        <p className="inter" style={{ fontSize: 15, color: "#222", fontWeight: 400 }}>Here's where things stand this week.</p>
      </div>

      {/* WIG */}
      <div style={{ background: "#005764", borderRadius: 14, padding: "28px 32px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Wildly Important Goal</div>
          <select value={wigId} onChange={e => setWigId(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#fff", fontFamily: "Inter, sans-serif", cursor: "pointer", outline: "none", maxWidth: 220 }}>
            {data.goals.map(g => <option key={g.id} value={g.id} style={{ background: "#005764", color: "#fff" }}>{g.title}</option>)}
          </select>
        </div>
        <div className="lora" style={{ fontSize: 22, color: "#fff", fontStyle: "italic", marginBottom: 6 }}>{wigGoal.title}</div>
        <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 20, lineHeight: 1.65 }}>{wigGoal.why}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
            <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#5DCAA5", borderRadius: 99 }} />
          </div>
          <span className="inter" style={{ fontSize: 13, color: "#5DCAA5", fontWeight: 600, whiteSpace: "nowrap" }}>
            {fmt(wigGoal.current)} / {fmt(wigGoal.target)} · {pct(wigGoal.current, wigGoal.target)}%
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="g4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Overall Progress", value: overallPct + "%", note: "all goals" },
          { label: "On Track",         value: onTrack,          note: "going well" },
          { label: "Need Attention",   value: atRisk,           note: "require action" },
          { label: "Open Tasks",       value: openTasks,        note: "this week" },
        ].map(m => (
          <div key={m.label} className="metric">
            <div className="inter" style={{ fontSize: 10, color: "#222", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
            <div className="lora" style={{ fontSize: 30, color: "#1a1a1a", lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
            <div className="inter" style={{ fontSize: 12, color: "#222" }}>{m.note}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="lbl">All Goals</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.goals.map(g => {
              const p = pct(g.current, g.target);
              const s = sc[g.status];
              return (
                <div key={g.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{g.title}</span>
                    <span className="badge" style={{ background: s.bg, color: s.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                      {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="pbar" style={{ flex: 1 }}>
                      <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
                    </div>
                    <span className="inter" style={{ fontSize: 11, color: "#222", minWidth: 28, textAlign: "right" }}>{p}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lastMeeting && (
            <div className="card">
              <div className="lbl">Last Check-in · {lastMeeting.date}</div>
              {lastMeeting.wins && <p className="inter" style={{ fontSize: 13, color: "#222", fontStyle: "italic", marginBottom: 14, lineHeight: 1.65 }}>"{lastMeeting.wins}"</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lastMeeting.commitments.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.done ? "#2ECC71" : "#222", marginTop: 4, flexShrink: 0 }} />
                    <span className="inter" style={{ fontSize: 12, color: "#222", lineHeight: 1.5 }}><strong>{c.person}</strong> — {c.commitment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <div className="lbl">Open Tasks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {data.tasks.filter(t => t.status !== "done").slice(0, 5).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text, fontSize: 10 }}>{t.priority}</span>
                  <span className="inter" style={{ fontSize: 12, color: "#333", flex: 1 }}>{t.title}</span>
                  <span className="inter" style={{ fontSize: 11, color: "#222" }}>{t.assignee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {lastMeeting?.ownerNotes && (
        <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "18px 22px", borderLeft: "3px solid #005764" }}>
          <div className="lbl" style={{ color: "#005764" }}>Owner Note</div>
          <p className="inter" style={{ fontSize: 13, color: "#333", fontStyle: "italic", lineHeight: 1.7 }}>{lastMeeting.ownerNotes}</p>
        </div>
      )}
    </div>
  );
}

function Goals({ data, setData, updateGoal, TEAM, isOwner }) {
  const [adding, setAdding] = useState(false);
  const [ng, setNg] = useState({ title: "", category: "Memberships", startDate: "", endDate: "", target: "", current: 0, owner: "Collin", team: [], status: "on-track", why: "", notes: "" });

  const moveGoal = (idx, dir) => {
    const goals = [...data.goals];
    const swap = idx + dir;
    if (swap < 0 || swap >= goals.length) return;
    [goals[idx], goals[swap]] = [goals[swap], goals[idx]];
    setData(d => ({ ...d, goals }));
  };

  const save = () => {
    if (!ng.title || !ng.target) return;
    const id = Math.max(...data.goals.map(g => g.id)) + 1;
    setData(d => ({ ...d, goals: [...d.goals, { ...ng, id, target: Number(ng.target) }] }));
    setAdding(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Goals</h1>
          <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>What we're working toward and why it matters.</p>
        </div>
        <button className="btn btn-teal" onClick={() => setAdding(true)} style={{ display: isOwner ? "inline-block" : "none" }}>+ New Goal</button>
      </div>
      {adding && (
        <div className="card-teal" style={{ marginBottom: 20 }}>
          <div className="lbl">New Goal</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Goal title" value={ng.title} onChange={e => setNg(g => ({ ...g, title: e.target.value }))} />
            <select value={ng.category} onChange={e => setNg(g => ({ ...g, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" placeholder="Target number" value={ng.target} onChange={e => setNg(g => ({ ...g, target: e.target.value }))} />
            <select value={ng.owner} onChange={e => setNg(g => ({ ...g, owner: e.target.value }))}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
            <input type="date" value={ng.startDate} onChange={e => setNg(g => ({ ...g, startDate: e.target.value }))} />
            <input type="date" value={ng.endDate} onChange={e => setNg(g => ({ ...g, endDate: e.target.value }))} />
          </div>
          <textarea placeholder="Why does this goal matter?" rows={2} value={ng.why} onChange={e => setNg(g => ({ ...g, why: e.target.value }))} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={save}>Save Goal</button>
            <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.goals.map((g, idx) => (
          <div key={g.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {isOwner && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 14, flexShrink: 0 }}>
                <button onClick={() => moveGoal(idx, -1)} disabled={idx === 0}
                  style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 6, width: 28, height: 28, cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#ddd" : "#555", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                <button onClick={() => moveGoal(idx, 1)} disabled={idx === data.goals.length - 1}
                  style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 6, width: 28, height: 28, cursor: idx === data.goals.length - 1 ? "default" : "pointer", color: idx === data.goals.length - 1 ? "#ddd" : "#555", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <GoalCard goal={g} updateGoal={updateGoal} TEAM={TEAM} isOwner={isOwner} onDelete={id => setData(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalCard({ goal: g, updateGoal, onDelete, TEAM, isOwner }) {
  const [open, setOpen] = useState(false);
  const p = pct(g.current, g.target);
  const s = sc[g.status];
  return (
    <div className="card" style={{ cursor: isOwner ? "pointer" : "default" }} onClick={() => isOwner && setOpen(o => !o)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            {isOwner ? (
              <input type="text" value={g.title} onChange={e => updateGoal(g.id, "title", e.target.value)} onClick={e => e.stopPropagation()}
                style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a", background: "transparent", fontFamily: "Inter, sans-serif", flex: 1, minWidth: 120 }} />
            ) : (
              <span className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{g.title}</span>
            )}
            <span style={{ fontSize: 11, color: "#333", fontFamily: "Inter, sans-serif" }}>{g.category}</span>
          </div>
          <span className="inter" style={{ fontSize: 12, color: "#222" }}>
            Owners: {Array.isArray(g.owners) && g.owners.length > 0 ? g.owners.join(", ") : g.owner}
            {g.endDate ? ` · Due ${g.endDate}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span className="badge" style={{ background: s.bg, color: s.text }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
            {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
          </span>
          {isOwner && (
            <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this goal?")) onDelete(g.id); }}
              style={{ background: "none", border: "1px solid #eee", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12, color: "#C0392B" }}>
              Delete
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="pbar" style={{ flex: 1 }}>
          <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
        </div>
        <span className="inter" style={{ fontSize: 13, color: "#222", fontWeight: 500, minWidth: 90, textAlign: "right" }}>{fmt(g.current)} / {fmt(g.target)}</span>
      </div>
      {isOwner && open && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #f0f0f0" }}>
          <div style={{ marginBottom: 10 }}>
            <div className="lbl">Why this goal matters</div>
            <textarea rows={2} value={g.why} onChange={e => updateGoal(g.id, "why", e.target.value)}
              placeholder="Why does this goal matter?" style={{ fontStyle: "italic" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div className="lbl">Target</div>
              <input type="number" value={g.target} onChange={e => updateGoal(g.id, "target", Number(e.target.value))} onClick={e => e.stopPropagation()} />
            </div>
            <div>
              <div className="lbl">Current</div>
              <input type="number" value={g.current} onChange={e => updateGoal(g.id, "current", Number(e.target.value))} onClick={e => e.stopPropagation()} />
            </div>
            <div>
              <div className="lbl">Status</div>
              <select value={g.status} onChange={e => updateGoal(g.id, "status", e.target.value)} onClick={e => e.stopPropagation()}>
                <option value="on-track">On track</option>
                <option value="needs-attention">Needs attention</option>
                <option value="off-track">Off track</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div className="lbl">Owners</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TEAM.map(t => {
                  const owners = Array.isArray(g.owners) ? g.owners : [g.owner];
                  const checked = owners.includes(t);
                  return (
                    <label key={t} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", color: "#333", background: checked ? "#e6f4f5" : "#f5f5f5", padding: "5px 12px", borderRadius: 99, border: `1px solid ${checked ? "#005764" : "#e0e0e0"}` }}>
                      <input type="checkbox" checked={checked} style={{ width: 13, height: 13 }}
                        onChange={e => {
                          const cur = Array.isArray(g.owners) ? g.owners : [g.owner];
                          const next = e.target.checked ? [...cur, t] : cur.filter(x => x !== t);
                          updateGoal(g.id, "owners", next.length ? next : cur);
                        }} />
                      {t}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="lbl">Category</div>
              <select value={g.category} onChange={e => updateGoal(g.id, "category", e.target.value)} onClick={e => e.stopPropagation()}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="lbl">Start date</div>
              <input type="date" value={g.startDate} onChange={e => updateGoal(g.id, "startDate", e.target.value)} onClick={e => e.stopPropagation()} />
            </div>
            <div>
              <div className="lbl">End date</div>
              <input type="date" value={g.endDate} onChange={e => updateGoal(g.id, "endDate", e.target.value)} onClick={e => e.stopPropagation()} />
            </div>
          </div>
          <textarea placeholder="Notes..." rows={2} value={g.notes} onChange={e => updateGoal(g.id, "notes", e.target.value)} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Scoreboard({ data }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Scoreboard</h1>
        <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4 }}>Are we winning? The honest picture.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 28 }}>
        {data.goals.map(g => {
          const p = pct(g.current, g.target);
          const s = sc[g.status];
          return (
            <div key={g.id} className="card" style={{ borderTop: `3px solid ${s.bar}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", flex: 1, paddingRight: 8, lineHeight: 1.45 }}>{g.title}</span>
                <span className="badge" style={{ background: s.bg, color: s.text, flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                  {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Heads up" : "Off track"}
                </span>
              </div>
              <div className="lora" style={{ fontSize: 28, color: "#1a1a1a", marginBottom: 10 }}>
                {fmt(g.current)}<span className="inter" style={{ fontSize: 14, color: "#222", fontWeight: 400 }}> / {fmt(g.target)}</span>
              </div>
              <div className="pbar" style={{ marginBottom: 10 }}>
                <div className="pfill" style={{ width: `${p}%`, background: s.bar }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="inter" style={{ fontSize: 11, color: "#222" }}>{g.category}</span>
                <span className="inter" style={{ fontSize: 11, color: "#222" }}>{p}% · {Array.isArray(g.owners) && g.owners.length ? g.owners.join(", ") : g.owner}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="lbl">By Category</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {[...new Set(data.goals.map(g => g.category))].map(cat => {
            const cg = data.goals.filter(g => g.category === cat);
            const avg = Math.round(cg.reduce((s, g) => s + pct(g.current, g.target), 0) / cg.length);
            const worst = cg.find(g => g.status === "off-track") ? "off-track" : cg.find(g => g.status === "needs-attention") ? "needs-attention" : "on-track";
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="inter" style={{ fontSize: 13, color: "#333", minWidth: 130, fontWeight: 500 }}>{cat}</span>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pfill" style={{ width: `${avg}%`, background: sc[worst].bar }} />
                </div>
                <span className="inter" style={{ fontSize: 12, color: "#222", minWidth: 34, textAlign: "right" }}>{avg}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeadMeasures({ data, updateLog, setData, isOwner }) {
  const addMeasure = (goalId) => {
    const id = Math.max(...data.leadMeasures.map(m => m.id), 0) + 1;
    setData(d => ({ ...d, leadMeasures: [...d.leadMeasures, { id, goalId, title: "New measure", type: "number", target: 1, unit: "per week" }] }));
  };
  const updateMeasure = (id, field, value) => setData(d => ({ ...d, leadMeasures: d.leadMeasures.map(m => m.id === id ? { ...m, [field]: value } : m) }));
  const deleteMeasure = (id) => setData(d => ({ ...d, leadMeasures: d.leadMeasures.filter(m => m.id !== id) }));

  const allMeasures = data.leadMeasures.map(m => {
    const val = data.weeklyLogs[m.goalId]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
    const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
    const progress = m.type === "checkbox" ? (done ? 100 : 0) : Math.min(100, Math.round((Number(val) / m.target) * 100));
    return { ...m, val, done, progress };
  });
  const doneCount = allMeasures.filter(m => m.done).length;
  const total = allMeasures.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Lead Measures</h1>
          <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Weekly actions that move the needle. Update as you go.</p>
        </div>
        {total > 0 && (
          <div style={{ textAlign: "right" }}>
            <div className="lora" style={{ fontSize: 26, color: doneCount === total ? "#1E7A4A" : "#111" }}>{doneCount}<span style={{ fontSize: 16, color: "#aaa" }}>/{total}</span></div>
            <div className="inter" style={{ fontSize: 11, color: "#aaa" }}>completed this week</div>
          </div>
        )}
      </div>
      {total > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 6, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${Math.round((doneCount/total)*100)}%`, height: "100%", background: "#005764", borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
          <div className="inter" style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>{Math.round((doneCount/total)*100)}% of this week's measures complete</div>
        </div>
      )}
      {data.goals.map(g => {
        const measures = allMeasures.filter(m => m.goalId === g.id);
        if (!measures.length && !isOwner) return null;
        return (
          <div key={g.id} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#005764", textTransform: "uppercase", letterSpacing: "0.07em" }}>{g.title}</div>
              {isOwner && <button onClick={() => addMeasure(g.id)} style={{ background: "none", border: "1px solid #c8e8e8", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, color: "#005764", fontFamily: "Inter, sans-serif" }}>+ Add</button>}
            </div>
            {measures.length === 0 && isOwner && (
              <div style={{ padding: "12px 16px", background: "#f9f9f9", borderRadius: 8, border: "1px dashed #e0e0e0" }}>
                <span className="inter" style={{ fontSize: 13, color: "#bbb" }}>No measures yet — click + Add</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {measures.map(m => (
                <div key={m.id} style={{ background: m.done ? "#eefaf4" : "#fff", border: `1px solid ${m.done ? "#b8e8cc" : "#ebebeb"}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: m.type === "number" ? 10 : 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.done ? "#2ECC71" : "#e0e0e0", flexShrink: 0 }} />
                    {isOwner ? (
                      <input type="text" value={m.title} onChange={e => updateMeasure(m.id, "title", e.target.value)}
                        style={{ flex: 1, border: "none", padding: 0, fontSize: 14, fontWeight: 500, background: "transparent", fontFamily: "Inter, sans-serif", color: "#1a1a1a" }} />
                    ) : (
                      <span className="inter" style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{m.title}</span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {m.type === "checkbox" ? (
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <input type="checkbox" checked={!!m.val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} style={{ width: 18, height: 18 }} />
                          <span className="inter" style={{ fontSize: 12, color: m.done ? "#1E7A4A" : "#888" }}>{m.done ? "Done!" : "Mark done"}</span>
                        </label>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="number" value={m.val} min={0} onChange={e => updateLog(m.goalId, m.id, Number(e.target.value))}
                            style={{ width: 64, fontSize: 16, fontWeight: 700, textAlign: "center", border: "1px solid #e0e0e0", borderRadius: 8, padding: "4px 8px", color: m.done ? "#1E7A4A" : "#1a1a1a" }} />
                          <span className="inter" style={{ fontSize: 12, color: "#aaa" }}>/ {m.target}</span>
                        </div>
                      )}
                      {isOwner && <button onClick={() => deleteMeasure(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16, padding: "0 2px" }}>x</button>}
                    </div>
                  </div>
                  {m.type === "number" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 4, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${m.progress}%`, height: "100%", background: m.done ? "#2ECC71" : "#005764", borderRadius: 99 }} />
                      </div>
                      <span className="inter" style={{ fontSize: 11, color: "#aaa", minWidth: 28 }}>{m.progress}%</span>
                      {isOwner && (
                        <input type="text" value={m.unit} onChange={e => updateMeasure(m.id, "unit", e.target.value)}
                          style={{ border: "none", padding: 0, fontSize: 11, color: "#aaa", background: "transparent", width: 100, fontFamily: "Inter, sans-serif" }} placeholder="unit" />
                      )}
                    </div>
                  )}
                  {isOwner && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <select value={m.type} onChange={e => updateMeasure(m.id, "type", e.target.value)} style={{ fontSize: 11, width: "auto", color: "#888" }}>
                        <option value="number">Number</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      {m.type === "number" && <input type="number" value={m.target} onChange={e => updateMeasure(m.id, "target", Number(e.target.value))} style={{ width: 60, fontSize: 11 }} placeholder="Target" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Meetings({ data, updateCommitment, setData, TEAM, isOwner }) {
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], wins: "", moved: "", didnt: "", ownerNotes: "", commitments: [] });

  const save = () => {
    if (!form.date) return;
    const id = Math.max(...data.meetings.map(m => m.id), 0) + 1;
    setData(d => ({ ...d, meetings: [...d.meetings, { ...form, id }] }));
    setAdding(false); setStep(0);
    setForm({ date: new Date().toISOString().split("T")[0], wins: "", moved: "", didnt: "", ownerNotes: "", commitments: [] });
  };

  const updateMeeting = (id, field, value) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === id ? { ...m, [field]: value } : m) }));
  const deleteMeeting = (id) => { if (window.confirm("Delete?")) setData(d => ({ ...d, meetings: d.meetings.filter(m => m.id !== id) })); };
  const updateCF = (mid, idx, f, v) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.map((c, i) => i === idx ? { ...c, [f]: v } : c) } : m) }));
  const addC = (mid) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: [...(m.commitments||[]), { person: TEAM[0]||"Collin", commitment: "", due: "", done: false }] } : m) }));
  const removeC = (mid, idx) => setData(d => ({ ...d, meetings: d.meetings.map(m => m.id === mid ? { ...m, commitments: m.commitments.filter((_, i) => i !== idx) } : m) }));

  const steps = [
    { label: "Wins", prompt: "What went well last week?", field: "wins", placeholder: "Sold 8 memberships, great event..." },
    { label: "What moved the goal?", prompt: "What actions drove real results?", field: "moved", placeholder: "Direct outreach, warm lead follow-ups..." },
    { label: "What fell short?", prompt: "Be honest — what didn't happen?", field: "didnt", placeholder: "Instagram posts, business visits..." },
    { label: "Commitments", prompt: "What is each person committing to?", field: "commitments" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Check-ins</h1>
          <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Weekly rhythm. Fast and honest.</p>
        </div>
        {isOwner && !adding && <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New Check-in</button>}
      </div>

      {adding && (
        <div style={{ background: "#005764", borderRadius: 14, padding: "28px 32px", marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? "#5DCAA5" : "rgba(255,255,255,0.2)", cursor: "pointer" }} onClick={() => setStep(i)} />
            ))}
          </div>
          <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Step {step + 1} of {steps.length}</div>
          <div className="lora" style={{ fontSize: 20, color: "#fff", fontStyle: "italic", marginBottom: 12 }}>{steps[step].prompt}</div>

          {steps[step].field !== "commitments" ? (
            <textarea rows={3} value={form[steps[step].field]} placeholder={steps[step].placeholder}
              onChange={e => setForm(f => ({ ...f, [steps[step].field]: e.target.value }))}
              style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "Inter, sans-serif", resize: "none", outline: "none" }} />
          ) : (
            <div>
              {form.commitments.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
                  <select value={c.person} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, person: e.target.value } : x) }))}
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#fff", fontFamily: "Inter, sans-serif" }}>
                    {TEAM.map(t => <option key={t} style={{ background: "#005764" }}>{t}</option>)}
                  </select>
                  <input value={c.commitment} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, commitment: e.target.value } : x) }))}
                    placeholder="I commit to..." style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#fff", fontFamily: "Inter, sans-serif" }} />
                  <button onClick={() => setForm(f => ({ ...f, commitments: f.commitments.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer" }}>x</button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, commitments: [...f.commitments, { person: TEAM[0]||"Collin", commitment: "", due: "", done: false }] }))}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif", width: "100%", marginTop: 4 }}>
                + Add person
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
            {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, color: "#fff", fontFamily: "Inter, sans-serif" }}>Back</button>}
            {step < steps.length - 1
              ? <button onClick={() => setStep(s => s + 1)} style={{ background: "#5DCAA5", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#004450", fontFamily: "Inter, sans-serif" }}>Next</button>
              : <button onClick={save} style={{ background: "#5DCAA5", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#004450", fontFamily: "Inter, sans-serif" }}>Save Check-in</button>
            }
            <button onClick={() => { setAdding(false); setStep(0); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...data.meetings].reverse().map(m => {
          const doneCount = (m.commitments||[]).filter(c => c.done).length;
          const totalC = (m.commitments||[]).length;
          return (
            <div key={m.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  {isOwner ? (
                    <input type="date" value={m.date} onChange={e => updateMeeting(m.id, "date", e.target.value)}
                      style={{ border: "none", padding: 0, fontSize: 15, fontFamily: "Lora, Georgia, serif", fontStyle: "italic", fontWeight: 600, background: "transparent", color: "#111" }} />
                  ) : (
                    <div className="lora" style={{ fontSize: 15, fontStyle: "italic", fontWeight: 600, color: "#111" }}>{m.date}</div>
                  )}
                  {totalC > 0 && <div className="inter" style={{ fontSize: 12, color: doneCount === totalC ? "#1E7A4A" : "#888", marginTop: 2 }}>{doneCount}/{totalC} commitments done</div>}
                </div>
                {isOwner && <button onClick={() => deleteMeeting(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ddd", fontFamily: "Inter, sans-serif" }}>Delete</button>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Wins", field: "wins", color: "#eefaf4", border: "#c5e8d8", text: "#1E7A4A" },
                  { label: "What worked", field: "moved", color: "#f0fafa", border: "#c8e8e8", text: "#005764" },
                  { label: "Fell short", field: "didnt", color: "#fff8f0", border: "#f0d8c0", text: "#8B4A00" },
                ].map(col => (
                  <div key={col.field} style={{ background: col.color, border: `1px solid ${col.border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: col.text, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{col.label}</div>
                    {isOwner ? (
                      <textarea rows={2} value={m[col.field] || ""} onChange={e => updateMeeting(m.id, col.field, e.target.value)} placeholder="Add notes..."
                        style={{ width: "100%", background: "transparent", border: "none", fontSize: 12, color: "#333", fontFamily: "Inter, sans-serif", resize: "none", outline: "none", lineHeight: 1.5 }} />
                    ) : (
                      <p className="inter" style={{ fontSize: 12, color: "#444", lineHeight: 1.55, margin: 0 }}>{m[col.field] || "—"}</p>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="inter" style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em" }}>Commitments</span>
                  {isOwner && <button onClick={() => addC(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#005764", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+ Add</button>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(m.commitments||[]).map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: c.done ? "#eefaf4" : "#fafafa", borderRadius: 8, border: `1px solid ${c.done ? "#c5e8d8" : "#f0f0f0"}` }}>
                      <input type="checkbox" checked={c.done} onChange={e => updateCF(m.id, i, "done", e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                      {isOwner ? (
                        <>
                          <select value={c.person} onChange={e => updateCF(m.id, i, "person", e.target.value)} style={{ fontSize: 12, width: "auto", fontWeight: 600, border: "none", background: "transparent", color: "#333", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
                          <input value={c.commitment} onChange={e => updateCF(m.id, i, "commitment", e.target.value)}
                            style={{ flex: 1, border: "none", padding: 0, fontSize: 13, background: "transparent", textDecoration: c.done ? "line-through" : "none", color: c.done ? "#aaa" : "#333", fontFamily: "Inter, sans-serif" }} />
                          <input type="date" value={c.due||""} onChange={e => updateCF(m.id, i, "due", e.target.value)} style={{ fontSize: 11, width: 120, color: "#888" }} />
                          <button onClick={() => removeC(m.id, i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16 }}>x</button>
                        </>
                      ) : (
                        <>
                          <span className="inter" style={{ fontWeight: 600, fontSize: 13, color: "#333", minWidth: 60 }}>{c.person}</span>
                          <span className="inter" style={{ flex: 1, fontSize: 13, color: c.done ? "#aaa" : "#444", textDecoration: c.done ? "line-through" : "none" }}>{c.commitment}</span>
                          {c.due && <span className="inter" style={{ fontSize: 11, color: "#bbb" }}>{c.due}</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#005764", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Owner Note</div>
                <textarea value={m.ownerNotes||""} onChange={e => updateMeeting(m.id, "ownerNotes", e.target.value)} placeholder="Add a note for the team..."
                  rows={isOwner ? 2 : 1} readOnly={!isOwner}
                  style={{ width: "100%", background: "transparent", border: "none", fontSize: 13, fontStyle: "italic", color: m.ownerNotes ? "#444" : "#bbb", fontFamily: "Lora, Georgia, serif", resize: "none", outline: "none", lineHeight: 1.6 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tasks({ data, updateTask, setData, TEAM, isOwner }) {
  const [filter, setFilter] = useState("all");
  const today = new Date().toISOString().split("T")[0];
  const oneWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const addTask = () => {
    const id = Math.max(...data.tasks.map(t => t.id), 0) + 1;
    setData(d => ({ ...d, tasks: [...d.tasks, { id, title: "New task", goalId: data.goals[0]?.id || 1, assignee: TEAM[0] || "Collin", due: "", priority: "medium", status: "todo", notes: "" }] }));
  };
  const deleteTask = (id) => setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));

  const allTasks = data.tasks.filter(t => filter === "all" || t.assignee === filter);
  const open = allTasks.filter(t => t.status !== "done");
  const done = allTasks.filter(t => t.status === "done");
  const todayTasks = open.filter(t => t.due && t.due <= today);
  const weekTasks  = open.filter(t => t.due && t.due > today && t.due <= oneWeek);
  const laterTasks = open.filter(t => !t.due || t.due > oneWeek);

  const TaskRow = ({ t }) => {
    const goal = data.goals.find(g => g.id === t.goalId);
    const isOverdue = t.due && t.due < today && t.status !== "done";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: `1px solid ${isOverdue ? "#fdd" : "#ebebeb"}`, borderRadius: 10, opacity: t.status === "done" ? 0.45 : 1 }}>
        <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} style={{ width: 18, height: 18, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {isOwner ? (
            <input type="text" value={t.title} onChange={e => updateTask(t.id, "title", e.target.value)}
              style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", color: "#1a1a1a", textDecoration: t.status === "done" ? "line-through" : "none" }} />
          ) : (
            <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
            <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text, fontSize: 10 }}>{t.priority}</span>
            {goal && <span className="inter" style={{ fontSize: 11, color: "#aaa" }}>{goal.title}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isOwner ? (
            <>
              <select value={t.assignee} onChange={e => updateTask(t.id, "assignee", e.target.value)} style={{ fontSize: 12, width: "auto" }}>{TEAM.map(p => <option key={p}>{p}</option>)}</select>
              <input type="date" value={t.due||""} onChange={e => updateTask(t.id, "due", e.target.value)} style={{ width: 120, fontSize: 12 }} />
              <select value={t.priority} onChange={e => updateTask(t.id, "priority", e.target.value)} style={{ fontSize: 11, width: "auto" }}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16 }}>x</button>
            </>
          ) : (
            <>
              <span className="inter" style={{ fontSize: 12, color: "#888" }}>{t.assignee}</span>
              {t.due && <span className="inter" style={{ fontSize: 11, color: isOverdue ? "#C0392B" : "#bbb" }}>{t.due}</span>}
            </>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ label, tasks, accent }) => tasks.length === 0 ? null : (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <span className="inter" style={{ fontSize: 12, color: "#bbb" }}>{tasks.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{tasks.map(t => <TaskRow key={t.id} t={t} />)}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Tasks</h1>
          <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{open.length} open · {done.length} done</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="all">All team</option>
            {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {isOwner && <button className="btn btn-teal" onClick={addTask}>+ Task</button>}
        </div>
      </div>
      {open.length === 0 && <div style={{ textAlign: "center", padding: "40px 0" }}><div className="lora" style={{ fontSize: 20, color: "#bbb", fontStyle: "italic" }}>All clear!</div></div>}
      <Section label="Overdue / Due Today" tasks={todayTasks} accent="#E74C3C" />
      <Section label="This Week" tasks={weekTasks} accent="#F5A623" />
      <Section label="Later" tasks={laterTasks} accent="#aaa" />
      {done.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="inter" style={{ fontSize: 12, color: "#bbb", cursor: "pointer", userSelect: "none", padding: "8px 0" }}>Show {done.length} completed</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>{done.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </details>
      )}
    </div>
  );
}

function WorkPage({ data, setData, updateTask, updateCommitment, TEAM, isOwner }) {
  const [tab, setTab] = useState("tasks");

  const tabs = [
    { key: "tasks",    label: "Tasks",      emoji: "✅" },
    { key: "checkins", label: "Check-ins",  emoji: "💬" },
    { key: "ops",      label: "Ops Tasks",  emoji: "🔁" },
    { key: "checklist",label: "Checklist",  emoji: "📋" },
  ];

  // Quick stats for each tab
  const today = new Date().toISOString().split("T")[0];
  const openTasks = data.tasks.filter(t => t.status !== "done").length;
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const commitsDone = (lastMeeting?.commitments || []).filter(c => c.done).length;
  const commitsTotal = (lastMeeting?.commitments || []).length;
  const weekKey = (() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)).toISOString().split("T")[0]; })();
  const dailyOps = (data.opsTasks || []).filter(t => t.freq === "daily");
  const dailyDone = dailyOps.filter(t => t.completions?.[today]).length;
  const prePct = data.checklists?.preopen ? Math.round((data.checklists.preopen.filter(i => i.done).length / data.checklists.preopen.length) * 100) : 0;

  const stats = {
    tasks:     { label: `${openTasks} open`, color: openTasks > 0 ? "#F5A623" : "#2ECC71" },
    checkins:  { label: commitsTotal ? `${commitsDone}/${commitsTotal} done` : "No check-in yet", color: "#005764" },
    ops:       { label: `${dailyDone}/${dailyOps.length} today`, color: dailyDone === dailyOps.length ? "#2ECC71" : "#F5A623" },
    checklist: { label: `${prePct}% complete`, color: prePct === 100 ? "#2ECC71" : "#005764" },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Work</h1>
        <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Tasks, check-ins, ops, and opening checklist — all in one place.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 2 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${tab === t.key ? "#005764" : "#ebebeb"}`, background: tab === t.key ? "#005764" : "#fff", cursor: "pointer", flexShrink: 0, minWidth: 120, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{t.emoji}</span>
              <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: tab === t.key ? "#fff" : "#333" }}>{t.label}</span>
            </div>
            <span className="inter" style={{ fontSize: 11, color: tab === t.key ? "rgba(255,255,255,0.7)" : stats[t.key].color, fontWeight: 500 }}>{stats[t.key].label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "tasks"     && <Tasks data={data} updateTask={updateTask} setData={setData} TEAM={TEAM} isOwner={isOwner} />}
      {tab === "checkins"  && <Meetings data={data} updateCommitment={updateCommitment} setData={setData} TEAM={TEAM} isOwner={isOwner} />}
      {tab === "ops"       && <OpsTasksPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
      {tab === "checklist" && <Checklist data={data} setData={setData} />}
    </div>
  );
}

function Settings({ data, setData }) {
  const team = data.team || ["Collin","Jordan","Mia","Sam"];

  const updateName = (idx, val) => {
    const next = [...team];
    next[idx] = val;
    setData(d => ({ ...d, team: next }));
  };

  const addPerson = () => setData(d => ({ ...d, team: [...(d.team || team), "New person"] }));
  const removePerson = (idx) => {
    const next = team.filter((_, i) => i !== idx);
    setData(d => ({ ...d, team: next }));
  };
  const updateUser = (val) => setData(d => ({ ...d, currentUser: val }));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>Settings</h1>
        <p className="inter" style={{ fontSize: 14, color: "#333", marginTop: 4, fontWeight: 500 }}>Manage your team and preferences.</p>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
        <div className="lbl">Your name</div>
        <input type="text" value={data.currentUser} onChange={e => updateUser(e.target.value)}
          style={{ marginBottom: 4 }} />
        <div className="inter" style={{ fontSize: 11, color: "#888", marginTop: 4 }}>This is the name shown in the greeting and staff view.</div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="lbl" style={{ marginBottom: 0 }}>Team members</div>
          <button className="btn btn-teal" onClick={addPerson} style={{ padding: "6px 14px", fontSize: 12 }}>+ Add person</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {team.map((name, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e6f4f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#005764", flexShrink: 0 }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <input type="text" value={name} onChange={e => updateName(idx, e.target.value)}
                style={{ flex: 1, fontWeight: 500 }} />
              <button onClick={() => removePerson(idx)}
                style={{ background: "none", border: "1px solid #eee", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#C0392B" }}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="inter" style={{ fontSize: 11, color: "#888", marginTop: 12 }}>These names appear in goal ownership, tasks, and check-ins.</div>
      </div>
    </div>
  );
}

function StaffHome({ data, updateLog, updateTask, TEAM }) {
  const myTasks = data.tasks.filter(t => t.status !== "done");
  const lastMeeting = data.meetings[data.meetings.length - 1];
  const myCommitments = lastMeeting?.commitments || [];
  const wigId = data.wigId || data.goals[0]?.id;
  const wigGoal = data.goals.find(g => g.id === wigId) || data.goals[0];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>My Week</h1>
        <p className="inter" style={{ fontSize: 14, color: "#555", marginTop: 4 }}>Here's what needs your attention this week.</p>
      </div>

      {/* Score */}
      {wigGoal && (
        <div style={{ background: "#005764", borderRadius: 14, padding: "20px 24px", marginBottom: 20, color: "#fff" }}>
          <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 8 }}>The Score Right Now</div>
          <div className="lora" style={{ fontSize: 18, fontStyle: "italic", marginBottom: 12 }}>{wigGoal.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
              <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#5DCAA5", borderRadius: 99 }} />
            </div>
            <span className="inter" style={{ fontSize: 14, color: "#5DCAA5", fontWeight: 700 }}>
              {fmt(wigGoal.current)} / {fmt(wigGoal.target)} · {pct(wigGoal.current, wigGoal.target)}%
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Tasks */}
        <div className="card">
          <div className="lbl">My Tasks</div>
          {myTasks.length === 0 ? (
            <p className="inter" style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>All caught up!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myTasks.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} style={{ marginTop: 2 }} />
                  <div>
                    <div className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{t.title}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
                      <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text, fontSize: 10 }}>{t.priority}</span>
                      {t.due && <span className="inter" style={{ fontSize: 11, color: "#888" }}>Due {t.due}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commitments */}
        <div className="card">
          <div className="lbl">This Week's Commitments</div>
          {myCommitments.length === 0 ? (
            <p className="inter" style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>No commitments yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myCommitments.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: c.done ? "#eefaf4" : "#fafafa", borderRadius: 8, border: `1px solid ${c.done ? "#c5e8d8" : "#f0f0f0"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.done ? "#2ECC71" : "#ddd", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <span className="inter" style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>{c.person}</span>
                    <p className="inter" style={{ fontSize: 12, color: "#555", marginTop: 2, lineHeight: 1.5 }}>{c.commitment}</p>
                    {c.due && <p className="inter" style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Due {c.due}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Measures quick update */}
      <div className="card">
        <div className="lbl">This Week's Lead Measures</div>
        <p className="inter" style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Update your numbers for the week below.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.leadMeasures.map(m => {
            const g = data.goals.find(g => g.id === m.goalId);
            const val = data.weeklyLogs[m.goalId]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
            const done = m.type === "checkbox" ? val : val >= m.target;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: done ? "#eefaf4" : "#fafafa", borderRadius: 8, border: `1px solid ${done ? "#c5e8d8" : "#ebebeb"}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: done ? "#2ECC71" : "#ddd", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{m.title}</div>
                  {g && <div className="inter" style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{g.title}</div>}
                </div>
                {m.type === "checkbox" ? (
                  <input type="checkbox" checked={!!val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="number" value={val} min={0} style={{ width: 64, fontSize: 13 }} onChange={e => updateLog(m.goalId, m.id, Number(e.target.value))} />
                    <span className="inter" style={{ fontSize: 11, color: "#888" }}>/ {m.target}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Checklist({ data, setData }) {
  const [tab, setTab] = useState("preopen");
  const [filter, setFilter] = useState("all");
  const TEAM = data.team || ["Collin","Jordan","Mia","Sam"];

  const checklists = data.checklists || { preopen: [], opening: [] };
  const items = checklists[tab] || [];

  const toggle = (id) => setData(d => ({
    ...d, checklists: { ...d.checklists, [tab]: d.checklists[tab].map(i => i.id === id ? { ...i, done: !i.done } : i) }
  }));
  const updateItem = (id, field, value) => setData(d => ({
    ...d, checklists: { ...d.checklists, [tab]: d.checklists[tab].map(i => i.id === id ? { ...i, [field]: value } : i) }
  }));
  const addItem = (category) => {
    const id = `${tab[0]}${Date.now()}`;
    setData(d => ({ ...d, checklists: { ...d.checklists, [tab]: [...d.checklists[tab], { id, category, item: "New item", done: false, owner: TEAM[0], notes: "" }] } }));
  };
  const deleteItem = (id) => setData(d => ({ ...d, checklists: { ...d.checklists, [tab]: d.checklists[tab].filter(i => i.id !== id) } }));

  const filtered = filter === "all" ? items : items.filter(i => i.owner === filter);
  const categories = [...new Set(items.map(i => i.category))];
  const doneCount = items.filter(i => i.done).length;
  const pctDone = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  // Countdown to opening
  const openDate = data.openingDate ? new Date(data.openingDate) : null;
  const daysLeft = openDate ? Math.ceil((openDate - new Date()) / 86400000) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Opening Checklists</h1>
            <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Everything that needs to happen before and on opening day.</p>
          </div>
          {daysLeft !== null && (
            <div style={{ textAlign: "right", background: daysLeft <= 14 ? "#fff0f0" : "#f0fafa", border: `1px solid ${daysLeft <= 14 ? "#fdd" : "#c8e8e8"}`, borderRadius: 10, padding: "10px 18px" }}>
              <div className="lora" style={{ fontSize: 28, color: daysLeft <= 14 ? "#C0392B" : "#005764", lineHeight: 1 }}>{daysLeft > 0 ? daysLeft : "🎉"}</div>
              <div className="inter" style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{daysLeft > 0 ? "days to open" : "You're open!"}</div>
              <input type="date" value={data.openingDate || ""} onChange={e => setData(d => ({ ...d, openingDate: e.target.value }))}
                style={{ fontSize: 10, border: "none", background: "transparent", color: "#aaa", marginTop: 4, textAlign: "right", cursor: "pointer" }} />
            </div>
          )}
          {daysLeft === null && (
            <div style={{ textAlign: "right" }}>
              <div className="inter" style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>Set opening date</div>
              <input type="date" value={data.openingDate || ""} onChange={e => setData(d => ({ ...d, openingDate: e.target.value }))}
                style={{ fontSize: 13, border: "1px solid #e0e0e0", borderRadius: 8, padding: "6px 10px" }} />
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "preopen", label: "Pre-Opening", emoji: "🏗️" },
          { key: "opening", label: "Opening Day", emoji: "🎉" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${tab === t.key ? "#005764" : "#e0e0e0"}`, background: tab === t.key ? "#005764" : "#fff", color: tab === t.key ? "#fff" : "#444", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {t.emoji} {t.label}
          </button>
        ))}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginLeft: "auto", width: "auto", fontSize: 13 }}>
          <option value="all">All owners</option>
          {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24, background: "#f9f9f9", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{doneCount} of {items.length} complete</span>
          <span className="lora" style={{ fontSize: 20, color: pctDone === 100 ? "#1E7A4A" : "#005764" }}>{pctDone}%</span>
        </div>
        <div style={{ height: 8, background: "#e0e0e0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pctDone}%`, height: "100%", background: pctDone === 100 ? "#2ECC71" : "#005764", borderRadius: 99, transition: "width 0.5s ease" }} />
        </div>
        {pctDone === 100 && <div className="inter" style={{ fontSize: 13, color: "#1E7A4A", marginTop: 8, fontWeight: 600 }}>✓ All done — you're ready!</div>}
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {categories.map(cat => {
          const catItems = filtered.filter(i => i.category === cat);
          if (!catItems.length) return null;
          const catDone = catItems.filter(i => i.done).length;
          const catPct = Math.round((catDone / catItems.length) * 100);
          const barColor = catPct === 100 ? "#2ECC71" : catPct >= 50 ? "#005764" : "#F5A623";

          return (
            <div key={cat}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{cat}</span>
                  <span className="inter" style={{ fontSize: 11, color: "#aaa" }}>{catDone}/{catItems.length}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 4, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${catPct}%`, height: "100%", background: barColor, borderRadius: 99 }} />
                  </div>
                  <button onClick={() => addItem(cat)} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 12, color: "#666", fontFamily: "Inter, sans-serif" }}>+ Add</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: item.done ? "#eefaf4" : "#fff", border: `1px solid ${item.done ? "#c5e8d8" : "#ebebeb"}`, borderRadius: 10, opacity: item.done ? 0.75 : 1 }}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "#005764" }} />
                    <div style={{ flex: 1 }}>
                      <input type="text" value={item.item} onChange={e => updateItem(item.id, "item", e.target.value)}
                        style={{ border: "none", padding: 0, fontSize: 14, fontWeight: item.done ? 400 : 500, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", color: item.done ? "#aaa" : "#1a1a1a", textDecoration: item.done ? "line-through" : "none" }} />
                      <input type="text" value={item.notes} onChange={e => updateItem(item.id, "notes", e.target.value)} placeholder="Add a note..."
                        style={{ border: "none", padding: "2px 0 0", fontSize: 12, background: "transparent", width: "100%", fontFamily: "Inter, sans-serif", color: "#888", marginTop: 2 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <select value={item.owner} onChange={e => updateItem(item.id, "owner", e.target.value)} style={{ fontSize: 12, width: "auto", color: "#555", border: "1px solid #e0e0e0", borderRadius: 6 }}>
                        {TEAM.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e0e0e0", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>✕</button>
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

function OpsTasksPage({ data, setData, isOwner, TEAM }) {
  const [activeFreq, setActiveFreq] = useState("daily");
  const [editing, setEditing] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const weekKey = (() => {
    const d = new Date(); const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  })();
  const monthKey = new Date().toISOString().slice(0, 7);

  const getKey = (freq) => freq === "daily" ? today : freq === "weekly" ? weekKey : monthKey;

  const tasks = (data.opsTasks || []).filter(t => t.freq === activeFreq);
  const allForFreq = (data.opsTasks || []).filter(t => t.freq === activeFreq);
  const key = getKey(activeFreq);
  const doneCount = allForFreq.filter(t => t.completions?.[key]).length;
  const pctDone = allForFreq.length ? Math.round((doneCount / allForFreq.length) * 100) : 0;

  const toggle = (id) => {
    setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? {
      ...t, completions: { ...t.completions, [key]: t.completions?.[key] ? null : { at: new Date().toISOString(), by: d.currentUser } }
    } : t) }));
  };

  const updateTask = (id, field, value) => setData(d => ({ ...d, opsTasks: d.opsTasks.map(t => t.id === id ? { ...t, [field]: value } : t) }));

  const addTask = () => {
    const id = `${activeFreq[0]}${Date.now()}`;
    setData(d => ({ ...d, opsTasks: [...(d.opsTasks || []), { id, freq: activeFreq, title: "New task", desc: "", assignee: "", completions: {}, notes: "" }] }));
  };

  const deleteTask = (id) => setData(d => ({ ...d, opsTasks: d.opsTasks.filter(t => t.id !== id) }));

  const freqConfig = {
    daily:   { label: "Daily",   emoji: "☀️", color: "#005764", light: "#f0fafa", border: "#c8e8e8", reset: "Resets midnight" },
    weekly:  { label: "Weekly",  emoji: "📅", color: "#7B4F2E", light: "#fff8f2", border: "#e8d4c0", reset: "Resets Monday" },
    monthly: { label: "Monthly", emoji: "🗓️", color: "#2E4F7B", light: "#f2f5ff", border: "#c0cce8", reset: "Resets 1st of month" },
  };

  const cfg = freqConfig[activeFreq];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 28, fontWeight: 600, color: "#111" }}>Ops Tasks</h1>
        <p className="inter" style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Recurring tasks that keep Ripple running smoothly.</p>
      </div>

      {/* Frequency tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {Object.entries(freqConfig).map(([freq, c]) => {
          const count = (data.opsTasks || []).filter(t => t.freq === freq);
          const done = count.filter(t => t.completions?.[getKey(freq)]).length;
          const p = count.length ? Math.round((done / count.length) * 100) : 0;
          return (
            <button key={freq} onClick={() => setActiveFreq(freq)}
              style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: `2px solid ${activeFreq === freq ? c.color : "#ebebeb"}`, background: activeFreq === freq ? c.color : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: activeFreq === freq ? "rgba(255,255,255,0.7)" : "#aaa" }}>{done}/{count.length}</span>
              </div>
              <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: activeFreq === freq ? "#fff" : "#333", marginBottom: 2 }}>{c.label}</div>
              <div style={{ height: 3, background: activeFreq === freq ? "rgba(255,255,255,0.2)" : "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${p}%`, height: "100%", background: activeFreq === freq ? "#fff" : c.color, borderRadius: 99 }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: cfg.light, border: `1px solid ${cfg.border}`, borderRadius: 10, marginBottom: 20 }}>
        <div>
          <div className="inter" style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{doneCount} of {allForFreq.length} {cfg.label.toLowerCase()} tasks done</div>
          <div className="inter" style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{cfg.reset} · {today}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="lora" style={{ fontSize: 24, color: pctDone === 100 ? "#1E7A4A" : cfg.color }}>{pctDone}%</div>
          {isOwner && <button onClick={addTask} style={{ background: cfg.color, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+ Add task</button>}
        </div>
      </div>

      {/* Task list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map(t => {
          const completion = t.completions?.[key];
          const isDone = !!completion;
          return (
            <div key={t.id}
              style={{ background: isDone ? "#eefaf4" : "#fff", border: `1px solid ${isDone ? "#b8e8cc" : "#ebebeb"}`, borderRadius: 12, padding: "16px 18px", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Big checkbox */}
                <button onClick={() => toggle(t.id)}
                  style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${isDone ? "#2ECC71" : "#d0d0d0"}`, background: isDone ? "#2ECC71" : "#fff", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all 0.15s" }}>
                  {isDone && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>

                <div style={{ flex: 1 }}>
                  {editing === t.id && isOwner ? (
                    <input type="text" value={t.title} onChange={e => updateTask(t.id, "title", e.target.value)}
                      style={{ fontSize: 15, fontWeight: 600, padding: "0", border: "none", background: "transparent", fontFamily: "Inter, sans-serif", color: "#1a1a1a", width: "100%" }} autoFocus />
                  ) : (
                    <div className="inter" style={{ fontSize: 15, fontWeight: 600, color: isDone ? "#aaa" : "#1a1a1a", textDecoration: isDone ? "line-through" : "none" }}
                      onClick={() => isOwner && setEditing(t.id)}>{t.title}</div>
                  )}
                  {t.desc && <div className="inter" style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.5 }}>{t.desc}</div>}
                  {isDone && completion.at && (
                    <div className="inter" style={{ fontSize: 11, color: "#2ECC71", marginTop: 4 }}>
                      ✓ Done {completion.by ? `by ${completion.by}` : ""} · {new Date(completion.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {t.assignee && (
                    <span className="inter" style={{ fontSize: 12, color: "#888", background: "#f5f5f5", padding: "3px 10px", borderRadius: 99 }}>{t.assignee}</span>
                  )}
                  {isOwner && (
                    <button onClick={() => setEditing(editing === t.id ? null : t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: "0 2px" }}>✎</button>
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {editing === t.id && isOwner && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div className="lbl">Description</div>
                    <input type="text" value={t.desc} onChange={e => updateTask(t.id, "desc", e.target.value)} placeholder="Task details..." />
                  </div>
                  <div>
                    <div className="lbl">Assigned to</div>
                    <select value={t.assignee} onChange={e => updateTask(t.id, "assignee", e.target.value)} style={{ width: "auto" }}>
                      <option value="">Anyone</option>
                      {TEAM.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="lbl">Notes</div>
                    <input type="text" value={t.notes} onChange={e => updateTask(t.id, "notes", e.target.value)} placeholder="Any additional notes..." />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setEditing(null)} style={{ background: cfg.color, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>Done</button>
                    <button onClick={() => { deleteTask(t.id); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#C0392B", fontFamily: "Inter, sans-serif" }}>Delete task</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="lora" style={{ fontSize: 18, color: "#bbb", fontStyle: "italic" }}>No {activeFreq} tasks yet.</div>
          {isOwner && <button onClick={addTask} className="btn btn-teal" style={{ marginTop: 14 }}>+ Add your first task</button>}
        </div>
      )}
    </div>
  );
}
