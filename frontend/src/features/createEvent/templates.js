/** Curated event starters — client-side only; swap for API later if needed. */

export const EVENT_TEMPLATES = [
  {
    id: 'talk',
    label: 'Talk',
    icon: 'mic-outline',
    title: 'Community talk: Ideas worth sharing',
    description:
      'A focused session with one main speaker, followed by audience Q&A.\n\nWhat you\'ll get: clear takeaways, real examples, and time for questions.\n\nWho should attend: builders, students, and curious learners.\n\nAgenda: welcome (5 min) · talk (40 min) · Q&A (15 min).',
    format: 'talk',
    capacity: '80',
  },
  {
    id: 'panel',
    label: 'Panel',
    icon: 'people-outline',
    title: 'Panel: Industry voices & debate',
    description:
      'A moderated conversation with multiple perspectives.\n\nWhat you\'ll get: diverse viewpoints, moderated discussion, and audience questions.\n\nWho should attend: professionals and enthusiasts who enjoy dialogue.\n\nAgenda: intros (10 min) · panel (45 min) · audience Q&A (20 min).',
    format: 'panel',
    capacity: '120',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    icon: 'construct-outline',
    title: 'Hands-on workshop: Build together',
    description:
      'Bring your laptop — we learn by doing.\n\nWhat you\'ll get: guided exercises, starter materials, and facilitator support.\n\nWho should attend: practitioners who want concrete skills.\n\nAgenda: setup (10 min) · exercises (70 min) · showcase (20 min).',
    format: 'talk',
    capacity: '40',
  },
  {
    id: 'meetup',
    label: 'Meetup',
    icon: 'cafe-outline',
    title: 'Casual meetup: Connect & collaborate',
    description:
      'Low-pressure networking with a light theme.\n\nWhat you\'ll get: introductions, open conversation, and optional lightning talks.\n\nWho should attend: newcomers and regulars alike.\n\nFlow: arrivals · intros · open mingling.',
    format: null,
    capacity: '60',
  },
  {
    id: 'hackathon',
    label: 'Hackathon',
    icon: 'code-slash-outline',
    title: 'Build sprint: Ship something in one day',
    description:
      'Team up, pick a challenge, and demo at the end.\n\nWhat you\'ll get: mentorship, prizes (optional), and a showcase.\n\nWho should attend: developers, designers, and product thinkers.\n\nAgenda: kickoff · build blocks · demos & feedback.',
    format: 'hybrid',
    capacity: '150',
  },
  {
    id: 'custom',
    label: 'Blank',
    icon: 'document-outline',
    title: '',
    description: '',
    format: undefined,
    capacity: undefined,
  },
];
