"use client";

import { useEffect, useRef } from "react";
import { initStudio } from "@/lib/studio";

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
          <div className="brandmark">
            <h1>Lawgistics Marketing</h1>
            <span>one post a day</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-sm" type="button" data-go="brand">
              Brand
            </button>
            <button className="btn btn-sm" id="btnNewPost" type="button">
              New post
            </button>
          </div>
        </div>

        <section className="step" data-step="brand">
          <div className="stepcard stepcard-brand panel">
            <div className="stephead">
              <h2>
                Are you posting as a <em>firm</em>, a <em>business</em>, or <em>yourself</em>?
              </h2>
              <p>Set once. You can change it from the Brand button later.</p>
            </div>
            <div className="brandlayout">
              <div id="brandPanel">
                <div className="segmented kindpick" id="kindPick">
                  <button type="button" data-kind="firm">A law firm</button>
                  <button type="button" data-kind="business">A business</button>
                  <button type="button" data-kind="person">Myself</button>
                </div>

                <div className="brandgrid brandfields" data-for="person">
                  <div className="selectfield wide">
                    <label htmlFor="brandName">
                      Your name <span className="hint">sits in the corner of every slide</span>
                    </label>
                    <input type="text" id="brandName" data-brand="wordmark" maxLength={24} placeholder="e.g. John Smith" />
                  </div>
                </div>

                <div className="brandgrid brandfields" data-for="firm">
                  <div className="selectfield wide">
                    <label htmlFor="brandWordmark">
                      Firm name <span className="hint">sits in the corner of every slide</span>
                    </label>
                    <input type="text" id="brandWordmark" data-brand="wordmark" maxLength={24} placeholder="e.g. Smith & Co Lawyers" />
                  </div>
                </div>

                <div className="brandgrid brandfields" data-for="business">
                  <div className="selectfield wide">
                    <label htmlFor="brandWordmarkBiz">
                      Business name <span className="hint">sits in the corner of every slide</span>
                    </label>
                    <input type="text" id="brandWordmarkBiz" data-brand="wordmark" maxLength={24} placeholder="e.g. Corner Lane Cafe" />
                  </div>
                </div>

                <div className="field">
                  <label>
                    Your style <span className="hint">how the slides are laid out</span>
                  </label>
                  <div className="styles" id="styles"></div>
                </div>

                <div className="field">
                  <label>
                    Your colours <span className="hint">tap one, the preview updates</span>
                  </label>
                  <div className="palettes" id="palettes"></div>
                </div>

                <details className="morefields brandfields" data-for="firm business">
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
                      <label htmlFor="brandSerif">Serif (statements)</label>
                      <select id="brandSerif" data-brand="serif" defaultValue="default">
                        <option value="default">Playfair Display (default)</option>
                        <option value="Lora">Lora</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="Fraunces">Fraunces</option>
                      </select>
                    </div>
                    <div className="selectfield">
                      <label htmlFor="brandSans">Sans (body &amp; labels)</label>
                      <select id="brandSans" data-brand="sans" defaultValue="default">
                        <option value="default">TikTok Sans (default)</option>
                        <option value="Inter">Inter</option>
                        <option value="Manrope">Manrope</option>
                        <option value="Work Sans">Work Sans</option>
                      </select>
                    </div>
                  </div>
                </details>

                <div className="field brandvoice">
                  <label htmlFor="brandVoice">
                    Your voice <span className="hint">optional. paste a few things you have actually written</span>
                  </label>
                  <textarea
                    id="brandVoice"
                    data-brand="voice"
                    rows={4}
                    placeholder="A post, an email, anything in your own words. The drafts will sound like this instead of like AI."
                  />
                </div>
              </div>

              <div className="brandpreview">
                <p className="panel-title">What your slides will look like</p>
                <div className="previewframe">
                  <div className="canvasholder" id="brandPreview"></div>
                </div>
              </div>
            </div>
            <div className="stepfoot">
              <button className="btn btn-sm" id="btnResetBrand" type="button">
                Reset to defaults
              </button>
              <button className="btn btn-accent" type="button" data-go="ask">
                Done
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="ask">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                What do you want to <em>post about</em> today?
              </h2>
              <p>One line is enough. You get a LinkedIn post and the slides to go with it. Nothing posts on its own.</p>
            </div>
            <div className="segmented formatpick" id="formatPick">
              <button type="button" data-format="carousel">Slides (a carousel)</button>
              <button type="button" data-format="poster">One poster</button>
            </div>
            <textarea
              className="askbox"
              id="askInput"
              rows={5}
              placeholder="e.g. what to bring to your first family law appointment&#10;or: free wills clinic, Tuesday 10am, Parramatta office"
            />
            <p className="askstatus" id="askStatus"></p>
            <div className="stepfoot">
              <button type="button" className="linkbtn" id="btnSeeExample">
                See an example post first
              </button>
              <button className="btn btn-accent" id="btnAsk" type="button">
                Write my post
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="post">
          <div className="postgrid">
            <div className="panel panel-pad chatcol">
              <div className="stephead compact">
                <h2>
                  Want to <em>change</em> anything?
                </h2>
              </div>
              <div className="chatlog" id="chatLog"></div>
              <div className="chatbar">
                <textarea id="chatInput" rows={2} placeholder="Shorter. Punchier hook. Slide 3 should name the case." />
                <button className="btn btn-accent" id="btnSend" type="button">
                  Send
                </button>
              </div>
              <p className="chathint">Just say it in plain words. Everything you do not mention stays as it is.</p>
            </div>

            <div className="panel panel-pad resultcol" id="resultPanel">
              <p className="panel-title">Your post</p>
              <textarea id="captionText" rows={10} />
              <div className="captionrow">
                <button className="btn btn-sm" id="btnCopyCaption" type="button">
                  Copy post
                </button>
              </div>

              <p className="panel-title striptitle">
                Slides <span className="hint">tap one to edit it by hand</span>
              </p>
              <div className="strip" id="strip"></div>
              <details className="morefields" id="editDrawer">
                <summary>Edit this slide by hand</summary>
                <div className="editgrid">
                  <div className="previewframe">
                    <div className="canvasholder" id="previewHolder"></div>
                  </div>
                  <div id="editorPanel"></div>
                </div>
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
                  Save this slide to Photos
                </button>
              </div>
              <div className="exportbar" id="downloadBar">
                <button className="btn btn-accent" id="btnExportAll" type="button">
                  Download whole carousel (ZIP)
                </button>
                <button className="btn" id="btnExportOne" type="button">
                  Download this slide (PNG)
                </button>
              </div>
              <p className="exportnote" id="exportNote"></p>
            </div>
          </div>
        </section>
      </div>

      <div style={{ position: "fixed", left: -99999, top: 0 }} id="exportStage"></div>
      <div className="toast" id="toast"></div>
    </>
  );
}
