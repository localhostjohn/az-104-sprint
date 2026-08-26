import {env} from 'cloudflare:workers';
import {scoreHistoryIndex,scoreHistorySchema} from '@/db/schema';

export type ScoreAttempt = {
  id:number; score:number; correct_answers:number; total_questions:number;
  elapsed_seconds:number; mode:'sprint'|'mock'; domain:string; created_at:string;
};

const database = () => (env as unknown as {DB:D1Database}).DB;

export async function ensureScoresTable(){
  const db=database();
  await db.batch([
    db.prepare(scoreHistorySchema),
    db.prepare(scoreHistoryIndex),
  ]);
  return db;
}

export async function listScores(){
  const db=await ensureScoresTable();
  const result=await db.prepare(
    'SELECT id, score, correct_answers, total_questions, elapsed_seconds, mode, domain, created_at FROM score_attempts ORDER BY created_at DESC, id DESC LIMIT 100'
  ).all<ScoreAttempt>();
  return result.results;
}

export async function saveScore(input:Omit<ScoreAttempt,'id'|'created_at'>){
  const db=await ensureScoresTable();
  const result=await db.prepare(
    'INSERT INTO score_attempts (score, correct_answers, total_questions, elapsed_seconds, mode, domain) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, score, correct_answers, total_questions, elapsed_seconds, mode, domain, created_at'
  ).bind(input.score,input.correct_answers,input.total_questions,input.elapsed_seconds,input.mode,input.domain).first<ScoreAttempt>();
  return result;
}
