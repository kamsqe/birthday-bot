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
