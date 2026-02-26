export interface Template {
  id: string;
  category: string;
  text: string;
}

export const TEMPLATES: Record<string, Template[]> = {
  friend: [
    { id: 'f1', category: 'friend', text: "Happy birthday {{name}}! Let's grab drinks. You're officially {{age}}!" },
    { id: 'f2', category: 'friend', text: "Another year older, none the wiser. Happy B-day {{name}}!" },
    { id: 'f3', category: 'friend', text: "Hope you have a fantastic birthday, {{name}}!" }
  ],
  family: [
    { id: 'fam1', category: 'family', text: "Happy Birthday {{name}}! Wishing you all the love and happiness in the world." },
    { id: 'fam2', category: 'family', text: "So proud to call you family. Have a wonderful birthday {{name}}!" }
  ],
  colleague: [
    { id: 'c1', category: 'colleague', text: "Wishing you a very Happy Birthday, {{name}}. Hope you have a great day!" },
    { id: 'c2', category: 'colleague', text: "Happy birthday {{name}}! Wishing you success and happiness." }
  ],
  romantic: [
    { id: 'r1', category: 'romantic', text: "Happy birthday to my favorite person. Love you, {{name}}!" },
    { id: 'r2', category: 'romantic', text: "Happy birthday {{name}}! You mean the world to me." }
  ]
};

export function renderTemplate(text: string, name: string, birthYear: number | null): string {
  let result = text.replace(/\{\{name\}\}/g, name);
  const age = birthYear ? (new Date().getUTCFullYear() - birthYear).toString() : 'one year older';
  result = result.replace(/\{\{age\}\}/g, age);
  return result;
}

export function getTemplateById(categoryId: string, tplId: string): Template | undefined {
  return TEMPLATES[categoryId]?.find(t => t.id === tplId);
}
