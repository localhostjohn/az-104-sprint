'use client';
import {useEffect,useMemo,useState} from 'react';
import {domains,Question,questions} from './questions';

type Screen='home'|'quiz'|'result'|'progress';
type Mode='sprint'|'mock';
type Answer={q:Question;pick:number;ok:boolean};
type Attempt={id:number;score:number;correct_answers:number;total_questions:number;elapsed_seconds:number;mode:Mode;domain:string;created_at:string};
const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
const fmtTime=(value:number)=>Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
const dateValue=(value:string)=>value.includes('T')?value:value.replace(' ','T')+'Z';
const fmtDate=(value:string)=>new Date(dateValue(value)).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const createMockRound=()=>shuffle([
  ...shuffle(questions.filter(q=>q.domain==='Identity & governance')).slice(0,12),
  ...shuffle(questions.filter(q=>q.domain==='Compute')).slice(0,12),
  ...shuffle(questions.filter(q=>q.domain==='Storage')).slice(0,9),
  ...shuffle(questions.filter(q=>q.domain==='Networking')).slice(0,10),
  ...shuffle(questions.filter(q=>q.domain==='Monitoring & recovery')).slice(0,7),
]);

export default function Home(){
  const[screen,setScreen]=useState<Screen>('home');
  const[domain,setDomain]=useState(domains[0]);
  const[mode,setMode]=useState<Mode>('sprint');
  const[round,setRound]=useState<Question[]>([]);
  const[index,setIndex]=useState(0);
  const[picked,setPicked]=useState<number|null>(null);
  const[answers,setAnswers]=useState<Answer[]>([]);
  const[streak,setStreak]=useState(0);
  const[seconds,setSeconds]=useState(0);
  const[history,setHistory]=useState<Attempt[]>([]);
  const[historyStatus,setHistoryStatus]=useState<'loading'|'ready'|'error'>('loading');
  const current=round[index];

  useEffect(()=>{fetch('/api/scores').then(r=>r.ok?r.json():Promise.reject()).then(data=>{setHistory(data.attempts||[]);setHistoryStatus('ready')}).catch(()=>setHistoryStatus('error'))},[]);
  useEffect(()=>{if(screen!=='quiz')return;const timer=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(timer)},[screen]);

  const best=Math.max(0,...history.map(x=>x.score));
  const average=history.length?Math.round(history.reduce((sum,x)=>sum+x.score,0)/history.length):0;
  const targetHits=history.filter(x=>x.score>=800).length;
  const right=answers.filter(x=>x.ok).length;
  const score=Math.round(right/Math.max(round.length,1)*1000);
  const weak=useMemo(()=>Object.entries(answers.reduce<Record<string,{right:number;total:number}>>((acc,item)=>{acc[item.q.domain]??={right:0,total:0};acc[item.q.domain].total++;if(item.ok)acc[item.q.domain].right++;return acc},{})).sort((a,b)=>a[1].right/a[1].total-b[1].right/b[1].total)[0]?.[0],[answers]);

  const start=(nextMode:Mode=mode,nextDomain:string=domain)=>{
    const source=questions.filter(item=>nextDomain===domains[0]||item.domain===nextDomain);
    setMode(nextMode);setDomain(nextDomain);setRound(nextMode==='mock'?createMockRound():shuffle(source).slice(0,10));setIndex(0);setPicked(null);setAnswers([]);setStreak(0);setSeconds(0);setScreen('quiz');
  };
  const choose=(choice:number)=>{if(picked!==null)return;const ok=choice===current.answer;setPicked(choice);setAnswers(items=>[...items,{q:current,pick:choice,ok}]);setStreak(value=>ok?value+1:0)};
  const saveAttempt=async(finalScore:number,correct:number)=>{
    const optimistic:Attempt={id:-Date.now(),score:finalScore,correct_answers:correct,total_questions:round.length,elapsed_seconds:seconds,mode,domain:mode==='mock'?'All domains':domain,created_at:new Date().toISOString()};
    setHistory(items=>[optimistic,...items]);
    try{const response=await fetch('/api/scores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({score:finalScore,correct_answers:correct,total_questions:round.length,elapsed_seconds:seconds,mode,domain:optimistic.domain})});if(!response.ok)throw new Error();const data=await response.json();setHistory(items=>items.map(item=>item.id===optimistic.id?data.attempt:item));setHistoryStatus('ready')}catch{setHistoryStatus('error')}
  };
  const next=()=>{if(index<round.length-1){setIndex(value=>value+1);setPicked(null);return}const finalRight=answers.filter(item=>item.ok).length;const finalScore=Math.round(finalRight/round.length*1000);setScreen('result');void saveAttempt(finalScore,finalRight)};
  const goHome=()=>setScreen('home');

  return <main>
    <header className="top"><button className="logo" onClick={goHome}><span>AZ</span><strong>104 SPRINT</strong></button><nav className="nav"><button className={screen==='home'?'active':''} onClick={goHome}>Practice</button><button className={screen==='progress'?'active':''} onClick={()=>setScreen('progress')}>Progress <b>{history.length}</b></button><a href="https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104" target="_blank">Study guide ↗</a></nav></header>

    {screen==='home'&&<section className="home">
      <div className="hero"><p className="kicker">AZURE ADMINISTRATOR // COMPLETE BLUEPRINT</p><h1>Train to <em>800.</em><br/>Pass with confidence.</h1><p className="lede">{questions.length} original questions across every objective in Microsoft’s current AZ-104 outline—from Entra and storage to compute, networking, monitoring, backup, and recovery.</p><div className="target"><b>800<small>TARGET</small></b><span><strong>Your safety margin</strong><p>Microsoft requires 700. Aim higher so exam-day nerves have room to breathe.</p></span></div></div>
      <div className="card"><p className="kicker">CHOOSE A TRAINING MODE</p><div className="modes"><button className={mode==='sprint'?'sel':''} onClick={()=>setMode('sprint')}><b>10</b><span>Quick sprint<small>Instant teaching feedback</small></span></button><button className={mode==='mock'?'sel':''} onClick={()=>{setMode('mock');setDomain(domains[0])}}><b>50</b><span>Mock exam<small>All domains · 100 min target</small></span></button></div>
        {mode==='sprint'&&<><h2>Choose your focus</h2><div className="domains">{domains.map(item=><button className={domain===item?'sel':''} onClick={()=>setDomain(item)} key={item}>{item===domains[0]?'⚡ Mixed review':item}<small>{item===domains[0]?questions.length+' questions total':questions.filter(q=>q.domain===item).length+' questions'}</small></button>)}</div></>}
        {mode==='mock'&&<div className="mock-note"><span>SIMULATION</span><strong>50 questions from the full blueprint</strong><p>Answers stay hidden until the end. Your score and time are saved automatically.</p></div>}
        <button className="primary" onClick={()=>start()}>{mode==='mock'?'Start full mock exam':'Start 10-question sprint'} <span>→</span></button><small className="fine">Your completed scores are saved privately to this site.</small>
      </div>
      <div className="blueprint"><p>2026 EXAM BLUEPRINT</p>{[['Identity & governance','20–25%'],['Compute','20–25%'],['Storage','15–20%'],['Networking','15–20%'],['Monitoring & recovery','10–15%']].map(item=><div key={item[0]}><span>{item[0]}</span><i/><b>{item[1]}</b></div>)}</div>
    </section>}

    {screen==='progress'&&<section className="progress-page">
      <div className="progress-head"><div><p className="kicker">YOUR SCORE HISTORY</p><h1>Are you ready for 800?</h1><p>Every completed sprint and mock exam contributes to your trend.</p></div><button className="primary" onClick={goHome}>Train now →</button></div>
      <div className="stat-grid"><article><small>PERSONAL BEST</small><strong>{best||'—'}</strong><span>/ 1000</span></article><article><small>AVERAGE SCORE</small><strong>{average||'—'}</strong><span>{history.length?'all attempts':'no attempts'}</span></article><article><small>COMPLETED</small><strong>{history.length}</strong><span>attempts</span></article><article><small>800+ SCORES</small><strong>{targetHits}</strong><span>{history.length?Math.round(targetHits/history.length*100)+'% hit rate':'target passes'}</span></article></div>
      <div className="progress-grid"><article className="trend-card"><div className="panel-title"><div><h2>Recent trend</h2><p>Last 12 completed attempts</p></div><span className={average>=800?'ready':'building'}>{average>=800?'ON TARGET':'BUILDING'}</span></div>
        {history.length?<div className="chart"><div className="target-line"><span>800</span></div>{[...history].slice(0,12).reverse().map(item=><div className="bar-wrap" key={item.id}><b>{item.score}</b><i className={item.score>=800?'hit':''} style={{height:Math.max(8,item.score/10)+'%'}}/><small>{new Date(dateValue(item.created_at)).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</small></div>)}</div>:<div className="empty-state"><b>⌁</b><h3>Your trend starts after one completed round.</h3><button onClick={goHome}>Take a sprint</button></div>}
      </article><aside className="readiness"><span>READINESS SIGNAL</span><div className="readiness-ring" style={{'--score':Math.min(100,average/10)*3.6+'deg'} as React.CSSProperties}><b>{average||0}</b><small>AVG</small></div><h3>{average>=800?'Exam-ready momentum':'Build consistency above 800'}</h3><p>{average>=800?'Your average is above the safety target. Keep it there with mixed mocks.':'Focused sprints lift weak areas; full mocks validate progress.'}</p></aside></div>
      <article className="history-card"><div className="panel-title"><div><h2>Attempt history</h2><p>Newest first · up to 100 attempts</p></div>{historyStatus==='error'&&<span className="sync-error">Sync needs a retry</span>}</div>{history.length?<div className="history-table"><div className="history-row labels"><span>Date</span><span>Mode</span><span>Focus</span><span>Accuracy</span><span>Time</span><span>Score</span></div>{history.map(item=><div className="history-row" key={item.id}><span>{fmtDate(item.created_at)}</span><span><b className="mode-pill">{item.mode==='mock'?'Mock 50':'Sprint'}</b></span><span>{item.domain}</span><span>{item.correct_answers}/{item.total_questions}</span><span>{fmtTime(item.elapsed_seconds)}</span><strong className={item.score>=800?'pass-text':''}>{item.score}</strong></div>)}</div>:<div className="loading">{historyStatus==='loading'?'Loading your scores…':'No completed attempts yet.'}</div>}</article>
    </section>}

    {screen==='quiz'&&current&&<section className="quiz"><aside><button onClick={goHome}>← Exit {mode==='mock'?'mock':'sprint'}</button><p>{mode==='mock'?'MOCK EXAM':'QUESTION'}</p><strong>{String(index+1).padStart(2,'0')} <small>/ {String(round.length).padStart(2,'0')}</small></strong><div className="progress"><i style={{width:(index+(picked!==null?1:0))/round.length*100+'%'}}/></div><dl><div><dt>{mode==='mock'?'Answered':'Score'}</dt><dd>{mode==='mock'?answers.length:right+'/'+answers.length}</dd></div><div><dt>Streak</dt><dd>{mode==='mock'?'—':'×'+streak}</dd></div><div><dt>{mode==='mock'?'Remaining':'Time'}</dt><dd>{mode==='mock'?fmtTime(Math.max(0,6000-seconds)):fmtTime(seconds)}</dd></div></dl>{mode==='mock'&&<small className="hidden-note">ANSWERS HIDDEN UNTIL RESULTS</small>}</aside>
      <article className="qcard"><div className="qtop"><span>{current.domain}</span><small>{current.objective.toUpperCase()}</small></div><h2>{current.prompt}</h2><div className="options">{current.options.map((option,i)=>{const state=picked===null?'':mode==='mock'?(i===picked?'selected':'dim'):i===current.answer?'correct':i===picked?'wrong':'dim';return <button key={option} className={state} onClick={()=>choose(i)}><b>{String.fromCharCode(65+i)}</b>{option}{mode==='sprint'&&picked!==null&&i===current.answer&&<i>✓</i>}{mode==='sprint'&&picked===i&&i!==current.answer&&<i>×</i>}</button>})}</div>
        {picked!==null&&mode==='sprint'&&<div className={'feedback '+(picked===current.answer?'good':'bad')}><strong>{picked===current.answer?'Correct — lock it in.':'Not quite — remember this.'}</strong><p>{current.explanation}</p><button onClick={next}>{index===round.length-1?'See my score':'Next question'} →</button></div>}
        {picked!==null&&mode==='mock'&&<div className="mock-next"><span>Answer locked</span><button onClick={next}>{index===round.length-1?'Finish mock exam':'Next question'} →</button></div>}
      </article></section>}

    {screen==='result'&&<section className="result"><p className="kicker">{mode==='mock'?'MOCK EXAM COMPLETE':'SPRINT COMPLETE'}</p><div className={'score '+(score>=800?'pass':'')}><b>{score}</b><small>/ 1000</small></div><h1>{score>=800?'You hit the target.':'One more focused lap.'}</h1><p>{right} of {round.length} correct in {fmtTime(seconds)}. {score>=800?'Keep repeating until 800 feels routine.':'Review the misses, then attack your weakest area.'}</p><div className="saved-badge">{historyStatus==='error'?'△ Score will retry after your next round':'✓ Score saved to your history'}</div><div className="actions"><button className="primary" onClick={()=>start()}>Retry {mode==='mock'?'mock':'focus'} →</button><button onClick={()=>setScreen('progress')}>View progress</button><button onClick={goHome}>Change mode</button></div>{weak&&<div className="weak"><small>WEAKEST AREA</small><strong>{weak}</strong><button onClick={()=>start('sprint',weak)}>Drill this next →</button></div>}<div className="review"><h2>Review your answers</h2>{answers.map((answer,i)=><div key={answer.q.id}><b className={answer.ok?'yes':'no'}>{answer.ok?'✓':'×'}</b><span><small>Q{i+1} · {answer.q.domain} · {answer.q.objective}</small>{answer.q.prompt}{!answer.ok&&<em>Correct: {answer.q.options[answer.q.answer]}. {answer.q.explanation}</em>}</span></div>)}</div></section>}
    <footer>Independent study aid · Original questions aligned to Microsoft’s AZ-104 skills outline · Updated August 2026</footer>
  </main>
}
