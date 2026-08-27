/* Sending a person's work to be marked, without the wait killing it.
 *
 * Both marked exercises, advocacy and drafting, ask Opus to read something a
 * learner wrote and score it against a rubric. That is a slow request by
 * nature: it reasons, then it writes a full assessment against a schema.
 *
 * The first build sent it as one buffered request and waited for the whole
 * answer. Nothing came back down the wire until the model had finished, so as
 * far as every machine in between was concerned the connection was idle. The
 * serverless function is capped at sixty seconds, and a long letter marked at
 * high effort goes past that, so the function was killed and the browser was
 * handed a bare 504. The learner saw "Something went wrong (504)" after a
 * minute of staring at a spinner, with no idea whether their letter was the
 * problem. It was not. The plumbing was.
 *
 * So it streams. Bytes start arriving as soon as the model starts writing,
 * which keeps the connection demonstrably alive and lets the page show the
 * feedback being written rather than a spinner that might mean anything.
 *
 * Streaming alone does not make a slow request fast, so there is a second
 * guard. If the stream stops before the model is finished, which is what the
 * function running out of time looks like from here, it marks once more at a
 * lower effort setting. That is a real trade and the caller is told it
 * happened, because a mark produced under a different setting should not
 * quietly present itself as the same mark.
 *
 * Nothing a learner writes is stored by any of this. It goes to be marked and
 * the feedback comes back to the page.
 */
(function () {
  'use strict';

  var ENDPOINT = '/claude';

  /* The step down taken when the first attempt runs out of time. Still Opus,
     still the same rubric and the same schema: the only thing that changes is
     how long it is allowed to deliberate before writing. */
  var FALLBACK_EFFORT = 'medium';

  function LgMarkError(message, kind) {
    var err = new Error(message);
    err.kind = kind || 'failed';
    return err;
  }

  /* Anthropic's stream is server-sent events: "data: {...}" lines, blank line
     separated. Only the text of the answer is wanted here. Adaptive thinking
     also emits thinking deltas, which are the model working rather than the
     model's answer, and must not end up in the JSON we parse. */
  function readStream(res, onText) {
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var text = '';
    var finished = false;
    var stopReason = null;
    var streamError = null;

    function handle(raw) {
      var line = raw.trim();
      if (line.indexOf('data:') !== 0) return;
      var json = line.slice(5).trim();
      if (!json || json === '[DONE]') return;
      var ev;
      try { ev = JSON.parse(json); } catch (e) { return; }

      if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
        text += ev.delta.text;
        if (onText) onText(text);
      } else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason) {
        stopReason = ev.delta.stop_reason;
      } else if (ev.type === 'message_start' && ev.message && ev.message.stop_reason) {
        stopReason = ev.message.stop_reason;
      } else if (ev.type === 'message_stop') {
        finished = true;
      } else if (ev.type === 'error') {
        streamError = (ev.error && ev.error.message) || 'stream error';
      }
    }

    function pump() {
      return reader.read().then(function (step) {
        if (step.done) {
          // Whatever is left with no trailing newline behind it.
          if (buffer.trim()) handle(buffer);
          return { text: text, finished: finished, stopReason: stopReason, streamError: streamError };
        }
        buffer += decoder.decode(step.value, { stream: true });
        var parts = buffer.split('\n');
        buffer = parts.pop();
        for (var i = 0; i < parts.length; i++) handle(parts[i]);
        return pump();
      });
    }

    return pump();
  }

  /* A deployment that has not picked up the streaming proxy yet answers with
     one JSON object. Reading it costs nothing and means an out-of-date
     function degrades to the old behaviour rather than to an error. */
  function readWhole(res) {
    return res.json().then(function (resp) {
      var text = (resp.content || [])
        .filter(function (b) { return b.type === 'text'; })
        .map(function (b) { return b.text; })
        .join('');
      return { text: text, finished: true, stopReason: resp.stop_reason || null, streamError: null };
    });
  }

  function attempt(payload, opts) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.status === 503) {
        throw LgMarkError(
          'The marking service is not switched on yet. Whoever set this up needs to add ANTHROPIC_API_KEY.',
          'no_key'
        );
      }
      if (res.status === 429) {
        throw LgMarkError('That is a lot of marking at once. Wait a minute and send it again.', 'rate');
      }
      if (!res.ok) {
        throw LgMarkError(
          'Something went wrong (' + res.status + '). Your work is safe in the box, try again in a moment.',
          res.status === 504 || res.status === 502 ? 'timeout' : 'failed'
        );
      }

      var type = String(res.headers.get('content-type') || '');
      var reading = type.indexOf('text/event-stream') !== -1 && res.body && res.body.getReader
        ? readStream(res, opts.onText)
        : readWhole(res);

      return reading.then(function (out) {
        if (out.streamError) throw LgMarkError('The marker stopped part way through. Please send it again.', 'timeout');
        if (out.stopReason === 'refusal') {
          throw LgMarkError('The marker could not assess that submission. Try rewriting it.', 'refusal');
        }
        if (!out.finished || !out.text) {
          // The connection closed with the answer unfinished. From here that is
          // indistinguishable from the function running out of time, and it is
          // treated as that because it is by far the likeliest cause.
          throw LgMarkError('The marker ran out of time.', 'timeout');
        }
        var parsed;
        try {
          parsed = JSON.parse(out.text);
        } catch (e) {
          throw LgMarkError('The feedback came back garbled. Please try again.', 'garbled');
        }
        return parsed;
      });
    });
  }

  /* Mark a submission.
   *
   *   payload      the request body, exactly as the page would have sent it
   *   opts.onText  called with the answer so far, as it is written
   *   opts.onSlow  called once if the first attempt timed out and it is being
   *                marked again at a lower effort, so the page can say so
   */
  window.LG_MARK = function (payload, opts) {
    opts = opts || {};
    var first = {};
    for (var k in payload) if (Object.prototype.hasOwnProperty.call(payload, k)) first[k] = payload[k];
    first.stream = true;

    return attempt(first, opts).catch(function (err) {
      if (err.kind !== 'timeout') throw err;

      if (opts.onSlow) opts.onSlow();

      var second = {};
      for (var j in first) if (Object.prototype.hasOwnProperty.call(first, j)) second[j] = first[j];
      second.output_config = {};
      for (var m in first.output_config) {
        if (Object.prototype.hasOwnProperty.call(first.output_config, m)) {
          second.output_config[m] = first.output_config[m];
        }
      }
      second.output_config.effort = FALLBACK_EFFORT;

      return attempt(second, opts).catch(function (again) {
        // Twice is not bad luck. Repeating the status code a second time tells
        // the person nothing they can act on, so say the thing that usually
        // works instead.
        if (again.kind !== 'timeout') throw again;
        throw LgMarkError(
          'The marker ran out of time twice. Your work is safe in the box. Sending a shorter piece usually gets through.',
          'timeout'
        );
      });
    });
  };
})();
