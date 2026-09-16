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
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                What does <em>your brand</em> look like?
              </h2>
              <p>Set once. Defaults are Lawgistics. Change anything, or just press Done.</p>
            </div>
            <div className="brandgrid" id="brandPanel">
              <div className="selectfield">
                <label htmlFor="brandWordmark">Wordmark</label>
                <input type="text" id="brandWordmark" data-brand="wordmark" maxLength={24} />
              </div>
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
            <div className="stepfoot">
              <button className="btn btn-sm" id="btnResetBrand" type="button">
                Reset to Lawgistics
              </button>
              <button className="btn btn-accent" type="button" data-go="post">
                Done
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="post">
          <div className="postgrid">
            <div className="panel panel-pad chatcol">
              <div className="stephead compact">
                <h2>
                  What do you want to <em>post about</em> today?
                </h2>
              </div>
              <div className="chatlog" id="chatLog"></div>
              <div className="chatbar">
                <textarea id="chatInput" rows={2} placeholder="Type it here. One line is enough." />
                <button className="btn btn-accent" id="btnSend" type="button">
                  Send
                </button>
              </div>
              <p className="chathint">
                Then just tell it what to change. &ldquo;Shorter.&rdquo; &ldquo;Punchier hook.&rdquo; &ldquo;Slide 3
                should name the case.&rdquo;
              </p>
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
