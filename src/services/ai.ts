export class AIService {
  constructor(private aiBinding: any) {}

  async generateBirthdayMessage(name: string, ageStr: string, rel: string, vibe: string): Promise<string> {
    const prompt = `Write a short, ${vibe}, and engaging happy birthday message for my ${rel} named ${name}. ${ageStr} Do not include placeholders like [Your Name]. Just write the message directly. Keep it to 2-3 sentences max.`;

    try {
      const response = await this.aiBinding.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          { role: 'system', content: 'You are a helpful assistant that writes perfect, natural-sounding birthday greetings.' },
          { role: 'user', content: prompt }
        ]
      });

      let generatedText = response.response || "Happy Birthday!";
      // Clean up quotes if the AI wrapped it
      return generatedText.replace(/^["']|["']$/g, '').trim();
      
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      throw new Error("Sorry, the AI encountered an error generating your message. Please try again.");
    }
  }
}
