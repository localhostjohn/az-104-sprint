import {env} from 'cloudflare:workers';

export type QuestionMistake = {
  question_id:number;
  miss_count:number;
  last_missed_at:string;
  review_stage:number;
  next_review_at:string|null;
  review_reason:'repair'|'scheduled';
};
export type QuestionAnswerResult = {question_id:number;correct:boolean};
export type ReviewSchedule = {due_now:number;scheduled:number;mastered:number;next_review_at:string|null};
export type ReviewState = {mistakes:QuestionMistake[];schedule:ReviewSchedule};

const database = () => (env as unknown as {DB:D1Database}).DB;

export async function listReviewState():Promise<ReviewState>{
  const db=database();
  const result=await db.prepare(`
    SELECT question_id, miss_count, last_missed_at, review_stage, next_review_at,
      CASE WHEN active = 1 THEN 'repair' ELSE 'scheduled' END AS review_reason
    FROM question_mistakes
    WHERE active = 1
      OR (review_stage BETWEEN 1 AND 3 AND next_review_at <= CURRENT_TIMESTAMP)
    ORDER BY active DESC, COALESCE(next_review_at, last_missed_at) ASC, question_id ASC
  `).all<QuestionMistake>();
  const summary=await db.prepare(`
    SELECT
      SUM(CASE WHEN active = 1 OR (review_stage BETWEEN 1 AND 3 AND next_review_at <= CURRENT_TIMESTAMP) THEN 1 ELSE 0 END) AS due_now,
      SUM(CASE WHEN active = 0 AND review_stage BETWEEN 1 AND 3 AND next_review_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END) AS scheduled,
      SUM(CASE WHEN review_stage = 4 THEN 1 ELSE 0 END) AS mastered,
      MIN(CASE WHEN active = 0 AND review_stage BETWEEN 1 AND 3 AND next_review_at > CURRENT_TIMESTAMP THEN next_review_at END) AS next_review_at
    FROM question_mistakes
  `).first<{due_now:number|null;scheduled:number|null;mastered:number|null;next_review_at:string|null}>();
  return {mistakes:result.results,schedule:{due_now:summary?.due_now??0,scheduled:summary?.scheduled??0,mastered:summary?.mastered??0,next_review_at:summary?.next_review_at??null}};
}

const correctReviewStatement=(db:D1Database,questionId:number)=>db.prepare(`
  UPDATE question_mistakes SET
    active = 0,
    review_stage = CASE WHEN review_stage < 4 THEN review_stage + 1 ELSE 4 END,
    next_review_at = CASE
      WHEN review_stage = 0 THEN datetime('now', '+1 day')
      WHEN review_stage = 1 THEN datetime('now', '+3 days')
      WHEN review_stage = 2 THEN datetime('now', '+7 days')
      ELSE NULL
    END,
    mastered_at = CASE WHEN review_stage >= 3 THEN CURRENT_TIMESTAMP ELSE NULL END
  WHERE question_id = ?
    AND (active = 1 OR next_review_at <= CURRENT_TIMESTAMP)
`).bind(questionId);

const missedReviewStatement=(db:D1Database,questionId:number)=>db.prepare(`
  INSERT INTO question_mistakes (question_id, miss_count, active, last_missed_at, review_stage, next_review_at, mastered_at)
  VALUES (?, 1, 1, CURRENT_TIMESTAMP, 0, NULL, NULL)
  ON CONFLICT(question_id) DO UPDATE SET
    miss_count = question_mistakes.miss_count + 1,
    active = 1,
    last_missed_at = CURRENT_TIMESTAMP,
    review_stage = 0,
    next_review_at = NULL,
    mastered_at = NULL
`).bind(questionId);

export async function recordQuestionAnswers(inputs:QuestionAnswerResult[]){
  const db=database();
  const statements=inputs.map(input=>input.correct?correctReviewStatement(db,input.question_id):missedReviewStatement(db,input.question_id));
  if(statements.length)await db.batch(statements);
  return listReviewState();
}

export async function recordQuestionAnswer(questionId:number,correct:boolean){
  return recordQuestionAnswers([{question_id:questionId,correct}]);
}
