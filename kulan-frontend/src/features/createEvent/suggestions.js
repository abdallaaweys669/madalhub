/**
 * Client-side heuristics for titles/descriptions and format detection.
 * Replace internals with API calls later without changing callers.
 */

export function detectFormatFromPeople(people) {
  const speakers = people.filter((p) => p.role === 'speaker' && p.fullName?.trim());
  const panelists = people.filter((p) => p.role === 'panelist' && p.fullName?.trim());
  const moderators = people.filter((p) => p.role === 'moderator' && p.fullName?.trim());

  if (speakers.length >= 1 && panelists.length >= 2) return 'hybrid';
  if (panelists.length >= 2 && moderators.length >= 1) return 'panel';
  if (speakers.length >= 1 && panelists.length === 0 && moderators.length === 0) return 'talk';
  return null;
}

function formatWord(format) {
  if (format === 'panel') return 'panel';
  if (format === 'hybrid') return 'hybrid';
  if (format === 'talk') return 'talk';
  return 'event';
}

export function suggestTitle({ categoryName, format, isPhysical, locationName, seed = 0 }) {
  const cat = (categoryName || 'Community').trim();
  const loc = (locationName || '').trim();
  const venue = isPhysical ? (loc ? ` at ${loc}` : ' downtown') : ' online';
  const fmt = formatWord(format);

  const pool = [
    `${cat} ${fmt}: fresh ideas & real talk`,
    `An evening of ${cat.toLowerCase()} — ${fmt} style`,
    `${cat} spotlight${venue}`,
    `${fmt === 'event' ? 'Meetup' : fmt.charAt(0).toUpperCase() + fmt.slice(1)} night: ${cat}`,
    `Level up: ${cat} for curious minds`,
    `${cat} collective — learn, connect, build`,
  ];

  const n = pool.length;
  const i = ((seed % n) + n) % n;
  return [pool[i], pool[(i + 1) % n], pool[(i + 2) % n]];
}

export function suggestDescription({ title, format, capacity, locationName, isPhysical, seed = 0 }) {
  const t = (title || 'This event').trim();
  const cap = capacity ? `about ${capacity} seats` : 'a welcoming group';
  const loc = (locationName || '').trim();
  const place = isPhysical ? (loc ? `We’ll meet at ${loc}.` : 'Venue details will be confirmed soon.') : 'Join from anywhere — link is on the event page.';

  const fmt = formatWord(format);
  const intros = [
    `${t} is built to be practical and welcoming — perfect if you want substance without hype.`,
    `Come for the ideas, stay for the people. ${t} is designed to be interactive and useful.`,
    `Whether you’re new or experienced, ${t} will give you clear takeaways you can use immediately.`,
  ];
  const who = [
    `Ideal for builders, students, and professionals who care about ${fmt === 'event' ? 'learning together' : fmt + '-style sessions'}.`,
    `Bring questions — we leave room for discussion and networking.`,
    `We’re keeping the pace friendly and the content sharp.`,
  ];
  const i = ((seed % intros.length) + intros.length) % intros.length;

  const body = `${intros[i]}\n\nWhat to expect: focused content, community energy, and space for questions.\n\nAudience: ${cap}. ${who[i]}\n\n${place}`;

  const alt1 = `${t} covers the essentials with room for depth.\n\nYou’ll leave with notes, connections, and next steps.\n\n${place}`;
  const alt2 = `A ${fmt === 'event' ? 'community' : fmt} session centered on real examples and honest conversation.\n\n${who[(i + 1) % who.length]}\n\n${place}`;

  return [body, alt1, alt2];
}
