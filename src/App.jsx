import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ── Helpers ──────────────────────────────────────────────────────────────────
const pct = (c, t) => Math.min(100, Math.round((c / t) * 100));

// ── Smooth input hooks ────────────────────────────────────────────────────────
// Use local state while typing, sync to parent only on blur or Enter
function useField(externalValue, onCommit) {
  const [local, setLocal] = useState(String(externalValue ?? ""));
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setLocal(String(externalValue ?? ""));
  }, [externalValue]);
  return {
    value: local,
    onChange: e => { dirty.current = true; setLocal(e.target.value); },
    onBlur: () => { dirty.current = false; onCommit(local); },
    onKeyDown: e => { if (e.key === "Enter") { dirty.current = false; onCommit(local); e.target.blur(); } },
  };
}

function useNumberField(externalValue, onCommit) {
  const [local, setLocal] = useState(String(externalValue ?? ""));
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setLocal(String(externalValue ?? ""));
  }, [externalValue]);
  return {
    value: local,
    onChange: e => { dirty.current = true; setLocal(e.target.value); },
    onBlur: () => {
      dirty.current = false;
      const num = parseFloat(local);
      onCommit(isNaN(num) ? 0 : num);
    },
    onKeyDown: e => {
      if (e.key === "Enter") {
        dirty.current = false;
        const num = parseFloat(local);
        onCommit(isNaN(num) ? 0 : num);
        e.target.blur();
      }
    },
  };
}
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n ?? 0);
const initials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
const AVATAR_PALETTE = ["#1A5F6A","#7B5EA7","#2A3F6B","#4A6B2A","#6B2A4A","#2A6B5F"];
const avatarColor = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];
const todayKey = () => new Date().toISOString().split("T")[0];
const weekKey = () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(new Date().setDate(diff)).toISOString().split("T")[0]; };
const monthKey = () => new Date().toISOString().slice(0, 7);

// ── Reusable smooth input components ─────────────────────────────────────────
function SmoothInput({ value, onCommit, placeholder, style, autoFocus, autoComplete = "off", multiline, rows = 2 }) {
  const props = useField(value, onCommit);
  const baseStyle = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 13,
    color: "#0D1117",
    background: "#E5EBF1",
    border: "1px solid #D0DCE4",
    borderRadius: 9,
    padding: "8px 11px",
    outline: "none",
    width: "100%",
    WebkitTextFillColor: "#0D1117",
    WebkitBoxShadow: "0 0 0px 1000px #fff inset",
    ...style,
  };
  if (multiline) return <textarea rows={rows} placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete} {...props} style={{ ...baseStyle, resize: "none", lineHeight: 1.55 }} />;
  return <input type="text" placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete} {...props} style={baseStyle} />;
}

function SmoothNumber({ value, onCommit, min = 0, style }) {
  const props = useNumberField(value, onCommit);
  return (
    <input
      type="number"
      min={min}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      {...props}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: "#0D1117",
        background: "#E5EBF1",
        border: "1px solid #D0DCE4",
        borderRadius: 9,
        padding: "6px 8px",
        outline: "none",
        textAlign: "center",
        WebkitTextFillColor: "#0D1117",
        WebkitBoxShadow: "0 0 0px 1000px #fff inset",
        ...style,
      }}
    />
  );
}

function SmoothTextarea({ value, onCommit, placeholder, rows = 2, style, readOnly }) {
  const props = useField(value, onCommit);
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      readOnly={readOnly}
      autoComplete="off"
      {...(readOnly ? { value: value || "" } : props)}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        color: "#0D1117",
        background: "transparent",
        border: "none",
        outline: "none",
        width: "100%",
        resize: "none",
        lineHeight: 1.6,
        WebkitTextFillColor: "#0D1117",
        ...style,
      }}
    />
  );
}
const TEAM = ["Caleb", "Madeline", "Collin"];

