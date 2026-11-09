'use client';

import { useState } from 'react';
import Link from '@/components/app-link';
import { Button, Card } from '@/components/ui';
import { LIMIT_REACHED, MAX_QUESTION, NOT_COVERED, type AskResult } from '@/lib/ask/rules';

/** Ask a question; the answer comes only from lessons a lawyer has signed off. */
export function AskBox() {
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || question.trim().length < 3) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      setResult((await r.json()) as AskResult);
    } catch {
      setResult({ kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="font-sans text-xl font-semibold">Ask a question</h2>
      <p className="mt-1 mb-3 text-sm text-slate">
        Answers come only from the lessons a lawyer has checked. If they do not cover it, it says so.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="ask-q" className="sr-only">Your question</label>
        <input
          id="ask-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION}
          placeholder="e.g. What is the difference between a High Court and a Sessions Court?"
          className="w-full rounded-md border-2 border-rule bg-paper-raised px-3 py-2.5 text-base outline-none placeholder:text-muted/70 focus:border-accent"
        />
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Looking…' : 'Ask'}
        </Button>
      </form>
      <div aria-live="polite" className="mt-4 space-y-3 text-sm">
        {result?.kind === 'notCovered' ? <p className="text-slate">{NOT_COVERED}</p> : null}
        {result?.kind === 'limit' ? <p className="text-slate">{LIMIT_REACHED}</p> : null}
        {result?.kind === 'error' ? (
          <p className="text-slate">That did not work just now. Try again in a moment.</p>
        ) : null}
        {result?.kind === 'answer' ? (
          <>
            <p className="whitespace-pre-line leading-relaxed">{result.text}</p>
            <p className="text-xs text-muted">
              {result.written
                ? 'Put into plain words from the lessons below. Check the lesson before you rely on it.'
                : 'This is the lesson text itself.'}
            </p>
            <ul className="space-y-1">
              {result.sources.map((s) => (
                <li key={`${s.href}${s.heading}`}>
                  <Link href={s.href} className="underline">
                    {s.title}: {s.heading}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </Card>
  );
}
