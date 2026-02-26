export interface Template {
  id: string;
  category: string;
  text: string;
}

export const TEMPLATES: Record<string, Template[]> = {
  // Base relationship templates (shown when user picks "browse all")
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
  ],

  // Sub-category templates (funny, heartfelt, professional, family-style)
  friend_funny: [
    { id: 'ff1', category: 'friend_funny', text: "Happy birthday {{name}}! You're not old, you're vintage 🍷" },
    { id: 'ff2', category: 'friend_funny', text: "One year closer to needing reading glasses. Happy birthday {{name}}! 😂" },
    { id: 'ff3', category: 'friend_funny', text: "{{name}}, you don't look a day over fabulous! HBD! 🥳" }
  ],
  friend_heartfelt: [
    { id: 'fh1', category: 'friend_heartfelt', text: "{{name}}, you make every day brighter. Wishing you the happiest birthday! 💛" },
    { id: 'fh2', category: 'friend_heartfelt', text: "Grateful for every moment with you, {{name}}. Happy birthday to someone truly special." }
  ],
  friend_colleague: [
    { id: 'fp1', category: 'friend_colleague', text: "Happy birthday {{name}}! Hope your day is as great as you are. 🤝" },
    { id: 'fp2', category: 'friend_colleague', text: "Wishing you a wonderful birthday and a successful year ahead, {{name}}!" }
  ],
  friend_family: [
    { id: 'ffa1', category: 'friend_family', text: "{{name}}, you're basically family at this point. Happy birthday! 🎂" },
    { id: 'ffa2', category: 'friend_family', text: "From our family to you — happy birthday {{name}}! We love you!" }
  ],

  family_funny: [
    { id: 'famf1', category: 'family_funny', text: "Happy birthday {{name}}! Remember, age is just a number... a really big one 😜" },
    { id: 'famf2', category: 'family_funny', text: "{{name}}, you've leveled up again! Happy birthday, old timer! 🎮" }
  ],
  family_heartfelt: [
    { id: 'famh1', category: 'family_heartfelt', text: "{{name}}, you are the heart of our family. Happy birthday with all my love. ❤️" },
    { id: 'famh2', category: 'family_heartfelt', text: "Wishing the happiest birthday to the most wonderful {{name}}. You mean everything to us." }
  ],
  family_colleague: [
    { id: 'famp1', category: 'family_colleague', text: "Happy birthday {{name}}! Wishing you health, happiness, and all the best." },
    { id: 'famp2', category: 'family_colleague', text: "{{name}}, may this year bring you everything you deserve. Happy birthday!" }
  ],
  family_family: [
    { id: 'famfa1', category: 'family_family', text: "Our dearest {{name}}, happy birthday! The whole family sends their love. 🤗" },
    { id: 'famfa2', category: 'family_family', text: "Happy birthday {{name}}! Nothing is more important than family — and you're the best of it." }
  ],

  colleague_funny: [
    { id: 'cf1', category: 'colleague_funny', text: "Happy birthday {{name}}! May your inbox be empty and your coffee be strong today ☕" },
    { id: 'cf2', category: 'colleague_funny', text: "{{name}}, happy birthday! Don't worry, I won't mention your age at the meeting 😄" }
  ],
  colleague_heartfelt: [
    { id: 'ch1', category: 'colleague_heartfelt', text: "Happy birthday {{name}}! Working with you is a true pleasure. Have a wonderful day." },
    { id: 'ch2', category: 'colleague_heartfelt', text: "{{name}}, you make the workplace better just by being there. Happy birthday! 🌟" }
  ],
  colleague_colleague: [
    { id: 'cp1', category: 'colleague_colleague', text: "Happy birthday {{name}}! Wishing you continued success and a great year ahead. 💼" },
    { id: 'cp2', category: 'colleague_colleague', text: "{{name}}, here's to another year of great achievements. Happy birthday!" }
  ],
  colleague_family: [
    { id: 'cfa1', category: 'colleague_family', text: "Happy birthday {{name}}! From our work family — have a fantastic day! 🎉" },
    { id: 'cfa2', category: 'colleague_family', text: "{{name}}, you're more than a colleague — you're part of the team family. HBD!" }
  ],

  romantic_funny: [
    { id: 'rf1', category: 'romantic_funny', text: "Happy birthday {{name}}! You're stuck with me for another year 😘" },
    { id: 'rf2', category: 'romantic_funny', text: "{{name}}, happy birthday! I'd sing you a song but I love you too much to do that to your ears 🎤😂" }
  ],
  romantic_heartfelt: [
    { id: 'rh1', category: 'romantic_heartfelt', text: "Happy birthday to the love of my life, {{name}}. Every day with you is a gift. 💕" },
    { id: 'rh2', category: 'romantic_heartfelt', text: "{{name}}, you are my everything. Happy birthday, my love. Here's to forever. ❤️" }
  ],
  romantic_colleague: [
    { id: 'rp1', category: 'romantic_colleague', text: "Happy birthday {{name}}! Wishing you an amazing day, sweetheart. 💝" },
    { id: 'rp2', category: 'romantic_colleague', text: "{{name}}, making every birthday a celebration of us. Happy birthday! 🥂" }
  ],
  romantic_family: [
    { id: 'rfa1', category: 'romantic_family', text: "Happy birthday {{name}}! Our little family is so lucky to have you. ❤️👨‍👩‍👧" },
    { id: 'rfa2', category: 'romantic_family', text: "To the best partner and parent — happy birthday {{name}}! We love you endlessly." }
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
