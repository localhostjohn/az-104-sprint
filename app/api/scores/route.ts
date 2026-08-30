import {listScores,saveScore} from '@/lib/scores-db';
import {domains} from '@/app/questions';

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
    const attempt=await saveScore({score,correct_answers:correct,total_questions:total,elapsed_seconds:elapsed,mode,domain,domain_breakdown});
    return Response.json({attempt},{status:201});
  }catch{return Response.json({error:'Could not save this score.'},{status:500});}
}
