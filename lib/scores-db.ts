import {env} from 'cloudflare:workers';
import {attemptDomainScoresIndex,attemptDomainScoresSchema,scoreHistoryIndex,scoreHistorySchema} from '@/db/schema';

export type DomainResult={correct:number;total:number};

export type ScoreAttempt = {
  id:number; score:number; correct_answers:number; total_questions:number;
  elapsed_seconds:number; mode:'sprint'|'mock'; domain:string; created_at:string;
  domain_breakdown?:Record<string,DomainResult>;
};

type ScoreInput=Omit<ScoreAttempt,'id'|'created_at'>;

const database = () => (env as unknown as {DB:D1Database}).DB;

export async function ensureScoresTable(){
  const db=database();
  await db.batch([
    db.prepare(scoreHistorySchema),
    db.prepare(scoreHistoryIndex),
    db.prepare(attemptDomainScoresSchema),
    db.prepare(attemptDomainScoresIndex),
  ]);
  return db;
}

export async function listScores(){
  const db=await ensureScoresTable();
  const result=await db.prepare(
    'SELECT id, score, correct_answers, total_questions, elapsed_seconds, mode, domain, created_at FROM score_attempts ORDER BY created_at DESC, id DESC LIMIT 100'
  ).all<ScoreAttempt>();
  const domainRows=await db.prepare(
    `SELECT detail.attempt_id, detail.domain, detail.correct_answers, detail.total_questions
     FROM attempt_domain_scores detail
     JOIN (SELECT id FROM score_attempts ORDER BY created_at DESC, id DESC LIMIT 100) recent
       ON recent.id = detail.attempt_id`
  ).all<{attempt_id:number;domain:string;correct_answers:number;total_questions:number}>();
  const breakdowns=new Map<number,Record<string,DomainResult>>();
  for(const row of domainRows.results){
    const breakdown=breakdowns.get(row.attempt_id)??{};
    breakdown[row.domain]={correct:row.correct_answers,total:row.total_questions};
    breakdowns.set(row.attempt_id,breakdown);
  }
  return result.results.map(attempt=>({...attempt,domain_breakdown:breakdowns.get(attempt.id)}));
}

export async function saveScore(input:ScoreInput){
  const db=await ensureScoresTable();
  const result=await db.prepare(
    'INSERT INTO score_attempts (score, correct_answers, total_questions, elapsed_seconds, mode, domain) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, score, correct_answers, total_questions, elapsed_seconds, mode, domain, created_at'
  ).bind(input.score,input.correct_answers,input.total_questions,input.elapsed_seconds,input.mode,input.domain).first<ScoreAttempt>();
  if(!result)throw new Error('Score attempt was not created.');
  const entries=Object.entries(input.domain_breakdown??{});
  if(entries.length){
    await db.batch(entries.map(([domain,value])=>db.prepare(
      'INSERT INTO attempt_domain_scores (attempt_id, domain, correct_answers, total_questions) VALUES (?, ?, ?, ?)'
    ).bind(result.id,domain,value.correct,value.total)));
  }
  return {...result,domain_breakdown:input.domain_breakdown};
}
