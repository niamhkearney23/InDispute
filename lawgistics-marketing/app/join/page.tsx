"use client";

import { useEffect, useState } from "react";

// Redeems an invite. The code arrives in the URL fragment (/join#XXXX-...), which
// a browser never sends to a server, so it cannot end up in a log or a referrer.
export default function JoinPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [off, setOff] = useState<string | null>(null);

  useEffect(() => {
    // The code can arrive on load, or later if someone pastes an invite link into a
    // tab already open on this page, which only changes the hash and does not reload.
    function takeFragment() {
      const frag = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim();
      if (!frag) return;
      setCode(frag);
      // take it out of the address bar and the history once it is in the box
      history.replaceState(null, "", window.location.pathname);
    }
    takeFragment();
    window.addEventListener("hashchange", takeFragment);
    fetch("/api/firm/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.configured) setOff(d.reason || "Firm workspaces are not switched on yet.");
        else if (d.member) window.location.replace(d.member.role === "admin" ? "/team" : "/");
      })
      .catch(() => {});
    return () => window.removeEventListener("hashchange", takeFragment);
  }, []);

  async function join() {
    const c = code.trim();
    if (!c) {
      setMsg("Enter the code you were given.");
      return;
    }
    setBusy(true);
    setMsg("Checking…");
    try {
      const r = await fetch("/api/firm/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        // someone else's brand and writing sample must not linger on this device
        try {
          localStorage.removeItem("lgm_state_v1");
        } catch {}
        window.location.replace(d.role === "admin" ? "/team" : "/");
        return;
      }
      setMsg(d.error || "That did not work. Try again.");
    } catch {
      setMsg("Could not reach the studio. Check your connection.");
    }
    setBusy(false);
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brandmark">
          <h1>
            <span className="mk-name">Lawgistics</span>
            <span className="mk-suffix">Marketing</span>
          </h1>
        </div>
      </div>
      <section className="step active">
        <div className="stepcard panel" style={{ maxWidth: 460 }}>
          <div className="stephead">
            <h2>
              Join your <em>firm.</em>
            </h2>
            <p>Enter the invite code your firm gave you. It works once, and it signs you in on this device.</p>
          </div>
          {off ? (
            <p className="askstatus bad">{off}</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="joinCode">Invite code</label>
                <input
                  id="joinCode"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={80}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                  style={{ fontFamily: "var(--mono)", letterSpacing: ".06em" }}
                />
              </div>
              <p className="askstatus" role="status">
                {msg}
              </p>
              <div className="stepfoot">
                <a className="linkbtn" href="/">
                  Use the studio on your own
                </a>
                <button className="btn btn-accent" type="button" onClick={join} disabled={busy}>
                  Join
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
