export function getZodiacSign(month: number, day: number): string {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒️'; // Aquarius
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '♓️'; // Pisces
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈️'; // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉️'; // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊️'; // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋️'; // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌️'; // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍️'; // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎️'; // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏️'; // Scorpio
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐️'; // Sagittarius
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑️'; // Capricorn
  return '🌟';
}

export function getDaysUntilBirthday(month: number, day: number): number {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  
  // Set time to exact midnight UTC to purely calculate days
  const today = new Date(Date.UTC(currentYear, now.getUTCMonth(), now.getUTCDate()));
  let nextBday = new Date(Date.UTC(currentYear, month - 1, day));

  // If birthday already passed this year, it's next year
  if (nextBday.getTime() < today.getTime()) {
    nextBday = new Date(Date.UTC(currentYear + 1, month - 1, day));
  }

  const diffTime = nextBday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRelationshipIcon(rel: string | null): string {
  switch (rel) {
    case 'friend': return '🤝';
    case 'family': return '👨‍👩‍👧';
    case 'colleague': return '💼';
    case 'romantic': return '❤️';
    default: return '👋';
  }
}

const ZW0 = '\u200B';
const ZW1 = '\u200C';
const ZWT = '\u200D';

export function encodeInvisibleId(id: number): string {
    const binary = id.toString(2);
    return binary.split('').map(b => b === '0' ? ZW0 : ZW1).join('') + ZWT;
}

export function decodeInvisibleId(text: string): number | null {
    if (!text) return null;
    const regex = new RegExp(`([${ZW0}${ZW1}]+)${ZWT}$`);
    const res = text.match(regex);
    if (!res) return null;
    const binary = res[1].split('').map(c => c === ZW0 ? '0' : '1').join('');
    return parseInt(binary, 2);
}

export function paginate<T>(items: T[], page: number, perPage: number = 5) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  if (page < 0) page = totalPages - 1;
  if (page >= totalPages) page = 0;
  
  const pageItems = items.slice(page * perPage, (page + 1) * perPage);
  
  return { pageItems, totalPages, currentPage: page };
}

export function getDaysInMonth(month: number): number {
  if (month === 2) return 29; // Treat February as having 29 max
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function formatDate(month: number, day: number): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];
  
  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';
  
  return `${day}${suffix} of ${monthName}`;
}
