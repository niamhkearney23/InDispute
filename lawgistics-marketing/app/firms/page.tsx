import type { Metadata } from "next";
import "./firms.css";

export const metadata: Metadata = {
  title: "Lawgistics Marketing for firms",
  description:
    "One idea in, a post your firm would sign off. LinkedIn posts and designed carousels in each lawyer's voice, inside one firm brand.",
};

// Replace with the real booking link (Calendly, Cal.com, a form) before this
// goes in front of anyone. Left as an anchor so a dead external link cannot ship.
const BOOK = "#book";

/* The slide examples below use the studio's own classes from globals.css, so
   what a visitor sees is literally what the product renders. These tokens are
   the plum brand applied the way a firm's would be. */
const BRAND: React.CSSProperties = {
  ["--t-cream" as string]: "#F2EFE9",
  ["--t-navy" as string]: "#241320",
  ["--t-ink-cream" as string]: "#241320",
  ["--t-ink-navy" as string]: "#F2EFE9",
  ["--t-kicker-cream" as string]: "#8A7F7A",
  ["--t-kicker-navy" as string]: "#A697A0",
  ["--t-body-cream" as string]: "#3A2E32",
  ["--t-body-navy" as string]: "#D8CCD4",
  ["--t-sub-cream" as string]: "#5A4B52",
  ["--t-sub-navy" as string]: "#CFC0C9",
  ["--t-muted-cream" as string]: "#9A8F89",
  ["--t-muted-navy" as string]: "#8D7E88",
  ["--t-accent" as string]: "#6B2450",
  ["--t-accent-navy" as string]: "#C08BAE",
  ["--t-ink-accent" as string]: "#F6EEF3",
  ["--t-kicker-accent" as string]: "#D7B9CC",
  ["--t-body-accent" as string]: "#EEDFE8",
  ["--t-muted-accent" as string]: "#C9A8BC",
  ["--f-serif" as string]: "'Studio Serif'",
  ["--f-sans" as string]: "'Studio Sans'",
};

function Mark() {
  return <div className="mark">ANNA REID · EMPLOYMENT</div>;
}

