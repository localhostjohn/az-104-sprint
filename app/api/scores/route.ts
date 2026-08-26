import {listScores,saveScore} from '@/lib/scores-db';

export async function GET(){
  try{return Response.json({attempts:await listScores()});}
  catch{return Response.json({attempts:[],error:'Score history is temporarily unavailable.'},{status:503});}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const score=Number(body.score),correct=Number(body.correct_answers),total=Number(body.total_questions),elapsed=Number(body.elapsed_seconds);
    const mode=body.mode==='mock'?'mock':body.mode==='sprint'?'sprint':null;
    const domain=typeof body.domain==='string'?body.domain.slice(0,80):'All domains';
    if(!Number.isInteger(score)||score<0||score>1000||!Number.isInteger(correct)||!Number.isInteger(total)||total<1||correct<0||correct>total||!Number.isInteger(elapsed)||elapsed<0||!mode){
      return Response.json({error:'Invalid score attempt.'},{status:400});
    }
    const attempt=await saveScore({score,correct_answers:correct,total_questions:total,elapsed_seconds:elapsed,mode,domain});
    return Response.json({attempt},{status:201});
  }catch{return Response.json({error:'Could not save this score.'},{status:500});}
}
