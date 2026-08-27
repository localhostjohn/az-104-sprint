import {questions} from '@/app/questions';
import {listActiveMistakes,recordQuestionAnswer} from '@/lib/mistakes-db';

export async function GET(){
  try{return Response.json({mistakes:await listActiveMistakes()});}
  catch{return Response.json({mistakes:[],error:'Mistake review is temporarily unavailable.'},{status:503});}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const questionId=Number(body.question_id);
    const correct=body.correct;
    if(!Number.isInteger(questionId)||!questions.some(question=>question.id===questionId)||typeof correct!=='boolean'){
      return Response.json({error:'Invalid question result.'},{status:400});
    }
    const mistakes=await recordQuestionAnswer(questionId,correct);
    return Response.json({mistakes});
  }catch{return Response.json({error:'Could not update mistake review.'},{status:500});}
}
