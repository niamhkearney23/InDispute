"use client";

import { useEffect, useRef } from "react";
import { initStudio } from "@/lib/studio";

function Dots({ on }: { on: "you" | "look" | "voice" }) {
  return (
    <p className="stepdots" aria-hidden="true">
      {(["you", "look", "voice"] as const).map((k) => (
        <i key={k} className={k === on ? "on" : ""} />
      ))}
    </p>
  );
}

export default function Page() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    initStudio();
  }, []);

  return (
    <>
      <div className="wrap">
        <div className="topbar">
          {/* master brand, then a quiet product label, matching the Academy's
              lockup so the two read as one company rather than two */}
          <div className="brandmark">
            <h1>
              <span className="mk-name">Lawgistics</span>
              <span className="mk-suffix">Marketing</span>
            </h1>
            <span className="mk-tag">one post a week</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-sm" type="button" data-go="you">
              Brand
            </button>
            <button className="btn btn-sm" id="btnNewPost" type="button">
              New post
            </button>
          </div>
        </div>

        {/* 1. who */}
        <section className="step" data-step="you">
          <div className="stepcard panel">
            <Dots on="you" />
            <div className="stephead">
              <h2>
                First, <em>who are you?</em>
              </h2>
              <p>Two answers and you are set up for good.</p>
            </div>

            <div className="rowfields">
              <div className="field">
                <label htmlFor="brandName">Your name</label>
                <input type="text" id="brandName" data-brand="wordmark" maxLength={28} placeholder="e.g. Mathew Thomas Philip" />
              </div>
              <div className="field">
                <label htmlFor="brandRole">
                  Your practice <span className="hint">optional</span>
                </label>
                <input type="text" id="brandRole" data-brand="role" maxLength={34} placeholder="e.g. Dispute Resolution" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="brandField">What do you do?</label>
              <input
                type="text"
                id="brandField"
                data-brand="field"
                maxLength={80}
                placeholder="e.g. Commercial litigation and shareholder disputes"
              />
            </div>

            <div className="field">
              <label htmlFor="brandAudience">
                Who do you want reading your posts?{" "}
                <span className="hint">this changes the writing more than anything else</span>
              </label>
              <input
                type="text"
                id="brandAudience"
                data-brand="audience"
                maxLength={80}
                placeholder="e.g. Founders, directors and business owners"
              />
            </div>

            <div className="field">
              <label htmlFor="brandDisclaimer">
                Footer note <span className="hint">on every slide. clear it if you do not want one</span>
              </label>
              <input
                type="text"
                id="brandDisclaimer"
                data-brand="disclaimer"
                maxLength={90}
                placeholder="General information, not legal advice."
              />
            </div>

            <details className="morefields" id="kindDetails">
              <summary>Posting as a firm or a business instead?</summary>
              <div className="optiongrid kindpick" id="kindPick">
                <button type="button" className="stylebtn" data-kind="person">
                  <b>Me</b>
                  <span>Your own name. Reaches further than a company page.</span>
                </button>
                <button type="button" className="stylebtn" data-kind="firm">
                  <b>My law firm</b>
                  <span>Written as the firm, for clients and referrers.</span>
                </button>
                <button type="button" className="stylebtn" data-kind="business">
                  <b>My business</b>
                  <span>Anything else, written for its customers.</span>
                </button>
              </div>
            </details>

            <div className="stepfoot">
              <span />
              <button className="btn btn-accent" type="button" data-go="look">
                Next
              </button>
            </div>
          </div>
        </section>

        {/* 2. look */}
        <section className="step" data-step="look">
          <div className="stepcard stepcard-brand panel">
            <Dots on="look" />
            <div className="stephead">
              <h2>
                Pick your <em>look</em>.
              </h2>
              <p>Or press Surprise me and take whatever it gives you.</p>
            </div>
            <div className="brandlayout">
              <div>
                <div className="field">
                  <label>
                    Colours
                    <button type="button" className="randombtn" id="btnRandomise">
                      Surprise me
                    </button>
                  </label>
                  <div className="palettes" id="palettes"></div>
                </div>

                <div className="field">
                  <label>
                    Layout <span className="hint">how the words sit on the slide</span>
                  </label>
                  <div className="styles" id="styles"></div>
                </div>

                <details className="morefields">
                  <summary>Fine-tune colours and type</summary>
                  <div className="brandgrid" style={{ marginTop: 12 }}>
                    <div className="colorfield">
                      <label htmlFor="brandCream">Light background</label>
                      <input type="color" id="brandCream" data-brand="cream" />
                    </div>
                    <div className="colorfield">
                      <label htmlFor="brandNavy">Dark background</label>
                      <input type="color" id="brandNavy" data-brand="navy" />
                    </div>
                    <div className="colorfield">
                      <label htmlFor="brandAccent">Accent</label>
                      <input type="color" id="brandAccent" data-brand="accent" />
                    </div>
                    <div className="selectfield">
                      <label htmlFor="brandSerif">Serif</label>
                      <select id="brandSerif" data-brand="serif" defaultValue="default">
                        <option value="default">Playfair Display</option>
                        <option value="Lora">Lora</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="Fraunces">Fraunces</option>
                      </select>
                    </div>
                    <div className="selectfield">
                      <label htmlFor="brandSans">Sans</label>
                      <select id="brandSans" data-brand="sans" defaultValue="default">
                        <option value="default">TikTok Sans</option>
                        <option value="Inter">Inter</option>
                        <option value="Manrope">Manrope</option>
                        <option value="Work Sans">Work Sans</option>
                      </select>
                    </div>
                  </div>
                </details>
              </div>

              <div className="brandpreview">
                <p className="panel-title">Your slides</p>
                <div className="previewframe">
                  <div className="canvasholder" id="brandPreview"></div>
                </div>
              </div>
            </div>
            <div className="stepfoot">
              <button className="btn" type="button" data-go="you">
                Back
              </button>
              <button className="btn btn-accent" type="button" data-go="voice">
                Next
              </button>
            </div>
          </div>
        </section>

        {/* 3. voice */}
        <section className="step" data-step="voice">
          <div className="stepcard panel">
            <Dots on="voice" />
            <div className="stephead">
              <h2>
                Want it to sound <em>like you?</em>
              </h2>
              <p>
                Paste anything you have written: a post, an email, a note. It copies your rhythm, not your topic.
                Optional, and you can add it later.
              </p>
            </div>
            <textarea
              className="askbox"
              id="brandVoice"
              data-brand="voice"
              rows={6}
              placeholder="Paste a few paragraphs in your own words."
            />
            <div className="stepfoot">
              <button className="btn" type="button" data-go="look">
                Back
              </button>
              <button className="btn btn-accent" type="button" data-go="ask">
                Done
              </button>
            </div>
          </div>
        </section>

        {/* 4. topic */}
        <section className="step" data-step="ask">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                What do you want to <em>write about</em> today?
              </h2>
              <p>One line is enough. You get a post and the slides to go with it. Nothing posts on its own.</p>
            </div>
            <div className="askcontrols">
              <div className="segmented formatpick" id="formatPick">
                <button type="button" data-format="carousel">Slides</button>
                <button type="button" data-format="poster">One poster</button>
              </div>
              <label className="samecheck" id="sameRow" htmlFor="sameAsLast" hidden>
                <input type="checkbox" id="sameAsLast" />
                <span>Same shapes as last time</span>
              </label>
            </div>
            <div className="brandbar" id="brandBar"></div>
            <textarea
              className="askbox"
              id="askInput"
              rows={5}
              placeholder="e.g. what to bring to your first appointment&#10;or: the new rules on casual conversion"
            />
            <p className="askstatus" id="askStatus"></p>
            <div className="stepfoot">
              <button type="button" className="linkbtn" id="btnSeeExample">
                Show me an example
              </button>
              <button className="btn btn-accent" id="btnAsk" type="button">
                Write it
              </button>
            </div>
            <p className="remindrow">
              <button type="button" className="linkbtn" id="btnRemindWeekly">
                Remind me to post every week
              </button>
              <span className="hint">adds a repeating reminder to your calendar</span>
            </p>
          </div>
        </section>

        {/* 5. review */}
        <section className="step" data-step="review">
          <div className="stepcard stepcard-wide panel">
            <div className="stephead">
              <h2>
                Happy with <em>this?</em>
              </h2>
              <p>Read every line. You are the one publishing it.</p>
            </div>

            <div className="stage">
              <div className="previewframe">
                <div className="canvasholder" id="previewHolder"></div>
              </div>
              <p className="stagecount" id="stageCount"></p>
            </div>
            <div className="strip" id="strip"></div>

            <div className="captionblock">
              <p className="panel-title striptitle">
                Your post <span className="hint">this is the text, the slides go with it</span>
              </p>
              <textarea id="captionText" rows={7} />
            </div>

            <div className="changepanel" id="changePanel" hidden>
              <div className="chatlog" id="chatLog"></div>
              <div className="chatbar">
                <textarea id="chatInput" rows={2} placeholder="Shorter. Punchier hook. Slide 3 should name the case." />
                <button className="btn btn-accent" id="btnSend" type="button">
                  Send
                </button>
              </div>
              <p className="chathint">Say it in plain words. Anything you do not mention stays as it is.</p>
              <details className="morefields editdrawer" id="editDrawer">
                <summary>Or edit this slide by hand</summary>
                <div id="editorPanel"></div>
                <div className="slidetools">
                  <button className="btn btn-sm" id="btnAddSlide" type="button">
                    + Add slide after
                  </button>
                  <button className="btn btn-sm" id="btnDupSlide" type="button">
                    Duplicate
                  </button>
                  <button className="btn btn-sm" id="btnMoveUp" type="button">
                    Move earlier
                  </button>
                  <button className="btn btn-sm" id="btnMoveDown" type="button">
                    Move later
                  </button>
                  <button className="btn btn-sm btn-danger" id="btnDelSlide" type="button">
                    Delete
                  </button>
                </div>
              </details>
            </div>

            <div className="stepfoot">
              <button className="btn" id="btnChange" type="button">
                Change something
              </button>
              <button className="btn btn-accent" type="button" data-go="save">
                Looks good
              </button>
            </div>
          </div>
        </section>

        {/* 6. save */}
        <section className="step" data-step="save">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                Save it and <em>post it.</em>
              </h2>
              <p>Slides to your camera roll, text to your clipboard. Then paste it into LinkedIn.</p>
            </div>

            <label className="consentbar" htmlFor="consentCheck">
              <input type="checkbox" id="consentCheck" />
              <span>
                This was drafted by AI. I have read every slide and the post, checked any facts, names and citations
                myself, and I take responsibility for what I post.
              </span>
            </label>

            <div className="exportbar" id="shareBar" hidden>
              <button className="btn btn-accent" id="btnShareAll" type="button">
                Save all slides to Photos
              </button>
              <button className="btn" id="btnShareOne" type="button">
                Save this slide only
              </button>
            </div>
            <div className="exportbar" id="downloadBar">
              <button className="btn btn-accent" id="btnExportAll" type="button">
                Download all slides (ZIP)
              </button>
              <button className="btn" id="btnExportOne" type="button">
                Download this slide (PNG)
              </button>
            </div>
            <p className="exportnote" id="exportNote"></p>

            <div className="captionblock">
              <p className="panel-title">Your post</p>
              <textarea id="captionOut" rows={7} readOnly />
              <div className="captionrow">
                <button className="btn" id="btnCopyCaption" type="button">
                  Copy post
                </button>
              </div>
            </div>

            <div className="stepfoot">
              <button className="btn" type="button" data-go="review">
                Back
              </button>
              <button className="btn" id="btnAnother" type="button">
                Write another
              </button>
            </div>
          </div>
        </section>
      </div>

      <div style={{ position: "fixed", left: -99999, top: 0 }} id="exportStage"></div>
      <div className="toast" id="toast"></div>
    </>
  );
}
