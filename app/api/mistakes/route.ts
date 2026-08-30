import {questions} from '@/app/questions';
import {listActiveMistakes,recordQuestionAnswer,recordQuestionAnswers} from '@/lib/mistakes-db';

export async function GET(){
  try{return Response.json({mistakes:await listActiveMistakes()});}
  catch{return Response.json({mistakes:[],error:'Mistake review is temporarily unavailable.'},{status:503});}
}

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    if(Array.isArray(body.answers)){
      const answers=body.answers.map(item=>item as Record<string,unknown>);
      const valid=answers.length>0&&answers.length<=100&&answers.every(item=>Number.isInteger(Number(item.question_id))&&questions.some(question=>question.id===Number(item.question_id))&&typeof item.correct==='boolean');
      if(!valid)return Response.json({error:'Invalid question results.'},{status:400});
      const mistakes=await recordQuestionAnswers(answers.map(item=>({question_id:Number(item.question_id),correct:item.correct as boolean})));
      return Response.json({mistakes});
    }
    const questionId=Number(body.question_id);
    const correct=body.correct;
    if(!Number.isInteger(questionId)||!questions.some(question=>question.id===questionId)||typeof correct!=='boolean'){
      return Response.json({error:'Invalid question result.'},{status:400});
    }
    const mistakes=await recordQuestionAnswer(questionId,correct);
    return Response.json({mistakes});
  }catch{return Response.json({error:'Could not update mistake review.'},{status:500});}
}
