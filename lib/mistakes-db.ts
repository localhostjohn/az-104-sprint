import {env} from 'cloudflare:workers';
import {questionMistakesIndex,questionMistakesSchema} from '@/db/schema';

export type QuestionMistake = {
  question_id:number;
  miss_count:number;
  last_missed_at:string;
};

const database = () => (env as unknown as {DB:D1Database}).DB;

export async function ensureMistakesTable(){
  const db=database();
  await db.batch([
    db.prepare(questionMistakesSchema),
    db.prepare(questionMistakesIndex),
    db.prepare('PRAGMA optimize'),
  ]);
  return db;
}

export async function listActiveMistakes(){
  const db=await ensureMistakesTable();
  const result=await db.prepare(
    'SELECT question_id, miss_count, last_missed_at FROM question_mistakes WHERE active = 1 ORDER BY last_missed_at DESC, question_id ASC'
  ).all<QuestionMistake>();
  return result.results;
}

export async function recordQuestionAnswer(questionId:number,correct:boolean){
  const db=await ensureMistakesTable();
  if(correct){
    await db.prepare('UPDATE question_mistakes SET active = 0 WHERE question_id = ?').bind(questionId).run();
  }else{
    await db.prepare(`
      INSERT INTO question_mistakes (question_id, miss_count, active, last_missed_at)
      VALUES (?, 1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(question_id) DO UPDATE SET
        miss_count = question_mistakes.miss_count + 1,
        active = 1,
        last_missed_at = CURRENT_TIMESTAMP
    `).bind(questionId).run();
  }
  return listActiveMistakes();
}
