import fs from 'node:fs';
import path from 'node:path';
import { createBlankProgress, type ProgressData } from '@/lib/session';
import { getDatabase } from '@/lib/mongodb';

export type UserProgress = ProgressData;
type StoredProgress = UserProgress & { userId: string };

async function getProgressCollection() {
  const database = await getDatabase();
  return database.collection<StoredProgress>('progress');
}

function findLegacyProgress(email: string): UserProgress | null {
  try {
    const filePath = path.join(process.cwd(), 'src', 'db', 'progress.json');
    const legacyData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, UserProgress>;
    const match = Object.values(legacyData).find(
      (progress) => progress.user?.toLowerCase() === email.toLowerCase(),
    );
    return match ?? null;
  } catch {
    return null;
  }
}

export async function initializeUserProgress(userId: string, email: string) {
  const collection = await getProgressCollection();
  const legacyProgress = findLegacyProgress(email);
  const progress = legacyProgress ?? createBlankProgress(email);

  await collection.updateOne(
    { userId },
    { $setOnInsert: { userId, ...progress } },
    { upsert: true },
  );

  return await collection.findOne({ userId });
}

export async function getUserProgress(userId: string, email: string) {
  const collection = await getProgressCollection();
  const progress = await collection.findOne({ userId });
  return progress ?? await initializeUserProgress(userId, email);
}

export async function recordSolvedSubmission(
  userId: string,
  question: { id: string; title: string; difficulty: string },
  timeTaken: string,
) {
  const collection = await getProgressCollection();
  const progress = await collection.findOne({ userId });
  if (!progress || progress.recentSubmissions.some((submission) => submission.id === question.id)) return;

  progress.recentSubmissions.unshift({
    id: question.id,
    title: question.title,
    time: 'Just now',
    timeTaken,
  });

  if (progress.solved[question.difficulty as keyof UserProgress['solved']] !== undefined) {
    progress.solved[question.difficulty as keyof UserProgress['solved']]++;
  }

  const todayKey = new Date().toISOString().split('T')[0];
  if (!progress.contributionGrid[todayKey]) {
    progress.activeDays++;
    progress.maxStreak = Math.max(progress.maxStreak, 1);
    if (progress.activeDays === 7 && !progress.badges.includes('7-Day Warrior')) {
      progress.badges.push('7-Day Warrior');
    }
  }
  progress.contributionGrid[todayKey] = (progress.contributionGrid[todayKey] || 0) + 1;

  await collection.updateOne(
    { userId },
    {
      $set: {
        user: progress.user,
        solved: progress.solved,
        activeDays: progress.activeDays,
        maxStreak: progress.maxStreak,
        badges: progress.badges,
        recentSubmissions: progress.recentSubmissions,
        contributionGrid: progress.contributionGrid,
      },
    },
  );
}