const INITIAL_DATA = {
  team: TEAM,
  currentUser: "Collin",
  viewMode: "owner",
  openingDate: "2025-06-15",
  wigId: 1,

  goals: [
    { id: 1, title: "Reach 200 Members", category: "Memberships", target: 200, current: 31, owner: "Collin", status: "on-track", why: "Founding members build our community before we open. They're our believers.", notes: "" },
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

  foundingMembers: [
    {"id":"2669495","name":"Andrew Gibson","email":"gibsonas11@gmail.com","date":"2026-05-04","type":"Founding Monthly — Couple","people":2},
    {"id":"2668039","name":"Will Walls","email":"willthethrillwalls@gmail.com","date":"2026-05-03","type":"Founding Monthly — Couple","people":2},
    {"id":"2663988","name":"Adam Barrett","email":"adambarrett1987@gmail.com","date":"2026-05-01","type":"Founding Annual — Couple","people":2},
    {"id":"2663720","name":"Sam Sobczak","email":"samsobczak@gmail.com","date":"2026-05-01","type":"Founding Monthly — Individual","people":1},
    {"id":"2663395","name":"Michael Hurley","email":"mhurley21@gmail.com","date":"2026-05-01","type":"Founding Monthly — Individual","people":1},
    {"id":"2662174","name":"Erik Lutz","email":"erikmlutz@gmail.com","date":"2026-04-30","type":"Founding Monthly — Individual","people":1},
    {"id":"2661843","name":"Bryce Trebley","email":"trebs99@outlook.com","date":"2026-04-30","type":"Founding Monthly — Individual","people":1},
    {"id":"2661280","name":"Rachel Valle","email":"rachelmvalle13@gmail.com","date":"2026-04-29","type":"Founding Annual — Couple","people":2},
    {"id":"2661174","name":"Jacob Sonntag","email":"jhsonntag@gmail.com","date":"2026-04-29","type":"Founding Monthly — Individual","people":1},
    {"id":"2661172","name":"Kyler Finn","email":"00kefinn@gmail.com","date":"2026-04-29","type":"Founding Monthly — Individual","people":1},
    {"id":"2618075","name":"Jonathan Johnson","email":"jjohnsonviolin@gmail.com","date":"2026-04-28","type":"Founding Monthly — Family (Couple + 2 Children)","people":4},
    {"id":"2657629","name":"Nick Schwaberow","email":"nschwabe23@gmail.com","date":"2026-04-26","type":"Founding Monthly — Individual","people":1},
    {"id":"2655930","name":"Paul Jacobson","email":"pjjacobson17@gmail.com","date":"2026-04-25","type":"Founding Monthly — Individual","people":1},
    {"id":"2653803","name":"Megan McVey","email":"mmmcvey98@gmail.com","date":"2026-04-24","type":"Founding Monthly — Individual","people":1},
    {"id":"2652617","name":"Elliot Bruhl","email":"elliotnoahbruhl@gmail.com","date":"2026-04-23","type":"Founding Monthly — Individual","people":1},
    {"id":"2651753","name":"Jaquelyn Walburn","email":"jacki.walburn@gmail.com","date":"2026-04-22","type":"Founding Monthly — Couple","people":2},
    {"id":"2639770","name":"Jasmine Vann","email":"happyjaz12@charter.net","date":"2026-04-16","type":"Founding Monthly — Individual","people":1},
    {"id":"2636731","name":"Brian Clow","email":"bclowd@gmail.com","date":"2026-04-14","type":"Founding Monthly — Individual","people":1},
    {"id":"2635605","name":"Benjamin Bastnagel","email":"bbastnag@gmail.com","date":"2026-04-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2635456","name":"Kyle Kaiser","email":"Kylekaiser88@yahoo.com","date":"2026-04-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2635438","name":"Yuanzhi Yang","email":"cinsiliay@gmail.com","date":"2026-04-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2635045","name":"Grant Paulson","email":"grant.paulson@orrfellowship.org","date":"2026-04-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2634917","name":"Mark Ladd","email":"laddmj@gmail.com","date":"2026-04-13","type":"Founding Monthly — Family (Couple + 2 Children)","people":4},
    {"id":"2634351","name":"Adrian Deneen","email":"adeneen117@gmail.com","date":"2026-04-12","type":"Founding Monthly — Individual","people":1},
    {"id":"2634292","name":"Sneha Pamulapati","email":"saagarsneha@gmail.com","date":"2026-04-12","type":"Founding Monthly — Individual","people":1},
    {"id":"2634069","name":"Patrick Cole","email":"paddycole9@gmail.com","date":"2026-04-12","type":"Founding Monthly — Family (Couple + Child)","people":3},
    {"id":"2631343","name":"Tommy Dant","email":"jamesdantindy@gmail.com","date":"2026-04-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2629851","name":"Phillip Schlosberg","email":"upping.matrons_9j@icloud.com","date":"2026-04-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2629367","name":"Cory Allen","email":"coryallen228@gmail.com","date":"2026-04-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2629280","name":"Tony Johnson","email":"anthonyjohnson8800@gmail.com","date":"2026-04-10","type":"Founding Monthly — Family (Couple + 2 Children)","people":4},
    {"id":"2629210","name":"Thaddeus Foster","email":"thaddeusjamesfoster@gmail.com","date":"2026-04-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2629151","name":"Ryan Czarnecki","email":"Rczarnecki@me.com","date":"2026-04-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2628886","name":"Jackson Minix","email":"jackson.minix@gmail.com","date":"2026-04-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2627814","name":"Harry Hensel","email":"harryhensel95@gmail.com","date":"2026-04-09","type":"Founding Monthly — Individual","people":1},
    {"id":"2627810","name":"Mads Gullion","email":"madsgullion@gmail.com","date":"2026-04-09","type":"Founding Monthly — Individual","people":1},
    {"id":"2627119","name":"William Dou","email":"dou.william@outlook.com","date":"2026-04-09","type":"Founding Monthly — Individual","people":1},
    {"id":"2623689","name":"Louis Soria","email":"louissoria@me.com","date":"2026-04-07","type":"Founding Monthly — Individual","people":1},
    {"id":"2623541","name":"Amanda Leatherman","email":"amanda.moon.leatherman@gmail.com","date":"2026-04-07","type":"Founding Monthly — Individual","people":1},
    {"id":"2622374","name":"Jordan Seeder","email":"jordan.seeder@gmail.com","date":"2026-04-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2622232","name":"Michael Schmitz","email":"michael.schmitz045@gmail.com","date":"2026-04-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2620475","name":"Pete Stremming","email":"pete.stremming@gmail.com","date":"2026-04-05","type":"Founding Monthly — Individual","people":1},
    {"id":"2620360","name":"Christina Baker","email":"christina.m.baker26@gmail.com","date":"2026-04-05","type":"Founding Monthly — Individual","people":1},
    {"id":"2620303","name":"Rhianna Walzer","email":"rwalzer@stio.com","date":"2026-04-05","type":"Founding Monthly — Couple","people":2},
    {"id":"2618483","name":"Cameron Behringer","email":"behringer.cameron@gmail.com","date":"2026-04-04","type":"Founding Monthly — Individual","people":1},
    {"id":"2614094","name":"Hudson Skilling","email":"jon@tiffanyskillinginteriors.com","date":"2026-04-02","type":"Founding Annual — Individual","people":1},
    {"id":"2611727","name":"Rachel Kappeler","email":"rachelkappeler@gmail.com","date":"2026-04-01","type":"Founding Annual — Individual","people":1},
    {"id":"2611439","name":"Kaito Richmond","email":"kaitolax@gmail.com","date":"2026-04-01","type":"Founding Monthly — Individual","people":1},
    {"id":"2609091","name":"Lucas Wuestefeld","email":"lucwuestefeld@gmail.com","date":"2026-03-31","type":"Founding Monthly — Individual","people":1},
    {"id":"2600714","name":"Tim Wong","email":"wong.hsw@gmail.com","date":"2026-03-29","type":"Founding Monthly — Individual","people":1},
    {"id":"2605950","name":"Brandon Corbin","email":"brandon@icorbin.com","date":"2026-03-28","type":"Founding Monthly — Individual","people":1},
    {"id":"2603635","name":"Lucas Henricks","email":"lucashenricks1974@gmail.com","date":"2026-03-27","type":"Founding Monthly — Individual","people":1},
    {"id":"2602696","name":"Isaac Beaverson","email":"isaac.beaverson@gmail.com","date":"2026-03-27","type":"Founding Monthly — Individual","people":1},
    {"id":"2599489","name":"Brian Kwon","email":"thebriankwon@gmail.com","date":"2026-03-24","type":"Founding Monthly — Individual","people":1},
    {"id":"2598970","name":"Katelyn Murphy","email":"murphykatelyn19@gmail.com","date":"2026-03-24","type":"Founding Monthly — Individual","people":1},
    {"id":"2598452","name":"Nicholas Polster","email":"n.polster@yahoo.com","date":"2026-03-23","type":"Founding Monthly — Individual","people":1},
    {"id":"2597074","name":"Bridget Nash","email":"bridgetnash35@gmail.com","date":"2026-03-22","type":"Founding Monthly — Individual","people":1},
    {"id":"2596930","name":"Eric Nelson","email":"enels89@gmail.com","date":"2026-03-22","type":"Founding Monthly — Individual","people":1},
    {"id":"2595751","name":"Skyler Wickstrom","email":"skylerbleu4@gmail.com","date":"2026-03-21","type":"Founding Monthly — Couple","people":2},
    {"id":"2594763","name":"Drew Harris","email":"harrisdrew31@gmail.com","date":"2026-03-21","type":"Founding Monthly — Individual","people":1},
    {"id":"2589305","name":"Neekesh Patel","email":"ncpatel329@gmail.com","date":"2026-03-17","type":"Founding Monthly — Individual","people":1},
    {"id":"2589067","name":"Ben Hiatt","email":"bhiatt@developertown.com","date":"2026-03-17","type":"Founding Monthly — Individual","people":1},
    {"id":"2588589","name":"Emma Cottrell","email":"emmagcottrell@gmail.com","date":"2026-03-17","type":"Founding Monthly — Individual","people":1},
    {"id":"2587961","name":"Joel Vastbinder","email":"jvastbinder513@gmail.com","date":"2026-03-16","type":"Founding Monthly — Couple","people":2},
    {"id":"2582155","name":"James Montague","email":"jmontagu87@gmail.com","date":"2026-03-15","type":"Founding Monthly — Family (Couple + 2 Children)","people":4},
    {"id":"2585024","name":"Julie Gallina","email":"jfgallina@gmail.com","date":"2026-03-14","type":"Founding Monthly — Couple","people":2},
    {"id":"2581060","name":"Patrick VanMeter","email":"patrick.d.vanmeter@gmail.com","date":"2026-03-14","type":"Founding Monthly — Individual","people":1},
    {"id":"2580917","name":"Gavin Hensley","email":"Gavin.Krista@Gmail.com","date":"2026-03-12","type":"Founding Monthly — Couple","people":2},
    {"id":"2579812","name":"Robert Flaherty","email":"rrflars@gmail.com","date":"2026-03-11","type":"Founding Annual — Individual","people":1},
    {"id":"2578621","name":"Dominik Kowalczyk","email":"dominik.tkd@gmail.com","date":"2026-03-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2579246","name":"Harry Burdess","email":"hdburdess@gmail.com","date":"2026-03-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2578531","name":"Clare Bielefeld","email":"clarecbielefeld@gmail.com","date":"2026-03-10","type":"Founding Monthly — Individual","people":1},
    {"id":"2577552","name":"Garrett Prost","email":"prostgarrett@gmail.com","date":"2026-03-10","type":"Founding Monthly — Individual","people":1},
    {"id":"452571","name":"Luke Williams","email":"lukewilliams16@gmail.com","date":"2026-03-09","type":"Founding Monthly — Couple","people":2},
    {"id":"2576035","name":"Wesley Stevens","email":"friggleste@gmail.com","date":"2026-03-08","type":"Founding Monthly — Individual","people":1},
    {"id":"2566540","name":"Nick Traycoff","email":"nicktraycoff@gmail.com","date":"2026-03-03","type":"Founding Monthly — Individual","people":1},
    {"id":"2554926","name":"Mackenzie  Tilton","email":"kenzieltilton@gmail.com","date":"2026-02-28","type":"Founding Monthly — Couple","people":2},
    {"id":"2551786","name":"Olivia Mitchell","email":"olivia@crouchingtigers.com","date":"2026-02-27","type":"Founding Annual — Individual","people":1},
    {"id":"2547671","name":"Caleb KETCHAM","email":"calebketcham@gmail.com","date":"2026-02-24","type":"Founding Monthly — Individual","people":1},
    {"id":"2547553","name":"David Cornelius","email":"corneliusdm@gmail.com","date":"2026-02-24","type":"Founding Annual — Individual","people":1},
    {"id":"2545634","name":"Tyler Pereira","email":"tylergpereira4@gmail.com","date":"2026-02-22","type":"Founding Annual — Couple","people":2},
    {"id":"2294929","name":"Matt Mewborn","email":"mattemewborn15@gmail.com","date":"2026-02-16","type":"Founding Monthly — Individual","people":1},
    {"id":"2430364","name":"Thomas Schuler","email":"thomasschuler19@gmail.com","date":"2026-02-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2427412","name":"Elizabeth Vos","email":"voselizabeth22@gmail.com","date":"2026-02-09","type":"Founding Monthly — Individual","people":1},
    {"id":"2416472","name":"Tyler Nolan","email":"Nolan.tylerj@gmail.com","date":"2026-02-03","type":"Founding Monthly — Individual","people":1},
    {"id":"2408389","name":"Christopher Kim","email":"christopher@rungne.com","date":"2026-01-30","type":"Founding Monthly — Individual","people":1},
    {"id":"2402176","name":"Nathan Jarrett","email":"jarrett.n.p@gmail.com","date":"2026-01-26","type":"Founding Annual — Individual","people":1},
    {"id":"2393035","name":"Zeke Dixon","email":"zekedixon1@gmail.com","date":"2026-01-21","type":"Founding Monthly — Individual","people":1},
    {"id":"2392777","name":"Jesse Cannella","email":"jessep.cannella@gmail.com","date":"2026-01-21","type":"Founding Monthly — Individual","people":1},
    {"id":"493877","name":"Braden King","email":"braden.n.king@gmail.com","date":"2026-01-21","type":"Founding Monthly — Couple","people":2},
    {"id":"2391048","name":"Brett Fischl","email":"brettfischl1@gmail.com","date":"2026-01-20","type":"Founding Monthly — Individual","people":1},
    {"id":"2390970","name":"Sydney Joseph","email":"sfjohnson95@gmail.com","date":"2026-01-20","type":"Founding Monthly — Individual","people":1},
    {"id":"2390961","name":"Timothy Gruenhagen","email":"tgruenha@gmail.com","date":"2026-01-20","type":"Founding Monthly — Couple","people":2},
    {"id":"2389703","name":"Connor Love","email":"connor@combinedcuriosity.com","date":"2026-01-19","type":"Founding Monthly — Individual","people":1},
    {"id":"2380477","name":"Caleb Hawkins","email":"caleb.hawkins@realifechurch.org","date":"2026-01-15","type":"Founding Monthly — Individual","people":1},
    {"id":"1084772","name":"Jake Krebs","email":"jakek321@gmail.com","date":"2026-01-15","type":"Founding Monthly — Individual","people":1},
    {"id":"2379277","name":"Raymond Kline","email":"rayjkline@me.com","date":"2026-01-14","type":"Founding Monthly — Family (Couple + 3 Children)","people":5},
    {"id":"2378061","name":"Evan Ballard","email":"e.ballard30795@gmail.com","date":"2026-01-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2377947","name":"Michael Taft","email":"mchltaft@gmail.com","date":"2026-01-13","type":"Founding Monthly — Individual","people":1},
    {"id":"2323995","name":"Alex Xu","email":"jingyixu@umass.edu","date":"2026-01-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2047863","name":"Keith Bye","email":"kjbye5252@gmail.com","date":"2026-01-11","type":"Founding Monthly — Individual","people":1},
    {"id":"2315989","name":"Tim Kaminske","email":"extratim@gmail.com","date":"2026-01-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2315800","name":"Seth Felty","email":"sethfelty2@gmail.com","date":"2026-01-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2315644","name":"Yongzhe Li","email":"liyongzhespu@gmail.com","date":"2026-01-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2315617","name":"Sam Mueller","email":"samjamesmueller@gmail.com","date":"2026-01-06","type":"Founding Monthly — Individual","people":1},
    {"id":"2306336","name":"Dennis Robertson","email":"dennislrobertson@gmail.com","date":"2026-01-01","type":"Founding Monthly — Individual","people":1},
    {"id":"812582","name":"Caleb Johnson","email":"caleb@rippleboulder.co","date":"2026-01-01","type":"Founding Monthly — Individual","people":1},
  ],

  weeklySuggestions: [
    { id: "ws1", text: "Ask every new climber if they've heard about our founding membership", active: true },
    { id: "ws2", text: "Learn 3 new member names this week", active: true },
    { id: "ws3", text: "Invite first-time climbers back — 'We'd love to see you again soon!'", active: true },
    { id: "ws4", text: "Mention the next community event to at least 5 people", active: true },
    { id: "ws5", text: "Capture one great social media moment during a busy hour", active: true },
    { id: "ws6", text: "Ask a regular member if they'd send a friend our way", active: false },
    { id: "ws7", text: "Check in with new members — 'How's climbing been going for you?'", active: false },
    { id: "ws8", text: "Help one anxious beginner feel genuinely comfortable today", active: false },
  ],

  monthlyMetrics: [
    {
      id: "mm1",
      month: "May 2025",
      activeMembers: 47,
      newMembers: 18,
      foundingMembers: 31,
      referrals: 6,
      dayPasses: 42,
      notes: "Strong presale momentum. Partnership push needed.",
    }
  ],
};

const sc = {
  "on-track":        { bg: "rgba(46,125,50,0.2)", text: "#1A5F6A", bar: "#5CC87A", dot: "#5CC87A" },
  "needs-attention": { bg: "rgba(245,127,23,0.2)", text: "#FFC04D", bar: "#FFC107", dot: "#FFC107" },
  "off-track":       { bg: "rgba(198,40,40,0.2)", text: "#FF6B6B", bar: "#EF5350", dot: "#EF5350" },
};
const pc = {
  high:   { bg: "rgba(198,40,40,0.2)", text: "#FF6B6B" },
  medium: { bg: "rgba(245,127,23,0.2)", text: "#FFC04D" },
  low:    { bg: "rgba(46,125,50,0.2)", text: "#1A5F6A" },
};

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [nav, setNav] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const OWNER_PIN = "5255";

  // Seamless view switching — PIN required to enter owner view
  const switchView = () => {
    if (data.viewMode === "owner") {
      // Switching to staff — no PIN needed
      setData(d => ({ ...d, viewMode: "staff" }));
      setMenuOpen(false);
      setNav("ops");
    } else {
      // Switching to owner — require PIN
      setPinInput("");
      setPinError(false);
      setShowPinModal(true);
      setMenuOpen(false);
    }
  };

  const submitPin = () => {
    if (pinInput === OWNER_PIN) {
      setShowPinModal(false);
      setPinInput("");
      setPinError(false);
      setData(d => ({ ...d, viewMode: "owner" }));
      setNav("home");
    } else {
      setPinError(true);
      setPinInput("");
    }
  };
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

  // Single source of truth for member count — updates goals + scoreboard simultaneously
  const setMemberCount = (v) => {
    const num = Number(v) || 0;
    setData(d => ({
      ...d,
      manualMembershipCount: num,
      // Update the first membership-related goal automatically
      goals: d.goals.map(g =>
        (g.title.toLowerCase().includes("member") || g.title.toLowerCase().includes("founding"))
          ? { ...g, current: num }
          : g
      ),
      // Also update latest monthly metric
      monthlyMetrics: (d.monthlyMetrics || []).map((m, i, arr) =>
        i === arr.length - 1 ? { ...m, foundingMembers: num } : m
      ),
    }));
  };

  // Auto-sync founding member count from real Beta data — counts people, not memberships
  const realFoundingCount = (data.foundingMembers || []).reduce((s, m) => s + (m.people || 1), 0);
  // Only auto-fill if the goal still has the placeholder value (31) — don't override manual edits
  const goalsWithRealCount = data.goals.map(g =>
    g.title.toLowerCase().includes("founding") && g.current === 31
      ? { ...g, current: realFoundingCount }
      : g
  );

  const ownerNav = [
    { key: "home",       label: "Home" },
    { key: "ops",        label: "Ops" },
    { key: "scoreboard", label: "Scoreboard" },
    { key: "goals",      label: "Goals" },
    { key: "members",    label: "Members" },
    { key: "opening",    label: "Opening" },
    { key: "settings",   label: "Settings" },
  ];
  const staffNav = [
    { key: "ops",        label: "My Shift" },
    { key: "scoreboard", label: "Scoreboard" },
  ];
  const navItems = isOwner ? ownerNav : staffNav;

  // If current nav page doesn't exist in the active view, redirect to home
  useEffect(() => {
    const validKeys = navItems.map(n => n.key);
    if (!validKeys.includes(nav)) {
      setNav(isOwner ? "home" : "ops");
    }
  }, [isOwner]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F2F4F7", minHeight: "100vh", color: "#0D1117" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-tap-highlight-color: transparent; }
        body { background: #F2F4F7; overscroll-behavior-y: none; }

        .lora { font-family: 'Lora', Georgia, serif; }
        .inter { font-family: 'Inter', system-ui, sans-serif; }

        /* Glass cards — light version */
        .card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 20px 22px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
        }
        .card-warm {
          background: rgba(26,95,106,0.06);
          border: 1px solid rgba(26,95,106,0.14);
          border-radius: 20px;
          padding: 20px 22px;
          box-shadow: 0 2px 12px rgba(26,95,106,0.08);
        }
        .card-solid {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px;
          padding: 20px 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        /* Buttons */
        .btn {
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.9);
          border-radius: 12px;
          padding: 10px 18px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #1A2530;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .btn:hover { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .btn:active { transform: scale(0.97); }
        .btn-teal { background: linear-gradient(135deg,#1A6B78,#1A5F6A); color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(26,95,106,0.3); }
        .btn-teal:hover { background: linear-gradient(135deg,#22808F,#1A6B78); box-shadow: 0 6px 20px rgba(26,95,106,0.4); }

        /* Progress bars */
        .pbar { height: 6px; border-radius: 99px; background: rgba(0,0,0,0.07); overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; transition: width 0.7s cubic-bezier(.4,0,.2,1); }

        /* Badges */
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: 0.02em; }

        /* Inputs */
        input[type=text], input[type=number], input[type=date], select, textarea {
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 11px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          background: rgba(255,255,255,0.85);
          color: #0D1117;
          outline: none;
          width: 100%;
          -webkit-text-fill-color: #0D1117;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.9) inset;
          -webkit-appearance: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        input:focus, select:focus, textarea:focus {
          border-color: #1A5F6A;
          box-shadow: 0 0 0 3px rgba(26,95,106,0.12);
          background: #fff;
          -webkit-box-shadow: 0 0 0px 1000px #fff inset;
        }
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #fff inset !important;
          -webkit-text-fill-color: #0D1117 !important;
        }
        input[type=checkbox] {
          width: 20px; height: 20px;
          cursor: pointer;
          accent-color: #1A5F6A;
          flex-shrink: 0;
        }
        select option { background: #fff; color: #0D1117; }

        /* Labels */
        .sec-label {
          font-size: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #2A3A4A;
          margin-bottom: 10px;
        }

        hr.divider { border: none; border-top: 1px solid rgba(0,0,0,0.07); margin: 16px 0; }
        .avatar { display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; font-family: 'Inter', sans-serif; font-weight: 800; color: #fff; }

        /* Task rows */
        .task-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.07);
          background: rgba(255,255,255,0.8);
          transition: all 0.15s;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 64px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .task-row:active { transform: scale(0.98); background: #fff; }
        .task-row.done { background: rgba(26,160,80,0.06); border-color: rgba(26,160,80,0.18); }

        /* Check circle */
        .check-circle {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15);
          background: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .check-circle.done { border-color: #1A9A50; background: #1A9A50; }

        /* Nav tabs */
        .nav-tab {
          background: none;
          border: none;
          border-bottom: 2.5px solid transparent;
          cursor: pointer;
          padding: 8px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #1A2530;
          transition: all 0.15s;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .nav-tab.active { color: #1A5F6A; border-bottom-color: #1A5F6A; }

        /* Freq tabs */
        .freq-tab {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(0,0,0,0.09);
          background: rgba(255,255,255,0.8);
          cursor: pointer;
          flex-shrink: 0;
          text-align: left;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .freq-tab.active {
          background: linear-gradient(135deg,#1A6B78,#1A5F6A);
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(26,95,106,0.28);
        }
        .freq-tab:active { transform: scale(0.97); }

        /* Picker buttons */
        .picker-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          border-radius: 99px;
          border: 1.5px solid rgba(26,95,106,0.25);
          background: rgba(26,95,106,0.05);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          transition: all 0.15s;
        }
        .picker-btn:active { transform: scale(0.96); background: rgba(26,95,106,0.1); }

        /* Horizontal scroll */
        .hscroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; -ms-overflow-style: none; }
        .hscroll::-webkit-scrollbar { display: none; }

        /* Hero gradient cards — keep teal */
        .hero-card {
          background: linear-gradient(135deg, #1A5F6A 0%, #0D3D48 100%);
          border-radius: 22px;
          padding: 24px 22px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(26,95,106,0.3);
        }
        .hero-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 180px; height: 180px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
        }

        /* Stat cards */
        .stat-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }

        /* View transition */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        main > * { animation: fadeSlideIn 0.22s ease; }

        /* Responsive */
        @media(max-width:680px) {
          .g2 { grid-template-columns: 1fr !important; }
          .g3 { grid-template-columns: 1fr 1fr !important; }
          .hide-sm { display: none !important; }
          .card { padding: 16px; border-radius: 18px; }
          .hero-card { padding: 20px 18px; border-radius: 20px; }
        }
        @media(min-width:681px) { .show-sm-only { display: none !important; } }

        * { -webkit-overflow-scrolling: touch; }
        :root { --safe-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* Loading */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#F2F4F7", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center" }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 56, marginBottom: 16, opacity: 0.7 }} />
            <div className="inter" style={{ fontSize: 13, color: "#333" }}>Getting things ready…</div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowPinModal(false); setPinInput(""); setPinError(false); } }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 340, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
            <div className="lora" style={{ fontSize: 22, fontStyle: "italic", color: "#0D1117", marginBottom: 6 }}>Owner Access</div>
            <div className="inter" style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Enter your PIN to switch to owner view</div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              autoFocus
              onChange={e => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(false); }}
              onKeyDown={e => { if (e.key === "Enter") submitPin(); if (e.key === "Escape") { setShowPinModal(false); setPinInput(""); setPinError(false); } }}
              placeholder="••••"
              style={{ width: "100%", fontSize: 32, textAlign: "center", letterSpacing: "0.3em", border: `2px solid ${pinError ? "#EF5350" : "#DDE8EE"}`, borderRadius: 12, padding: "12px 0", fontFamily: "Inter, sans-serif", outline: "none", marginBottom: 8, background: "#F6F9FB", color: "#0D1117", WebkitTextFillColor: "#0D1117", WebkitBoxShadow: "0 0 0px 1000px #F6F9FB inset" }}
            />
            {pinError && <div className="inter" style={{ fontSize: 13, color: "#EF5350", marginBottom: 12, fontWeight: 600 }}>Incorrect PIN — try again</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(false); }} className="btn" style={{ flex: 1, padding: "12px 0" }}>Cancel</button>
              <button onClick={submitPin} className="btn btn-teal" style={{ flex: 1, padding: "12px 0", fontSize: 15 }}>Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: "rgba(242,244,247,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 42, width: "auto" }} />
            <span className="inter" style={{ fontSize: 10, color: "#1A5F6A", background: "rgba(26,95,106,0.1)", padding: "2px 10px", borderRadius: 99, fontWeight: 800, letterSpacing: "0.08em" }}>
              {isOwner ? "OWNER" : "STAFF"}
            </span>
          </div>
          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 0 }} className="hide-sm">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setNav(item.key)} className={`nav-tab${nav === item.key ? " active" : ""}`}>
                {item.label}
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: "#2D4050", margin: "0 8px" }} />
            <button onClick={switchView}
              style={{ background: isOwner ? "rgba(26,95,106,0.08)" : "rgba(26,95,106,0.12)", border: "1px solid rgba(26,95,106,0.25)", borderRadius: 99, cursor: "pointer", fontSize: 12, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 700, padding: "5px 14px" }}>
              {isOwner ? "👤 Staff view" : "🔑 Owner view"}
            </button>
          </nav>
          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: menuOpen ? "rgba(26,95,106,0.08)" : "#DDE4EC", border: `1px solid ${menuOpen ? "rgba(26,95,106,0.2)" : "#C5D0DA"}`, borderRadius: 10, padding: "7px 13px", cursor: "pointer", fontSize: 17, color: menuOpen ? "#1A5F6A" : "#222", lineHeight: 1, transition: "all 0.15s", touchAction: "manipulation" }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "rgba(248,250,252,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setNav(item.key); setMenuOpen(false); }}
                style={{ display: "flex", alignItems: "center", width: "100%", textAlign: "left", padding: "16px 20px", background: nav === item.key ? "rgba(26,95,106,0.06)" : "none", border: "none", borderBottom: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 17, color: nav === item.key ? "#1A5F6A" : "#1a1a1a", fontWeight: nav === item.key ? 700 : 400, touchAction: "manipulation" }}>
                {nav === item.key && <span style={{ width: 3, height: 18, background: "#1A5F6A", borderRadius: 99, marginRight: 12, flexShrink: 0 }} />}
                {item.label}
              </button>
            ))}
            <button onClick={switchView}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "16px 20px", background: "rgba(26,95,106,0.05)", border: "none", borderTop: "2px solid rgba(26,95,106,0.1)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 16, color: "#1A5F6A", fontWeight: 700 }}>
              <span style={{ fontSize: 18 }}>{isOwner ? "👤" : "🔑"}</span>
              Switch to {isOwner ? "Staff" : "Owner"} view
            </button>
          </div>
        )}
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 40px" }}>
        {nav === "home"       && (isOwner ? <OwnerHome data={{...data, goals: goalsWithRealCount}} setData={setData} setMemberCount={setMemberCount} TEAM={TEAM} setNav={setNav} /> : <StaffHome data={data} setData={setData} updateLog={updateLog} updateTask={updateTask} TEAM={TEAM} setNav={setNav} />)}
        {nav === "ops"        && <OpsPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "goals"      && <GoalsPage data={{...data, goals: goalsWithRealCount}} setData={setData} updateGoal={updateGoal} updateLog={updateLog} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "opening"    && <OpeningPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "members"    && <MembersPage data={data} setData={setData} />}
        {nav === "scoreboard" && <ScoreboardPage data={{...data, goals: goalsWithRealCount}} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "settings"   && isOwner && <SettingsPage data={data} setData={setData} />}
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 16px", textAlign: "center" }}>
        <p className="inter" style={{ fontSize: 11, color: "#555" }}>Ripple Boulder · Broad Ripple, Indianapolis · built for the team 🌊</p>
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
function OwnerHome({ data, setData, setMemberCount, TEAM, setNav }) {
  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];
  const openTasks = data.tasks.filter(t => t.status !== "done").length;
  const today = todayKey();
  const dailyOps = (data.opsTasks || []).filter(t => t.freq === "opening" || t.freq === "midday" || t.freq === "closing");
  const dailyDone = dailyOps.filter(t => t.completions?.[today]).length;
  const openingDays = data.openingDate ? Math.ceil((new Date(data.openingDate) - new Date()) / 86400000) : null;
  const totalChecklist = data.openingChecklist?.length || 0;
  const doneChecklist = data.openingChecklist?.filter(i => i.done).length || 0;
  const now = new Date();
  const membershipCount = (data.foundingMembers || []).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="lora" style={{ fontSize: 28, fontStyle: "italic", color: "#0D1117", marginBottom: 4 }}>
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, Collin.
        </h1>
        <p className="inter" style={{ fontSize: 14, color: "#222" }}>Here's where Ripple Boulder stands today.</p>
      </div>

      {/* WIG — at the very top */}
      {wigGoal && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0A3540 100%)", borderRadius: 18, padding: "22px 24px", marginBottom: 20, boxShadow: "0 6px 24px rgba(26,95,106,0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div className="inter" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>⭐ Wildly Important Goal</div>
              <div className="lora" style={{ fontSize: 20, color: "#fff", fontStyle: "italic", lineHeight: 1.3 }}>{wigGoal.title}</div>
              {wigGoal.why && <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{wigGoal.why}</div>}
            </div>
            <select value={data.wigId} onChange={e => setData(d => ({ ...d, wigId: Number(e.target.value) }))}
              style={{ width: "auto", fontSize: 11, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 8px", background: "rgba(255,255,255,0.1)", cursor: "pointer", marginLeft: 12, flexShrink: 0, color: "#fff", fontFamily: "Inter, sans-serif", WebkitTextFillColor: "#fff" }}>
              {data.goals.map(g => <option key={g.id} value={g.id} style={{ background: "#1A5F6A" }}>{g.title}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#7DD3B8", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
            <span className="lora" style={{ fontSize: 22, color: "#7DD3B8", whiteSpace: "nowrap" }}>
              {pct(wigGoal.current, wigGoal.target)}%
            </span>
          </div>
          <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
            {fmt(wigGoal.current)} of {fmt(wigGoal.target)}
          </div>
        </div>
      )}

      {/* Member count — editable, saves everywhere */}
      <div className="card" style={{ marginBottom: 16, borderTop: "3px solid #1A5F6A" }}>
        <div className="sec-label">Membership Count</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "Total Members", key: "manualMembershipCount", auto: membershipCount, fn: (v) => setMemberCount(v) },
            { label: "New This Month", key: "manualNewCount", auto: 0, fn: (v) => setData(d => ({ ...d, manualNewCount: Number(v) || 0 })) },
          ].map(item => (
            <div key={item.key} style={{ textAlign: "center", padding: "14px 10px", background: "#F6F9FB", borderRadius: 12 }}>
              <div className="inter" style={{ fontSize: 11, color: "#333", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
              <input
                type="number"
                inputMode="numeric"
                value={data[item.key] !== undefined ? data[item.key] : item.auto}
                onChange={e => item.fn(e.target.value)}
                onFocus={e => e.target.select()}
                style={{ width: "100%", fontSize: 38, textAlign: "center", fontWeight: 800, color: "#1A5F6A", border: "2px solid #1A5F6A", background: "#fff", borderRadius: 10, padding: "8px 0", fontFamily: "Inter, sans-serif", outline: "none", WebkitTextFillColor: "#1A5F6A", WebkitBoxShadow: "0 0 0px 1000px #fff inset" }}
              />
              <div className="inter" style={{ fontSize: 10, color: "#1A5F6A", marginTop: 6 }}>tap to edit · saves instantly</div>
            </div>
          ))}
        </div>
      </div>

      {/* Opening countdown */}
      {openingDays !== null && openingDays > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0A3540 0%, #1A5F6A 100%)", borderRadius: 14, padding: "18px 22px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Until Opening Day</div>
            <div className="lora" style={{ fontSize: 32, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{openingDays}</div>
            <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>days to go · {data.openingDate}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="inter" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Launch readiness</div>
            <div className="lora" style={{ fontSize: 26, color: "#7DD3B8" }}>{Math.round((doneChecklist / totalChecklist) * 100)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{doneChecklist}/{totalChecklist} items</div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }} className="g3">
        {[
          { label: "Goals on track", value: data.goals.filter(g => g.status === "on-track").length + "/" + data.goals.length, color: "#1A5F6A" },
          { label: "Open tasks", value: openTasks, color: openTasks > 5 ? "#F57F17" : "#1A5F6A" },
          { label: "Ops done today", value: `${dailyDone}/${dailyOps.length}`, color: dailyDone === dailyOps.length ? "#1A5F6A" : "#F57F17" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="sec-label">{s.label}</div>
            <div className="lora" style={{ fontSize: 24, color: s.color, marginTop: 2 }}>{s.value}</div>
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
                  <span className="inter" style={{ fontSize: 13, fontWeight: 500, color: "#0D1117" }}>{g.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="inter" style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>{p}%</span>
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

      <ValuesCard />
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
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>
            {shiftEmoji} {hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}
          </h1>
          <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 3 }}>
            {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {wigGoal && (
          <div style={{ textAlign: "right", background: "rgba(26,95,106,0.2)", borderRadius: 10, padding: "8px 14px" }}>
            <div className="inter" style={{ fontSize: 10, color: "#1A5F6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>The Score</div>
            <div className="lora" style={{ fontSize: 20, color: "#1A5F6A" }}>{pct(wigGoal.current, wigGoal.target)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "#222" }}>{fmt(wigGoal.current)} / {fmt(wigGoal.target)}</div>
          </div>
        )}
      </div>

      {/* Current shift ops */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#0D1117" }}>{shiftLabel}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 72, height: 4, background: "#CCD5DE", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${shiftOps.length ? Math.round((shiftDone/shiftOps.length)*100) : 0}%`, height: "100%", background: shiftDone === shiftOps.length ? "#5CC87A" : "#1A5F6A", borderRadius: 99 }} />
            </div>
            <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: shiftDone === shiftOps.length ? "#1A5F6A" : "#1A5F6A" }}>{shiftDone}/{shiftOps.length}</span>
          </div>
        </div>

        {shiftDone === shiftOps.length && shiftOps.length > 0 && (
          <div style={{ background: "rgba(46,125,50,0.15)", border: "1px solid #C8E6C9", borderRadius: 10, padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A5F6A" }}>All {shiftLabel.toLowerCase()} done — great work!</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shiftOps.map(t => {
            const completion = t.completions?.[today];
            const isDone = !!completion;
            const isOpen = picker === t.id;
            return (
              <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#CCD5DE"}`, borderRadius: 12, overflow: "hidden", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <button onClick={() => isDone ? uncompleteOps(t.id) : setPicker(isOpen ? null : t.id)}
                    style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${isDone ? "#5CC87A" : isOpen ? "#1A5F6A" : "#555"}`, background: isDone ? "#5CC87A" : isOpen ? "#E8F2F4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {isDone
                      ? <svg width="14" height="11" fill="none" viewBox="0 0 14 11"><path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOpen ? "#1A5F6A" : "#555" }} />
                    }
                  </button>
                  <div style={{ flex: 1 }}>
                    <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: isDone ? "#222" : "#0D1117", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</div>
                    {t.desc && !isDone && <div className="inter" style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{t.desc}</div>}
                    {isDone && completion?.at && (
                      <div className="inter" style={{ fontSize: 11, color: "#5CC87A", marginTop: 2 }}>
                        ✓ {completion.by} · {new Date(completion.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    {isOpen && <div className="inter" style={{ fontSize: 12, color: "#1A5F6A", marginTop: 2, fontWeight: 600 }}>Who completed this?</div>}
                  </div>
                  {isDone && completion?.by
                    ? <Avatar name={completion.by} size={30} ring="#5CC87A" />
                    : !isOpen && <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 14 }}>👤</span></div>
                  }
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid #E8F2F4", paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {TEAM.map(person => (
                      <button key={person} onClick={() => completeOps(t.id, person)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, border: "1.5px solid #1A5F6A", background: "#E5EBF1", cursor: "pointer" }}>
                        <Avatar name={person} size={24} />
                        <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1A5F6A" }}>{person}</span>
                      </button>
                    ))}
                    <button onClick={() => setPicker(null)}
                      style={{ padding: "8px 14px", borderRadius: 99, border: "1.5px solid #DDE8EE", background: "#E5EBF1", cursor: "pointer", fontSize: 13, color: "#222", fontFamily: "Inter, sans-serif" }}>
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
          <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#0D1117", marginBottom: 12 }}>📌 Your Tasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openTasks.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#E5EBF1", border: "1px solid #DDE8EE", borderRadius: 10 }}>
                <input type="checkbox" checked={false} onChange={() => updateTask(t.id, "status", "done")} style={{ width: 20, height: 20 }} />
                <div style={{ flex: 1 }}>
                  <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#0D1117" }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text }}>{t.priority}</span>
                    {t.due && <span className="inter" style={{ fontSize: 11, color: "#222" }}>Due {t.due}</span>}
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
        <div className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#0D1117", marginBottom: 12 }}>📊 This Week's Focus</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.leadMeasures.map(m => {
            const val = data.weeklyLogs[m.goalId]?.[m.id] ?? (m.type === "checkbox" ? false : 0);
            const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: done ? "#F0FBF0" : "#fff", border: `1px solid ${done ? "#C8E6C9" : "#CCD5DE"}`, borderRadius: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: done ? "#5CC87A" : "#555", flexShrink: 0 }} />
                <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                {m.type === "checkbox"
                  ? <input type="checkbox" checked={!!val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} style={{ width: 20, height: 20 }} />
                  : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SmoothNumber value={val} onCommit={v => updateLog(m.goalId, m.id, v)} style={{ width: 58 }} />
                      <span className="inter" style={{ fontSize: 12, color: "#222" }}>/ {m.target}</span>
                    </div>
                }
              </div>
            );
          })}
        </div>
      </div>

      <ValuesCard />
    </div>
  );
}

// ── Values Card ───────────────────────────────────────────────────────────────
function ValuesCard() {
  const values = [
    { emoji: "🍽️", name: "Michelin Presence",        desc: "Intentional hospitality, attention to detail, calm excellence in every interaction." },
    { emoji: "🪴", name: "Front Porch Belonging",     desc: "Everyone is welcomed, known, and invited. This is a space where people feel safe." },
    { emoji: "🍍", name: "Pineapple Guy Expression",  desc: "Celebrate individuality, creativity, and humanity. Be yourself. Let others be themselves." },
    { emoji: "🌸", name: "Activating Superblooms",    desc: "Help people flourish together. Create environments where growth naturally happens." },
  ];
  return (
    <div style={{ marginTop: 24 }}>
      {/* Vision */}
      <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 16, padding: "22px 26px", marginBottom: 16, textAlign: "center" }}>
        <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#222", textTransform: "uppercase", marginBottom: 8 }}>Our Vision</div>
        <div className="lora" style={{ fontSize: 20, fontStyle: "italic", color: "#fff", lineHeight: 1.4 }}>
          "A rare space for abundance<br />and collective exploration."
        </div>
      </div>

      {/* Values grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="g2">
        {values.map((v, i) => (
          <div key={i} style={{ background: "#E5EBF1", border: "1px solid #DDE8EE", borderRadius: 13, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{v.emoji}</div>
            <div className="lora" style={{ fontSize: 14, fontStyle: "italic", color: "#0D1117", fontWeight: 500, marginBottom: 5 }}>{v.name}</div>
            <div className="inter" style={{ fontSize: 12, color: "#222", lineHeight: 1.55 }}>{v.desc}</div>
          </div>
        ))}
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
            <div className="inter" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#222", textTransform: "uppercase", marginBottom: 4 }}>The Score · {wigGoal.category}</div>
            <div className="lora" style={{ fontSize: 15, color: "#fff", fontStyle: "italic", lineHeight: 1.3 }}>{wigGoal.title}</div>
            <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#1A5F6A", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="lora" style={{ fontSize: 26, color: "#1A5F6A", lineHeight: 1 }}>{pct(wigGoal.current, wigGoal.target)}%</div>
            <div className="inter" style={{ fontSize: 11, color: "#222", marginTop: 2 }}>{fmt(wigGoal.current)} / {fmt(wigGoal.target)}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 24, fontStyle: "italic", color: "#0D1117" }}>Ops Tasks</h1>
          <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 2 }}>Keep the space excellent. Every shift.</p>
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
              style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${activeFreq === f.key ? "#1A5F6A" : "#CCD5DE"}`, background: activeFreq === f.key ? "#1A5F6A" : "#fff", cursor: "pointer", flexShrink: 0, textAlign: "left", transition: "all 0.12s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{f.emoji}</span>
                <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: activeFreq === f.key ? "#fff" : "#1A2530" }}>{f.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 3, background: activeFreq === f.key ? "#444" : "#CCD5DE", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${fp}%`, height: "100%", background: activeFreq === f.key ? "#1A5F6A" : "#1A5F6A", borderRadius: 99 }} />
                </div>
                <span className="inter" style={{ fontSize: 10, color: activeFreq === f.key ? "rgba(255,255,255,0.8)" : "#1A2530" }}>{fDone}/{fTasks.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#EEF4F7", borderRadius: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 5, background: "#E0DDD6", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pctDone}%`, height: "100%", background: pctDone === 100 ? "#5CC87A" : "#1A5F6A", borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: pctDone === 100 ? "#1A5F6A" : "#1A5F6A", minWidth: 80, textAlign: "right" }}>{doneCount}/{tasks.length} done</span>
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
            <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#CCD5DE"}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px" }}>
                <button onClick={() => isDone ? uncomplete(t.id) : setPicker(isOpen ? null : t.id)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${isDone ? "#5CC87A" : isOpen ? "#1A5F6A" : "#555"}`, background: isDone ? "#5CC87A" : isOpen ? "#E8F2F4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {isDone
                    ? <svg width="13" height="10" fill="none" viewBox="0 0 13 10"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOpen ? "#1A5F6A" : "#555" }} />
                  }
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing
                    ? <SmoothInput value={t.title} onCommit={v => updateOps(t.id, "title", v)} autoFocus style={{ fontSize: 14, fontWeight: 600, border: "none", padding: 0, background: "transparent" }} />
                    : <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: isDone ? "#222" : "#0D1117", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</div>
                  }
                  {t.desc && !isDone && !isEditing && <div className="inter" style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{t.desc}</div>}
                  {isDone && completion?.at && (
                    <div className="inter" style={{ fontSize: 11, color: "#5CC87A", marginTop: 2 }}>
                      {completion.by} · {new Date(completion.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isDone && completion?.by
                    ? <Avatar name={completion.by} size={28} ring="#5CC87A" />
                    : t.assignee
                      ? <Avatar name={t.assignee} size={28} />
                      : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 13 }}>👤</span></div>
                  }
                  {isOwner && (
                    <button onClick={() => setEditing(editing === t.id ? null : t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#444", fontSize: 14, padding: "0 2px" }}>✎</button>
                  )}
                </div>
              </div>

              {/* Picker */}
              {isOpen && (
                <div style={{ padding: "0 16px 13px", borderTop: "1px solid #E8F2F4", paddingTop: 11, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TEAM.map(person => (
                    <button key={person} onClick={() => complete(t.id, person)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 99, border: "1.5px solid #1A5F6A", background: "#E5EBF1", cursor: "pointer" }}>
                      <Avatar name={person} size={22} />
                      <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#1A5F6A" }}>{person}</span>
                    </button>
                  ))}
                  <button onClick={() => setPicker(null)} style={{ padding: "7px 13px", borderRadius: 99, border: "1.5px solid #DDE8EE", background: "#E5EBF1", cursor: "pointer", fontSize: 13, color: "#222", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                </div>
              )}

              {/* Edit panel */}
              {isEditing && (
                <div style={{ padding: "0 16px 14px", borderTop: "1px solid #E4EEF4", paddingTop: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div>
                      <div className="sec-label">Description</div>
                      <SmoothInput value={t.desc} onCommit={v => updateOps(t.id, "desc", v)} placeholder="Details..." />
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
          <div className="lora" style={{ fontSize: 18, color: "#444", fontStyle: "italic" }}>No {activeFreq} tasks yet.</div>
          {isOwner && <button className="btn btn-teal" onClick={addOps} style={{ marginTop: 14 }}>+ Add one</button>}
        </div>
      )}

      {!isOwner && <ValuesCard />}
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
    setData(d => ({ ...d, goals: [...d.goals, { ...ng, id, target: Number(ng.target), current: Number(ng.current), notes: "" }] }));
    setAdding(false);
    setNg({ title: "", category: "Memberships", target: "", current: 0, owner: "Collin", status: "on-track", why: "" });
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
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Goals & Focus</h1>
          <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 2 }}>Edit anything — all changes save automatically.</p>
        </div>
        {isOwner && <button className="btn btn-teal" onClick={() => setAdding(true)}>+ New goal</button>}
      </div>

      {adding && (
        <div className="card-warm" style={{ marginBottom: 20 }}>
          <div className="sec-label">New Goal</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Goal title" value={ng.title} onChange={e => setNg(g => ({ ...g, title: e.target.value }))} />
            <select value={ng.category} onChange={e => setNg(g => ({ ...g, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" placeholder="Current number" value={ng.current} onChange={e => setNg(g => ({ ...g, current: Number(e.target.value) }))} />
            <input type="number" placeholder="Target number" value={ng.target} onChange={e => setNg(g => ({ ...g, target: e.target.value }))} />
            <select value={ng.owner} onChange={e => setNg(g => ({ ...g, owner: e.target.value }))}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
            <select value={ng.status} onChange={e => setNg(g => ({ ...g, status: e.target.value }))}>
              <option value="on-track">On track</option>
              <option value="needs-attention">Needs attention</option>
              <option value="off-track">Off track</option>
            </select>
          </div>
          <textarea placeholder="Why does this goal matter to Ripple Boulder?" rows={2} value={ng.why} onChange={e => setNg(g => ({ ...g, why: e.target.value }))} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={save}>Save goal</button>
            <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.goals.map((g) => {
          const p = pct(g.current, g.target);
          const s = sc[g.status];
          const measures = allMeasures.filter(m => m.goalId === g.id);
          const measuresDone = measures.filter(m => m.done).length;
          const isWIG = g.id === data.wigId;

          return (
            <div key={g.id} className="card" style={{ border: isWIG ? "2px solid #1A5F6A" : "1px solid #DDE8EE", boxShadow: isWIG ? "0 4px 20px rgba(26,95,106,0.12)" : "0 1px 4px rgba(0,0,0,0.04)" }}>

              {/* WIG indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isWIG
                    ? <div style={{ background: "#1A5F6A", color: "#fff", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}>⭐ WILDLY IMPORTANT GOAL</div>
                    : isOwner && <button onClick={() => setData(d => ({ ...d, wigId: g.id }))}
                        style={{ background: "none", border: "1px dashed #ccc", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#888", fontFamily: "Inter, sans-serif", cursor: "pointer" }}>
                        Set as WIG
                      </button>
                  }
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: s.bg, color: s.text }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
                    {g.status === "on-track" ? "On track" : g.status === "needs-attention" ? "Watch" : "Off track"}
                  </span>
                  {isOwner && (
                    <button onClick={() => setData(d => ({ ...d, goals: d.goals.filter(x => x.id !== g.id) }))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16 }}>✕</button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 6 }}>
                {isOwner
                  ? <SmoothInput value={g.title} onCommit={v => updateGoal(g.id, "title", v)}
                      style={{ border: "none", padding: 0, fontSize: 17, fontWeight: 600, fontFamily: "Lora, serif", fontStyle: "italic", background: "transparent", color: "#0D1117", width: "100%" }} />
                  : <div className="lora" style={{ fontSize: 17, fontStyle: "italic", fontWeight: 600, color: "#0D1117" }}>{g.title}</div>
                }
              </div>

              {/* Why — always editable by owner */}
              {isOwner
                ? <SmoothInput value={g.why || ""} onCommit={v => updateGoal(g.id, "why", v)}
                    placeholder="Why does this goal matter? (click to edit)"
                    style={{ border: "none", padding: 0, fontSize: 13, background: "transparent", color: "#555", marginBottom: 14, width: "100%", fontStyle: g.why ? "normal" : "italic" }} />
                : g.why && <p className="inter" style={{ fontSize: 13, color: "#555", marginBottom: 14, lineHeight: 1.5 }}>{g.why}</p>
              }

              {/* Progress numbers */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pfill" style={{ width: `${p}%`, background: isWIG ? "#1A5F6A" : s.bar }} />
                </div>
                {isOwner
                  ? <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div className="inter" style={{ fontSize: 9, color: "#888", marginBottom: 2, fontWeight: 700 }}>CURRENT</div>
                        <input type="number" inputMode="numeric"
                          value={g.current}
                          onChange={e => updateGoal(g.id, "current", Number(e.target.value) || 0)}
                          onFocus={e => e.target.select()}
                          style={{ width: 80, fontSize: 18, textAlign: "center", fontWeight: 800, color: "#1A5F6A", border: "2px solid #1A5F6A", background: "#fff", borderRadius: 10, padding: "6px 4px", fontFamily: "Inter, sans-serif", outline: "none", WebkitTextFillColor: "#1A5F6A", WebkitBoxShadow: "0 0 0px 1000px #fff inset" }} />
                      </div>
                      <span className="inter" style={{ fontSize: 20, color: "#ccc", fontWeight: 300 }}>/</span>
                      <div style={{ textAlign: "center" }}>
                        <div className="inter" style={{ fontSize: 9, color: "#888", marginBottom: 2, fontWeight: 700 }}>TARGET</div>
                        <input type="number" inputMode="numeric"
                          value={g.target}
                          onChange={e => updateGoal(g.id, "target", Number(e.target.value) || 0)}
                          onFocus={e => e.target.select()}
                          style={{ width: 80, fontSize: 18, textAlign: "center", fontWeight: 800, color: "#333", border: "2px solid #DDE8EE", background: "#F6F9FB", borderRadius: 10, padding: "6px 4px", fontFamily: "Inter, sans-serif", outline: "none", WebkitTextFillColor: "#333", WebkitBoxShadow: "0 0 0px 1000px #F6F9FB inset" }} />
                      </div>
                    </div>
                  : <span className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#0D1117", whiteSpace: "nowrap" }}>{fmt(g.current)} / {fmt(g.target)}</span>
                }
              </div>

              <div className="inter" style={{ fontSize: 12, fontWeight: 700, color: isWIG ? "#1A5F6A" : s.text, marginBottom: 14 }}>{p}% complete</div>

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
                {isOwner && <button onClick={() => addMeasure(g.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>+ Add action</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {measures.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: m.done ? "#F0FBF0" : "#F6F9FB", borderRadius: 8, border: `1px solid ${m.done ? "#C8E6C9" : "#CCD5DE"}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.done ? "#5CC87A" : "#999", flexShrink: 0 }} />
                    {isOwner
                      ? <SmoothInput value={m.title} onCommit={v => updateMeasure(m.id, "title", v)} style={{ flex: 1, border: "none", padding: 0, fontSize: 13, fontWeight: 500, background: "transparent", color: "#0D1117" }} />
                      : <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#0D1117" }}>{m.title}</span>
                    }
                    {isOwner && <span className="inter" style={{ fontSize: 11, color: "#555" }}>{m.unit}</span>}
                    {m.type === "checkbox"
                      ? <input type="checkbox" checked={!!m.val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} />
                      : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <SmoothNumber value={m.val} onCommit={v => updateLog(m.goalId, m.id, v)} style={{ width: 54 }} />
                          <span className="inter" style={{ fontSize: 11, color: "#555" }}>/ {m.target}</span>
                        </div>
                    }
                    {isOwner && <button onClick={() => deleteMeasure(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 14 }}>✕</button>}
                  </div>
                ))}
                {measures.length === 0 && isOwner && (
                  <p className="inter" style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>No weekly actions yet — add one above.</p>
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
  const today = todayKey();
  const oneWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const open = data.tasks.filter(t => t.status !== "done");
  const done = data.tasks.filter(t => t.status === "done");
  const overdue = open.filter(t => t.due && t.due < today);
  const thisWeek = open.filter(t => t.due && t.due >= today && t.due <= oneWeek);
  const later = open.filter(t => !t.due || t.due > oneWeek);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Tasks</h1>
        <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 2 }}>{open.length} open · {done.length} done</p>
      </div>
      <TasksTab data={data} setData={setData} updateTask={updateTask} isOwner={isOwner} TEAM={TEAM} open={open} done={done} overdue={overdue} thisWeek={thisWeek} later={later} today={today} />
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#E5EBF1", border: `1px solid ${isOverdue ? "#FFCDD2" : "#CCD5DE"}`, borderRadius: 10, opacity: t.status === "done" ? 0.45 : 1 }}>
        <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} style={{ width: 18, height: 18 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {isOwner
            ? <SmoothInput value={t.title} onCommit={v => updateTask(t.id, "title", v)} style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent", textDecoration: t.status === "done" ? "line-through" : "none" }} />
            : <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#0D1117", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
          }
          <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
            <span className="badge" style={{ background: pc[t.priority].bg, color: pc[t.priority].text }}>{t.priority}</span>
            {t.due && <span className="inter" style={{ fontSize: 11, color: isOverdue ? "#C62828" : "#222" }}>{isOverdue ? "⚠ " : ""}Due {t.due}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isOwner ? (
            <>
              <select value={t.assignee} onChange={e => updateTask(t.id, "assignee", e.target.value)} style={{ width: "auto", fontSize: 12 }}>{TEAM.map(p => <option key={p}>{p}</option>)}</select>
              <input type="date" value={t.due || ""} onChange={e => updateTask(t.id, "due", e.target.value)} style={{ width: 120, fontSize: 12 }} />
              <button onClick={() => setData(d => ({ ...d, tasks: d.tasks.filter(x => x.id !== t.id) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 16 }}>✕</button>
            </>
          ) : (
            <>{t.assignee && <Avatar name={t.assignee} size={28} />}{t.due && <span className="inter" style={{ fontSize: 11, color: isOverdue ? "#C62828" : "#222" }}>{t.due}</span>}</>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ label, tasks, accent }) => tasks.length === 0 ? null : (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
        <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#222", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <span className="inter" style={{ fontSize: 12, color: "#444" }}>{tasks.length}</span>
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
      {filteredOpen.length === 0 && <div style={{ textAlign: "center", padding: "32px 0" }}><div className="lora" style={{ fontSize: 18, color: "#444", fontStyle: "italic" }}>All clear! 🌊</div></div>}
      <Section label="Overdue / Today" tasks={filteredOverdue} accent="#EF5350" />
      <Section label="This Week" tasks={filteredThisWeek} accent="#FFC107" />
      <Section label="Later" tasks={filteredLater} accent="#B0B0A8" />
      {done.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="inter" style={{ fontSize: 12, color: "#444", cursor: "pointer", padding: "8px 0" }}>Show {done.length} completed</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>{done.map(t => <TaskRow key={t.id} t={t} />)}</div>
        </details>
      )}
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────
function ScoreboardPage({ data, setData, isOwner, TEAM }) {
  const wk = weekKey();
  const today = todayKey();
  const wigGoal = data.goals.find(g => g.id === data.wigId) || data.goals[0];
  const wigPct = wigGoal ? pct(wigGoal.current, wigGoal.target) : 0;
  const contributions = data.contributions || {};
  const weekContribs = contributions[wk] || {};
  const suggestions = (data.weeklySuggestions || []).filter(s => s.active);

  // Ops completed today per person
  const opsToday = {};
  TEAM.forEach(p => { opsToday[p] = 0; });
  (data.opsTasks || []).forEach(t => {
    const c = t.completions?.[today];
    if (c?.by && opsToday[c.by] !== undefined) opsToday[c.by]++;
  });
  const totalDailyOps = (data.opsTasks || []).filter(t => ["opening","midday","closing"].includes(t.freq)).length;

  // Lead measures for the WIG
  const wigMeasures = data.leadMeasures.filter(m => m.goalId === wigGoal?.id);

  const addAction = (person, text) => {
    if (!text.trim()) return;
    setData(d => {
      const wkData = d.contributions?.[wk] || {};
      const pd = wkData[person] || { actions: [] };
      return { ...d, contributions: { ...d.contributions, [wk]: { ...wkData, [person]: { ...pd, actions: [...pd.actions, { text: text.trim(), ts: new Date().toISOString() }] } } } };
    });
  };
  const removeAction = (person, idx) => setData(d => {
    const wkData = d.contributions?.[wk] || {};
    const pd = wkData[person] || { actions: [] };
    return { ...d, contributions: { ...d.contributions, [wk]: { ...wkData, [person]: { ...pd, actions: pd.actions.filter((_, i) => i !== idx) } } } };
  });
  const updateSuggestion = (id, text) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).map(s => s.id === id ? { ...s, text } : s) }));
  const addSuggestion = () => setData(d => ({ ...d, weeklySuggestions: [...(d.weeklySuggestions||[]), { id: `ws${Date.now()}`, text: "New focus for the team", active: true }] }));
  const toggleSuggestion = (id) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).map(s => s.id === id ? { ...s, active: !s.active } : s) }));
  const removeSuggestion = (id) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).filter(s => s.id !== id) }));

  const milestones = [
    { pct: 0,   emoji: "🚀", msg: "Every shift counts. Let's build this together!" },
    { pct: 25,  emoji: "🌱", msg: "Momentum is building — keep showing up!" },
    { pct: 50,  emoji: "🔥", msg: "Halfway there. The team is making it happen!" },
    { pct: 75,  emoji: "⚡", msg: "So close — one final push together!" },
    { pct: 100, emoji: "🏆", msg: "WE DID IT! Goal complete!" },
  ];
  const milestone = [...milestones].reverse().find(m => wigPct >= m.pct) || milestones[0];
  const totalWins = TEAM.reduce((s, p) => s + ((weekContribs[p]?.actions?.length) || 0), 0);
  const totalOpsToday = Object.values(opsToday).reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Team Scoreboard 🏔️</h1>
        <p className="inter" style={{ fontSize: 13, color: "#555", marginTop: 3 }}>Your daily work is what moves us forward.</p>
      </div>

      {/* WIG HERO */}
      {wigGoal && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0A3540 100%)", borderRadius: 20, padding: "22px 22px 20px", marginBottom: 20, boxShadow: "0 6px 24px rgba(26,95,106,0.22)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
          <div className="inter" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 6 }}>⭐ Our Wildly Important Goal</div>
          <div className="lora" style={{ fontSize: 20, fontStyle: "italic", color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>{wigGoal.title}</div>
          {wigGoal.why && <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 16, lineHeight: 1.5 }}>{wigGoal.why}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.12)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${wigPct}%`, height: "100%", background: "linear-gradient(90deg, #7DD3B8, #4DB896)", borderRadius: 99, transition: "width 0.8s" }} />
            </div>
            <div className="lora" style={{ fontSize: 28, color: "#7DD3B8", lineHeight: 1, flexShrink: 0 }}>{wigPct}%</div>
          </div>
          <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>{fmt(wigGoal.current)} of {fmt(wigGoal.target)}</div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{milestone.emoji}</span>
            <span className="inter" style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{milestone.msg}</span>
          </div>

          {/* Team quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
            {[
              { label: "Wins this week", value: totalWins, emoji: "🌿" },
              { label: "Ops done today", value: `${totalOpsToday}/${totalDailyOps}`, emoji: "✅" },
              { label: "Days to opening", value: data.openingDate ? Math.max(0, Math.ceil((new Date(data.openingDate) - new Date()) / 86400000)) : "—", emoji: "📅" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{s.emoji}</div>
                <div className="lora" style={{ fontSize: 20, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                <div className="inter" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead measures — the scoreboard of what moves the WIG */}
      {wigMeasures.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="sec-label" style={{ marginBottom: 14 }}>What moves the goal 🎯</div>
          <p className="inter" style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.5 }}>
            These are the specific actions our team takes every week that directly grow our membership and push us toward our goal.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {wigMeasures.map(m => {
              const val = data.weeklyLogs[m.goalId]?.[m.id] ?? 0;
              const done = m.type === "checkbox" ? !!val : Number(val) >= m.target;
              const progress = m.type === "checkbox" ? (done ? 100 : 0) : Math.min(100, Math.round((Number(val) / m.target) * 100));
              return (
                <div key={m.id} style={{ padding: "14px 16px", background: done ? "linear-gradient(135deg, #F0FBF5, #E8F9F0)" : "#F6F9FB", borderRadius: 12, border: `1.5px solid ${done ? "#A8DCC0" : "#DDE8EE"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#4CAF50" : "#1A5F6A", flexShrink: 0 }} />
                      <span className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#0D1117" }}>{m.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {m.type !== "checkbox" && (
                        <SmoothNumber value={val} onCommit={v => setData(d => ({ ...d, weeklyLogs: { ...d.weeklyLogs, [m.goalId]: { ...d.weeklyLogs[m.goalId], [m.id]: v } } }))}
                          style={{ width: 52, textAlign: "center", fontSize: 14, fontWeight: 700, color: done ? "#2E7D32" : "#1A5F6A" }} />
                      )}
                      <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: done ? "#2E7D32" : "#888" }}>
                        {m.type === "checkbox" ? (done ? "✓ Done" : "—") : `/ ${m.target}`}
                      </span>
                      {m.type === "checkbox" && (
                        <input type="checkbox" checked={!!val} onChange={e => setData(d => ({ ...d, weeklyLogs: { ...d.weeklyLogs, [m.goalId]: { ...d.weeklyLogs[m.goalId], [m.id]: e.target.checked } } }))} />
                      )}
                    </div>
                  </div>
                  <div style={{ height: 5, background: "#E0EAF0", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: done ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                  {m.unit && <div className="inter" style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{m.unit} · week of {wk}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* This week's focus — what the team should do */}
      {(suggestions.length > 0 || isOwner) && (
        <div style={{ background: "linear-gradient(135deg, #F0FBF5, #E8F4FF)", border: "1px solid #C8E8D8", borderRadius: 18, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div className="sec-label" style={{ color: "#1A5F6A", marginBottom: 3 }}>This week's focus</div>
              <div className="lora" style={{ fontSize: 17, fontStyle: "italic", color: "#0D1117" }}>Ways YOU can help us win 🌱</div>
            </div>
            {isOwner && <button onClick={addSuggestion} style={{ background: "none", border: "1px solid #1A5F6A", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>+ Add</button>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(isOwner ? (data.weeklySuggestions || []) : suggestions).map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: s.active ? "#fff" : "rgba(255,255,255,0.4)", borderRadius: 10, border: `1px solid ${s.active ? "#B8E0CC" : "#D8ECE4"}`, opacity: s.active ? 1 : 0.5 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{["💚","🌟","🤝","💡","📸","🗣️","🧗","✨"][i % 8]}</span>
                {isOwner
                  ? <SmoothInput value={s.text} onCommit={v => updateSuggestion(s.id, v)} style={{ flex: 1, border: "none", padding: 0, fontSize: 13, background: "transparent", color: "#1A2530", fontWeight: 500, WebkitTextFillColor: "#1A2530" }} />
                  : <span className="inter" style={{ flex: 1, fontSize: 14, color: "#1A2530", fontWeight: 500, lineHeight: 1.5 }}>{s.text}</span>
                }
                {isOwner && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleSuggestion(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#1A5F6A", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{s.active ? "Hide" : "Show"}</button>
                    <button onClick={() => removeSuggestion(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 14 }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team cards — personal contribution tracker */}
      <div>
        <div className="sec-label" style={{ marginBottom: 14 }}>Team contributions this week 🙌</div>
        <p className="inter" style={{ fontSize: 12, color: "#555", marginBottom: 16, lineHeight: 1.5 }}>Every conversation, every connection, every great experience you create — log it here. This is how the team sees the impact of your work.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TEAM.map(person => {
            const pd = weekContribs[person] || { actions: [] };
            const opsCount = opsToday[person] || 0;
            const actionCount = pd.actions?.length || 0;
            const color = avatarColor(person);
            const opsPct = totalDailyOps ? Math.round((opsCount / totalDailyOps) * 100) : 0;
            const [input, setInput] = useState("");
            const [showInput, setShowInput] = useState(false);

            return (
              <div key={person} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
                    <span className="inter" style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{initials(person)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="lora" style={{ fontSize: 18, color: "#fff", fontStyle: "italic" }}>{person}</div>
                    <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                      {actionCount > 0 ? `${actionCount} contribution${actionCount !== 1 ? "s" : ""} logged 🌿` : "Ready to make a move!"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 12px", flexShrink: 0 }}>
                    <div className="lora" style={{ fontSize: 20, color: "#fff", lineHeight: 1 }}>{opsCount}</div>
                    <div className="inter" style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em" }}>ops today</div>
                  </div>
                </div>
                <div style={{ height: 4, background: "#EEF4F7" }}>
                  <div style={{ width: `${opsPct}%`, height: "100%", background: `${color}99`, transition: "width 0.5s" }} />
                </div>

                <div style={{ padding: "14px 18px" }}>
                  {actionCount > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                      {pd.actions.map((a, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: "linear-gradient(135deg, #F0FBF5, #E8F4FF)", borderRadius: 8, border: "1px solid #C8E8D8" }}>
                          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🌿</span>
                          <span className="inter" style={{ flex: 1, fontSize: 13, color: "#0D1117", lineHeight: 1.5, fontWeight: 500 }}>{a.text}</span>
                          <span className="inter" style={{ fontSize: 10, color: "#5A8A6A", whiteSpace: "nowrap" }}>{new Date(a.ts || a.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          {isOwner && <button onClick={() => removeAction(person, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 13 }}>✕</button>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px 0 12px" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>✨</div>
                      <p className="inter" style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>Nothing logged yet — what did {person.split(" ")[0]} do to move us closer?</p>
                    </div>
                  )}

                  {showInput ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input autoFocus value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && input.trim()) { addAction(person, input); setInput(""); setShowInput(false); } if (e.key === "Escape") setShowInput(false); }}
                        placeholder={`What did ${person.split(" ")[0]} do to move us toward ${fmt(wigGoal?.target)} members?`}
                        style={{ flex: 1, fontSize: 13, color: "#0D1117", background: "#fff", border: `2px solid ${color}`, borderRadius: 10, padding: "10px 14px", fontFamily: "Inter, sans-serif", outline: "none", fontWeight: 500, WebkitTextFillColor: "#0D1117", WebkitBoxShadow: "0 0 0px 1000px #fff inset" }} />
                      <button onClick={() => { if (input.trim()) { addAction(person, input); setInput(""); } setShowInput(false); }}
                        style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 700, flexShrink: 0 }}>Save</button>
                      <button onClick={() => { setShowInput(false); setInput(""); }}
                        style={{ background: "#F6F9FB", border: "1px solid #DDE8EE", borderRadius: 10, padding: "10px 12px", cursor: "pointer", fontSize: 14, color: "#555", flexShrink: 0 }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowInput(true)}
                      style={{ width: "100%", background: `${color}0D`, border: `1.5px dashed ${color}55`, borderRadius: 10, padding: "11px 16px", cursor: "pointer", fontSize: 13, color: color, fontFamily: "Inter, sans-serif", fontWeight: 700, textAlign: "center", touchAction: "manipulation" }}>
                      + Log a contribution for {person.split(" ")[0]} 🌿
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
  const addItem = (cat) => setData(d => ({ ...d, openingChecklist: [...d.openingChecklist, { id: `oc${Date.now()}`, category: cat, item: "New item", done: false, owner: TEAM[0], notes: "" }] }));
  const removeItem = (id) => setData(d => ({ ...d, openingChecklist: d.openingChecklist.filter(x => x.id !== id) }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Opening Roadmap</h1>
          <p className="inter" style={{ fontSize: 13, color: "#333", marginTop: 2 }}>Everything that needs to happen before we open.</p>
        </div>
        {openingDays !== null && (
          <div style={{ textAlign: "right", background: openingDays <= 14 ? "#FFEBEE" : "#E8F2F4", border: `1px solid ${openingDays <= 14 ? "#FFCDD2" : "#B2D8DD"}`, borderRadius: 12, padding: "10px 16px" }}>
            <div className="lora" style={{ fontSize: 28, color: openingDays <= 14 ? "#C62828" : "#1A5F6A", lineHeight: 1 }}>{openingDays > 0 ? openingDays : "🎉"}</div>
            <div className="inter" style={{ fontSize: 11, color: "#333", marginTop: 2 }}>{openingDays > 0 ? "days to go" : "We\'re open!"}</div>
            {isOwner && <input type="date" value={data.openingDate || ""} onChange={e => setData(d => ({ ...d, openingDate: e.target.value }))}
              style={{ fontSize: 11, border: "none", background: "transparent", color: "#888", marginTop: 4, cursor: "pointer", WebkitTextFillColor: "#888" }} />}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#0D1117" }}>{doneCount} of {items.length} complete</span>
          <span className="lora" style={{ fontSize: 22, color: pctDone === 100 ? "#2E7D32" : "#1A5F6A" }}>{pctDone}%</span>
        </div>
        <div style={{ height: 8, background: "#EEF4F7", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pctDone}%`, height: "100%", background: pctDone === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        {pctDone === 100 && <p className="inter" style={{ fontSize: 13, color: "#2E7D32", marginTop: 8, fontWeight: 700 }}>🎉 Ready to open!</p>}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All owners</option>
          {TEAM.map(t => <option key={t}>{t}</option>)}
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
                  <span className="inter" style={{ fontSize: 14, fontWeight: 700, color: "#0D1117" }}>{cat}</span>
                  <span className="inter" style={{ fontSize: 11, color: "#555" }}>{catDone}/{catItems.length}</span>
                  <div style={{ width: 48, height: 4, background: "#EEF4F7", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${cp}%`, height: "100%", background: cp === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99 }} />
                  </div>
                </div>
                {isOwner && <button onClick={() => addItem(cat)} style={{ background: "none", border: "1px solid #DDE8EE", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, color: "#333", fontFamily: "Inter, sans-serif" }}>+ Add</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: item.done ? "#F0FBF0" : "#fff", border: `1px solid ${item.done ? "#C8E6C9" : "#DDE8EE"}`, borderRadius: 10, opacity: item.done ? 0.75 : 1 }}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} style={{ width: 20, height: 20, accentColor: "#1A5F6A", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      {isOwner
                        ? <SmoothInput value={item.item} onCommit={v => updateItem(item.id, "item", v)}
                            style={{ border: "none", padding: 0, fontSize: 14, fontWeight: item.done ? 400 : 500, background: "transparent", color: item.done ? "#888" : "#0D1117", textDecoration: item.done ? "line-through" : "none", WebkitTextFillColor: item.done ? "#888" : "#0D1117", width: "100%" }} />
                        : <span className="inter" style={{ fontSize: 14, fontWeight: item.done ? 400 : 500, color: item.done ? "#888" : "#0D1117", textDecoration: item.done ? "line-through" : "none" }}>{item.item}</span>
                      }
                    </div>
                    {isOwner && (
                      <select value={item.owner} onChange={e => updateItem(item.id, "owner", e.target.value)} style={{ fontSize: 12, width: "auto", flexShrink: 0 }}>
                        {TEAM.map(t => <option key={t}>{t}</option>)}
                      </select>
                    )}
                    {!isOwner && <Avatar name={item.owner} size={26} />}
                    {isOwner && <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, flexShrink: 0 }}>✕</button>}
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

function MembersPage({ data, setData }) {
  const members = data.foundingMembers || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const types = [...new Set(members.map(m => m.type))].sort();
  const filtered = members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.type === filterType;
    return matchSearch && matchType;
  });

  const byType = types.map(t => ({ type: t, count: members.filter(m => m.type === t).length }));
  const totalDisplay = data.manualMembershipCount !== undefined ? data.manualMembershipCount : members.length;

  const addMember = () => setData(d => ({
    ...d,
    foundingMembers: [{ id: `manual_${Date.now()}`, name: "New Member", email: "", date: new Date().toISOString().split("T")[0], type: "Founding Monthly — Individual", people: 1 }, ...(d.foundingMembers || [])]
  }));
  const updateMember = (id, f, v) => setData(d => ({ ...d, foundingMembers: d.foundingMembers.map(m => m.id === id ? { ...m, [f]: v } : m) }));
  const removeMember = (id) => { if (window.confirm("Remove this member?")) setData(d => ({ ...d, foundingMembers: d.foundingMembers.filter(m => m.id !== id) })); };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Members</h1>
          <p className="inter" style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Founding members · SUCCEEDED transactions only</p>
        </div>
        <button className="btn btn-teal" onClick={addMember} style={{ fontSize: 13, padding: "9px 18px" }}>+ Add</button>
      </div>

      {/* Big count card */}
      <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0A3540 100%)", borderRadius: 18, padding: "22px 24px", marginBottom: 20, boxShadow: "0 6px 24px rgba(26,95,106,0.2)" }}>
        <div className="inter" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Total Memberships</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <input type="number" inputMode="numeric"
            value={totalDisplay}
            onChange={e => setData(d => ({ ...d, manualMembershipCount: Number(e.target.value) || 0 }))}
            onFocus={e => e.target.select()}
            style={{ width: 120, fontSize: 52, textAlign: "center", fontWeight: 800, color: "#7DD3B8", border: "none", background: "transparent", fontFamily: "Lora, Georgia, serif", outline: "none", WebkitTextFillColor: "#7DD3B8", WebkitBoxShadow: "0 0 0px 1000px transparent inset", padding: 0, lineHeight: 1 }} />
          <div>
            <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Tap the number to edit</div>
            <div className="inter" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{members.length} imported from Beta · {members.reduce((s, m) => s + (m.people || 1), 0)} people covered</div>
          </div>
        </div>
      </div>

      {/* Type breakdown — editable */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="sec-label" style={{ marginBottom: 14 }}>Breakdown by Type</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byType.map(t => {
            const overrideKey = `typeCount_${t.type.replace(/\s+/g, "_")}`;
            const displayCount = data[overrideKey] !== undefined ? data[overrideKey] : t.count;
            const barPct = totalDisplay > 0 ? Math.min(100, Math.round((displayCount / totalDisplay) * 100)) : 0;
            const label = t.type.replace("Founding ", "").replace(" — ", " · ");
            return (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="inter" style={{ fontSize: 13, color: "#0D1117", flex: 1, fontWeight: 500 }}>{label}</span>
                <div style={{ width: 100, height: 6, background: "#EEF4F7", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ width: `${barPct}%`, height: "100%", background: "#1A5F6A", borderRadius: 99, transition: "width 0.4s" }} />
                </div>
                <input type="number" inputMode="numeric"
                  value={displayCount}
                  onChange={e => setData(d => ({ ...d, [overrideKey]: Number(e.target.value) || 0 }))}
                  onFocus={e => e.target.select()}
                  style={{ width: 52, fontSize: 14, textAlign: "center", fontWeight: 700, color: "#1A5F6A", border: "1.5px solid #1A5F6A", background: "#fff", borderRadius: 8, padding: "5px 0", fontFamily: "Inter, sans-serif", outline: "none", WebkitTextFillColor: "#1A5F6A", WebkitBoxShadow: "0 0 0px 1000px #fff inset", flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name or email..."
          style={{ flex: 1, minWidth: 200, fontSize: 14, padding: "11px 14px", border: "1.5px solid #DDE8EE", borderRadius: 12, outline: "none", fontFamily: "Inter, sans-serif", WebkitTextFillColor: "#0D1117", background: "#fff", color: "#0D1117", WebkitBoxShadow: "0 0 0px 1000px #fff inset" }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ width: "auto", fontSize: 13, borderRadius: 12, border: "1.5px solid #DDE8EE" }}>
          <option value="all">All types</option>
          {types.map(t => <option key={t} value={t}>{t.replace("Founding ", "").replace(" — ", " · ")}</option>)}
        </select>
      </div>

      <div className="inter" style={{ fontSize: 12, color: "#555", marginBottom: 12, fontWeight: 500 }}>
        Showing {filtered.length} of {members.length} members
      </div>

      {/* Member list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(m => {
          const color = avatarColor(m.name);
          const isOpen = expanded === m.id;
          return (
            <div key={m.id} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s" }}>
              {/* Row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                onClick={() => setExpanded(isOpen ? null : m.id)}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="inter" style={{ fontSize: 13, fontWeight: 800, color }}>{initials(m.name)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#0D1117" }}>{m.name}</div>
                  <div className="inter" style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{m.email}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="inter" style={{ fontSize: 11, fontWeight: 700, color, background: `${color}12`, padding: "2px 8px", borderRadius: 99 }}>
                    {m.type.replace("Founding ", "").replace(" — ", " · ")}
                  </div>
                  <div className="inter" style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{m.date}</div>
                </div>
                <span style={{ color: "#bbb", fontSize: 14, flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>

              {/* Expanded edit panel */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #EEF4F7", padding: "14px 16px", background: "#F8FBFC", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="g2">
                    <div>
                      <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</div>
                      <SmoothInput value={m.name} onCommit={v => updateMember(m.id, "name", v)} style={{ fontSize: 14, fontWeight: 500, color: "#0D1117", WebkitTextFillColor: "#0D1117" }} />
                    </div>
                    <div>
                      <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</div>
                      <SmoothInput value={m.email} onCommit={v => updateMember(m.id, "email", v)} style={{ fontSize: 13, color: "#555", WebkitTextFillColor: "#555" }} />
                    </div>
                    <div>
                      <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</div>
                      <input type="date" value={m.date} onChange={e => updateMember(m.id, "date", e.target.value)} style={{ fontSize: 13, width: "100%" }} />
                    </div>
                    <div>
                      <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>People</div>
                      <input type="number" value={m.people || 1} min={1} max={10}
                        onChange={e => updateMember(m.id, "people", Number(e.target.value))}
                        style={{ fontSize: 14, width: "100%", fontWeight: 700, color: "#1A5F6A", WebkitTextFillColor: "#1A5F6A" }} />
                    </div>
                  </div>
                  <div>
                    <div className="inter" style={{ fontSize: 10, fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Membership Type</div>
                    <select value={m.type} onChange={e => updateMember(m.id, "type", e.target.value)} style={{ fontSize: 13, width: "100%" }}>
                      <option>Founding Monthly — Individual</option>
                      <option>Founding Monthly — Couple</option>
                      <option>Founding Monthly — Family (Couple + Child)</option>
                      <option>Founding Monthly — Family (Couple + 2 Children)</option>
                      <option>Founding Monthly — Family (Couple + 3 Children)</option>
                      <option>Founding Annual — Individual</option>
                      <option>Founding Annual — Couple</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => removeMember(m.id)}
                      style={{ background: "none", border: "1px solid #FFCDD2", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: "#C62828", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                      Remove member
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div className="lora" style={{ fontSize: 18, color: "#555", fontStyle: "italic" }}>No members match your search.</div>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ data, setData }) {
  const team = data.team || TEAM;
  const updateName = (idx, val) => { const next = [...team]; next[idx] = val; setData(d => ({ ...d, team: next })); };
  const addPerson = () => setData(d => ({ ...d, team: [...(d.team||TEAM), "New person"] }));
  const removePerson = (idx) => setData(d => ({ ...d, team: (d.team||TEAM).filter((_, i) => i !== idx) }));

  const inputStyle = {
    flex: 1,
    fontWeight: 500,
    fontSize: 14,
    color: "#0D1117",
    background: "#E5EBF1",
    border: "1px solid #E0DDD6",
    borderRadius: 9,
    padding: "10px 14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    WebkitTextFillColor: "#0D1117",
    WebkitBoxShadow: "0 0 0px 1000px #F8F7F4 inset",
    transition: "border-color 0.12s",
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#0D1117" }}>Settings</h1>
        <p className="inter" style={{ fontSize: 13, color: "#222", marginTop: 2 }}>Manage your team and preferences.</p>
      </div>

      <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
        <div className="sec-label">Your name</div>
        <SmoothInput
          value={data.currentUser}
          onCommit={v => setData(d => ({ ...d, currentUser: v }))}
          autoComplete="off"
          style={{ ...inputStyle, marginBottom: 4 }}
        />
        <p className="inter" style={{ fontSize: 11, color: "#222", marginTop: 6 }}>Shown in greetings and the staff view.</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="sec-label" style={{ marginBottom: 0 }}>Team members</div>
          <button className="btn btn-teal" onClick={addPerson} style={{ padding: "6px 14px", fontSize: 12 }}>+ Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {team.map((name, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={name} size={36} />
              <SmoothInput
                value={name}
                onCommit={v => updateName(idx, v)}
                autoComplete="off"
                style={inputStyle}
              />
              <button onClick={() => removePerson(idx)}
                style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 8, padding: "8px 13px", cursor: "pointer", fontSize: 13, color: "#C62828", fontFamily: "Inter, sans-serif", fontWeight: 500, flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
