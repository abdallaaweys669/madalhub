// --- Using all the images from your assets folder ---
const IMG_CULTURE1 = require('../assets/culture1.png');
const IMG_CULTURE2 = require('../assets/culture2.png');
const IMG_POETRY1 = require('../assets/poetry1.png');
const IMG_PUBLIC_SPEAKING = require('../assets/public speaking.png');
const IMG_TECH_SUMMIT = require('../assets/tech summit1.png');

function addDays(days, hours = 18, minutes = 0) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function formatDetails(startsAt, city) {
  const date = new Date(startsAt);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart} · ${city}`;
}

export const events = [
  {
    id: '1',
    title: 'Somali Cultural Festival',
    startsAt: addDays(1, 19, 0),
    city: 'Mogadishu',
    isOnline: false,
    priceType: 'Free',
    priceAmount: null,
    goingCount: 42,
    image: IMG_CULTURE1,
    description:
      'Celebrate the rich heritage of Somali culture with traditional music, dance, food, and art. A family-friendly event for all ages.',
  },
  {
    id: '2',
    title: 'Somali Poetry Night',
    startsAt: addDays(2, 20, 0),
    city: 'Hargeisa',
    isOnline: false,
    priceType: 'Paid',
    priceAmount: 12,
    goingCount: 30,
    image: IMG_POETRY1,
    description:
      'An evening dedicated to the powerful words of classic and contemporary Somali poets. Open mic session included.',
  },
  {
    id: '3',
    title: 'Horn of Africa Tech Summit',
    startsAt: addDays(5, 9, 0),
    city: 'Nairobi',
    isOnline: false,
    priceType: 'Paid',
    priceAmount: 35,
    goingCount: 96,
    image: IMG_TECH_SUMMIT,
    description:
      'Join industry leaders and innovators to discuss the future of technology in East Africa. Keynotes, workshops, and networking opportunities.',
  },
  {
    id: '4',
    title: 'Art of Public Speaking',
    startsAt: addDays(0, 14, 0),
    city: 'Online',
    isOnline: true,
    priceType: 'Free',
    priceAmount: null,
    goingCount: 24,
    image: IMG_PUBLIC_SPEAKING,
    description:
      'Master the art of public speaking. This interactive online workshop will help you build confidence and deliver impactful presentations.',
  },
  {
    id: '5',
    title: 'Cultural Exchange Night',
    startsAt: addDays(8, 18, 30),
    city: 'Mogadishu',
    isOnline: false,
    priceType: 'Free',
    priceAmount: null,
    goingCount: 54,
    image: IMG_CULTURE2,
    description:
      'An evening of cultural exchange, featuring stories, performances, and cuisine from around the world. Hosted in the heart of Mogadishu.',
  },
];

events.forEach((event) => {
  event.details = formatDetails(event.startsAt, event.city);
});