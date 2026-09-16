"use client";

import { useEffect, useRef } from "react";
import { initStudio } from "@/lib/studio";

const STEPS = [
  { key: "brand", label: "Brand" },
  { key: "topic", label: "Topic" },
  { key: "review", label: "Review" },
  { key: "export", label: "Download" },
];

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
            <span>one graphic a day</span>
          </div>
          <ol className="steps" id="stepBar">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button type="button" className="stepbtn" data-step={s.key}>
                  <span className="stepnum">{i + 1}</span>
                  <span className="steplabel">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <section className="step" data-step="brand">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                First, <em>your brand.</em>
              </h2>
              <p>Defaults are Lawgistics. Change anything, or just press Next.</p>
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
                  placeholder="A post, an email, anything in your own words. The draft will sound like this instead of like AI."
                />
              </div>
            </div>
            <div className="stepfoot">
              <button className="btn btn-sm" id="btnResetBrand" type="button">
                Reset to Lawgistics
              </button>
              <button className="btn btn-accent" type="button" data-go="topic">
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="topic">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                What do you want to <em>post about</em> today?
              </h2>
              <p>One line is enough. It drafts a full carousel and a caption for you to check. Nothing posts on its own.</p>
            </div>
            <div className="aibar">
              <textarea
                id="aiPrompt"
                rows={3}
                placeholder="e.g. the High Court's long service leave ruling, or five things that actually get you a clerkship"
              />
              <div className="aibar-row">
                <p className="aistatus" id="aiStatus"></p>
                <button className="btn btn-accent" id="btnAiGenerate" type="button">
                  Draft it
                </button>
              </div>
            </div>
            <p className="altlinks">
              <button type="button" className="linkbtn" id="btnLoadExample">
                Load the example carousel
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" className="linkbtn" id="btnNew">
                Start from a blank slide
              </button>
            </p>
            <div className="stepfoot">
              <button className="btn" type="button" data-go="brand">
                Back
              </button>
              <button className="btn" type="button" data-go="review">
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="review">
          <div className="stepcard stepcard-wide panel">
            <div className="stephead">
              <h2>
                Check <em>every</em> slide.
              </h2>
              <p>Edit anything. What you see here is exactly what downloads.</p>
            </div>
            <div className="reviewgrid">
              <div className="previewcol">
                <div className="previewframe">
                  <div className="canvasholder" id="previewHolder"></div>
                </div>
                <div className="slidenav">
                  <button className="btn btn-sm" id="btnPrevSlide" type="button">
                    ← Prev
                  </button>
                  <div className="dotrow" id="dotRow"></div>
                  <button className="btn btn-sm" id="btnNextSlide" type="button">
                    Next →
                  </button>
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
              </div>
              <div id="editorPanel"></div>
            </div>
            <div className="stepfoot">
              <button className="btn" type="button" data-go="topic">
                Back
              </button>
              <button className="btn btn-accent" type="button" data-go="export">
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="step" data-step="export">
          <div className="stepcard panel">
            <div className="stephead">
              <h2>
                Ready to <em>download?</em>
              </h2>
              <p>One last look. You are the publisher, not the AI.</p>
            </div>
            <div className="strip" id="strip"></div>
            <label className="consentbar" htmlFor="consentCheck">
              <input type="checkbox" id="consentCheck" />
              <span>
                This was drafted by AI. I have read every slide and the caption, checked any facts, names and citations
                myself, and I take responsibility for what I post.
              </span>
            </label>
            <div className="exportbar">
              <button className="btn" id="btnExportOne" type="button">
                Download this slide (PNG)
              </button>
              <button className="btn btn-accent" id="btnExportAll" type="button">
                Download whole carousel (ZIP)
              </button>
            </div>
            <div className="captionpanel" id="captionPanel" hidden>
              <p className="panel-title">Caption</p>
              <textarea id="captionText" rows={8} />
              <div className="captionrow">
                <button className="btn btn-sm" id="btnCopyCaption" type="button">
                  Copy caption
                </button>
              </div>
            </div>
            <div className="stepfoot">
              <button className="btn" type="button" data-go="review">
                Back
              </button>
              <button className="btn" type="button" data-go="topic">
                Start another
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
