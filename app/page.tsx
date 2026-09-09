'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {domains,Question,questions} from './questions';

type Screen='home'|'quiz'|'examReview'|'result'|'progress'|'resources';
type Mode='sprint'|'mock'|'review';
type Answer={q:Question;pick:number;ok:boolean};
type DomainResult={correct:number;total:number};
type Attempt={id:number;score:number;correct_answers:number;total_questions:number;elapsed_seconds:number;mode:'sprint'|'mock';domain:string;created_at:string;domain_breakdown?:Record<string,DomainResult>};
const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
const fmtTime=(value:number)=>Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
const dateValue=(value:string)=>value.includes('T')?value:value.replace(' ','T')+'Z';
const fmtDate=(value:string)=>new Date(dateValue(value)).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const createMockRound=()=>{
  const core=questions.filter(q=>!q.caseStudy);
  const standard=shuffle([
    ...shuffle(core.filter(q=>q.domain==='Identity & governance')).slice(0,10),
    ...shuffle(core.filter(q=>q.domain==='Compute')).slice(0,10),
    ...shuffle(core.filter(q=>q.domain==='Storage')).slice(0,8),
    ...shuffle(core.filter(q=>q.domain==='Networking')).slice(0,9),
    ...shuffle(core.filter(q=>q.domain==='Monitoring & recovery')).slice(0,7),
  ]);
  const caseIds=shuffle([...new Set(questions.flatMap(q=>q.caseStudy?[q.caseStudy.id]:[]))]).slice(0,2);
  const caseBlocks=caseIds.map(caseId=>questions.filter(q=>q.caseStudy?.id===caseId));
  return [...standard.slice(0,15),...caseBlocks[0],...standard.slice(15,34),...caseBlocks[1],...standard.slice(34)];
};
const loadLocalMistakes=()=>{
  const ids=JSON.parse(localStorage.getItem('az104-mistakes')||'[]');
  return Array.isArray(ids)?ids.filter((id):id is number=>Number.isInteger(id)&&questions.some(question=>question.id===id)):[];
};
const saveLocalMistakes=(ids:number[])=>localStorage.setItem('az104-mistakes',JSON.stringify(ids));
const answerBreakdown=(items:Answer[])=>items.reduce<Record<string,DomainResult>>((results,answer)=>{
  results[answer.q.domain]??={correct:0,total:0};
  results[answer.q.domain].total++;
  if(answer.ok)results[answer.q.domain].correct++;
  return results;
},{});
const aggregateDomains=(attempts:Attempt[])=>domains.slice(1).map(name=>{
  const totals=attempts.reduce<DomainResult>((result,attempt)=>{
    const value=attempt.domain_breakdown?.[name];
    if(value){result.correct+=value.correct;result.total+=value.total}
    return result;
  },{correct:0,total:0});
  return {...totals,name,percent:totals.total?Math.round(totals.correct/totals.total*100):0};
});
const learningPaths=[
  {step:'00',domain:'Start here',title:'AZ-104 administrator prerequisites',focus:'Cloud Shell and ARM templates',href:'https://learn.microsoft.com/en-us/training/paths/az-104-administrator-prerequisites/'},
  {step:'01',domain:'Identity & governance · 20–25%',title:'Manage identities and governance',focus:'Entra ID, RBAC, Policy and subscriptions',href:'https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/'},
  {step:'02',domain:'Storage · 15–20%',title:'Implement and manage storage',focus:'Accounts, security, Blob and Azure Files',href:'https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/'},
  {step:'03',domain:'Compute · 20–25%',title:'Deploy and manage compute resources',focus:'VMs, availability, App Service and containers',href:'https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/'},
  {step:'04',domain:'Networking · 15–20%',title:'Configure and manage virtual networks',focus:'VNets, routing, DNS, load balancing and connectivity',href:'https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/'},
  {step:'05',domain:'Monitoring & recovery · 10–15%',title:'Monitor and back up Azure resources',focus:'Azure Monitor, alerts, Backup and recovery',href:'https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/'},
];
const examResources=[
  {tag:'BLUEPRINT',title:'Official AZ-104 study guide',copy:'Use the current skills-measured list as your master checklist.',href:'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104'},
  {tag:'PRACTICE',title:'Microsoft Practice Assessment',copy:'Take Microsoft’s free assessment after completing the learning paths.',href:'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/?practice-assessment-type=certification'},
  {tag:'REFERENCE',title:'Azure Architecture Center',copy:'See reliable patterns and decision guidance for real Azure designs.',href:'https://learn.microsoft.com/en-us/azure/architecture/'},
  {tag:'FOUNDATION',title:'Microsoft Learn: Azure training',copy:'Fill any fundamentals gap before spending time on harder scenarios.',href:'https://learn.microsoft.com/en-us/training/azure/'},
  {tag:'IDENTITY',title:'Microsoft Entra training',copy:'Go deeper on identity concepts that repeatedly appear in AZ-104.',href:'https://learn.microsoft.com/en-us/training/entra/'},
];

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
  const[historyStatus,setHistoryStatus]=useState<'loading'|'ready'|'local'|'error'>('loading');
  const[mistakeIds,setMistakeIds]=useState<number[]>([]);
  const[mistakeStatus,setMistakeStatus]=useState<'loading'|'ready'|'local'|'error'>('loading');
  const[flagged,setFlagged]=useState<number[]>([]);
  const submittedRef=useRef(false);
  const current=round[index];

  useEffect(()=>{fetch('/api/scores').then(r=>r.ok?r.json():Promise.reject()).then(data=>{setHistory(data.attempts||[]);setHistoryStatus('ready')}).catch(()=>{try{setHistory(JSON.parse(localStorage.getItem('az104-history')||'[]'));setHistoryStatus('local')}catch{setHistoryStatus('error')}})},[]);
  useEffect(()=>{fetch('/api/mistakes').then(r=>r.ok?r.json():Promise.reject()).then(data=>{setMistakeIds((data.mistakes||[]).map((item:{question_id:number})=>item.question_id));setMistakeStatus('ready')}).catch(()=>{try{setMistakeIds(loadLocalMistakes());setMistakeStatus('local')}catch{setMistakeStatus('error')}})},[]);
  useEffect(()=>{if(screen!=='quiz'&&screen!=='examReview')return;const timer=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(timer)},[screen]);

  const best=Math.max(0,...history.map(x=>x.score));
  const average=history.length?Math.round(history.reduce((sum,x)=>sum+x.score,0)/history.length):0;
  const targetHits=history.filter(x=>x.score>=800).length;
  const domainStats=useMemo(()=>aggregateDomains(history),[history]);
  const recentExams=useMemo(()=>history.filter(attempt=>attempt.mode==='mock').slice(0,3),[history]);
  const recentExamAverage=recentExams.length?Math.round(recentExams.reduce((sum,attempt)=>sum+attempt.score,0)/recentExams.length):0;
  const recentExamDomains=useMemo(()=>aggregateDomains(recentExams),[recentExams]);
  const weakestDomain=domainStats.filter(item=>item.total).sort((a,b)=>a.percent-b.percent)[0];
  const weakestRecentDomain=recentExamDomains.filter(item=>item.total).sort((a,b)=>a.percent-b.percent)[0];
  const recentDomainFloor=Math.min(100,...recentExamDomains.filter(item=>item.total).map(item=>item.percent));
  const threeExamBaseline=recentExams.length===3;
  const examReady=threeExamBaseline&&recentExams.every(attempt=>attempt.score>=800)&&recentDomainFloor>=70;
  const nearlyReady=threeExamBaseline&&recentExamAverage>=750&&recentDomainFloor>=60;
  const readiness=examReady
    ?{label:'READY TO BOOK',title:'Three strong exams in a row',detail:'You scored 800+ on all three recent full simulations, with every domain at 70% or better.',tone:'ready'}
    :nearlyReady
      ?{label:'NEARLY READY',title:'Close—repair the weakest domain',detail:`Your last three full exams average ${recentExamAverage}. Push every domain above 70%, then repeat 800+.`,tone:'near'}
      :threeExamBaseline
        ?{label:'BUILDING',title:'More exam reps needed',detail:`Your last three full exams average ${recentExamAverage}. Drill ${weakestRecentDomain?.name??'your weakest area'}, then retest.`,tone:'building'}
        :{label:'BASELINE NEEDED',title:`Complete ${3-recentExams.length} more full exam${3-recentExams.length===1?'':'s'}`,detail:'Readiness is based on three recent 50-question simulations, not quick sprints.',tone:'baseline'};
  const right=answers.filter(x=>x.ok).length;
  const score=Math.round(right/Math.max(round.length,1)*1000);
  const answeredIds=useMemo(()=>new Set(answers.map(answer=>answer.q.id)),[answers]);
  const unansweredCount=Math.max(0,round.length-answers.length);
  const weak=useMemo(()=>Object.entries(answers.reduce<Record<string,{right:number;total:number}>>((acc,item)=>{acc[item.q.domain]??={right:0,total:0};acc[item.q.domain].total++;if(item.ok)acc[item.q.domain].right++;return acc},{})).sort((a,b)=>a[1].right/a[1].total-b[1].right/b[1].total)[0]?.[0],[answers]);
  const mistakeQuestions=useMemo(()=>mistakeIds.map(id=>questions.find(question=>question.id===id)).filter((question):question is Question=>Boolean(question)),[mistakeIds]);

  const start=(nextMode:Mode=mode,nextDomain:string=domain)=>{
    const source=questions.filter(item=>nextDomain===domains[0]||item.domain===nextDomain);
    const nextRound=nextMode==='mock'?createMockRound():nextMode==='review'?shuffle(mistakeQuestions).slice(0,10):shuffle(source).slice(0,10);
    if(!nextRound.length)return;
    submittedRef.current=false;setMode(nextMode);setDomain(nextDomain);setRound(nextRound);setIndex(0);setPicked(null);setAnswers([]);setFlagged([]);setStreak(0);setSeconds(0);setScreen('quiz');
  };
  const trackMistake=(questionId:number,correct:boolean)=>{
    setMistakeIds(items=>{
      const next=correct?items.filter(id=>id!==questionId):[questionId,...items.filter(id=>id!==questionId)];
      if(mistakeStatus!=='ready'){try{saveLocalMistakes(next)}catch{} }
      return next;
    });
    if(mistakeStatus==='ready')void fetch('/api/mistakes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question_id:questionId,correct})}).then(response=>{if(!response.ok)throw new Error()}).catch(()=>{setMistakeStatus('local');setMistakeIds(items=>{try{saveLocalMistakes(items)}catch{setMistakeStatus('error')}return items})});
  };
  const trackExamMistakes=(examAnswers:Answer[])=>{
    const results=examAnswers.map(answer=>({question_id:answer.q.id,correct:answer.ok}));
    setMistakeIds(items=>{
      const next=results.reduce((ids,result)=>result.correct?ids.filter(id=>id!==result.question_id):[result.question_id,...ids.filter(id=>id!==result.question_id)],items);
      if(mistakeStatus!=='ready'){try{saveLocalMistakes(next)}catch{} }
      return next;
    });
    if(mistakeStatus==='ready')void fetch('/api/mistakes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers:results})}).then(response=>{if(!response.ok)throw new Error()}).catch(()=>{setMistakeStatus('local');setMistakeIds(items=>{try{saveLocalMistakes(items)}catch{setMistakeStatus('error')}return items})});
  };
  const choose=(choice:number)=>{
    if(picked!==null&&mode!=='mock')return;
    const nextAnswer={q:current,pick:choice,ok:choice===current.answer};
    setPicked(choice);
    if(mode==='mock'){setAnswers(items=>[...items.filter(answer=>answer.q.id!==current.id),nextAnswer]);return;}
    setAnswers(items=>[...items,nextAnswer]);setStreak(value=>nextAnswer.ok?value+1:0);trackMistake(current.id,nextAnswer.ok);
  };
  const saveAttempt=async(finalScore:number,correct:number,answerItems:Answer[]=answers)=>{
    const storedMode=mode==='mock'?'mock':'sprint';
    const storedDomain=mode==='mock'?'All domains':mode==='review'?'Review mistakes':domain;
    const domain_breakdown=answerBreakdown(answerItems);
    const optimistic:Attempt={id:-Date.now(),score:finalScore,correct_answers:correct,total_questions:round.length,elapsed_seconds:seconds,mode:storedMode,domain:storedDomain,created_at:new Date().toISOString(),domain_breakdown};
    setHistory(items=>[optimistic,...items]);
    try{const response=await fetch('/api/scores',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({score:finalScore,correct_answers:correct,total_questions:round.length,elapsed_seconds:seconds,mode:storedMode,domain:storedDomain,domain_breakdown})});if(!response.ok)throw new Error();const data=await response.json();setHistory(items=>items.map(item=>item.id===optimistic.id?data.attempt:item));setHistoryStatus('ready')}catch{setHistory(items=>{try{localStorage.setItem('az104-history',JSON.stringify(items));setHistoryStatus('local')}catch{setHistoryStatus('error')}return items})}
  };
  const goQuestion=(targetIndex:number)=>{const target=round[targetIndex];if(!target)return;setIndex(targetIndex);setPicked(answers.find(answer=>answer.q.id===target.id)?.pick??null);setScreen('quiz')};
  const toggleFlag=()=>setFlagged(items=>items.includes(current.id)?items.filter(id=>id!==current.id):[...items,current.id]);
  const finishExam=()=>{
    if(submittedRef.current)return;submittedRef.current=true;
    const finalAnswers=round.map(question=>answers.find(answer=>answer.q.id===question.id)??{q:question,pick:-1,ok:false});
    const finalRight=finalAnswers.filter(answer=>answer.ok).length;
    setAnswers(finalAnswers);trackExamMistakes(finalAnswers);setScreen('result');void saveAttempt(Math.round(finalRight/round.length*1000),finalRight,finalAnswers);
  };
  const next=()=>{
    if(mode==='mock'){if(index<round.length-1){goQuestion(index+1)}else{setScreen('examReview')}return;}
    if(index<round.length-1){setIndex(value=>value+1);setPicked(null);return}
    const finalRight=answers.filter(item=>item.ok).length;const finalScore=Math.round(finalRight/round.length*1000);setScreen('result');void saveAttempt(finalScore,finalRight);
  };
  const goHome=()=>{if(mode==='review'&&!mistakeIds.length)setMode('sprint');setScreen('home')};

  useEffect(()=>{if(mode==='mock'&&(screen==='quiz'||screen==='examReview')&&seconds>=6000)finishExam()},[mode,screen,seconds]);

  return <main>
    <header className="top"><button className="logo" onClick={goHome}><span>AZ</span><strong>104 SPRINT</strong></button><nav className="nav"><button className={screen==='home'?'active':''} onClick={goHome}>Practice</button><button className={screen==='progress'?'active':''} onClick={()=>setScreen('progress')}>Progress <b>{history.length}</b></button><button className={screen==='resources'?'active':''} onClick={()=>setScreen('resources')}>Learn</button></nav></header>

    {screen==='home'&&<section className="home">
      <div className="hero"><p className="kicker">AZURE ADMINISTRATOR // COMPLETE BLUEPRINT</p><h1>Train to <em>800.</em><br/>Pass with confidence.</h1><p className="lede">{questions.length} original questions across every objective in Microsoft’s current AZ-104 outline—from Entra and storage to compute, networking, monitoring, backup, and recovery.</p><div className="target"><b>800<small>TARGET</small></b><span><strong>Your safety margin</strong><p>Microsoft requires 700. Aim higher so exam-day nerves have room to breathe.</p></span></div></div>
      <div className="card"><p className="kicker">CHOOSE A TRAINING MODE</p><div className="modes"><button className={mode==='sprint'?'sel':''} onClick={()=>setMode('sprint')}><b>10</b><span>Quick sprint<small>Instant teaching feedback</small></span></button><button className={mode==='mock'?'sel':''} onClick={()=>{setMode('mock');setDomain(domains[0])}}><b>50</b><span>Exam simulator<small>100 min · case studies · flags</small></span></button><button className={mode==='review'?'sel':''} disabled={!mistakeIds.length||mistakeStatus==='loading'} onClick={()=>{setMode('review');setDomain(domains[0])}}><b>{mistakeStatus==='loading'?'…':mistakeIds.length}</b><span>Review mistakes<small>{mistakeIds.length?'Clear remembered misses':'No mistakes waiting'}</small></span></button></div>
        {mode==='sprint'&&<><h2>Choose your focus</h2><div className="domains">{domains.map(item=><button className={domain===item?'sel':''} onClick={()=>setDomain(item)} key={item}>{item===domains[0]?'⚡ Mixed review':item}<small>{item===domains[0]?questions.length+' questions total':questions.filter(q=>q.domain===item).length+' questions'}</small></button>)}</div></>}
        {mode==='mock'&&<div className="mock-note"><span>EXAM-DAY SIMULATION</span><strong>50 questions with two case-study sets</strong><p>Navigate freely, change answers, flag questions, and review unanswered items. Results stay hidden until final submission.</p></div>}
        {mode==='review'&&<div className="mock-note mistake-note"><span>MEMORY REPAIR</span><strong>{mistakeIds.length} question{mistakeIds.length===1?'':'s'} waiting for review</strong><p>Answer one correctly to remove it. Miss it again and it stays in your queue.</p></div>}
        <button className="primary" disabled={mistakeStatus==='loading'} onClick={()=>start()}>{mistakeStatus==='loading'?'Loading review history…':mode==='mock'?'Start exam simulator':mode==='review'?`Review ${Math.min(10,mistakeIds.length)} mistake${Math.min(10,mistakeIds.length)===1?'':'s'}`:'Start 10-question sprint'} <span>→</span></button><small className="fine">{historyStatus==='local'||mistakeStatus==='local'?'Your scores and missed questions stay in this browser on this device.':'Your scores and missed questions are saved privately to this site.'}</small>
      </div>
      <div className="blueprint"><p>2026 EXAM BLUEPRINT</p>{[['Identity & governance','20–25%'],['Compute','20–25%'],['Storage','15–20%'],['Networking','15–20%'],['Monitoring & recovery','10–15%']].map(item=><div key={item[0]}><span>{item[0]}</span><i/><b>{item[1]}</b></div>)}</div>
    </section>}

    {screen==='progress'&&<section className="progress-page">
      <div className="progress-head"><div><p className="kicker">YOUR SCORE HISTORY</p><h1>Are you ready for 800?</h1><p>Every completed sprint and exam simulation contributes to your trend.</p></div><button className="primary" onClick={goHome}>Train now →</button></div>
      <div className="stat-grid"><article><small>PERSONAL BEST</small><strong>{best||'—'}</strong><span>/ 1000</span></article><article><small>AVERAGE SCORE</small><strong>{average||'—'}</strong><span>{history.length?'all attempts':'no attempts'}</span></article><article><small>COMPLETED</small><strong>{history.length}</strong><span>attempts</span></article><article><small>800+ SCORES</small><strong>{targetHits}</strong><span>{history.length?Math.round(targetHits/history.length*100)+'% hit rate':'target passes'}</span></article></div>
      <div className="progress-grid"><article className="trend-card"><div className="panel-title"><div><h2>Recent trend</h2><p>Last 12 completed attempts</p></div><span className={average>=800?'ready':'building'}>{average>=800?'ON TARGET':'BUILDING'}</span></div>
        {history.length?<div className="chart"><div className="target-line"><span>800</span></div>{[...history].slice(0,12).reverse().map(item=><div className="bar-wrap" key={item.id}><b>{item.score}</b><i className={item.score>=800?'hit':''} style={{height:Math.max(8,item.score/10)+'%'}}/><small>{new Date(dateValue(item.created_at)).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</small></div>)}</div>:<div className="empty-state"><b>⌁</b><h3>Your trend starts after one completed round.</h3><button onClick={goHome}>Take a sprint</button></div>}
      </article><aside className={`readiness ${readiness.tone}`}><span>{readiness.label}</span><div className="readiness-ring" style={{'--score':Math.min(100,recentExamAverage/10)*3.6+'deg'} as React.CSSProperties}><b>{recentExamAverage||0}</b><small>3-EXAM AVG</small></div><h3>{readiness.title}</h3><p>{readiness.detail}</p><small className="readiness-count">{recentExams.length}/3 FULL EXAMS RECORDED</small></aside></div>
      <article className="domain-card"><div className="panel-title"><div><h2>Performance by exam domain</h2><p>All completed attempts with domain data · weighted by questions answered</p></div>{weakestDomain&&<span className="domain-focus">FOCUS: {weakestDomain.name.toUpperCase()}</span>}</div>
        {domainStats.some(item=>item.total)?<div className="domain-list">{domainStats.map(item=><div className="domain-row" key={item.name}><div><strong>{item.name}</strong><small>{item.total?`${item.correct}/${item.total} correct · ${item.total} questions seen`:'No questions recorded yet'}</small></div><div className="domain-meter"><i style={{width:item.percent+'%'}} className={item.percent>=80?'strong':item.percent>=70?'steady':'focus'}/></div><b className={item.percent>=80?'strong-text':item.percent>=70?'steady-text':'focus-text'}>{item.total?item.percent+'%':'—'}</b><button onClick={()=>start('sprint',item.name)}>Drill</button></div>)}</div>:<div className="domain-empty"><strong>Complete one new sprint or exam to unlock domain analytics.</strong><span>Earlier attempts remain in your history; new attempts add the detailed breakdown.</span></div>}
      </article>
      <article className="history-card"><div className="panel-title"><div><h2>Attempt history</h2><p>Newest first · up to 100 attempts</p></div>{historyStatus==='local'&&<span className="local-note">SAVED ON THIS DEVICE</span>}{historyStatus==='error'&&<span className="sync-error">Sync needs a retry</span>}</div>{history.length?<div className="history-table"><div className="history-row labels"><span>Date</span><span>Mode</span><span>Focus</span><span>Accuracy</span><span>Time</span><span>Score</span></div>{history.map(item=><div className="history-row" key={item.id}><span>{fmtDate(item.created_at)}</span><span><b className="mode-pill">{item.mode==='mock'?'Exam 50':item.domain==='Review mistakes'?'Review':'Sprint'}</b></span><span>{item.domain}</span><span>{item.correct_answers}/{item.total_questions}</span><span>{fmtTime(item.elapsed_seconds)}</span><strong className={item.score>=800?'pass-text':''}>{item.score}</strong></div>)}</div>:<div className="loading">{historyStatus==='loading'?'Loading your scores…':'No completed attempts yet.'}</div>}</article>
    </section>}

    {screen==='resources'&&<section className="resources-page">
      <div className="resources-head"><div><p className="kicker">OFFICIAL MICROSOFT LEARN PATH</p><h1>Learn the gap.<br/><em>Then drill it.</em></h1><p>Follow the six official paths in order once. After that, use your domain scores to revisit only what is costing you marks.</p></div><div className="resource-plan"><small>FASTEST USE OF YOUR TIME</small><strong>Quiz → weak domain → Learn → drill → full exam</strong><p>Do not restart the entire course after a bad score. Repair the lowest domain, then validate it in the 50-question simulator.</p></div></div>
      <div className="learning-path-list">{learningPaths.map(path=><a href={path.href} target="_blank" rel="noreferrer" key={path.step}><b>{path.step}</b><span><small>{path.domain}</small><strong>{path.title}</strong><p>{path.focus}</p></span><i>OPEN ↗</i></a>)}</div>
      <div className="resource-section-title"><div><h2>Exam essentials</h2><p>Current Microsoft sources worth bookmarking. Everything below supports AZ-104 directly.</p></div><button onClick={goHome}>Back to practice →</button></div>
      <div className="resource-grid">{examResources.map(resource=><a href={resource.href} target="_blank" rel="noreferrer" key={resource.title}><small>{resource.tag}</small><strong>{resource.title}</strong><p>{resource.copy}</p><span>Open Microsoft Learn ↗</span></a>)}</div>
    </section>}

    {screen==='examReview'&&<section className="exam-review-page">
      <div className="exam-review-head"><div><p className="kicker">FINAL REVIEW</p><h1>Check your exam before submitting.</h1><p>Select any question to return to it. The clock continues while you review.</p></div><div className="exam-clock"><small>TIME REMAINING</small><strong>{fmtTime(Math.max(0,6000-seconds))}</strong></div></div>
      <div className="exam-summary"><article><small>ANSWERED</small><strong>{answers.length}</strong><span>of {round.length}</span></article><article className={unansweredCount?'warn':''}><small>UNANSWERED</small><strong>{unansweredCount}</strong><span>{unansweredCount?'needs attention':'complete'}</span></article><article><small>FLAGGED</small><strong>{flagged.length}</strong><span>for review</span></article></div>
      <article className="exam-review-card"><div className="exam-review-title"><div><h2>Question navigator</h2><p>Blue is answered, amber is flagged, and outlined questions are unanswered.</p></div></div><div className="exam-review-grid">{round.map((question,questionIndex)=>{const classes=[answeredIds.has(question.id)?'answered':'',flagged.includes(question.id)?'flagged':''].filter(Boolean).join(' ');return <button key={question.id} className={classes} onClick={()=>goQuestion(questionIndex)} aria-label={`Open question ${questionIndex+1}`}>{questionIndex+1}{flagged.includes(question.id)&&<i>⚑</i>}</button>})}</div>
        {unansweredCount>0&&<div className="exam-warning"><strong>{unansweredCount} unanswered question{unansweredCount===1?'':'s'}.</strong><span>Unanswered questions will be marked incorrect if you submit now.</span></div>}
        <div className="exam-submit-actions"><button onClick={()=>setScreen('quiz')}>Resume exam</button><button className="primary" onClick={finishExam}>Submit final answers →</button></div>
      </article>
    </section>}

    {screen==='quiz'&&current&&<section className="quiz"><aside><button onClick={goHome}>← Exit {mode==='mock'?'exam':mode==='review'?'review':'sprint'}</button><p>{mode==='mock'?'EXAM SIMULATOR':mode==='review'?'REVIEW SET':'QUESTION'}</p><strong>{String(index+1).padStart(2,'0')} <small>/ {String(round.length).padStart(2,'0')}</small></strong><div className="progress"><i style={{width:(mode==='mock'?answers.length:(index+(picked!==null?1:0)))/round.length*100+'%'}}/></div><dl><div><dt>{mode==='mock'?'Answered':'Score'}</dt><dd>{mode==='mock'?answers.length:right+'/'+answers.length}</dd></div><div><dt>{mode==='mock'?'Flagged':'Streak'}</dt><dd>{mode==='mock'?flagged.length:'×'+streak}</dd></div><div><dt>{mode==='mock'?'Remaining':'Time'}</dt><dd>{mode==='mock'?fmtTime(Math.max(0,6000-seconds)):fmtTime(seconds)}</dd></div></dl>{mode==='mock'&&<><small className="hidden-note">ANSWERS HIDDEN UNTIL RESULTS</small><div className="exam-tools"><span>QUESTION NAVIGATOR</span><div className="exam-grid">{round.map((question,questionIndex)=>{const classes=[questionIndex===index?'current':'',answeredIds.has(question.id)?'answered':'',flagged.includes(question.id)?'flagged':''].filter(Boolean).join(' ');return <button key={question.id} className={classes} onClick={()=>goQuestion(questionIndex)} aria-label={`Open question ${questionIndex+1}`}>{questionIndex+1}{flagged.includes(question.id)&&<i>⚑</i>}</button>})}</div><button className="review-exam-btn" onClick={()=>setScreen('examReview')}>Review & submit</button></div></>}</aside>
      <article className="qcard"><div className="qtop"><span>{current.domain}</span><small>{current.objective.toUpperCase()}</small></div>{current.caseStudy&&<section className="case-study"><span>CASE STUDY</span><h3>{current.caseStudy.title}</h3><p>{current.caseStudy.context}</p><strong>Requirements</strong><ul>{current.caseStudy.requirements.map(requirement=><li key={requirement}>{requirement}</li>)}</ul></section>}<h2>{current.prompt}</h2><div className="options">{current.options.map((option,i)=>{const state=picked===null?'':mode==='mock'?(i===picked?'selected':'dim'):i===current.answer?'correct':i===picked?'wrong':'dim';return <button key={option} className={state} onClick={()=>choose(i)}><b>{String.fromCharCode(65+i)}</b>{option}{mode!=='mock'&&picked!==null&&i===current.answer&&<i>✓</i>}{mode!=='mock'&&picked===i&&i!==current.answer&&<i>×</i>}</button>})}</div>
        {picked!==null&&mode!=='mock'&&<div className={'feedback '+(picked===current.answer?'good':'bad')}><strong>{picked===current.answer?(mode==='review'?'Correct — removed from your mistake queue.':'Correct — lock it in.'):'Not quite — this stays in your mistake queue.'}</strong><p>{current.explanation}</p><button onClick={next}>{index===round.length-1?'See my score':'Next question'} →</button></div>}
        {mode==='mock'&&<div className="mock-next exam-controls"><button onClick={()=>goQuestion(index-1)} disabled={index===0}>← Previous</button><button className={flagged.includes(current.id)?'flag-active':''} onClick={toggleFlag}>{flagged.includes(current.id)?'⚑ Flagged':'⚐ Flag for review'}</button><button onClick={next}>{index===round.length-1?'Review & submit':'Next question'} →</button></div>}
      </article></section>}

    {screen==='result'&&<section className="result"><p className="kicker">{mode==='mock'?'EXAM SIMULATOR COMPLETE':mode==='review'?'REVIEW COMPLETE':'SPRINT COMPLETE'}</p><div className={'score '+(score>=800?'pass':'')}><b>{score}</b><small>/ 1000</small></div><h1>{mode==='review'&&!mistakeIds.length?'Mistake queue cleared.':score>=800?'You hit the target.':'One more focused lap.'}</h1><p>{right} of {round.length} correct in {fmtTime(seconds)}. {mode==='review'?`${mistakeIds.length} remembered mistake${mistakeIds.length===1?'':'s'} remaining.`:score>=800?'Keep repeating until 800 feels routine.':'Review the misses, then attack your weakest area.'}</p><div className="saved-badge">{historyStatus==='error'?'△ Score could not be saved':historyStatus==='local'?'✓ Score saved on this device':'✓ Score saved to your history'}</div><div className="actions">{mode==='review'&&!mistakeIds.length?<button className="primary" onClick={goHome}>All cleared ✓</button>:<button className="primary" onClick={()=>start()}>Retry {mode==='mock'?'exam':mode==='review'?'mistakes':'focus'} →</button>}<button onClick={()=>setScreen('progress')}>View progress</button><button onClick={goHome}>Change mode</button></div>{weak&&<div className="weak"><small>WEAKEST AREA</small><strong>{weak}</strong><button onClick={()=>start('sprint',weak)}>Drill this next →</button></div>}<div className="review"><h2>Review your answers</h2>{answers.map((answer,i)=><div key={answer.q.id}><b className={answer.ok?'yes':'no'}>{answer.ok?'✓':'×'}</b><span><small>Q{i+1} · {answer.q.domain} · {answer.q.objective}{answer.pick===-1?' · Unanswered':''}</small>{answer.q.prompt}{!answer.ok&&<em>Correct: {answer.q.options[answer.q.answer]}. {answer.q.explanation}</em>}</span></div>)}</div></section>}
    <footer>Independent study aid · Original questions aligned to Microsoft’s AZ-104 skills outline · Updated August 2026</footer>
  </main>
}
