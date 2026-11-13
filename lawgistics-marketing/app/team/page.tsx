"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCanvasEl, defaultBrand, ensureGoogleFont } from "@/lib/studio";
import "./team.css";

/* ---------------------------------------------------------------- plumbing */

type Brand = {
  cream?: string;
  navy?: string;
  accent?: string;
  serif?: string;
  sans?: string;
  style?: string;
  disclaimer?: string;
};
type Profile = { role?: string; field?: string; audience?: string; voice?: string };
type Me = {
  member: { id: string; name: string; role: "admin" | "lawyer"; profile: Profile };
  firm: { id: string; name: string; brand: Brand; requireApproval: boolean; monthlyQuota: number };
  usage: { used: number; quota: number };
};
type PostRow = {
  id: string;
  status: string;
  topic: string;
  title: string | null;
  rev: number;
  reviewer_note: string;
  updated_at: string;
  submitted_at: string | null;
  member_id: string;
  member_name: string;
  slide_count: number;
};

async function api<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = await r.json().catch(() => null);
  if (r.status === 401 && d?.needsSignIn) {
    window.location.href = "/join";
    throw new Error("Please sign in.");
  }
  if (!r.ok) {
    const e: any = new Error(d?.error || "That did not work. Try again.");
    e.status = r.status;
    e.data = d;
    throw e;
  }
  return d as T;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Waiting for review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

function brandFor(fb: Brand, name: string, profile?: Profile) {
  const base = defaultBrand();
  return {
    ...base,
    kind: "person",
    wordmark: name,
    role: profile?.role || "",
    cream: fb.cream || base.cream,
    navy: fb.navy || base.navy,
    accent: fb.accent || base.accent,
    serif: fb.serif || "default",
    sans: fb.sans || "default",
    style: fb.style || "editorial",
    disclaimer: fb.disclaimer || "",
  };
}

