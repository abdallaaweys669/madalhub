// --- Using all the images from your assets folder ---
const IMG_CULTURE1 = require('../assets/culture1.png');
const IMG_CULTURE2 = require('../assets/culture2.png');
const IMG_POETRY1 = require('../assets/poetry1.png');
const IMG_PUBLIC_SPEAKING = require('../assets/public speaking.png');
const IMG_TECH_SUMMIT = require('../assets/tech summit1.png');


export const events = [
  { 
    id: '1', 
    title: 'Somali Cultural Festival', 
    details: 'Sat, Nov 15, 7:00 PM · Mogadishu', 
    image: IMG_CULTURE1,
    description: 'Celebrate the rich heritage of Somali culture with traditional music, dance, food, and art. A family-friendly event for all ages.'
  },
  { 
    id: '2', 
    title: 'Somali Poetry Night', 
    details: 'Fri, Nov 21, 8:00 PM · Hargeisa', 
    image: IMG_POETRY1,
    description: 'An evening dedicated to the powerful words of classic and contemporary Somali poets. Open mic session included.'
  },
  { 
    id: '3', 
    title: 'Horn of Africa Tech Summit', 
    details: 'Mon, Dec 1, 9:00 AM · Nairobi', 
    image: IMG_TECH_SUMMIT,
    description: 'Join industry leaders and innovators to discuss the future of technology in East Africa. Keynotes, workshops, and networking opportunities.'
  },
  { 
    id: '4', 
    title: 'Art of Public Speaking', 
    details: 'Sun, Dec 7, 11:00 AM · Online', 
    image: IMG_PUBLIC_SPEAKING,
    description: 'Master the art of public speaking. This interactive online workshop will help you build confidence and deliver impactful presentations.'
  },
  { 
    id: '5', 
    title: 'Cultural Exchange Night', 
    details: 'Fri, Dec 12, 6:00 PM · Mogadishu', 
    image: IMG_CULTURE2,
    description: 'An evening of cultural exchange, featuring stories, performances, and cuisine from around the world. Hosted in the heart of Mogadishu.'
  },

];