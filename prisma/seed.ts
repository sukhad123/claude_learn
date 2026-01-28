import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
  // Behavioral Questions
  { text: "Tell me about a time when you had to deal with a difficult coworker. How did you handle it?", category: "behavioral" },
  { text: "Describe a situation where you had to meet a tight deadline. What did you do?", category: "behavioral" },
  { text: "Give an example of a goal you reached and how you achieved it.", category: "behavioral" },
  { text: "Tell me about a time you failed. How did you deal with the situation?", category: "behavioral" },
  { text: "Describe a time when you had to adapt to a significant change at work.", category: "behavioral" },
  { text: "Tell me about a time you showed leadership.", category: "behavioral" },
  { text: "Describe a situation where you had to work with a team to accomplish a goal.", category: "behavioral" },
  { text: "Give an example of how you handled a stressful situation.", category: "behavioral" },

  // Technical Questions
  { text: "Explain the difference between REST and GraphQL APIs.", category: "technical" },
  { text: "What is the difference between SQL and NoSQL databases? When would you use each?", category: "technical" },
  { text: "Explain the concept of closures in JavaScript.", category: "technical" },
  { text: "What is the difference between authentication and authorization?", category: "technical" },
  { text: "Describe the SOLID principles in software development.", category: "technical" },
  { text: "What is the difference between microservices and monolithic architecture?", category: "technical" },
  { text: "Explain how garbage collection works in your preferred programming language.", category: "technical" },
  { text: "What are the key differences between TCP and UDP protocols?", category: "technical" },

  // General Questions
  { text: "Tell me about yourself and your background.", category: "general" },
  { text: "Why are you interested in this position?", category: "general" },
  { text: "Where do you see yourself in five years?", category: "general" },
  { text: "What are your greatest strengths and weaknesses?", category: "general" },
  { text: "Why should we hire you?", category: "general" },
  { text: "What motivates you in your work?", category: "general" },
  { text: "Describe your ideal work environment.", category: "general" },
  { text: "What questions do you have for us?", category: "general" },
];

async function main() {
  console.log('Seeding database...');

  for (const question of questions) {
    await prisma.question.create({
      data: question,
    });
  }

  console.log(`Seeded ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