export default function FirmsPage() {
  return (
    <div className="firms">
      <header className="bar">
        <div className="fwrap">
          <a className="lockup" href="/firms" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="lmark">L</span>
            <span className="lname">Lawgistics</span>
            <span className="lsuffix">Marketing</span>
          </a>
          <a className="barlink" href={BOOK}>
            Book a demo
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="fwrap">
            <p className="eyebrow">A content system for law firms</p>
            <h1 className="serif">
              One idea in. A post your firm would <em>sign off.</em>
            </h1>
            <p className="lede">
              A lawyer writes a rough note. Lawgistics returns a LinkedIn post and a designed carousel, in their
              voice, inside your firm&rsquo;s brand. A person reads and approves every one before it goes anywhere.
            </p>
            <div className="ctas">
              <a className="fbtn" href={BOOK}>
                Book a firm demo
              </a>
              <a className="fbtn fbtn-ghost" href="/">
                Try it yourself
              </a>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="fwrap">
            <p className="eyebrow">Real output</p>
            <h2 className="serif">These are not mockups.</h2>
            <p className="lede">
              Every slide here was drawn by the product, by the same code that will draw yours. Scroll sideways.
            </p>
          </div>
          <div className="fwrap" style={{ marginTop: 34 }}>
            <div className="shelf">
              <div className="frame">
                <div className="slide-canvas onaccent lay-statement anc-mid al-left" style={BRAND}>
                  <div className="page">
                    <div className="kicker">A note for business owners</div>
                    <div className="content">
                      <div className="statement lg">
                        Read the clause before you <em>sign it,</em> not after.
                      </div>
                      <div className="sub">The paragraph nobody reads is the one that decides the argument.</div>
                    </div>
                    <div className="foot">
                      <div className="cite">General information, not legal advice.</div>
                      <Mark />
                    </div>
                  </div>
                </div>
              </div>

              <div className="frame">
                <div className="slide-canvas lay-list anc-top al-left" style={BRAND}>
                  <div className="page">
                    <div className="kicker">Before you sign</div>
                    <div className="content">
                      <div className="statement md">Three clauses worth an hour of your time.</div>
                      <ol className="listrows">
                        <li>
                          <span className="n">1</span>
                          <span className="t">
                            <b>Termination</b>
                            <em>Who can walk away, how much notice, and what it costs.</em>
                          </span>
                        </li>
                        <li>
                          <span className="n">2</span>
                          <span className="t">
                            <b>Liability</b>
                            <em>The number at the bottom is the number you are agreeing to.</em>
                          </span>
                        </li>
                        <li>
                          <span className="n">3</span>
                          <span className="t">
                            <b>Jurisdiction</b>
                            <em>Where you would have to argue it, and who pays to get there.</em>
                          </span>
                        </li>
                      </ol>
                    </div>
                    <div className="foot">
                      <div className="cite">General information, not legal advice.</div>
                      <Mark />
                    </div>
                  </div>
                </div>
              </div>

              <div className="frame">
                <div className="slide-canvas dark lay-edge anc-bottom al-left" style={BRAND}>
                  <div className="page">
                    <div className="kicker">Casual conversion</div>
                    <div className="content">
                      <div className="statement lg">A roster that never changes is not casual work.</div>
                      <div className="sub">What the amendments actually changed</div>
                    </div>
                    <div className="foot">
                      <div className="cite">General information, not legal advice.</div>
                      <Mark />
                    </div>
                  </div>
                </div>
              </div>

              <div className="frame">
                <div className="slide-canvas lay-frame anc-mid al-centre" style={BRAND}>
                  <div className="page">
                    <div className="ruleframe" aria-hidden="true" />
                    <div className="kicker">The short answer</div>
                    <div className="content">
                      <div className="statement md">
                        Put it in writing on the <em>day.</em>
                      </div>
                      <div className="sub">
                        A note made at the time carries weight that a later reconstruction never will.
                      </div>
                    </div>
                    <div className="foot">
                      <div className="cite">General information, not legal advice.</div>
                      <Mark />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="shelfnote">Your colours, your typefaces, your lawyer&rsquo;s name in the corner.</p>
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
            <h2 className="serif">Four steps, about three minutes.</h2>
            <div className="fsteps">
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
            <h2 className="serif">What works today, and what the pilot is for.</h2>
            <div className="ledger">
              <div className="fcol now">
                <p className="fcolhead">Working now</p>
                <ul>
                  <li>One idea becomes a post and a six slide carousel</li>
                  <li>The lawyer&rsquo;s own voice, taken from a writing sample</li>
                  <li>Your colours, your typefaces, your footer note on every slide</li>
                  <li>Twenty compositions, so a feed never looks automated</li>
                  <li>Plain language changes: shorter, bolder, less corporate</li>
                  <li>Download the slides, copy the post text</li>
                  <li>Nothing publishes automatically, ever</li>
                </ul>
              </div>
              <div className="fcol soon">
                <p className="fcolhead">What founding firms are building with us</p>
                <ul>
                  <li>A separate profile for each lawyer in the firm</li>
                  <li>One brand shared across every profile</li>
                  <li>Central review and approval before a post leaves the firm</li>
                  <li>Usage visible to whoever runs marketing</li>
                </ul>
              </div>
            </div>
            <p className="ledgernote">
              Today this is strong for one lawyer at a time, and a lawyer sets themselves up in about three minutes.
              The firm layer is genuinely not finished, and we would rather you heard that here than at the demo.
            </p>
          </div>
        </section>

        <section className="plumpanel">
          <div className="fwrap">
            <p className="eyebrow">Founding firm pilot</p>
            <h2 className="serif">
              Start with one team. <em>Grow across the firm.</em>
            </h2>
            <div className="price">
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
                  <i>&#43;</i> Central review and approval, as it is built
                </li>
              </ul>
              <a className="fbtn" href={BOOK}>
                Join the founding firm pilot
              </a>
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
            <div className="qa">
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
                  Your firm. Every draft is written by AI, and the app will not export anything until the lawyer has
                  ticked to say they read every slide and checked the facts themselves.
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
                  No. There are twenty compositions, and the generator is blocked from using the same one twice in a
                  row or putting three slides in a row on the same background.
                </p>
              </div>
              <div>
                <h3 className="serif">What happens to what we type?</h3>
                <p>
                  Your brand settings and drafts stay in your own browser. The idea you type is sent to the AI
                  provider to write the post, the same way any AI tool works. We keep no copy of your drafts.
                </p>
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
              <a className="fbtn" href={BOOK}>
                Book a firm demo
              </a>
              <a className="fbtn fbtn-ghost" href="/">
                Try it yourself first
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="fwrap">
          <span className="lockup">
            <span className="lmark">L</span>
            <span className="lname">Lawgistics</span>
            <span className="lsuffix">Marketing</span>
          </span>
          <span>Content systems for modern law firms.</span>
          <span>&copy; 2026 Lawgistics</span>
        </div>
      </footer>
    </div>
  );
}
