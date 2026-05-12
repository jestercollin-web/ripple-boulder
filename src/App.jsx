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
const fmt = (n) => n >= 1000 ? "$" + (n / 1000).toFixed(1) + "K" : String(n);
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
    color: "#1C1C1A",
    background: "#fff",
    border: "1px solid #D0DCE4",
    borderRadius: 9,
    padding: "8px 11px",
    outline: "none",
    width: "100%",
    WebkitTextFillColor: "#1C1C1A",
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
        color: "#1C1C1A",
        background: "#fff",
        border: "1px solid #D0DCE4",
        borderRadius: 9,
        padding: "6px 8px",
        outline: "none",
        textAlign: "center",
        WebkitTextFillColor: "#1C1C1A",
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
        color: "#1C1C1A",
        background: "transparent",
        border: "none",
        outline: "none",
        width: "100%",
        resize: "none",
        lineHeight: 1.6,
        WebkitTextFillColor: "#1C1C1A",
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

  // Auto-sync founding member count from real Beta data
  const realFoundingCount = (data.foundingMembers || []).length;
  const goalsWithRealCount = data.goals.map(g =>
    g.title.toLowerCase().includes("founding") ? { ...g, current: realFoundingCount } : g
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

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F6F9FB", minHeight: "100vh", color: "#1C1C1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F6F9FB; }
        .lora { font-family: 'Lora', Georgia, serif; }
        .inter { font-family: 'Inter', system-ui, sans-serif; }
        .card { background: #fff; border: 1px solid #DDE8EE; border-radius: 14px; padding: 20px 22px; }
        .card-warm { background: #F4F8FB; border: 1px solid #D8E8F0; border-radius: 14px; padding: 20px 22px; }
        .btn { border: 1px solid #D0DCE4; background: #fff; border-radius: 9px; padding: 9px 18px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; color: #2C2C28; transition: all 0.12s; }
        .btn:hover { background: #EEF4F7; }
        .btn-teal { background: #1A5F6A; color: #fff; border-color: #1A5F6A; }
        .btn-teal:hover { background: #164F58; }
        .pbar { height: 5px; border-radius: 99px; background: #E4EEF4; overflow: hidden; }
        .pfill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0.01em; }
        input[type=text], input[type=number], input[type=date], select, textarea { border: 1px solid #D0DCE4; border-radius: 9px; padding: 8px 11px; font-family: 'Inter', sans-serif; font-size: 13px; background: #fff; color: #1C1C1A; outline: none; width: 100%; -webkit-text-fill-color: #1C1C1A; }
        input:focus, select:focus, textarea:focus { border-color: #1A5F6A; box-shadow: 0 0 0 3px rgba(26,95,106,0.1); }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0px 1000px #fff inset !important; -webkit-text-fill-color: #1C1C1A !important; border-color: #D0DCE4; }
        input[type=checkbox] { width: 17px; height: 17px; cursor: pointer; accent-color: #1A5F6A; flex-shrink: 0; }
        .sec-label { font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8A9AAA; margin-bottom: 10px; }
        hr.divider { border: none; border-top: 1px solid #E4EEF4; margin: 16px 0; }
        .avatar { display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; font-family: 'Inter', sans-serif; font-weight: 700; color: #fff; }
        @media(max-width:680px) { .g2{grid-template-columns:1fr!important} .g3{grid-template-columns:1fr 1fr!important} .hide-sm{display:none!important} }
      `}</style>

      {/* Loading */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#F6F9FB", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ textAlign: "center" }}>
            <img src="/logo.svg" alt="Ripple Boulder" style={{ height: 56, marginBottom: 16, opacity: 0.8 }} />
            <div className="inter" style={{ fontSize: 13, color: "#9C9888" }}>Getting things ready…</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E4EEF4", position: "sticky", top: 0, zIndex: 100 }}>
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
            <div style={{ width: 1, height: 16, background: "#DDE8EE", margin: "0 8px" }} />
            <button onClick={() => { setData(d => ({ ...d, viewMode: d.viewMode === "owner" ? "staff" : "owner" })); setNav(isOwner ? "ops" : "home"); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9C9888", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Switch view
            </button>
          </nav>
          {/* Mobile */}
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ display: "none", background: "none", border: "1px solid #DDE8EE", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 20, color: "#555", lineHeight: 1 }}
            className="hide-sm" id="mobile-toggle">
            {menuOpen ? "✕" : "☰"}
          </button>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "1px solid #DDE8EE", borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontSize: 18, color: "#555", lineHeight: 1 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        {menuOpen && (
          <div style={{ borderTop: "1px solid #E4EEF4", background: "#fff" }}>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setNav(item.key); setMenuOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 20px", background: nav === item.key ? "#F0F8F9" : "none", border: "none", borderBottom: "1px solid #EEF4F7", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 15, color: nav === item.key ? "#1A5F6A" : "#1C1C1A", fontWeight: nav === item.key ? 600 : 400 }}>
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
        {nav === "home"       && (isOwner ? <OwnerHome data={{...data, goals: goalsWithRealCount}} setData={setData} updateGoal={updateGoal} TEAM={TEAM} setNav={setNav} /> : <StaffHome data={data} setData={setData} updateLog={updateLog} updateTask={updateTask} TEAM={TEAM} setNav={setNav} />)}
        {nav === "ops"        && <OpsPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "goals"      && <GoalsPage data={{...data, goals: goalsWithRealCount}} setData={setData} updateGoal={updateGoal} updateLog={updateLog} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "opening"    && <OpeningPage data={data} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "members"    && <MembersPage data={data} setData={setData} />}
        {nav === "scoreboard" && <ScoreboardPage data={{...data, goals: goalsWithRealCount}} setData={setData} isOwner={isOwner} TEAM={TEAM} />}
        {nav === "settings"   && isOwner && <SettingsPage data={data} setData={setData} />}
      </main>

      <footer style={{ borderTop: "1px solid #E4EEF4", padding: "24px 20px", textAlign: "center", marginTop: 40 }}>
        <p className="inter" style={{ fontSize: 12, color: "#A8B8C4" }}>Ripple Boulder · Broad Ripple, Indianapolis · built for the team 🌊</p>
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
              style={{ width: "auto", fontSize: 12, border: "1px solid #DDE8EE", borderRadius: 8, padding: "4px 8px", background: "#fff", cursor: "pointer", marginLeft: 12, flexShrink: 0 }}>
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
          <div key={s.label} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 12, padding: "16px 18px" }}>
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
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.done ? "#4CAF50" : "#E4EEF4" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand values */}
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
            <div style={{ width: 72, height: 4, background: "#E4EEF4", borderRadius: 99, overflow: "hidden" }}>
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
              <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#DDE8EE"}`, borderRadius: 12, overflow: "hidden", transition: "all 0.15s" }}>
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
                      style={{ padding: "8px 14px", borderRadius: 99, border: "1.5px solid #DDE8EE", background: "#fff", cursor: "pointer", fontSize: 13, color: "#9C9888", fontFamily: "Inter, sans-serif" }}>
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
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1px solid #DDE8EE", borderRadius: 10 }}>
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
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: done ? "#F0FBF0" : "#fff", border: `1px solid ${done ? "#C8E6C9" : "#DDE8EE"}`, borderRadius: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: done ? "#4CAF50" : "#D4D0C8", flexShrink: 0 }} />
                <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                {m.type === "checkbox"
                  ? <input type="checkbox" checked={!!val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} style={{ width: 20, height: 20 }} />
                  : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SmoothNumber value={val} onCommit={v => updateLog(m.goalId, m.id, v)} style={{ width: 58 }} />
                      <span className="inter" style={{ fontSize: 12, color: "#9C9888" }}>/ {m.target}</span>
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
        <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 8 }}>Our Vision</div>
        <div className="lora" style={{ fontSize: 20, fontStyle: "italic", color: "#fff", lineHeight: 1.4 }}>
          "A rare space for abundance<br />and collective exploration."
        </div>
      </div>

      {/* Values grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="g2">
        {values.map((v, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 13, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{v.emoji}</div>
            <div className="lora" style={{ fontSize: 14, fontStyle: "italic", color: "#1C1C1A", fontWeight: 500, marginBottom: 5 }}>{v.name}</div>
            <div className="inter" style={{ fontSize: 12, color: "#8A9AAA", lineHeight: 1.55 }}>{v.desc}</div>
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
              style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${activeFreq === f.key ? "#1A5F6A" : "#DDE8EE"}`, background: activeFreq === f.key ? "#1A5F6A" : "#fff", cursor: "pointer", flexShrink: 0, textAlign: "left", transition: "all 0.12s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{f.emoji}</span>
                <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: activeFreq === f.key ? "#fff" : "#2C2C28" }}>{f.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 3, background: activeFreq === f.key ? "rgba(255,255,255,0.25)" : "#E4EEF4", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${fp}%`, height: "100%", background: activeFreq === f.key ? "#7DD3B8" : "#1A5F6A", borderRadius: 99 }} />
                </div>
                <span className="inter" style={{ fontSize: 10, color: activeFreq === f.key ? "rgba(255,255,255,0.7)" : "#9C9888" }}>{fDone}/{fTasks.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#EEF4F7", borderRadius: 10, marginBottom: 20 }}>
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
            <div key={t.id} style={{ background: isDone ? "#F0FBF0" : "#fff", border: `1.5px solid ${isOpen ? "#1A5F6A" : isDone ? "#C8E6C9" : "#DDE8EE"}`, borderRadius: 12, overflow: "hidden" }}>
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
                    ? <SmoothInput value={t.title} onCommit={v => updateOps(t.id, "title", v)} autoFocus style={{ fontSize: 14, fontWeight: 600, border: "none", padding: 0, background: "transparent" }} />
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
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#A8B8C4", fontSize: 14, padding: "0 2px" }}>✎</button>
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
                  <button onClick={() => setPicker(null)} style={{ padding: "7px 13px", borderRadius: 99, border: "1.5px solid #DDE8EE", background: "#fff", cursor: "pointer", fontSize: 13, color: "#9C9888", fontFamily: "Inter, sans-serif" }}>Cancel</button>
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
          <div className="lora" style={{ fontSize: 18, color: "#A8B8C4", fontStyle: "italic" }}>No {activeFreq} tasks yet.</div>
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
                    ? <SmoothInput value={g.title} onCommit={v => updateGoal(g.id, "title", v)} style={{ border: "none", padding: 0, fontSize: 16, fontWeight: 600, fontFamily: "Lora, serif", fontStyle: "italic", background: "transparent", color: "#1C1C1A" }} />
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
                      <SmoothNumber value={g.current} onCommit={v => updateGoal(g.id, "current", v)} style={{ width: 72 }} />
                      <span className="inter" style={{ fontSize: 13, color: "#9C9888" }}>/</span>
                      <SmoothNumber value={g.target} onCommit={v => updateGoal(g.id, "target", v)} style={{ width: 72, color: "#9C9888", fontWeight: 600 }} />
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
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: m.done ? "#F0FBF0" : "#F6F9FB", borderRadius: 8, border: `1px solid ${m.done ? "#C8E6C9" : "#E4EEF4"}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.done ? "#4CAF50" : "#D4D0C8", flexShrink: 0 }} />
                    {isOwner
                      ? <SmoothInput value={m.title} onCommit={v => updateMeasure(m.id, "title", v)} style={{ flex: 1, border: "none", padding: 0, fontSize: 13, fontWeight: 500, background: "transparent" }} />
                      : <span className="inter" style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                    }
                    {isOwner && <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{m.unit}</span>}
                    {m.type === "checkbox"
                      ? <input type="checkbox" checked={!!m.val} onChange={e => updateLog(m.goalId, m.id, e.target.checked)} />
                      : <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <SmoothNumber value={m.val} onCommit={v => updateLog(m.goalId, m.id, v)} style={{ width: 54 }} />
                          <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>/ {m.target}</span>
                        </div>
                    }
                    {isOwner && <button onClick={() => deleteMeasure(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14 }}>✕</button>}
                  </div>
                ))}
                {measures.length === 0 && isOwner && (
                  <p className="inter" style={{ fontSize: 13, color: "#A8B8C4", fontStyle: "italic" }}>No weekly actions yet — add one above.</p>
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
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${tab === t.key ? "#1A5F6A" : "#DDE8EE"}`, background: tab === t.key ? "#1A5F6A" : "#fff", cursor: "pointer", flexShrink: 0, minWidth: 130, transition: "all 0.12s" }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: `1px solid ${isOverdue ? "#FFCDD2" : "#DDE8EE"}`, borderRadius: 10, opacity: t.status === "done" ? 0.45 : 1 }}>
        <input type="checkbox" checked={t.status === "done"} onChange={e => updateTask(t.id, "status", e.target.checked ? "done" : "todo")} style={{ width: 18, height: 18 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {isOwner
            ? <SmoothInput value={t.title} onCommit={v => updateTask(t.id, "title", v)} style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent", textDecoration: t.status === "done" ? "line-through" : "none" }} />
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
        <span className="inter" style={{ fontSize: 12, color: "#A8B8C4" }}>{tasks.length}</span>
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
      {filteredOpen.length === 0 && <div style={{ textAlign: "center", padding: "32px 0" }}><div className="lora" style={{ fontSize: 18, color: "#A8B8C4", fontStyle: "italic" }}>All clear! 🌊</div></div>}
      <Section label="Overdue / Today" tasks={filteredOverdue} accent="#EF5350" />
      <Section label="This Week" tasks={filteredThisWeek} accent="#FFC107" />
      <Section label="Later" tasks={filteredLater} accent="#B0B0A8" />
      {done.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary className="inter" style={{ fontSize: 12, color: "#A8B8C4", cursor: "pointer", padding: "8px 0" }}>Show {done.length} completed</summary>
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
              style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "Inter, sans-serif", resize: "none", outline: "none", WebkitTextFillColor: "#fff" }} />
          ) : (
            <div>
              {form.commitments.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, marginBottom: 8 }}>
                  <select value={c.person} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, person: e.target.value } : x) }))}
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                    {TEAM.map(t => <option key={t} style={{ background: "#0F3D45" }}>{t}</option>)}
                  </select>
                  <input value={c.commitment} onChange={e => setForm(f => ({ ...f, commitments: f.commitments.map((x, j) => j === i ? { ...x, commitment: e.target.value } : x) }))}
                    placeholder="I'll..." style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 13, WebkitTextFillColor: "#fff" }} />
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
                      ? <SmoothTextarea value={m[col.field]||""} onCommit={v => updateMeeting(m.id, col.field, v)} placeholder="Add notes..." rows={2} style={{ fontSize: 12, lineHeight: 1.5 }} />
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
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: c.done ? "#F0FBF0" : "#F6F9FB", borderRadius: 8, border: `1px solid ${c.done ? "#C8E6C9" : "#E4EEF4"}` }}>
                    <input type="checkbox" checked={c.done} onChange={e => updateCF(m.id, i, "done", e.target.checked)} />
                    {isOwner
                      ? <>
                          <select value={c.person} onChange={e => updateCF(m.id, i, "person", e.target.value)} style={{ width: "auto", fontSize: 12, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer" }}>{TEAM.map(t => <option key={t}>{t}</option>)}</select>
                          <SmoothInput value={c.commitment} onCommit={v => updateCF(m.id, i, "commitment", v)}
                            style={{ flex: 1, border: "none", padding: 0, fontSize: 13, background: "transparent", textDecoration: c.done ? "line-through" : "none", color: c.done ? "#9C9888" : "#1C1C1A" }} />
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
              <div style={{ marginTop: 12, borderTop: "1px solid #E4EEF4", paddingTop: 12 }}>
                <div className="sec-label" style={{ color: "#1A5F6A", marginBottom: 5 }}>Owner Note</div>
                <SmoothTextarea value={m.ownerNotes||""} onCommit={v => updateMeeting(m.id, "ownerNotes", v)} readOnly={!isOwner}
                  placeholder="A note for the team..." rows={isOwner ? 2 : 1}
                  style={{ fontSize: 13, fontStyle: "italic", color: m.ownerNotes ? "#444" : "#A8B8C4", fontFamily: "Lora, serif", lineHeight: 1.6 }} />
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
      <div style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Overall readiness — {doneCount} of {items.length} complete</span>
          <span className="lora" style={{ fontSize: 22, color: pctDone === 100 ? "#2E7D32" : "#1A5F6A" }}>{pctDone}%</span>
        </div>
        <div style={{ height: 8, background: "#E4EEF4", borderRadius: 99, overflow: "hidden" }}>
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
                  <div style={{ width: 48, height: 3, background: "#E4EEF4", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${cp}%`, height: "100%", background: cp === 100 ? "#4CAF50" : "#1A5F6A", borderRadius: 99 }} />
                  </div>
                </div>
                {isOwner && <button onClick={() => addItem(cat)} style={{ background: "none", border: "1px solid #DDE8EE", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, color: "#666", fontFamily: "Inter, sans-serif" }}>+ Add</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: item.done ? "#F0FBF0" : "#fff", border: `1px solid ${item.done ? "#C8E6C9" : "#DDE8EE"}`, borderRadius: 10, opacity: item.done ? 0.75 : 1 }}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} style={{ width: 18, height: 18, accentColor: "#1A5F6A" }} />
                    <div style={{ flex: 1 }}>
                      {isOwner
                        ? <SmoothInput value={item.item} onCommit={v => updateItem(item.id, "item", v)}
                            style={{ border: "none", padding: 0, fontSize: 13, fontWeight: item.done ? 400 : 500, background: "transparent", color: item.done ? "#9C9888" : "#1C1C1A", textDecoration: item.done ? "line-through" : "none" }} />
                        : <div className="inter" style={{ fontSize: 13, fontWeight: item.done ? 400 : 500, color: item.done ? "#9C9888" : "#1C1C1A", textDecoration: item.done ? "line-through" : "none" }}>{item.item}</div>
                      }
                      {item.notes && <div className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 2 }}>{item.notes}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {isOwner
                        ? <>
                            <select value={item.owner} onChange={e => updateItem(item.id, "owner", e.target.value)} style={{ fontSize: 12, width: "auto", border: "1px solid #DDE8EE", borderRadius: 6 }}>
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
  const suggestions = data.weeklySuggestions || [];
  const monthlyMetrics = data.monthlyMetrics || [];

  // Ops completions today per person
  const opsToday = {};
  TEAM.forEach(p => { opsToday[p] = 0; });
  (data.opsTasks || []).forEach(t => {
    const c = t.completions?.[today];
    if (c?.by && opsToday[c.by] !== undefined) opsToday[c.by]++;
  });
  const totalDailyOps = (data.opsTasks || []).filter(t => ["opening","midday","closing"].includes(t.freq)).length;

  const addAction = (person, text) => {
    if (!text.trim()) return;
    setData(d => {
      const wkData = d.contributions?.[wk] || {};
      const pd = wkData[person] || { actions: [], note: "" };
      return { ...d, contributions: { ...d.contributions, [wk]: { ...wkData, [person]: { ...pd, actions: [...pd.actions, { text: text.trim(), ts: new Date().toISOString() }] } } } };
    });
  };
  const removeAction = (person, idx) => setData(d => {
    const wkData = d.contributions?.[wk] || {};
    const pd = wkData[person] || { actions: [], note: "" };
    return { ...d, contributions: { ...d.contributions, [wk]: { ...wkData, [person]: { ...pd, actions: pd.actions.filter((_, i) => i !== idx) } } } };
  });

  const toggleSuggestion = (id) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).map(s => s.id === id ? { ...s, active: !s.active } : s) }));
  const updateSuggestion = (id, text) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).map(s => s.id === id ? { ...s, text } : s) }));
  const addSuggestion = () => setData(d => ({ ...d, weeklySuggestions: [...(d.weeklySuggestions||[]), { id: `ws${Date.now()}`, text: "New suggestion", active: true }] }));
  const removeSuggestion = (id) => setData(d => ({ ...d, weeklySuggestions: (d.weeklySuggestions||[]).filter(s => s.id !== id) }));

  const addMonthlyEntry = () => {
    const now = new Date();
    const label = now.toLocaleString("default", { month: "long", year: "numeric" });
    setData(d => ({ ...d, monthlyMetrics: [...(d.monthlyMetrics||[]), { id: `mm${Date.now()}`, month: label, activeMembers: 0, newMembers: 0, foundingMembers: 0, referrals: 0, dayPasses: 0, notes: "" }] }));
  };
  const updateMetric = (id, f, v) => setData(d => ({ ...d, monthlyMetrics: (d.monthlyMetrics||[]).map(m => m.id === id ? { ...m, [f]: v } : m) }));

  const latestMetric = monthlyMetrics[monthlyMetrics.length - 1];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Scoreboard</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>We're building something together. Here's how it's going.</p>
      </div>

      {/* WIG Hero */}
      {wigGoal && (
        <div style={{ background: "linear-gradient(135deg, #1A5F6A 0%, #0F3D45 100%)", borderRadius: 18, padding: "28px 28px 24px", marginBottom: 20 }}>
          <div className="inter" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 8 }}>Our Wildly Important Goal</div>
          <div className="lora" style={{ fontSize: 22, fontStyle: "italic", color: "#fff", marginBottom: 4 }}>{wigGoal.title}</div>
          <div className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 22, lineHeight: 1.5 }}>{wigGoal.why}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.12)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct(wigGoal.current, wigGoal.target)}%`, height: "100%", background: "#7DD3B8", borderRadius: 99, transition: "width 0.7s ease" }} />
            </div>
            <span className="lora" style={{ fontSize: 20, color: "#7DD3B8", fontWeight: 600, whiteSpace: "nowrap" }}>{pct(wigGoal.current, wigGoal.target)}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="inter" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{fmt(wigGoal.current)} of {fmt(wigGoal.target)}</span>
            {pct(wigGoal.current, wigGoal.target) >= 50 && <span className="inter" style={{ fontSize: 12, color: "#7DD3B8", fontWeight: 600 }}>🎉 Over halfway there!</span>}
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }} className="g2">
        {data.goals.map(g => {
          const p = pct(g.current, g.target);
          const s = sc[g.status];
          const daysLeft = g.endDate ? Math.ceil((new Date(g.endDate) - new Date()) / 86400000) : null;
          return (
            <div key={g.id} style={{ background: "#fff", border: `1px solid ${s.bar}30`, borderRadius: 14, padding: "16px 18px", borderTop: `3px solid ${s.bar}` }}>
              <div className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1A", marginBottom: 6, lineHeight: 1.3 }}>{g.title}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span className="lora" style={{ fontSize: 22, color: s.bar, fontWeight: 600 }}>{fmt(g.current)}</span>
                <span className="inter" style={{ fontSize: 13, color: "#9C9888" }}>/ {fmt(g.target)}</span>
              </div>
              <div style={{ height: 6, background: "#E4EEF4", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${p}%`, height: "100%", background: s.bar, borderRadius: 99, transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="inter" style={{ fontSize: 11, fontWeight: 700, color: s.text }}>{p}%</span>
                {daysLeft !== null && daysLeft > 0 && <span className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{daysLeft}d left</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest monthly metrics */}
      {latestMetric && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div className="sec-label">Monthly Snapshot</div>
              <div className="lora" style={{ fontSize: 16, fontStyle: "italic", color: "#1C1C1A" }}>{latestMetric.month}</div>
            </div>
            {isOwner && <button className="btn btn-teal" onClick={addMonthlyEntry} style={{ fontSize: 12, padding: "6px 14px" }}>+ New Month</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="g3">
            {[
              { label: "Active Members", field: "activeMembers", emoji: "🧗" },
              { label: "New Members",    field: "newMembers",    emoji: "✨" },
              { label: "Founding Members", field: "foundingMembers", emoji: "⭐" },
              { label: "Referrals",      field: "referrals",    emoji: "🤝" },
              { label: "Day Passes",     field: "dayPasses",    emoji: "🎟️" },
            ].map(m => (
              <div key={m.field} style={{ background: "#F6F9FB", borderRadius: 10, padding: "12px 14px" }}>
                <div className="inter" style={{ fontSize: 11, color: "#9C9888", marginBottom: 4 }}>{m.emoji} {m.label}</div>
                {isOwner
                  ? <SmoothNumber value={latestMetric[m.field]} onCommit={v => updateMetric(latestMetric.id, m.field, v)} style={{ width: "100%", fontSize: 20, textAlign: "left", border: "none", background: "transparent", padding: "0", fontWeight: 700 }} />
                  : <div className="lora" style={{ fontSize: 22, color: "#1C1C1A", fontWeight: 600 }}>{latestMetric[m.field]}</div>
                }
              </div>
            ))}
          </div>
          {isOwner && (
            <div style={{ marginTop: 12 }}>
              <SmoothTextarea value={latestMetric.notes||""} onCommit={v => updateMetric(latestMetric.id, "notes", v)} placeholder="Notes about this month..." rows={2}
                style={{ fontSize: 12, color: "#555", fontStyle: "italic", background: "#F6F9FB", border: "1px solid #DDE8EE", borderRadius: 8, padding: "8px 12px", width: "100%" }} />
            </div>
          )}
          {!isOwner && latestMetric.notes && (
            <p className="inter" style={{ fontSize: 12, color: "#666", fontStyle: "italic", marginTop: 10 }}>{latestMetric.notes}</p>
          )}
        </div>
      )}

      {/* This week's focus */}
      <div className="card-warm" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div className="sec-label">This Week at Ripple</div>
            <div className="lora" style={{ fontSize: 17, fontStyle: "italic", color: "#1C1C1A" }}>Ways to help this week 🌱</div>
          </div>
          {isOwner && <button onClick={addSuggestion} style={{ background: "none", border: "1px solid #D8E8F0", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: "#7B5EA7", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+ Add</button>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suggestions.filter(s => s.active || isOwner).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: s.active ? "#fff" : "#EEF4F7", borderRadius: 10, border: `1px solid ${s.active ? "#D8E8F0" : "#E4EEF4"}`, opacity: s.active ? 1 : 0.55 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.active ? "💚" : "○"}</span>
              {isOwner
                ? <SmoothInput value={s.text} onCommit={v => updateSuggestion(s.id, v)} style={{ flex: 1, border: "none", padding: 0, fontSize: 13, background: "transparent", lineHeight: 1.5 }} />
                : <span className="inter" style={{ flex: 1, fontSize: 13, color: "#2C2C28", lineHeight: 1.55 }}>{s.text}</span>
              }
              {isOwner && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => toggleSuggestion(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: s.active ? "#1A5F6A" : "#9C9888", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{s.active ? "Hide" : "Show"}</button>
                  <button onClick={() => removeSuggestion(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14 }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team contributions this week */}
      <div style={{ marginBottom: 8 }}>
        <div className="sec-label">Team This Week</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TEAM.map(person => {
            const pd = weekContribs[person] || { actions: [] };
            const opsCount = opsToday[person] || 0;
            const [input, setInput] = useState("");
            const [showInput, setShowInput] = useState(false);

            return (
              <div key={person} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ background: avatarColor(person), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0 }}>
                    <span className="inter" style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{initials(person)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="lora" style={{ fontSize: 17, color: "#fff", fontStyle: "italic" }}>{person}</div>
                    <div className="inter" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{pd.actions?.length || 0} contribution{pd.actions?.length !== 1 ? "s" : ""} logged this week</div>
                  </div>
                  {opsCount > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div className="lora" style={{ fontSize: 20, color: "#fff", lineHeight: 1 }}>{opsCount}</div>
                      <div className="inter" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>ops today</div>
                    </div>
                  )}
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {pd.actions?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                      {pd.actions.map((a, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 11px", background: "#F4F8F4", borderRadius: 8, border: "1px solid #DCF0DC" }}>
                          <span style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}>🌿</span>
                          <span className="inter" style={{ flex: 1, fontSize: 13, color: "#1C1C1A", lineHeight: 1.5 }}>{a.text}</span>
                          <span className="inter" style={{ fontSize: 10, color: "#B0C8B0", whiteSpace: "nowrap", marginTop: 2 }}>{new Date(a.ts || a.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          {isOwner && <button onClick={() => removeAction(person, idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 14, lineHeight: 1 }}>✕</button>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="inter" style={{ fontSize: 13, color: "#A8B8C4", fontStyle: "italic", marginBottom: 10 }}>Nothing logged yet — add something that moved the goal forward!</p>
                  )}
                  {showInput ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input autoFocus value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && input.trim()) { addAction(person, input); setInput(""); setShowInput(false); } if (e.key === "Escape") setShowInput(false); }}
                        placeholder="What did you do to move the goal?"
                        style={{ flex: 1, fontSize: 14, color: "#1C1C1A", background: "#fff", border: `2px solid ${avatarColor(person)}`, borderRadius: 9, padding: "9px 13px", fontFamily: "Inter, sans-serif", outline: "none", fontWeight: 500, WebkitTextFillColor: "#1C1C1A", WebkitBoxShadow: "0 0 0px 1000px #fff inset" }} />
                      <button onClick={() => { if (input.trim()) { addAction(person, input); setInput(""); } setShowInput(false); }}
                        style={{ background: avatarColor(person), color: "#fff", border: "none", borderRadius: 9, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600, flexShrink: 0 }}>Save</button>
                      <button onClick={() => { setShowInput(false); setInput(""); }}
                        style={{ background: "none", border: "1px solid #DDE8EE", borderRadius: 9, padding: "9px 11px", cursor: "pointer", fontSize: 14, color: "#9C9888", flexShrink: 0 }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowInput(true)}
                      style={{ background: "#F6F9FB", border: `1.5px dashed ${avatarColor(person)}50`, borderRadius: 9, padding: "9px 16px", cursor: "pointer", fontSize: 13, color: avatarColor(person), fontFamily: "Inter, sans-serif", fontWeight: 600, width: "100%", textAlign: "center" }}>
                      + Log what {person} did this week
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

function MembersPage({ data, setData }) {
  const members = data.foundingMembers || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const types = [...new Set(members.map(m => m.type))].sort();
  const filtered = members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.type === filterType;
    return matchSearch && matchType;
  });

  const totalPeople = members.reduce((s, m) => s + (m.people || 1), 0);
  const byType = types.map(t => ({ type: t, count: members.filter(m => m.type === t).length }));

  // Most recent join date
  const sorted = [...members].sort((a, b) => b.date.localeCompare(a.date));
  const newest = sorted[0];

  const addMember = () => {
    setData(d => ({
      ...d,
      foundingMembers: [{
        id: `manual_${Date.now()}`,
        name: "New Member",
        email: "",
        date: new Date().toISOString().split("T")[0],
        type: "Founding Monthly — Individual",
        people: 1
      }, ...(d.foundingMembers || [])]
    }));
  };

  const updateMember = (id, f, v) => setData(d => ({ ...d, foundingMembers: d.foundingMembers.map(m => m.id === id ? { ...m, [f]: v } : m) }));
  const removeMember = (id) => { if (window.confirm("Remove this member?")) setData(d => ({ ...d, foundingMembers: d.foundingMembers.filter(m => m.id !== id) })); };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Founding Members</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Imported from Beta · SUCCEEDED transactions only</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }} className="g3">
        {[
          { label: "Memberships", value: members.length, color: "#1A5F6A" },
          { label: "People Covered", value: members.reduce((s, m) => s + (m.people || 1), 0), color: "#2E7D32" },
          { label: "Newest Signup", value: newest?.date || "—", color: "#9C9888" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #DDE8EE", borderRadius: 12, padding: "14px 16px" }}>
            <div className="sec-label">{s.label}</div>
            <div className="lora" style={{ fontSize: 20, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Membership type breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="sec-label">Breakdown by Type</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {byType.map(t => (
            <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="inter" style={{ fontSize: 13, color: "#1C1C1A", flex: 1 }}>{t.type}</span>
              <div style={{ width: 120, height: 5, background: "#E4EEF4", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${Math.round((t.count / members.length) * 100)}%`, height: "100%", background: "#1A5F6A", borderRadius: 99 }} />
              </div>
              <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: "#1A5F6A", minWidth: 28, textAlign: "right" }}>{t.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ flex: 1, minWidth: 200, fontSize: 13, padding: "9px 13px", border: "1px solid #D0DCE4", borderRadius: 9, outline: "none", fontFamily: "Inter, sans-serif", WebkitTextFillColor: "#1C1C1A" }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: "auto", fontSize: 13 }}>
          <option value="all">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-teal" onClick={addMember} style={{ fontSize: 12, padding: "8px 16px" }}>+ Add manually</button>
      </div>

      {/* Member count */}
      <div className="inter" style={{ fontSize: 12, color: "#9C9888", marginBottom: 10 }}>{filtered.length} member{filtered.length !== 1 ? "s" : ""} shown</div>

      {/* Member list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1px solid #DDE8EE", borderRadius: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E4EEF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="inter" style={{ fontSize: 13, fontWeight: 700, color: "#1A5F6A" }}>{initials(m.name)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="inter" style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1A" }}>{m.name}</div>
              <div className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 1 }}>{m.email}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="inter" style={{ fontSize: 12, fontWeight: 600, color: "#1A5F6A" }}>{m.type.replace("Founding ", "").replace(" \u2014 ", " · ")}</div>
              <div className="inter" style={{ fontSize: 11, color: "#9C9888" }}>{m.date} · {m.people || 1} {(m.people || 1) === 1 ? "person" : "people"}</div>
            </div>
            <button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D4D0C8", fontSize: 16, padding: "0 4px", flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="lora" style={{ fontSize: 18, color: "#B8C8D4", fontStyle: "italic" }}>No members match your search.</div>
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
    color: "#1C1C1A",
    background: "#F8F7F4",
    border: "1px solid #E0DDD6",
    borderRadius: 9,
    padding: "10px 14px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    WebkitTextFillColor: "#1C1C1A",
    WebkitBoxShadow: "0 0 0px 1000px #F8F7F4 inset",
    transition: "border-color 0.12s",
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="lora" style={{ fontSize: 26, fontStyle: "italic", color: "#1C1C1A" }}>Settings</h1>
        <p className="inter" style={{ fontSize: 13, color: "#9C9888", marginTop: 2 }}>Manage your team and preferences.</p>
      </div>

      <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
        <div className="sec-label">Your name</div>
        <SmoothInput
          value={data.currentUser}
          onCommit={v => setData(d => ({ ...d, currentUser: v }))}
          autoComplete="off"
          style={{ ...inputStyle, marginBottom: 4 }}
        />
        <p className="inter" style={{ fontSize: 11, color: "#9C9888", marginTop: 6 }}>Shown in greetings and the staff view.</p>
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
