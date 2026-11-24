import type { Metadata } from "next";
import "./firms.css";
import { SLIDES } from "./slides";
import { BrandControl, Deck, RevealScript } from "./interactive";
import { firmStatus } from "@/lib/firm/db";
import { bookingUrl } from "@/lib/booking";
import { emailStatus } from "@/lib/firm/email";

export const metadata: Metadata = {
  title: "Lawgistics Marketing for firms",
  description:
    "One idea in, a post your firm would sign off. LinkedIn posts and designed carousels in each lawyer's voice, inside one firm brand.",
};

// The booking link comes from BOOKING_URL (see lib/booking.ts). Until it is set, the buttons
// that need it are left out rather than pointing at an anchor that goes nowhere.


// The claims below depend on whether the firm layer (database, accounts, approval) is
// actually switched on for this deployment, so the page decides at request time rather
// than relying on someone remembering to edit the copy. Off, it says what it always said:
// the firm layer is the pilot. On, it says what is now true, and no more.
export const dynamic = "force-dynamic";

export default function FirmsPage() {
  const live = firmStatus().ok;
  const BOOK = bookingUrl();
  const emailing = emailStatus().ok;
  // opens in a new tab so a visitor does not lose their place on this page
  const bookProps = { href: BOOK || undefined, target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <div className="firms">
      <RevealScript />
      <header className="bar">
        <div className="fwrap">
          <a className="lockup" href="/firms" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="lmark">L</span>
            <span className="lname">Lawgistics</span>
            <span className="lsuffix">Marketing</span>
          </a>
          <div className="barlinks">
            {live ? (
              <a className="barlink quiet" href="/join">
                Sign in
              </a>
            ) : null}
            {BOOK ? (
              <a className="barlink" {...bookProps}>
                Book a demo
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div>
        <section className="hero">
          <div className="fwrap herogrid">
            <div className="herotext">
              <p className="eyebrow">A content system for law firms</p>
              <h1 className="serif">
                One idea in. A post your firm would <em>sign off.</em>
              </h1>
              <p className="lede">
                A lawyer writes a rough note. Lawgistics returns a LinkedIn post and a designed carousel, in
                their voice, inside your firm&rsquo;s brand. Where your firm turns approval on, a reviewer reads and
                approves each one before the app will save it.
              </p>
              <div className="ctas">
                {BOOK ? (
                  <a className="fbtn" {...bookProps}>
                    Book a firm demo
                  </a>
                ) : null}
                <a className={BOOK ? "fbtn fbtn-ghost" : "fbtn"} href="/">
                  Try it yourself
                </a>
              </div>
            </div>
            <Deck />
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="fwrap">
            <p className="eyebrow">Sample slides</p>
            <h2 className="serif">Drawn by the product.</h2>
            <p className="lede">
              The words on these slides were written for this page. They were drawn by the same code that will draw yours. Scroll sideways.
            </p>
          </div>
          <div className="fwrap" style={{ marginTop: 34 }} data-reveal>
            <div className="shelf" tabIndex={0} role="region" aria-label="Sample slides, scroll sideways">
              {SLIDES.map((sl) => (
                <div className="frame" key={sl.key}>
                  {sl.node}
                </div>
              ))}
            </div>
            <p className="shelfnote">Your colours, your typefaces, your lawyer&rsquo;s name in the corner.</p>
          </div>
          <div className="fwrap">
            <BrandControl />
          </div>
        </section>

        <section className="plumpanel">
          <div className="fwrap">
            <p className="eyebrow">Why firms end up posting nothing</p>
            <h2 className="serif">
              Your lawyers know what to say. Saying it takes an afternoon they <em>do not have.</em>
            </h2>
            <p className="lede">
              An agency writes posts that could be about any firm. A lawyer writing alone either posts off brand or
              posts nothing for four months. This gives every lawyer a strong starting point, and gives the firm a
              say before anything is published.
            </p>
          </div>
        </section>

        <section>
          <div className="fwrap">
            <p className="eyebrow">How it works</p>
            <h2 className="serif">Four steps.</h2>
            <div className="fsteps" data-reveal>
              <div className="fstep">
                <span className="n">01</span>
                <div>
                  <h3 className="serif">Set the lawyer up once</h3>
                  <p>
                    Their name, their practice area, who they want reading them, and a few paragraphs of something
                    they have already written, so it copies their rhythm rather than inventing one.
                  </p>
                </div>
              </div>
              <div className="fstep">
                <span className="n">02</span>
                <div>
                  <h3 className="serif">Lock the firm brand</h3>
                  <p>
                    Colours, typefaces, and the footer note your risk people want on every slide. Set it once and
                    every post carries it.
                  </p>
                </div>
              </div>
              <div className="fstep">
                <span className="n">03</span>
                <div>
                  <h3 className="serif">Write one rough idea</h3>
                  <p>
                    A sentence is enough. So is a case note, a question a client keeps asking, or a whole email
                    pasted straight in.
                  </p>
                </div>
              </div>
              <div className="fstep">
                <span className="n">04</span>
                <div>
                  <h3 className="serif">Read it, change it, save it</h3>
                  <p>
                    Ask for shorter, bolder or less corporate in plain words. Slides go to the camera roll, the post
                    text to the clipboard. Nothing publishes on its own, by design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="fwrap">
            <p className="eyebrow">Plain about what is built</p>
            <h2 className="serif">
              {live ? "What works today, and what does not yet." : "What works today, and what the pilot is for."}
            </h2>
            <div className="ledger" data-reveal>
              <div className="fcol now">
                <p className="fcolhead">Working now</p>
                <ul>
                  <li>One idea becomes a post and a carousel of five or six slides</li>
                  <li>The lawyer&rsquo;s own voice, taken from a writing sample</li>
                  <li>Your colours, your typefaces, your footer note on every slide</li>
                  <li>Twenty compositions, so a feed never looks automated</li>
                  <li>Plain language changes: shorter, bolder, less corporate</li>
                  <li>Download the slides, copy the post text</li>
                  <li>Nothing publishes automatically, ever</li>
                  {live ? (
                    <>
                      <li>A separate profile for each lawyer, with their own voice</li>
                      <li>One firm brand, set once by an admin and locked for everyone else</li>
                      <li>Review before saving, where your firm turns it on: the app will not save the slides until a reviewer approves them, and any edit sends them back</li>
                      <li>A monthly allowance per lawyer, and usage visible to whoever runs marketing</li>
                    </>
                  ) : null}
                </ul>
              </div>
              <div className="fcol soon">
                <p className="fcolhead">{live ? "Not built yet" : "What founding firms are building with us"}</p>
                <ul>
                  {live ? (
                    <>
                      {!emailing ? <li>Invites are sent by your admin, not emailed by us</li> : null}
                      <li>Signing in with a Google or Microsoft work account</li>
                      <li>Billing and invoices inside the app</li>
                    </>
                  ) : (
                    <>
                      <li>A separate profile for each lawyer in the firm</li>
                      <li>One brand shared across every profile</li>
                      <li>Central review and approval before a post leaves the firm</li>
                      <li>Usage visible to whoever runs marketing</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
            <p className="ledgernote">
              {live
                ? "Review is a workflow, not a lock. It stops this app saving or copying a post nobody has approved. It cannot stop someone taking a screenshot of what is on their screen, so treat it as a process your firm follows, not as security."
                : "Today this is strong for one lawyer at a time, and a lawyer can set themselves up in a few minutes. The firm layer is genuinely not finished, and we would rather you heard that here than at the demo."}
            </p>
          </div>
        </section>

        <section className="plumpanel">
          <div className="fwrap">
            <p className="eyebrow">Founding firm pilot</p>
            <h2 className="serif">
              Start with one team. <em>Grow across the firm.</em>
            </h2>
            <div className="price" data-reveal>
              <p className="pricehead">Firm starter</p>
              <p className="amount">
                <b>
                  <span className="cur">$</span>199
                </b>
                <span>AUD / month</span>
              </p>
              <p style={{ marginTop: 10, fontSize: 15 }}>For up to 5 lawyers</p>
              <ul>
                <li>
                  <i>&#10003;</i> 4 posts per lawyer, per month
                </li>
                <li>
                  <i>&#10003;</i> A saved voice for each lawyer
                </li>
                <li>
                  <i>&#10003;</i> One firm brand across every post
                </li>
                <li>
                  <i>&#10003;</i> Founding firm onboarding, with us in the room
                </li>
                <li>
                  {live ? (
                    <>
                      <i>&#10003;</i> Review before saving, so the app holds back anything not yet approved
                    </>
                  ) : (
                    <>
                      <i>&#43;</i> Central review and approval, as it is built
                    </>
                  )}
                </li>
              </ul>
              {BOOK ? (
                <a className="fbtn" {...bookProps}>
                  Join the founding firm pilot
                </a>
              ) : null}
            </div>
            <p className="lede" style={{ marginTop: 24 }}>
              More than five lawyers? We will put a plan together around the firm.
            </p>
          </div>
        </section>

        <section>
          <div className="fwrap">
            <p className="eyebrow">Questions firms actually ask</p>
            <h2 className="serif">The answers before you ask them.</h2>
            <div className="qa" data-reveal>
              <div>
                <h3 className="serif">Does it post to LinkedIn for us?</h3>
                <p>
                  No. It hands you the slides and the text, and someone at the firm posts them. That is a deliberate
                  choice, not a missing feature.
                </p>
              </div>
              <div>
                <h3 className="serif">Who is responsible for what goes out?</h3>
                <p>
                  Your firm. Every draft is written by AI. Before the app exports anything, the lawyer has to tick to
                  say they read every slide and checked the facts themselves.
                </p>
              </div>
              <div>
                <h3 className="serif">Will it invent a case or a citation?</h3>
                <p>
                  It is instructed to keep the point general rather than guess at a citation, a date or a party name
                  it is not certain of. Check every draft regardless. You would check a junior&rsquo;s work.
                </p>
              </div>
              <div>
                <h3 className="serif">Will every lawyer&rsquo;s posts look the same?</h3>
                <p>
                  No. There are twenty compositions, and the generator is told not to use the same one twice in a
                  row or to put three slides in a row on the same background. A second pass swaps repeats where it can.
                </p>
              </div>
              {live ? (
                <div>
                  <h3 className="serif">Does review really stop a post leaving the firm?</h3>
                  <p>
                    It stops this app saving or copying one. A lawyer sees &ldquo;waiting for your reviewer&rdquo; until it is
                    approved, and if they change a word afterwards it needs approving again. It cannot stop a screenshot, so
                    it is a process, not a security control.
                  </p>
                </div>
              ) : null}
              <div>
                <h3 className="serif">What happens to what we type?</h3>
                {live ? (
                  <p>
                    What a lawyer types is sent to OpenAI or Anthropic, overseas, to write the post, and the provider handles it under its own terms. Client names and confidential details should not be typed in. For
                    a firm workspace we also store the firm brand, each lawyer&rsquo;s profile, and any post they submit
                    for review, so a reviewer can open it. Nothing is stored for someone using the studio on their own: that
                    stays in their own browser.
                  </p>
                ) : (
                  <p>
                    Your brand settings and drafts stay in your own browser. The idea you type is sent to OpenAI or
                    Anthropic, overseas, to write the post, and the provider handles it under its own terms. Leave out client names and confidential details. We do not store your drafts.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="close">
          <div className="fwrap">
            <h2 className="serif">
              Make your firm&rsquo;s expertise <em>impossible to overlook.</em>
            </h2>
            <div className="ctas">
              {BOOK ? (
                <a className="fbtn" {...bookProps}>
                  Book a firm demo
                </a>
              ) : null}
              <a className={BOOK ? "fbtn fbtn-ghost" : "fbtn"} href="/">
                Try it yourself first
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer>
        <div className="fwrap">
          <span className="lockup">
            <span className="lmark">L</span>
            <span className="lname">Lawgistics</span>
            <span className="lsuffix">Marketing</span>
          </span>
          <span>Built by Lawgistics in Australia.</span>
          <span>&copy; 2026 Lawgistics</span>
        </div>
      </footer>
    </div>
  );
}
