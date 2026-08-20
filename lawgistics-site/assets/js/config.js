/* ==========================================================================
   Lawgistics, runtime configuration
   apiBase '/api' is proxied by serve.py to https://lawgistics.my/api so the
   browser only ever makes same-origin requests (no CORS involved).
   Set remote:false to force pure demo mode (seed data + localStorage).
   ========================================================================== */

window.LG_CONFIG = {
  apiBase: '/api',
  remote: true,

  // The training app (a separate deployment). This site describes the training
  // and marks advocacy; the questions live in the app, where they are scored on
  // the server and the result is kept. Leave it blank and every link into the
  // app disappears rather than pointing at nothing.
  appUrl: 'https://in-dispute.vercel.app',

  // Paste your Calendly event link here (e.g. 'https://calendly.com/yourname/10min')
  // and the free intake call section embeds live scheduling automatically.
  calendlyUrl: '',

  // Paste the full Instagram profile URL (e.g. 'https://www.instagram.com/lawgistics.my').
  // Left blank, the footer simply omits the social block rather than showing a dead link.
  instagramUrl: '',

  // Named lawyers shown in the homepage trust block. The block stays hidden
  // until at least one entry is added, so nothing unverified is ever claimed.
  // photo: a path such as 'assets/img/mathew.jpg', or '' for initials.
  lawyers: [
    // {
    //   name: 'Mathew Philip',
    //   role: 'Reviewing lawyer',
    //   firm: 'Messrs Thomas Philip, Advocates & Solicitors',
    //   admission: 'Advocate & Solicitor, High Court of Malaya (admitted 20XX)',
    //   photo: '',
    //   note: 'Reviews the employment, contract and debt recovery templates.'
    // }
  ],
  lawyersNote: 'Every template is drafted and reviewed by a Malaysian advocate and solicitor before it is published.',

  // n8n webhook endpoints. Paste the Production URL from each n8n workflow's
  // Webhook node. Leave blank to disable, the site works exactly the same
  // either way, and a failed webhook never blocks the user.
  // See automation/README.md for setup.
  n8n: {
    enquiry: '',        // 01-enquiry-triage, new enquiry / intake / independent
    review: '',         // 02-document-review-loop, review requested or status changed
    documentCreated: '', // optional: fires when a document is unlocked
    academy: '',        // 06-academy-milestone, learner completes a level
    quiz: ''            // 07-daily-quiz, new subscriber + the 7am send
  },

  // Store collection key -> Payload REST slug
  slugs: {
    users: 'users',
    media: 'media',
    faqs: 'faqs',
    insights: 'insights',
    insightCategories: 'insight-categories',
    reviews: 'reviews',
    contactSubmissions: 'contact-submissions',
    enquirySubmissions: 'enquiry-submissions',
    newsletterLeads: 'newsletter-leads',
    categories: 'categories',
    templates: 'templates',
    documentsToReview: 'documents-to-review',
    cases: 'cases',
    books: 'books',
    learnTracks: 'learn-tracks',
    academyLevels: 'academy-levels',
    assistantTraining: 'assistant-training',
    quizQuestions: 'quiz-questions',
    quizSubscribers: 'quiz-subscribers'
  },

  globals: {
    pricing: 'pricing'
  }
};
