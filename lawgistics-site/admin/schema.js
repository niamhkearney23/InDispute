/* ==========================================================================
   Lawgistics Admin, collection schema
   Mirrors the Payload collection structure: add a collection here and the
   sidebar, dashboard, list view, and edit form all pick it up automatically.
   ========================================================================== */

window.LG_SCHEMA = {

  groups: [
    { label: 'Collections',      collections: ['users', 'media', 'faqs', 'insights', 'insightCategories', 'reviews', 'contactSubmissions', 'enquirySubmissions', 'newsletterLeads'] },
    { label: 'Templates',        collections: ['categories', 'templates'] },
    { label: 'Hub',              collections: ['cases', 'books', 'learnTracks', 'academyLevels', 'assistantTraining', 'quizQuestions', 'quizSubscribers'] },
    { label: 'Review Documents', collections: ['documentsToReview'] },
    { label: 'Settings',         collections: ['pricing'] }
  ],

  collections: {

    /* ------------------------------------------------------------ Users -- */
    users: {
      label: 'Users', singular: 'User', useAsTitle: 'email', search: ['email', 'name'],
      columns: [
        { key: 'email', label: 'Email', link: true },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role', badge: { admin: 'blue', editor: 'amber', customer: 'grey' } },
        { key: 'createdAt', label: 'Created', type: 'date' }
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'role', label: 'Role', type: 'select', options: ['admin', 'editor', 'customer'], required: true },
        { key: 'password', label: 'Password', type: 'text', desc: 'Demo build only, a real deployment must hash this server-side.' },
        { key: 'createdAt', label: 'Created', type: 'date' }
      ]
    },

    /* ------------------------------------------------------------ Media -- */
    media: {
      label: 'Media', singular: 'Media item', useAsTitle: 'filename', search: ['filename', 'alt'],
      columns: [
        { key: 'filename', label: 'Filename', link: true },
        { key: 'alt', label: 'Alt text' },
        { key: 'mimeType', label: 'Type', badge: {} },
        { key: 'filesize', label: 'Size' },
        { key: 'createdAt', label: 'Uploaded', type: 'date' }
      ],
      fields: [
        { key: 'filename', label: 'Filename', type: 'text', required: true },
        { key: 'alt', label: 'Alt text', type: 'text', desc: 'Describes the image for screen readers and when the image fails to load.' },
        { key: 'mimeType', label: 'MIME type', type: 'text' },
        { key: 'filesize', label: 'File size', type: 'text' },
        { key: 'width', label: 'Width (px)', type: 'number', half: true },
        { key: 'height', label: 'Height (px)', type: 'number', half: true },
        { key: 'createdAt', label: 'Uploaded', type: 'date' }
      ]
    },

    /* ------------------------------------------------------------- FAQs -- */
    faqs: {
      label: 'Faqs', singular: 'FAQ', useAsTitle: 'question', search: ['question', 'answer'],
      defaultSort: 'order',
      columns: [
        { key: 'question', label: 'Question', link: true, wide: true },
        { key: 'status', label: 'Status', badge: { published: 'green', draft: 'grey' } },
        { key: 'order', label: 'Order', type: 'number' }
      ],
      fields: [
        { key: 'question', label: 'Question', type: 'text', required: true },
        { key: 'answer', label: 'Answer', type: 'textarea', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] },
        { key: 'order', label: 'Display order', type: 'number' }
      ]
    },

    /* --------------------------------------------------------- Insights -- */
    insights: {
      label: 'Insights', singular: 'Insight', useAsTitle: 'title', search: ['title', 'excerpt'],
      defaultSort: 'date', defaultOrder: 'desc',
      columns: [
        { key: 'title', label: 'Title', link: true, wide: true },
        { key: 'category', label: 'Category', rel: 'insightCategories' },
        { key: 'status', label: 'Status', badge: { published: 'green', draft: 'grey' } },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true, desc: 'URL path: /article.html?slug=…' },
        { key: 'category', label: 'Category', type: 'relationship', relTo: 'insightCategories', required: true },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, desc: 'Shown on the insights index and in search results.' },
        { key: 'body', label: 'Body', type: 'richtext', desc: 'Plain text. Start a line with ## for a heading.' },
        { key: 'author', label: 'Author', type: 'text', half: true },
        { key: 'readTime', label: 'Read time (min)', type: 'number', half: true },
        { key: 'date', label: 'Publish date', type: 'date', half: true },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'], half: true }
      ]
    },

    /* ----------------------------------------------- Insight Categories -- */
    insightCategories: {
      label: 'Insight Categories', singular: 'Insight category', useAsTitle: 'name', search: ['name', 'slug'],
      defaultSort: 'order',
      columns: [
        { key: 'name', label: 'Name', link: true },
        { key: 'slug', label: 'Slug' },
        { key: 'order', label: 'Order', type: 'number' }
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true },
        { key: 'order', label: 'Display order', type: 'number' }
      ]
    },

    /* ---------------------------------------------------------- Reviews -- */
    reviews: {
      label: 'Reviews', singular: 'Review', useAsTitle: 'author', search: ['author', 'company', 'body'],
      defaultSort: 'date', defaultOrder: 'desc',
      columns: [
        { key: 'author', label: 'Author', link: true },
        { key: 'company', label: 'Company' },
        { key: 'rating', label: 'Rating', type: 'stars' },
        { key: 'status', label: 'Status', badge: { published: 'green', pending: 'amber', hidden: 'grey' } },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      fields: [
        { key: 'author', label: 'Author', type: 'text', required: true },
        { key: 'company', label: 'Company / location', type: 'text' },
        { key: 'body', label: 'Review', type: 'textarea', required: true },
        { key: 'rating', label: 'Rating (1-5)', type: 'number', half: true },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'pending', 'hidden'], half: true },
        { key: 'date', label: 'Date', type: 'date' }
      ]
    },

    /* ---------------------------------------------- Contact Submissions -- */
    contactSubmissions: {
      label: 'Contact Submissions', singular: 'Contact submission', useAsTitle: 'name',
      search: ['name', 'email', 'subject', 'message'], defaultSort: 'date', defaultOrder: 'desc',
      readOnlyCreate: true,
      columns: [
        { key: 'name', label: 'Name', link: true },
        { key: 'email', label: 'Email' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status', badge: { new: 'blue', replied: 'green', closed: 'grey' } },
        { key: 'date', label: 'Received', type: 'date' }
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', half: true },
        { key: 'email', label: 'Email', type: 'email', half: true },
        { key: 'phone', label: 'Phone', type: 'text', half: true },
        { key: 'subject', label: 'Subject', type: 'text', half: true },
        { key: 'message', label: 'Message', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: ['new', 'replied', 'closed'], half: true },
        { key: 'date', label: 'Received', type: 'date', half: true }
      ]
    },

    /* ---------------------------------------------- Enquiry Submissions -- */
    enquirySubmissions: {
      label: 'Enquiry Submissions', singular: 'Enquiry', useAsTitle: 'businessName',
      search: ['businessName', 'businessType', 'email', 'legalServices', 'description'],
      defaultSort: 'date', defaultOrder: 'desc',
      readOnlyCreate: true,
      columns: [
        { key: 'businessName', label: 'Business', link: true },
        { key: 'businessType', label: 'Type / industry' },
        { key: 'legalServices', label: 'Services', truncate: 40 },
        { key: 'timeline', label: 'Timeline', badge: { urgent: 'red', soon: 'amber', flexible: 'grey' } },
        { key: 'assignedTo', label: 'Assigned to', empty: 'Unassigned' },
        { key: 'status', label: 'Status', badge: { new: 'blue', matched: 'amber', quoted: 'green', closed: 'grey' } },
        { key: 'date', label: 'Received', type: 'date' }
      ],
      fields: [
        { key: 'businessName', label: 'Business name', type: 'text', half: true },
        { key: 'businessType', label: 'Business type / industry', type: 'text', half: true },
        { key: 'stage', label: 'Stage of business', type: 'select', options: ['idea', 'startup', 'growing', 'established'], half: true },
        { key: 'timeline', label: 'Timeline / urgency', type: 'select', options: ['urgent', 'soon', 'flexible'], half: true },
        { key: 'legalServices', label: 'Legal services required', type: 'text' },
        { key: 'description', label: 'Detailed requirement description', type: 'textarea' },
        { key: 'email', label: 'Email', type: 'email', half: true },
        { key: 'phone', label: 'Phone', type: 'text', half: true },
        { key: 'preferredContact', label: 'Preferred mode of communication', type: 'select', options: ['email', 'phone', 'video', 'whatsapp'], half: true },
        { key: 'date', label: 'Received', type: 'date', half: true },
        { key: 'assignedTo', label: 'Assigned lawyer', type: 'text', half: true, desc: 'Workflow field, may not exist in the live Payload schema.' },
        { key: 'status', label: 'Status', type: 'select', options: ['new', 'matched', 'quoted', 'closed'], half: true, desc: 'Workflow field, may not exist in the live Payload schema.' }
      ]
    },

    /* -------------------------------------------------- Newsletter Leads -- */
    newsletterLeads: {
      label: 'Newsletter Leads', singular: 'Newsletter lead', useAsTitle: 'email',
      search: ['email', 'source'], defaultSort: 'date', defaultOrder: 'desc',
      columns: [
        { key: 'email', label: 'Email', link: true },
        { key: 'source', label: 'Source' },
        { key: 'status', label: 'Status', badge: { subscribed: 'green', unsubscribed: 'grey' } },
        { key: 'date', label: 'Subscribed', type: 'date' }
      ],
      fields: [
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'source', label: 'Source', type: 'text', half: true },
        { key: 'status', label: 'Status', type: 'select', options: ['subscribed', 'unsubscribed'], half: true },
        { key: 'date', label: 'Subscribed', type: 'date' }
      ]
    },

    /* ----------------------------------------------- Template Categories -- */
    categories: {
      label: 'Categories', singular: 'Category', useAsTitle: 'name', search: ['name', 'slug', 'description'],
      defaultSort: 'order',
      columns: [
        { key: 'name', label: 'Name', link: true },
        { key: 'slug', label: 'Slug' },
        { key: 'description', label: 'Description', wide: true, truncate: 70 },
        { key: 'order', label: 'Order', type: 'number' }
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'order', label: 'Display order', type: 'number' }
      ]
    },

    /* -------------------------------------------------------- Templates -- */
    templates: {
      label: 'Templates', singular: 'Template', useAsTitle: 'title', search: ['title', 'summary'],
      columns: [
        { key: 'title', label: 'Title', link: true, wide: true },
        { key: 'category', label: 'Category', rel: 'categories' },
        { key: 'price', label: 'Price', prefix: 'RM ', type: 'number' },
        { key: 'questions', label: 'Questions', type: 'number' },
        { key: 'downloads', label: 'Downloads', type: 'number' },
        { key: 'status', label: 'Status', badge: { published: 'green', draft: 'grey', archived: 'red' } }
      ],
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'relationship', relTo: 'categories', required: true },
        { key: 'summary', label: 'Summary', type: 'textarea', required: true, desc: 'Shown on the template card.' },
        { key: 'price', label: 'Price (RM)', type: 'number', half: true },
        { key: 'questions', label: 'Number of questions', type: 'number', half: true },
        { key: 'turnaround', label: 'Typical turnaround', type: 'text', half: true },
        { key: 'downloads', label: 'Downloads', type: 'number', half: true },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft', 'archived'] }
      ]
    },

    /* ----------------------------------------------- Documents To Review -- */
    documentsToReview: {
      label: 'Documents To Reviews', singular: 'Document to review', useAsTitle: 'reference',
      search: ['reference', 'customer', 'template'], defaultSort: 'submitted', defaultOrder: 'desc',
      columns: [
        { key: 'reference', label: 'Reference', link: true },
        { key: 'customer', label: 'Customer' },
        { key: 'template', label: 'Template' },
        { key: 'reviewer', label: 'Reviewer', empty: 'Unassigned' },
        { key: 'status', label: 'Status', badge: { 'awaiting review': 'blue', 'in review': 'amber', 'changes requested': 'red', approved: 'green' } },
        { key: 'submitted', label: 'Submitted', type: 'date' }
      ],
      fields: [
        { key: 'reference', label: 'Reference', type: 'text', required: true, half: true },
        { key: 'submitted', label: 'Submitted', type: 'date', half: true },
        { key: 'customer', label: 'Customer', type: 'text', half: true },
        { key: 'template', label: 'Template', type: 'text', half: true },
        { key: 'reviewer', label: 'Assigned reviewer', type: 'text', half: true },
        { key: 'status', label: 'Status', type: 'select', options: ['awaiting review', 'in review', 'changes requested', 'approved'], half: true },
        { key: 'notes', label: 'Reviewer notes', type: 'textarea' }
      ]
    },

    /* -------------------------------------------------------- Cases ---- */
    cases: {
      label: 'Cases', singular: 'Case', useAsTitle: 'name',
      search: ['name', 'citation', 'area', 'keywords', 'holding'],
      defaultSort: 'year', defaultOrder: 'desc',
      columns: [
        { key: 'name', label: 'Case', link: true, wide: true },
        { key: 'citation', label: 'Citation' },
        { key: 'court', label: 'Court' },
        { key: 'area', label: 'Area' },
        { key: 'year', label: 'Year', type: 'number' },
        { key: 'verified', label: 'Verified', badge: { true: 'green', false: 'amber' } },
        { key: 'superseded', label: 'Superseded', badge: { true: 'red', false: 'grey' } }
      ],
      fields: [
        { key: 'name', label: 'Case name', type: 'text', required: true },
        { key: 'citation', label: 'Citation', type: 'text', required: true, half: true, desc: 'Verify against the official report before marking this verified.' },
        { key: 'court', label: 'Court', type: 'text', half: true },
        { key: 'year', label: 'Year', type: 'number', half: true },
        { key: 'area', label: 'Area of law', type: 'text', half: true },
        { key: 'holding', label: 'Holding (plain English)', type: 'textarea', required: true, desc: 'Your own summary, never paste from the judgment.' },
        { key: 'keywords', label: 'Keywords', type: 'text', desc: 'Comma-separated.' },
        { key: 'verified', label: 'Citation verified', type: 'select', options: ['false', 'true'], half: true },
        { key: 'superseded', label: 'No longer good law', type: 'select', options: ['false', 'true'], half: true,
          desc: 'Set this the moment an authority is displaced. A stale case shown as current is the costliest error in the library.' }
      ]
    },

    /* -------------------------------------------------------- Books ---- */
    books: {
      label: 'Books', singular: 'Book', useAsTitle: 'title',
      search: ['title', 'author', 'publisher', 'area'],
      columns: [
        { key: 'title', label: 'Title', link: true, wide: true },
        { key: 'author', label: 'Author' },
        { key: 'publisher', label: 'Publisher' },
        { key: 'area', label: 'Area' },
        { key: 'level', label: 'Level', badge: { Student: 'blue', Practitioner: 'green' } }
      ],
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'author', label: 'Author', type: 'text', half: true },
        { key: 'publisher', label: 'Publisher', type: 'text', half: true },
        { key: 'area', label: 'Area of law', type: 'text', half: true },
        { key: 'level', label: 'Level', type: 'select', options: ['Student', 'Practitioner'], half: true },
        { key: 'note', label: 'Why it matters', type: 'textarea' }
      ]
    },

    /* --------------------------------------------------- Learn tracks -- */
    learnTracks: {
      label: 'Learn Tracks', singular: 'Track', useAsTitle: 'title',
      search: ['title', 'audience', 'summary'], defaultSort: 'order',
      columns: [
        { key: 'title', label: 'Track', link: true, wide: true },
        { key: 'audience', label: 'Audience' },
        { key: 'duration', label: 'Duration' },
        { key: 'status', label: 'Status', badge: { published: 'green', draft: 'grey' } },
        { key: 'order', label: 'Order', type: 'number' }
      ],
      fields: [
        { key: 'title', label: 'Track title', type: 'text', required: true },
        { key: 'audience', label: 'Audience', type: 'text', half: true },
        { key: 'duration', label: 'Duration', type: 'text', half: true },
        { key: 'summary', label: 'Summary', type: 'textarea' },
        { key: 'lessons', label: 'Lessons', type: 'richtext', desc: 'One lesson per line, each is worth 10 XP.' },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'], half: true },
        { key: 'order', label: 'Display order', type: 'number', half: true }
      ]
    },

    /* ------------------------------------------------- Academy levels -- */
    academyLevels: {
      label: 'Academy Levels', singular: 'Level', useAsTitle: 'name',
      search: ['name', 'blurb'], defaultSort: 'level',
      columns: [
        { key: 'level', label: 'Level', type: 'number' },
        { key: 'name', label: 'Name', link: true },
        { key: 'xpRequired', label: 'XP required', type: 'number' },
        { key: 'tracks', label: 'Track', rel: 'learnTracks' }
      ],
      fields: [
        { key: 'level', label: 'Level number', type: 'number', required: true, half: true },
        { key: 'xpRequired', label: 'XP required to unlock', type: 'number', half: true },
        { key: 'name', label: 'Level name', type: 'text', required: true },
        { key: 'blurb', label: 'What this level teaches', type: 'textarea' },
        { key: 'tracks', label: 'Learn track', type: 'relationship', relTo: 'learnTracks' }
      ]
    },

    /* -------------------------------------------- Assistant training --- */
    assistantTraining: {
      label: 'Assistant Training', singular: 'Training record', useAsTitle: 'question',
      search: ['question', 'draftAnswer', 'area'], defaultSort: 'date', defaultOrder: 'desc',
      columns: [
        { key: 'question', label: 'Question', link: true, wide: true, truncate: 70 },
        { key: 'area', label: 'Area' },
        { key: 'verdict', label: 'Status', badge: { approved: 'green', pending: 'amber', rejected: 'red' } },
        { key: 'reviewedBy', label: 'Reviewed by', empty: 'Unassigned' },
        { key: 'date', label: 'Logged', type: 'date' }
      ],
      fields: [
        { key: 'question', label: 'Question', type: 'text', required: true },
        { key: 'draftAnswer', label: 'Answer', type: 'textarea', desc: 'Only served to users once the verdict is “approved”.' },
        { key: 'area', label: 'Area of law', type: 'text', half: true },
        { key: 'date', label: 'Logged', type: 'date', half: true },
        { key: 'reviewedBy', label: 'Reviewed by', type: 'text', half: true },
        { key: 'verdict', label: 'Verdict', type: 'select', options: ['pending', 'approved', 'rejected'], half: true },
        { key: 'notes', label: 'Reviewer notes', type: 'textarea' }
      ]
    },

    /* ---------------------------------------------- Quiz questions ----- */
    quizQuestions: {
      label: 'Quiz Questions', singular: 'Question', useAsTitle: 'question',
      search: ['question', 'area', 'because'],
      columns: [
        { key: 'question', label: 'Question', link: true, wide: true, truncate: 72 },
        { key: 'area', label: 'Area' },
        { key: 'answer', label: 'Correct', type: 'number' },
        { key: 'status', label: 'Status', badge: { published: 'green', draft: 'grey' } }
      ],
      fields: [
        { key: 'question', label: 'Question', type: 'textarea', required: true },
        { key: 'options', label: 'Options', type: 'richtext', required: true, desc: 'One option per line, in order. Two to five options.' },
        { key: 'answer', label: 'Correct option (0 = first line)', type: 'number', required: true, half: true },
        { key: 'area', label: 'Area of law', type: 'text', half: true },
        { key: 'because', label: 'Why, with the authority', type: 'textarea', required: true, desc: 'Shown after answering. Cite the section or case.' },
        { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] }
      ]
    },

    /* --------------------------------------------- Quiz subscribers ---- */
    quizSubscribers: {
      label: 'Quiz Subscribers', singular: 'Subscriber', useAsTitle: 'name',
      search: ['name', 'email', 'phone'], defaultSort: 'date', defaultOrder: 'desc',
      readOnlyCreate: true,
      columns: [
        { key: 'name', label: 'Name', link: true },
        { key: 'channel', label: 'Channel', badge: { email: 'blue', whatsapp: 'green' } },
        { key: 'email', label: 'Email', empty: '—' },
        { key: 'phone', label: 'Phone', empty: '—' },
        { key: 'consent', label: 'Consent', badge: { yes: 'green', no: 'red' } },
        { key: 'status', label: 'Status', badge: { subscribed: 'green', unsubscribed: 'grey' } },
        { key: 'date', label: 'Joined', type: 'date' }
      ],
      fields: [
        { key: 'name', label: 'Name', type: 'text', half: true },
        { key: 'channel', label: 'Channel', type: 'select', options: ['email', 'whatsapp'], half: true },
        { key: 'email', label: 'Email', type: 'email', half: true },
        { key: 'phone', label: 'WhatsApp number', type: 'text', half: true, desc: 'Include the country code.' },
        { key: 'consent', label: 'Consent recorded', type: 'select', options: ['yes', 'no'], half: true, desc: 'Must be yes before any WhatsApp template is sent.' },
        { key: 'status', label: 'Status', type: 'select', options: ['subscribed', 'unsubscribed'], half: true },
        { key: 'date', label: 'Joined', type: 'date' }
      ]
    },

    /* ------------------------------------------------- Global: Pricing -- */
    pricing: {
      label: 'Pricing', singular: 'Pricing', global: true,
      fields: [
        { key: 'standardName', label: 'Standard tier name', type: 'text', half: true },
        { key: 'standardCurrency', label: 'Currency symbol', type: 'text', half: true },
        { key: 'standardPrice', label: 'Standard price', type: 'number', half: true },
        { key: 'standardNote', label: 'Price note', type: 'text', half: true },
        { key: 'standardFeatures', label: 'Standard features', type: 'textarea', desc: 'One feature per line.' },
        { key: 'customName', label: 'Custom tier name', type: 'text', half: true },
        { key: 'customPrice', label: 'Custom price label', type: 'text', half: true },
        { key: 'customFeatures', label: 'Custom features', type: 'textarea', desc: 'One feature per line.' },
        { key: 'currency', label: 'Billing currency', type: 'text', half: true },
        { key: 'taxNote', label: 'Tax note', type: 'text', half: true }
      ]
    }

  }
};
