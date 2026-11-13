"use client";

import { useCallback, useEffect, useState } from "react";
import "../team/team.css";

type Firm = { id: string; name: string; people: number; posts: number; created_at: string; monthly_quota: number; require_approval: boolean };
type Invite = { label: string; code: string; url: string; days: number };

// The platform owner's page. It is not linked from anywhere, and it does nothing
// without OWNER_KEY. The key lives in sessionStorage only, so closing the tab
// forgets it, and it is sent as a header to the owner routes and nowhere else.
export default function OwnerPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [firms, setFirms] = useState<Firm[] | null>(null);
  const [firmName, setFirmName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [msg, setMsg] = useState("");
  const [said, setSaid] = useState("");

  const call = useCallback(
    async (method: string, url: string, k: string, body?: unknown) => {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-owner-key": k },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "That did not work.");
      return d;
    },
    [],
  );

  const load = useCallback(
    async (k: string) => {
      try {
        const d = await call("GET", "/api/owner/firms", k);
        setFirms(d.firms);
        setAuthed(true);
        setMsg("");
        try {
          sessionStorage.setItem("lgm_owner", k);
        } catch {}
      } catch (e: any) {
        setAuthed(false);
        setMsg(e.message);
      }
    },
    [call],
  );

  useEffect(() => {
    try {
      const k = sessionStorage.getItem("lgm_owner");
      if (k) {
        setKey(k);
        load(k);
      }
    } catch {}
  }, [load]);

  async function create() {
    setMsg("");
    try {
      const d = await call("POST", "/api/owner/firms", key, { firmName, adminName });
      setInvite({ label: `${d.admin.name} at ${d.firm.name}`, code: d.inviteCode, url: d.joinUrl, days: d.inviteValidDays });
      setFirmName("");
      setAdminName("");
      load(key);
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  async function addAdmin(f: Firm) {
    const name = window.prompt(`New admin for ${f.name}. Their full name:`);
    if (!name) return;
    try {
      const d = await call("POST", `/api/owner/firms/${f.id}/admins`, key, { adminName: name });
      setInvite({ label: `${d.admin.name} at ${d.firm.name}`, code: d.inviteCode, url: d.joinUrl, days: d.inviteValidDays });
      load(key);
    } catch (e: any) {
      setMsg(e.message);
    }
  }
  async function c(what: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setSaid(`${what} copied`);
    } catch {
      setSaid("Copy it by hand from the box");
    }
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brandmark">
          <h1>
            <span className="mk-name">Lawgistics</span>
            <span className="mk-suffix">Owner</span>
          </h1>
        </div>
      </div>
      <section className="stepcard stepcard-wide panel tm-card">
        {!authed ? (
          <div className="tm-form" style={{ maxWidth: 440 }}>
            <div className="tm-head">
              <h3>Owner key</h3>
            </div>
            <div className="field">
              <label htmlFor="ok">Enter the OWNER_KEY set on the server</label>
              <input
                id="ok"
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(key)}
              />
            </div>
            {msg ? <p className="askstatus bad">{msg}</p> : null}
            <button className="btn btn-accent" type="button" onClick={() => load(key)}>
              Continue
            </button>
          </div>
        ) : (
          <>
            {invite ? (
              <div className="tm-invite" role="status">
                <p className="tm-invite-title">
                  Invite for <b>{invite.label}</b>
                </p>
                <p className="tm-invite-note">Shown once. It works one time and expires in {invite.days} days. Send it to them yourself.</p>
                <input readOnly value={invite.code} onFocus={(e) => e.target.select()} aria-label="Invite code" className="tm-code" />
                <div className="tm-row">
                  <button className="btn btn-sm" type="button" onClick={() => c("Code", invite.code)}>
                    Copy code
                  </button>
                  <button className="btn btn-sm" type="button" onClick={() => c("Link", invite.url)}>
                    Copy sign in link
                  </button>
                  <button className="btn btn-sm" type="button" onClick={() => setInvite(null)}>
                    Done
                  </button>
                  <span className="hint">{said}</span>
                </div>
              </div>
            ) : null}
            <div className="tm-head">
              <h3>New firm</h3>
            </div>
            <div className="tm-add">
              <div className="field">
                <label htmlFor="fn">Firm name</label>
                <input id="fn" type="text" maxLength={60} value={firmName} onChange={(e) => setFirmName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="an">First admin&apos;s name</label>
                <input id="an" type="text" maxLength={60} value={adminName} onChange={(e) => setAdminName(e.target.value)} />
              </div>
              <button className="btn btn-accent" type="button" disabled={!firmName.trim() || !adminName.trim()} onClick={create}>
                Create firm
              </button>
            </div>
            {msg ? <p className="askstatus bad">{msg}</p> : null}
            <div className="tm-head" style={{ marginTop: 26 }}>
              <h3>Firms</h3>
            </div>
            {!firms ? (
              <p className="hint">Loading…</p>
            ) : !firms.length ? (
              <p className="tm-empty">No firms yet.</p>
            ) : (
              <ul className="tm-list">
                {firms.map((f) => (
                  <li key={f.id} className="tm-person">
                    <div className="tm-item-main">
                      <b>{f.name}</b>
                      <span className="hint">
                        {f.people} people · {f.posts} posts · {f.monthly_quota > 0 ? `${f.monthly_quota} a month each` : "no limit"} ·{" "}
                        {f.require_approval ? "approval on" : "approval off"}
                      </span>
                    </div>
                    <button className="btn btn-sm" type="button" onClick={() => addAdmin(f)}>
                      Add an admin
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