/** A slide, drawn by the studio's own renderer, so a reviewer sees exactly what will be posted. */
function SlidePreview({ slide, brand, width }: { slide: any; brand: any; width: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    ensureGoogleFont(brand.serif);
    ensureGoogleFont(brand.sans);
    host.innerHTML = "";
    const canvas = buildCanvasEl(slide, brand) as HTMLElement;
    canvas.style.transform = `scale(${width / 1080})`;
    canvas.style.transformOrigin = "top left";
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    host.appendChild(canvas);
  }, [slide, brand, width]);
  return <div ref={ref} className="tm-slide" style={{ width, height: Math.round(width * 1.25) }} />;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function InviteCard({ name, code, url, days, onClose }: { name: string; code: string; url: string; days: number; onClose: () => void }) {
  const [said, setSaid] = useState("");
  async function c(what: string, text: string) {
    setSaid((await copy(text)) ? `${what} copied` : "Copy it by hand from the box");
  }
  return (
    <div className="tm-invite" role="status">
      <p className="tm-invite-title">
        Invite for <b>{name}</b>
      </p>
      <p className="tm-invite-note">
        Shown once. It works one time and expires in {days} days. Send it to them yourself.
      </p>
      <input readOnly value={code} onFocus={(e) => e.target.select()} aria-label="Invite code" className="tm-code" />
      <div className="tm-row">
        <button className="btn btn-sm" type="button" onClick={() => c("Code", code)}>
          Copy code
        </button>
        <button className="btn btn-sm" type="button" onClick={() => c("Link", url)}>
          Copy sign in link
        </button>
        <button className="btn btn-sm" type="button" onClick={onClose}>
          Done
        </button>
        <span className="hint">{said}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ tabs */

function PostList({ posts, onOpen, empty, showAuthor }: { posts: PostRow[] | null; onOpen: (p: PostRow) => void; empty: string; showAuthor?: boolean }) {
  if (!posts) return <p className="hint">Loading…</p>;
  if (!posts.length) return <p className="tm-empty">{empty}</p>;
  return (
    <ul className="tm-list">
      {posts.map((p) => (
        <li key={p.id}>
          <button type="button" className="tm-item" onClick={() => onOpen(p)}>
            <span className="tm-item-main">
              <b>{p.title || p.topic || "Untitled post"}</b>
              <span className="hint">
                {showAuthor ? `${p.member_name} · ` : ""}
                {p.slide_count} slides · {when(p.submitted_at || p.updated_at)}
              </span>
              {p.status === "changes_requested" && p.reviewer_note ? <span className="tm-note">{p.reviewer_note}</span> : null}
            </span>
            <span className={`tm-chip ${p.status}`}>{STATUS_LABEL[p.status] || p.status}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MyPosts() {
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<{ posts: PostRow[] }>("GET", "/api/firm/posts")
      .then((d) => setPosts(d.posts))
      .catch((e) => setErr(e.message));
  }, []);
  return (
    <div>
      <div className="tm-head">
        <h3>My posts</h3>
        <a className="btn btn-accent btn-sm" href="/">
          Write a new post
        </a>
      </div>
      {err ? <p className="askstatus bad">{err}</p> : null}
      <PostList
        posts={posts}
        empty="Nothing here yet. Write your first post and it will appear here once you submit it."
        onOpen={(p) => (window.location.href = `/?post=${p.id}`)}
      />
    </div>
  );
}

function MyProfile({ me, onSaved }: { me: Me; onSaved: (p: Profile) => void }) {
  const [p, setP] = useState<Profile>({ role: "", field: "", audience: "", voice: "", ...me.member.profile });
  const [msg, setMsg] = useState("");
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });
  async function save() {
    setMsg("Saving…");
    try {
      const d = await api<{ profile: Profile }>("PUT", "/api/firm/profile", p);
      onSaved(d.profile);
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  return (
    <div className="tm-form">
      <div className="tm-head">
        <h3>My profile</h3>
      </div>
      <p className="hint tm-lede">This is how the studio writes as you. Your name is {me.member.name}. Your firm sets the colours and fonts.</p>
      <div className="field">
        <label htmlFor="pRole">Your practice</label>
        <input id="pRole" type="text" maxLength={34} value={p.role} onChange={set("role")} placeholder="e.g. Employment law" />
      </div>
      <div className="field">
        <label htmlFor="pField">What you do</label>
        <input id="pField" type="text" maxLength={80} value={p.field} onChange={set("field")} placeholder="e.g. Workplace disputes and unfair dismissal" />
      </div>
      <div className="field">
        <label htmlFor="pAud">Who you want reading your posts</label>
        <input id="pAud" type="text" maxLength={80} value={p.audience} onChange={set("audience")} placeholder="e.g. HR managers and small business owners" />
      </div>
      <div className="field">
        <label htmlFor="pVoice">
          Something you have written <span className="hint">it copies your rhythm, not your topic</span>
        </label>
        <textarea id="pVoice" rows={7} maxLength={4000} value={p.voice} onChange={set("voice")} />
      </div>
      <div className="tm-row">
        <button className="btn btn-accent" type="button" onClick={save}>
          Save profile
        </button>
        <span className="hint" role="status">
          {msg}
        </span>
      </div>
    </div>
  );
}

function ReviewPost({ id, me, onBack }: { id: string; me: Me; onBack: () => void }) {
  const [p, setP] = useState<any>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api("GET", `/api/firm/posts/${id}`)
      .then((d) => setP(d.post))
      .catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  const brand = useMemo(() => (p ? brandFor(me.firm.brand, p.member_name, p.member_profile) : null), [p, me]);

  async function decide(decision: "approve" | "changes") {
    setErr("");
    if (decision === "changes" && !note.trim()) {
      setErr("Say what needs changing, so they know what to do.");
      return;
    }
    setBusy(true);
    try {
      await api("POST", `/api/firm/posts/${id}/review`, { decision, note, rev: p.rev });
      onBack();
    } catch (e: any) {
      setErr(e.message);
      // the author edited while this was open: show them the new version
      if (e.data?.stale) load();
    }
    setBusy(false);
  }

  if (!p || !brand) return <p className="hint">{err || "Loading…"}</p>;
  const waiting = p.status === "submitted";
  return (
    <div>
      <div className="tm-head">
        <button className="linkbtn" type="button" onClick={onBack}>
          ← Back
        </button>
        <span className={`tm-chip ${p.status}`}>{STATUS_LABEL[p.status] || p.status}</span>
      </div>
      <h3 className="tm-title">{p.slides?.[0]?.statement || p.topic || "Untitled post"}</h3>
      <p className="hint">
        {p.member_name} · revision {p.rev} · {when(p.submitted_at || p.updated_at)}
      </p>
      <div className="tm-shelf">
        {p.slides.map((s: any, i: number) => (
          <SlidePreview key={`${p.rev}-${i}`} slide={s} brand={brand} width={230} />
        ))}
      </div>
      <p className="panel-title">The post text</p>
      <pre className="tm-caption">{p.caption || "(no text)"}</pre>
      {waiting ? (
        <div className="tm-decide">
          <div className="field">
            <label htmlFor="rvNote">
              Note to {p.member_name.split(" ")[0]} <span className="hint">needed if you ask for changes</span>
            </label>
            <textarea id="rvNote" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {err ? <p className="askstatus bad">{err}</p> : null}
          <div className="tm-row">
            <button className="btn btn-accent" type="button" disabled={busy} onClick={() => decide("approve")}>
              Approve
            </button>
            <button className="btn" type="button" disabled={busy} onClick={() => decide("changes")}>
              Ask for changes
            </button>
          </div>
        </div>
      ) : (
        <>
          {p.reviewer_note ? <p className="tm-note">Reviewer note: {p.reviewer_note}</p> : null}
          {err ? <p className="askstatus bad">{err}</p> : null}
        </>
      )}
    </div>
  );
}

function ReviewTab({ me, refreshBadge }: { me: Me; refreshBadge: () => void }) {
  const [filter, setFilter] = useState("submitted");
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    setPosts(null);
    api<{ posts: PostRow[] }>("GET", `/api/firm/posts?scope=firm${filter ? `&status=${filter}` : ""}`)
      .then((d) => setPosts(d.posts))
      .catch((e) => setErr(e.message));
  }, [filter]);
  useEffect(load, [load]);

  if (open) {
    return (
      <ReviewPost
        id={open}
        me={me}
        onBack={() => {
          setOpen(null);
          load();
          refreshBadge();
        }}
      />
    );
  }
  return (
    <div>
      <div className="tm-head">
        <h3>Review</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Show posts">
          <option value="submitted">Waiting for review</option>
          <option value="changes_requested">Changes requested</option>
          <option value="approved">Approved</option>
          <option value="">Everything</option>
        </select>
      </div>
      {err ? <p className="askstatus bad">{err}</p> : null}
      <PostList
        posts={posts}
        showAuthor
        empty={filter === "submitted" ? "Nothing is waiting for you." : "Nothing here."}
        onOpen={(p) => setOpen(p.id)}
      />
    </div>
  );
}

type Member = {
  id: string;
  name: string;
  role: "admin" | "lawyer";
  active: boolean;
  invite_pending: boolean;
  used_this_month: number;
  posts: number;
};

function PeopleTab({ me }: { me: Me }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invite, setInvite] = useState<{ name: string; code: string; url: string; days: number } | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"lawyer" | "admin">("lawyer");
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    api<{ members: Member[] }>("GET", "/api/firm/members")
      .then((d) => setMembers(d.members))
      .catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  async function add() {
    setErr("");
    try {
      const d = await api("POST", "/api/firm/members", { name, role });
      setInvite({ name: d.member.name, code: d.inviteCode, url: d.joinUrl, days: d.inviteValidDays });
      setName("");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }
  async function patch(m: Member, body: object, withInvite = false) {
    setErr("");
    try {
      const d = await api("PATCH", `/api/firm/members/${m.id}`, body);
      if (withInvite && d.inviteCode) {
        const host = window.location.origin;
        setInvite({ name: m.name, code: d.inviteCode, url: `${host}/join#${d.inviteCode}`, days: d.inviteValidDays });
      }
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div>
      <div className="tm-head">
        <h3>People</h3>
      </div>
      {invite ? <InviteCard {...invite} onClose={() => setInvite(null)} /> : null}
      <div className="tm-add">
        <div className="field">
          <label htmlFor="newName">Add someone</label>
          <input id="newName" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Their full name" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as any)} aria-label="Role">
          <option value="lawyer">Lawyer</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-accent" type="button" disabled={!name.trim()} onClick={add}>
          Create invite
        </button>
      </div>
      {err ? <p className="askstatus bad">{err}</p> : null}
      {!members ? (
        <p className="hint">Loading…</p>
      ) : (
        <ul className="tm-list">
          {members.map((m) => (
            <li key={m.id} className={"tm-person" + (m.active ? "" : " off")}>
              <div className="tm-item-main">
                <b>
                  {m.name}
                  {m.id === me.member.id ? " (you)" : ""}
                </b>
                <span className="hint">
                  {m.role === "admin" ? "Admin" : "Lawyer"} ·{" "}
                  {!m.active ? "Switched off" : m.invite_pending ? "Has not joined yet" : "Active"} ·{" "}
                  {me.firm.monthlyQuota > 0 ? `${m.used_this_month} of ${me.firm.monthlyQuota}` : `${m.used_this_month}`} new posts this month
                </span>
              </div>
              <div className="tm-row">
                {m.active ? (
                  <button className="btn btn-sm" type="button" onClick={() => patch(m, { reissueInvite: true }, true)}>
                    New invite
                  </button>
                ) : null}
                {/* not offered on your own row: switching yourself off is refused by the server,
                    and stepping down is one click away from locking yourself out. Ask another admin. */}
                {m.id !== me.member.id ? (
                  <>
                    <button className="btn btn-sm" type="button" onClick={() => patch(m, { role: m.role === "admin" ? "lawyer" : "admin" })}>
                      Make {m.role === "admin" ? "lawyer" : "admin"}
                    </button>
                    {m.active ? (
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => patch(m, { active: false })}>
                        Switch off
                      </button>
                    ) : (
                      <button className="btn btn-sm" type="button" onClick={() => patch(m, { active: true })}>
                        Switch on
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="hint tm-lede">
        An invite is how someone signs in. If a phone is lost, switch the person off and create a new invite. A switched off
        person is signed out on their very next click.
      </p>
    </div>
  );
}

const SERIFS = [
  ["default", "Playfair Display"],
  ["Lora", "Lora"],
  ["Cormorant Garamond", "Cormorant Garamond"],
  ["Fraunces", "Fraunces"],
];
const SANS = [
  ["default", "TikTok Sans"],
  ["Inter", "Inter"],
  ["Manrope", "Manrope"],
  ["Work Sans", "Work Sans"],
];
const STYLES = [
  ["editorial", "Editorial"],
  ["bold", "Bold"],
  ["minimal", "Minimal"],
  ["block", "Colour block"],
  ["swiss", "Swiss"],
  ["mono", "Mono"],
  ["press", "Press"],
  ["stack", "Stack"],
];

function BrandTab({ me, onSaved }: { me: Me; onSaved: (b: Brand, ra: boolean, q: number) => void }) {
  const d0 = defaultBrand();
  const [b, setB] = useState<Brand>({
    cream: d0.cream,
    navy: d0.navy,
    accent: d0.accent,
    serif: "default",
    sans: "default",
    style: "editorial",
    disclaimer: "",
    ...me.firm.brand,
  });
  const [ra, setRa] = useState(me.firm.requireApproval);
  const [quota, setQuota] = useState(String(me.firm.monthlyQuota));
  const [msg, setMsg] = useState("");
  const set = (k: keyof Brand) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setB({ ...b, [k]: e.target.value });

  const brand = useMemo(() => brandFor(b, "Your lawyer", { role: "Practice area" }), [b]);
  const light = { layout: "statement", ground: "light", size: "lg", kicker: me.firm.name, cite: b.disclaimer || "", statement: "This is how your firm's posts will *look.*", sub: "The statement carries the point. The detail sits underneath." };
  const dark = { ...light, ground: "dark", layout: "edge", statement: "A line with weight goes on the floor of the frame.", sub: "Set once, for everyone" };

  async function save() {
    setMsg("Saving…");
    try {
      const q = Math.max(0, Math.min(500, Math.floor(Number(quota) || 0)));
      const d = await api("PUT", "/api/firm/brand", { brand: b, requireApproval: ra, monthlyQuota: q });
      onSaved(d.brand, d.requireApproval, d.monthlyQuota);
      setQuota(String(d.monthlyQuota));
      setMsg("Saved. Everyone in the firm sees it on their next post.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  return (
    <div className="tm-brand">
      <div className="tm-form">
        <div className="tm-head">
          <h3>Firm brand</h3>
        </div>
        <p className="hint tm-lede">Set once. Every lawyer's slides use it, and they cannot change it.</p>
        <div className="tm-colours">
          {(["cream", "navy", "accent"] as const).map((k) => (
            <div className="colorfield" key={k}>
              <label htmlFor={`c-${k}`}>{k === "cream" ? "Light background" : k === "navy" ? "Dark background" : "Accent"}</label>
              <input id={`c-${k}`} type="color" value={b[k] || "#000000"} onChange={set(k)} />
            </div>
          ))}
        </div>
        <div className="tm-three">
          <div className="field">
            <label htmlFor="bSerif">Serif</label>
            <select id="bSerif" value={b.serif} onChange={set("serif")}>
              {SERIFS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bSans">Sans</label>
            <select id="bSans" value={b.sans} onChange={set("sans")}>
              {SANS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bStyle">Layout style</label>
            <select id="bStyle" value={b.style} onChange={set("style")}>
              {STYLES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="bNote">
            Footer note <span className="hint">on every slide. leave empty for none</span>
          </label>
          <input id="bNote" type="text" maxLength={90} value={b.disclaimer} onChange={set("disclaimer")} placeholder="General information, not legal advice." />
        </div>
        <label className="tm-check" htmlFor="bRa">
          <input id="bRa" type="checkbox" checked={ra} onChange={(e) => setRa(e.target.checked)} />
          <span>
            <b>Posts need approval before they can be saved</b>
            <span className="hint">
              Switched off, a lawyer can save their own posts straight away. It controls what this app will let them save or
              copy. It cannot stop someone taking a screenshot.
            </span>
          </span>
        </label>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="bQuota">
            New posts per lawyer, per month <span className="hint">0 is no limit</span>
          </label>
          <input id="bQuota" type="number" min={0} max={500} value={quota} onChange={(e) => setQuota(e.target.value)} />
        </div>
        <div className="tm-row">
          <button className="btn btn-accent" type="button" onClick={save}>
            Save brand
          </button>
          <span className="hint" role="status">
            {msg}
          </span>
        </div>
      </div>
      <div className="tm-previews">
        <p className="panel-title">Preview</p>
        <SlidePreview slide={light} brand={brand} width={230} />
        <SlidePreview slide={dark} brand={brand} width={230} />
      </div>
    </div>
  );
}

function UsageTab() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("GET", "/api/firm/usage")
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="askstatus bad">{err}</p>;
  if (!d) return <p className="hint">Loading…</p>;
  const q = d.monthlyQuota;
  return (
    <div>
      <div className="tm-head">
        <h3>Usage</h3>
      </div>
      <p className="hint tm-lede">
        New posts started, per person. Revising a draft does not use anything. {q > 0 ? `Each person has ${q} a month.` : "There is no monthly limit."}
      </p>
      <div className="tm-tablewrap">
        <table className="tm-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>This month</th>
              <th>Last month</th>
              <th>Approved</th>
              <th>Waiting</th>
            </tr>
          </thead>
          <tbody>
            {d.people.map((p: any) => (
              <tr key={p.id} className={p.active ? "" : "off"}>
                <td>
                  {p.name}
                  {p.active ? "" : " (off)"}
                </td>
                <td>{q > 0 ? `${p.this_month} of ${q}` : p.this_month}</td>
                <td>{p.last_month}</td>
                <td>{p.approved}</td>
                <td>{p.waiting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint tm-lede">
        Across the firm: {d.posts.approved || 0} approved, {d.posts.submitted || 0} waiting, {d.posts.changes_requested || 0} sent back,{" "}
        {d.posts.draft || 0} drafts.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function TeamPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [off, setOff] = useState("");
  const [tab, setTab] = useState("");
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    api("GET", "/api/firm/me")
      .then((d) => {
        if (!d.configured) {
          setOff(d.reason || "Firm workspaces are not switched on.");
          return;
        }
        if (!d.member) {
          window.location.replace("/join");
          return;
        }
        setMe(d);
        setTab(d.member.role === "admin" ? "review" : "posts");
      })
      .catch(() => setOff("Could not reach the studio. Check your connection."));
  }, []);

  const refreshBadge = useCallback(() => {
    api<{ posts: PostRow[] }>("GET", "/api/firm/posts?scope=firm&status=submitted")
      .then((d) => setWaiting(d.posts.length))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (me?.member.role === "admin") refreshBadge();
  }, [me, refreshBadge]);

  async function signOut() {
    await fetch("/api/firm/logout", { method: "POST" }).catch(() => {});
    try {
      localStorage.removeItem("lgm_state_v1");
    } catch {}
    window.location.href = "/join";
  }

  if (off)
    return (
      <div className="wrap">
        <p className="askstatus bad">{off}</p>
      </div>
    );
  if (!me) return <div className="wrap" />;

  const admin = me.member.role === "admin";
  const tabs: [string, string][] = [
    ...(admin ? ([["review", waiting ? `Review (${waiting})` : "Review"], ["people", "People"], ["brand", "Brand"], ["usage", "Usage"]] as [string, string][]) : []),
    ["posts", "My posts"],
    ["profile", "My profile"],
  ];

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brandmark">
          <h1>
            <span className="mk-name">Lawgistics</span>
            <span className="mk-suffix">Marketing</span>
          </h1>
        </div>
        <div className="topbar-actions">
          <a className="btn btn-sm" href="/">
            Write a post
          </a>
          <button className="btn btn-sm" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
      <section className="stepcard stepcard-wide panel tm-card">
        <div className="tm-who">
          <h2>{me.firm.name}</h2>
          <p className="hint">
            {me.member.name} · {admin ? "Admin" : "Lawyer"} ·{" "}
            {me.usage.quota > 0 ? `${me.usage.used} of ${me.usage.quota} new posts used this month` : `${me.usage.used} posts this month`}
          </p>
        </div>
        <nav className="tm-tabs" aria-label="Sections">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" className={tab === k ? "on" : ""} aria-current={tab === k} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </nav>
        <div className="tm-body">
          {tab === "review" && <ReviewTab me={me} refreshBadge={refreshBadge} />}
          {tab === "people" && <PeopleTab me={me} />}
          {tab === "brand" && (
            <BrandTab
              me={me}
              onSaved={(brand, requireApproval, monthlyQuota) => setMe({ ...me, firm: { ...me.firm, brand, requireApproval, monthlyQuota }, usage: { ...me.usage, quota: monthlyQuota } })}
            />
          )}
          {tab === "usage" && <UsageTab />}
          {tab === "posts" && <MyPosts />}
          {tab === "profile" && <MyProfile me={me} onSaved={(profile) => setMe({ ...me, member: { ...me.member, profile } })} />}
        </div>
      </section>
    </div>
  );
}
