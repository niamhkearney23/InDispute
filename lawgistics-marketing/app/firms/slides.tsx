import type { ReactNode } from "react";

/* The slide examples, written once and used by both the hero deck and the
   shelf. They carry no colours of their own: every token is inherited from
   the .firms element, which is what lets the brand switcher re-skin the whole
   page by changing five variables. These are the studio's own class names, so
   what a visitor sees is what the product renders. */

function Mark({ who = "ANNA REID · EMPLOYMENT" }: { who?: string }) {
  return <div className="mark">{who}</div>;
}
function Cite() {
  return <div className="cite">General information, not legal advice.</div>;
}

export type Slide = { key: string; label: string; node: ReactNode };

export const SLIDES: Slide[] = [
  {
    key: "open",
    label: "The opening line",
    node: (
      <div className="slide-canvas onaccent lay-statement anc-mid al-left">
        <div className="page">
          <div className="kicker">A note for business owners</div>
          <div className="content">
            <div className="statement lg">
              Read the clause before you <em>sign it,</em> not after.
            </div>
            <div className="sub">The paragraph nobody reads is the one that decides the argument.</div>
          </div>
          <div className="foot">
            <Cite />
            <Mark />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "list",
    label: "A list people save",
    node: (
      <div className="slide-canvas lay-list anc-top al-left">
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
            <Cite />
            <Mark />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "edge",
    label: "The line with weight",
    node: (
      <div className="slide-canvas dark lay-edge anc-bottom al-left">
        <div className="page">
          <div className="kicker">Casual conversion</div>
          <div className="content">
            <div className="statement lg">A roster that never changes is not casual work.</div>
            <div className="sub">What the amendments actually changed</div>
          </div>
          <div className="foot">
            <Cite />
            <Mark />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "numeral",
    label: "A figure, blown up",
    node: (
      <div className="slide-canvas lay-numeral anc-top al-left">
        <div className="bignum" aria-hidden="true">
          21
        </div>
        <div className="page">
          <div className="kicker">The deadline nobody diarises</div>
          <div className="content">
            <div className="statement md">
              Twenty one days, and the clock starts <em>earlier</em> than people think.
            </div>
            <div className="sub">Time runs from the decision, not from the day it started to hurt.</div>
          </div>
          <div className="foot">
            <Cite />
            <Mark />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "frame",
    label: "The closing principle",
    node: (
      <div className="slide-canvas lay-frame anc-mid al-centre">
        <div className="ruleframe" aria-hidden="true" />
        <div className="page">
          <div className="kicker">The short answer</div>
          <div className="content">
            <div className="statement md">
              Put it in writing on the <em>day.</em>
            </div>
            <div className="sub">A note made at the time carries weight that a later reconstruction never will.</div>
          </div>
          <div className="foot">
            <Cite />
            <Mark />
          </div>
        </div>
      </div>
    ),
  },
];
