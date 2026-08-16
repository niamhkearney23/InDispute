/* ==========================================================================
   Lawgistics — question of the day
   The same question for everyone on a given day, chosen deterministically
   from the date so the site and the morning WhatsApp/email message always
   agree. Answering once a day earns XP into the Academy ladder.
   ========================================================================== */

(function (global) {
  'use strict';

  /* Day number since epoch in Malaysian time. Using a fixed offset rather
     than the visitor's locale keeps the site and the 7am MYT send in step,
     wherever the reader happens to be. */
  function malaysianDayNumber(now) {
    var d = now || new Date();
    var myt = new Date(d.getTime() + (8 * 60 - d.getTimezoneOffset() * -1) * 0);
    // Build a UTC+8 calendar date without depending on the host timezone.
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;
    myt = new Date(utc + 8 * 3600000);
    return Math.floor(Date.UTC(myt.getFullYear(), myt.getMonth(), myt.getDate()) / 86400000);
  }

  function questionForDay(list, dayNo) {
    if (!list.length) return null;
    return list[((dayNo % list.length) + list.length) % list.length];
  }

  function mytDateLabel(now) {
    var d = now || new Date();
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;
    var m = new Date(utc + 8 * 3600000);
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];
    return m.getDate() + ' ' + months[m.getMonth()] + ' ' + m.getFullYear();
  }

  // Exposed so the n8n workflow and any test can pick the identical question.
  global.LG_QUIZ = {
    dayNumber: malaysianDayNumber,
    questionForDay: questionForDay,
    dateLabel: mytDateLabel
  };

  function init() {
    var root = document.querySelector('[data-quiz]');
    if (!root || !global.Store) return;

    var esc = global.lgEsc || function (x) { return String(x == null ? '' : x); };

    var all = Store.list('quizQuestions', { where: { status: 'published' } });
    if (!all.length) { root.style.display = 'none'; return; }

    var dayNo = malaysianDayNumber();
    var q = questionForDay(all, dayNo);
    if (!q) { root.style.display = 'none'; return; }

    var session = Store.session();
    var KEY = 'lawgistics.quiz.' + (session ? session.email : 'guest');
    var state = { answered: {}, streak: 0, lastDay: null };
    try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    var optsHost = root.querySelector('[data-quiz-opts]');
    var because = root.querySelector('[data-quiz-because]');
    var options = String(q.options || '').split('\n').filter(function (l) { return l.trim(); });
    var LETTERS = ['A', 'B', 'C', 'D', 'E'];

    root.querySelector('[data-quiz-date]').textContent = mytDateLabel();
    root.querySelector('[data-quiz-area]').textContent = q.area || '';

    function paintStreak() {
      var wrap = root.querySelector('[data-quiz-streak-wrap]');
      if (!wrap) return;
      wrap.innerHTML = state.streak > 0
        ? '<b>' + state.streak + '</b> day streak'
        : '';
    }

    function reveal(chosen) {
      var correct = Number(q.answer);
      optsHost.querySelectorAll('.quiz__opt').forEach(function (btn, i) {
        btn.setAttribute('disabled', 'disabled');
        if (i === correct) btn.classList.add('is-right');
        else if (i === chosen) btn.classList.add('is-wrong');
      });
      because.innerHTML = '<strong>' + (chosen === correct ? 'Correct.' : 'Not quite.') +
        '</strong> ' + esc(q.because);
      because.classList.add('is-on');
    }

    options.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz__opt';
      btn.innerHTML = '<span class="quiz__letter">' + LETTERS[i] + '</span><span>' + esc(text.trim()) + '</span>';
      btn.addEventListener('click', function () {
        if (state.answered[dayNo] !== undefined) return;

        state.answered[dayNo] = i;
        // A streak counts consecutive days answered, right or wrong: the habit
        // is the point, and punishing a wrong answer discourages guessing aloud.
        state.streak = (state.lastDay === dayNo - 1 || state.lastDay === dayNo)
          ? (state.lastDay === dayNo ? state.streak : state.streak + 1)
          : 1;
        state.lastDay = dayNo;
        save();

        reveal(i);
        paintStreak();

        // Correct answers feed the Academy ladder, once per day.
        if (Number(q.answer) === i && session) {
          try {
            var AK = 'lawgistics.academy.' + session.email;
            var prog = JSON.parse(localStorage.getItem(AK) || '{}');
            var mark = 'quiz:' + dayNo;
            if (!prog[mark]) { prog[mark] = true; localStorage.setItem(AK, JSON.stringify(prog)); }
          } catch (e) { /* storage blocked: the quiz still works */ }
        }
      });
      optsHost.appendChild(btn);
    });

    root.querySelector('[data-quiz-q]').textContent = q.question;
    paintStreak();

    // Already answered today? Show the outcome rather than letting them retry.
    if (state.answered[dayNo] !== undefined) reveal(state.answered[dayNo]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
