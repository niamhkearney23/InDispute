/* Sleep Shop popups.

   House rules, because a popup is the easiest place on a site to look
   desperate:

   - Fires on intent, never on arrival. A popup that interrupts the first
     three seconds is asking before it has given anything.
   - Asks once. A dismissal is remembered for 30 days, a signup for a year.
   - Never on cart or checkout. Nothing gets between a customer and paying.
   - Two steps. Email first, then the optional detail. Asking for four fields
     up front is where capture rates go to die.
   - No countdown, no shame close, no "no thanks, I hate presents".
   - Renders nothing at all unless Klaviyo is actually configured, so an email
     can never be captured into a void.
*/
(function () {
  'use strict';

  var KEY = 'sleepshop.popup.';
  var REVISION = '2024-10-15';

  /* ------------------------------------------------------------ storage */

  function remember(id, days) {
    try {
      var until = new Date().getTime() + days * 86400000;
      localStorage.setItem(KEY + id, String(until));
    } catch (err) {
      /* Private mode. The popup then behaves as session only, which is the
         polite failure: it can reappear tomorrow, not three times today. */
    }
  }

  function suppressed(id) {
    try {
      var until = Number(localStorage.getItem(KEY + id));
      if (!until) return false;
      if (new Date().getTime() > until) {
        localStorage.removeItem(KEY + id);
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /* Someone who has already given us their email should never be asked again,
     whichever popup did the asking. */
  function alreadySubscribed() {
    return suppressed('subscribed');
  }

  /* ------------------------------------------------------------- klaviyo */

  function subscribe(config, payload) {
    var profile = { email: payload.email };
    if (payload.first_name) profile.first_name = payload.first_name;

    var properties = {};
    if (payload.gift_date) properties.gift_date = payload.gift_date;
    if (payload.gift_name) properties.gift_recipient = payload.gift_name;
    properties.signup_source = payload.source;
    profile.properties = properties;

    var body = {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: payload.source,
          profile: { data: { type: 'profile', attributes: profile } }
        },
        relationships: { list: { data: { type: 'list', id: payload.list } } }
      }
    };

    return fetch(
      'https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(config.key),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', revision: REVISION },
        body: JSON.stringify(body)
      }
    ).then(function (res) {
      /* Klaviyo answers 202 with an empty body on success. */
      if (!res.ok) throw new Error('klaviyo ' + res.status);
      return true;
    });
  }

  /* ------------------------------------------------------- focus handling */

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trap(panel, event) {
    var items = Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];

    if (!panel.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------- popup */

  function Popup(root, config) {
    this.root = root;
    this.config = config;
    this.id = root.getAttribute('data-popup');
    this.panel = root.querySelector('.ss-pop__panel');
    this.dismissDays = Number(root.getAttribute('data-dismiss-days')) || 30;
    this.returner = null;
    this.open = false;
    this.bind();
  }

  Popup.prototype.show = function () {
    if (this.open) return;
    this.open = true;
    this.returner = document.activeElement;
    this.root.setAttribute('data-open', 'true');
    /* Next frame, so the transition runs from the closed position. */
    requestAnimationFrame(
      function () {
        this.root.setAttribute('data-open', 'shown');
      }.bind(this)
    );
    document.body.style.overflow = 'hidden';

    var field = this.root.querySelector('input:not([type="hidden"])');
    /* Do not autofocus on touch: it throws the keyboard up over the offer
       before it has been read. */
    if (field && !window.matchMedia('(pointer: coarse)').matches) field.focus();
    else this.panel.focus();
  };

  Popup.prototype.hide = function (reason) {
    if (!this.open) return;
    this.open = false;
    this.root.setAttribute('data-open', 'true');
    document.body.style.overflow = '';

    var self = this;
    setTimeout(function () {
      self.root.removeAttribute('data-open');
    }, 300);

    if (reason === 'dismissed') remember(this.id, this.dismissDays);
    if (this.returner && document.contains(this.returner)) this.returner.focus();
  };

  Popup.prototype.bind = function () {
    var self = this;

    this.root.addEventListener('click', function (event) {
      if (event.target.closest('[data-pop-close], .ss-pop__scrim, [data-pop-decline]')) {
        self.hide('dismissed');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!self.open) return;
      if (event.key === 'Escape') self.hide('dismissed');
      if (event.key === 'Tab') trap(self.panel, event);
    });

    var form = this.root.querySelector('form');
    if (form) form.addEventListener('submit', this.submit.bind(this));

    var skip = this.root.querySelector('[data-pop-skip]');
    if (skip) {
      skip.addEventListener('click', function () {
        self.hide('done');
      });
    }
  };

  Popup.prototype.step = function (name) {
    var steps = this.root.querySelectorAll('.ss-pop__step');
    Array.prototype.forEach.call(steps, function (el) {
      el.hidden = el.getAttribute('data-step') !== name;
    });
  };

  Popup.prototype.submit = function (event) {
    event.preventDefault();
    var self = this;
    var form = event.target;
    var email = form.elements.email;
    var error = this.root.querySelector('.ss-pop__error');
    var button = form.querySelector('.ss-pop__submit');

    var value = String(email.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error.textContent = 'That email does not look right. Check it and try again.';
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      return;
    }
    error.textContent = '';
    email.removeAttribute('aria-invalid');
    button.setAttribute('aria-busy', 'true');

    var payload = {
      email: value,
      list: this.root.getAttribute('data-list'),
      source: this.root.getAttribute('data-source') || 'Website popup',
      first_name: form.elements.first_name ? form.elements.first_name.value.trim() : '',
      gift_name: form.elements.gift_name ? form.elements.gift_name.value.trim() : '',
      gift_date: form.elements.gift_date ? form.elements.gift_date.value : ''
    };

    subscribe(this.config, payload)
      .then(function () {
        remember('subscribed', 365);
        remember(self.id, 365);
        self.step(self.root.querySelector('[data-step="two"]') ? 'two' : 'done');
        button.removeAttribute('aria-busy');
      })
      .catch(function () {
        button.removeAttribute('aria-busy');
        error.textContent =
          'Something went wrong at our end. Try again, or email us and we will add you by hand.';
      });
  };

  /* ------------------------------------------------------------ triggers */

  function arm(popup) {
    var root = popup.root;
    var fired = false;

    function fire() {
      if (fired) return;
      fired = true;
      popup.show();
    }

    var delay = Number(root.getAttribute('data-delay')) || 0;
    if (delay) setTimeout(fire, delay * 1000);

    var scroll = Number(root.getAttribute('data-scroll')) || 0;
    if (scroll) {
      window.addEventListener(
        'scroll',
        function () {
          var height = document.documentElement.scrollHeight - window.innerHeight;
          if (height <= 0) return;
          if ((window.scrollY / height) * 100 >= scroll) fire();
        },
        { passive: true }
      );
    }

    /* Exit intent is a desktop signal. On touch there is no pointer leaving
       the window, and the usual substitutes (fast upward scroll, back button)
       guess wrong often enough to be rude. */
    if (root.getAttribute('data-exit') === 'true' && !window.matchMedia('(pointer: coarse)').matches) {
      document.addEventListener('mouseout', function (event) {
        if (!event.relatedTarget && event.clientY <= 4) fire();
      });
    }
  }

  /* ---------------------------------------------------------------- init */

  function init() {
    var host = document.querySelector('[data-popups]');
    if (!host) return;

    var config = { key: host.getAttribute('data-klaviyo-key') };
    if (!config.key) return; /* not configured, so nothing is asked for */

    var path = window.location.pathname;
    var onCheckout = path.indexOf('/checkouts') === 0 || path.indexOf('/cart') === 0;

    Array.prototype.forEach.call(host.querySelectorAll('[data-popup]'), function (root) {
      var id = root.getAttribute('data-popup');

      if (!root.getAttribute('data-list')) return;
      if (alreadySubscribed()) return;
      if (suppressed(id)) return;
      if (onCheckout && root.getAttribute('data-allow-cart') !== 'true') return;

      /* The cart popup has nothing to say when the cart is empty. */
      if (root.getAttribute('data-needs-cart') === 'true') {
        var count = Number(host.getAttribute('data-cart-count')) || 0;
        if (count === 0) return;
      }

      arm(new Popup(root, config));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
