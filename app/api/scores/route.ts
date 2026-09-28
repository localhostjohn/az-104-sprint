import {listScores,saveScore} from '@/lib/scores-db';
import {domains,questions} from '@/app/questions';

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
    const rawBreakdown=body.domain_breakdown;
    const rawObjectives=body.objective_breakdown;
    const rawQuestions=body.question_results;
    if(!Number.isInteger(score)||score<0||score>1000||!Number.isInteger(correct)||!Number.isInteger(total)||total<1||correct<0||correct>total||!Number.isInteger(elapsed)||elapsed<0||!mode){
      return Response.json({error:'Invalid score attempt.'},{status:400});
    }
    if(!rawBreakdown||typeof rawBreakdown!=='object'||Array.isArray(rawBreakdown))return Response.json({error:'Invalid domain breakdown.'},{status:400});
    const validDomains=new Set(domains.slice(1));
    const domain_breakdown:Record<string,{correct:number;total:number}>={};
    for(const [name,value] of Object.entries(rawBreakdown)){
      if(!validDomains.has(name)||!value||typeof value!=='object'||Array.isArray(value))return Response.json({error:'Invalid domain breakdown.'},{status:400});
      const result=value as Record<string,unknown>;
      const domainCorrect=Number(result.correct),domainTotal=Number(result.total);
      if(!Number.isInteger(domainCorrect)||!Number.isInteger(domainTotal)||domainTotal<1||domainCorrect<0||domainCorrect>domainTotal)return Response.json({error:'Invalid domain breakdown.'},{status:400});
      domain_breakdown[name]={correct:domainCorrect,total:domainTotal};
    }
    if(!Object.keys(domain_breakdown).length||Object.values(domain_breakdown).reduce((sum,item)=>sum+item.total,0)!==total||Object.values(domain_breakdown).reduce((sum,item)=>sum+item.correct,0)!==correct)return Response.json({error:'Domain totals do not match this attempt.'},{status:400});
    const objective_breakdown:Record<string,{correct:number;total:number}>={};
    if(rawObjectives!==undefined){
      if(!rawObjectives||typeof rawObjectives!=='object'||Array.isArray(rawObjectives))return Response.json({error:'Invalid objective breakdown.'},{status:400});
      const validObjectives=new Set(questions.map(question=>question.domain+' · '+question.objective));
      for(const [name,value] of Object.entries(rawObjectives)){
        if(!validObjectives.has(name)||!value||typeof value!=='object'||Array.isArray(value))return Response.json({error:'Invalid objective breakdown.'},{status:400});
        const result=value as Record<string,unknown>;
        const objectiveCorrect=Number(result.correct),objectiveTotal=Number(result.total);
        if(!Number.isInteger(objectiveCorrect)||!Number.isInteger(objectiveTotal)||objectiveTotal<1||objectiveCorrect<0||objectiveCorrect>objectiveTotal)return Response.json({error:'Invalid objective breakdown.'},{status:400});
        objective_breakdown[name]={correct:objectiveCorrect,total:objectiveTotal};
      }
      if(Object.values(objective_breakdown).reduce((sum,item)=>sum+item.total,0)!==total||Object.values(objective_breakdown).reduce((sum,item)=>sum+item.correct,0)!==correct)return Response.json({error:'Objective totals do not match this attempt.'},{status:400});
    }
    let question_results:Array<{question_id:number;correct:boolean}>|undefined;
    if(rawQuestions!==undefined){
      if(!Array.isArray(rawQuestions)||rawQuestions.length!==total)return Response.json({error:'Invalid question results.'},{status:400});
      const knownIds=new Set(questions.map(question=>question.id));
      const seen=new Set<number>();
      question_results=[];
      for(const item of rawQuestions){
        if(!item||typeof item!=='object'||Array.isArray(item))return Response.json({error:'Invalid question results.'},{status:400});
        const entry=item as Record<string,unknown>,id=entry.question_id;
        if(typeof id!=='number'||!Number.isInteger(id)||!knownIds.has(id)||seen.has(id)||typeof entry.correct!=='boolean')return Response.json({error:'Invalid question results.'},{status:400});
        seen.add(id);question_results.push({question_id:id,correct:entry.correct});
      }
      if(question_results.filter(item=>item.correct).length!==correct)return Response.json({error:'Question totals do not match this attempt.'},{status:400});
      const byDomain:Record<string,{correct:number;total:number}>={};
      const byObjective:Record<string,{correct:number;total:number}>={};
      for(const item of question_results){
        const question=questions[item.question_id-1];
        const key=question.domain+' · '+question.objective;
        byDomain[question.domain]??={correct:0,total:0};
        byObjective[key]??={correct:0,total:0};
        byDomain[question.domain].total++;byObjective[key].total++;
        if(item.correct){byDomain[question.domain].correct++;byObjective[key].correct++}
      }
      const matches=(expected:Record<string,{correct:number;total:number}>,actual:Record<string,{correct:number;total:number}>)=>
        Object.keys(expected).length===Object.keys(actual).length&&Object.entries(expected).every(([key,value])=>actual[key]?.correct===value.correct&&actual[key]?.total===value.total);
      if(!matches(byDomain,domain_breakdown)||(rawObjectives!==undefined&&!matches(byObjective,objective_breakdown)))return Response.json({error:'Question breakdown does not match this attempt.'},{status:400});
    }
    const attempt=await saveScore({score,correct_answers:correct,total_questions:total,elapsed_seconds:elapsed,mode,domain,domain_breakdown,objective_breakdown,question_results});
    return Response.json({attempt},{status:201});
  }catch{return Response.json({error:'Could not save this score.'},{status:500});}
}
