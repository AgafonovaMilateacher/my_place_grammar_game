'use strict';
/*
 * THE BOARD: exactly one route START (0) -> tiles 1..20 -> FINISH (21).
 * Coordinates below are centers measured in pixels on images/board.png (1536 x 1024).
 * To move a token's landing point, edit only the relevant [x,y] pair below.
 */
const BOARD_WIDTH=1536, BOARD_HEIGHT=1024;
const CELL_CENTRES=[
  [190,899], // 0 START
  [387,920], // 1  Kitchen
  [577,918], // 2
  [785,917], // 3  Study
  [971,865], // 4
  [1146,904],// 5  Bathroom
  [1357,810],// 6
  [1363,628],// 7
  [1312,474],// 8
  [1170,388],// 9  Bedroom
  [1001,389],// 10
  [821,335], // 11
  [659,404], // 12
  [505,273], // 13
  [341,257], // 14
  [219,368], // 15 Living room
  [194,520], // 16
  [352,602], // 17
  [564,597], // 18
  [772,607], // 19
  [921,604], // 20
  [1071,601] // 21 FINISH
];

const $=id=>document.getElementById(id);
const teams=[
 {name:'Blue Team',score:0,pos:0,token:$('blueToken'),scoreEl:$('blueScore'),posEl:$('bluePosition'),card:$('blueCard')},
 {name:'Red Team',score:0,pos:0,token:$('redToken'),scoreEl:$('redScore'),posEl:$('redPosition'),card:$('redCard')}
];
let currentTeam=0,phase='intro',activeTask=null,roomTile=null;
let nextStarter=0; // On each completed/new game, swap which team starts first.
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const labelFor=pos=>pos===0?'START':pos===21?'FINISH':`Space ${pos}`;

/* Sound effects are generated in the browser, so the site stays offline and
 * needs no audio downloads. Browsers unlock audio after a player's click. */
let soundEnabled=true, audioContext=null;
function unlockAudio(){
  if(!soundEnabled)return;
  try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    if(!audioContext)audioContext=new A();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch(err){console.info('Sound unavailable in this browser',err);}
}
function playStepSound(step){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  try{
    const now=audioContext.currentTime;
    const oscillator=audioContext.createOscillator();
    const gain=audioContext.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(510+(step%2)*48,now);
    oscillator.frequency.exponentialRampToValueAtTime(260,now+.095);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.065,now+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.095);
    oscillator.connect(gain);gain.connect(audioContext.destination);
    oscillator.start(now);oscillator.stop(now+.11);
  }catch(err){console.info('Sound disabled:',err);}
}
function setSound(enabled){
  soundEnabled=enabled;
  $('soundButton').setAttribute('aria-pressed',String(soundEnabled));
  $('soundButton').textContent=soundEnabled?'🔊 Sound on':'🔇 Sound off';
  if(enabled)unlockAudio();
}

/* Canvas confetti: no dependencies, falls when a team actually reaches FINISH. */
let confettiFrame=0,confettiStart=0,confettiPieces=[];
function stopConfetti(){
  if(confettiFrame)cancelAnimationFrame(confettiFrame);
  confettiFrame=0;confettiPieces=[];
  const canvas=$('confettiCanvas');
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
}
function launchConfetti(){
  stopConfetti();
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const canvas=$('confettiCanvas'),ctx=canvas.getContext('2d');
  const dpr=Math.min(window.devicePixelRatio||1,2),width=window.innerWidth,height=window.innerHeight;
  canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const colors=['#ffd84d','#79b86a','#5a8fda','#e94c4c','#fff5d9','#c8955a','#8ec7da'];
  confettiPieces=Array.from({length:360},()=>({
    x:Math.random()*width,y:-10-Math.random()*height*.42,
    vx:(Math.random()-.5)*2.3,vy:2.4+Math.random()*4.4,
    size:4+Math.random()*8,rotation:Math.random()*Math.PI*2,
    spin:(Math.random()-.5)*.12,color:colors[Math.floor(Math.random()*colors.length)],
    sway:Math.random()*6.28
  }));
  confettiStart=performance.now();
  function frame(time){
    const elapsed=time-confettiStart;
    ctx.clearRect(0,0,width,height);
    for(const p of confettiPieces){
      p.y+=p.vy;p.x+=p.vx+Math.sin((p.y*.02)+p.sway)*.65;
      p.rotation+=p.spin;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
      ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.65);ctx.restore();
    }
    if(elapsed<6200){confettiFrame=requestAnimationFrame(frame)}
    else{stopConfetti()}
  }
  confettiFrame=requestAnimationFrame(frame);
}
function hideVictory(){
  $('victoryOverlay').hidden=true;stopConfetti();
}


function updateUI(){
 const same=teams[0].pos===teams[1].pos;
 teams.forEach((team,i)=>{
   team.scoreEl.textContent=`${team.score} ${team.score===1?'point':'points'}`;
   team.posEl.textContent=labelFor(team.pos);
   team.card.classList.toggle('active',currentTeam===i);
   const [x,y]=CELL_CENTRES[team.pos];
   const offset=same?(i===0?-17:17):0;
   team.token.style.left=`${(x+offset)/BOARD_WIDTH*100}%`;
   team.token.style.top=`${y/BOARD_HEIGHT*100}%`;
 });
 $('activeTeam').textContent=teams[currentTeam].name;
 $('turnHeading').textContent=teams[currentTeam].name;
}

/* Canonicalize contractions and punctuation, but allow the teacher to accept other valid wordings. */
function normalize(answer){
 return String(answer||'').toLowerCase().replace(/\u2019/g,"'")
  .replace(/\bthere's\b/g,'there is').replace(/\bisn't\b/g,'is not')
  .replace(/\baren't\b/g,'are not').replace(/\bdoesn't\b/g,'does not')
  .replace(/[.,!?;:]/g,'').replace(/\s+/g,' ').trim();
}

function renderIdle(message,title='Ready to play?'){
 $('taskPanel').innerHTML=`<div class="idle-task"><div class="idle-icon">✦</div><h3>${title}</h3><p>${message}</p></div>`;
}

function renderTileTask(tile){
 activeTask=TILE_TASKS[tile]?.[currentTeam];
 if(!activeTask)throw Error(`Missing task for tile ${tile}`);
 $('endTurnButton').disabled=true;
 const panel=$('taskPanel');
 panel.innerHTML=`
 <span class="tile-badge">SPACE ${tile} · ${teams[currentTeam].name.toUpperCase()} · ${activeTask.type}</span>
 <h3></h3><p class="task-prompt" id="taskPrompt"></p>
 <p class="task-hint">Write the missing word or the complete sentence.</p>
 <input class="answer-input" type="text" id="answerInput" autocomplete="off" autocapitalize="sentences" placeholder="Type your answer here…" aria-label="Your answer">
 ${activeTask.type==='Choose the word'?'<div class="choice-grid" id="choiceGrid"><button type="button" class="choice-option" data-answer="a">A</button><button type="button" class="choice-option" data-answer="an">AN</button><button type="button" class="choice-option" data-answer="some">SOME</button><button type="button" class="choice-option" data-answer="any">ANY</button></div>':''}
 <div class="answer-actions"><button class="button button-blue" id="checkButton">Check answer</button><button class="button button-quiet" id="clearButton">Clear answer</button></div>
 <div id="answerFeedback" aria-live="polite"></div>
 <div class="teacher-actions"><button id="acceptButton" type="button" title="Teacher can accept another grammatically correct answer">✓ Teacher: accept a different correct answer</button><button id="skipButton" type="button">Show answer / no points</button></div>`;
 $('taskPrompt').textContent=activeTask.prompt;
 if(activeTask.type==='Choose the word'){
   $('answerInput').placeholder='Choose a word below or type your answer…';
   document.querySelectorAll('.choice-option').forEach(btn=>btn.addEventListener('click',()=>{
     if(phase!=='task')return;
     $('answerInput').value=btn.dataset.answer;
     document.querySelectorAll('.choice-option').forEach(b=>b.classList.toggle('selected',b===btn));
     $('answerFeedback').innerHTML='';
   }));
 }
 $('checkButton').addEventListener('click',checkAnswer);
 $('clearButton').addEventListener('click',()=>{if(phase!=='task')return;$('answerInput').value='';$('answerFeedback').innerHTML='';document.querySelectorAll('.choice-option').forEach(b=>b.classList.remove('selected'));$('answerInput').focus()});
 $('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
 $('acceptButton').addEventListener('click',()=>finishTask(true,true));
 $('skipButton').addEventListener('click',()=>finishTask(false,false));
 $('answerInput').focus({preventScroll:true});
}
function finishTask(givePoint,teacherAccepted){
 if(phase!=='task')return;
 phase='completed';
 if(givePoint)teams[currentTeam].score+=1;
 const fb=$('answerFeedback');fb.className='feedback correct';
 fb.innerHTML=(givePoint?`✓ ${teacherAccepted?'Accepted by the teacher':'Correct'}! +1 point.`:'No points this time.')+
 `<span class="sample-answer">Example: ${activeTask.example}</span>`;
 $('answerInput').disabled=true;$('checkButton').disabled=true;$('clearButton').disabled=true;document.querySelectorAll('.choice-option').forEach(b=>b.disabled=true);
 $('acceptButton').disabled=true;$('skipButton').disabled=true;
 $('endTurnButton').disabled=false;updateUI();
}
function checkAnswer(){
 if(phase!=='task')return;
 const value=normalize($('answerInput').value);
 const feedback=$('answerFeedback');
 if(!value){feedback.className='feedback incorrect';feedback.textContent='Write an answer first.';return;}
 const correct=activeTask.answers.some(answer=>normalize(answer)===value);
 if(correct){finishTask(true,false);return;}
 feedback.className='feedback incorrect';
 feedback.textContent='Not quite. Change your answer and press Check again, or use Clear answer to start over.';
 /* The input and Check button stay enabled on every incorrect attempt. */
}

function showRoom(tile){
 const info=ROOM_CHALLENGES[tile];roomTile=tile;const roomQuestions=info.byTeam[currentTeam];
 $('roomTitle').textContent=info.name;
 $('roomEyebrow').textContent=`ROOM CHALLENGE · SPACE ${tile}`;
 $('roomTeam').textContent=teams[currentTeam].name.toUpperCase()+' · 3 questions';
 $('roomImage').src=info.image;
 $('roomImage').alt=`${info.name} illustration with furniture`;
 $('roomQuestions').replaceChildren(...roomQuestions.map(item=>{const li=document.createElement('li');li.textContent=item.q;return li}));
 const suggestions=$('roomSuggestions');
 const samples=document.createElement('ol');
 roomQuestions.forEach(item=>{const li=document.createElement('li');li.textContent=item.example;samples.appendChild(li)});
 suggestions.replaceChildren(samples);suggestions.hidden=true;
 $('showSuggestions').textContent='Show sample answers';
 $('roomCompletion').textContent='';
 $('roomCompleteButton').hidden=false;$('roomCompleteButton').disabled=false;
 $('roomContinueButton').hidden=true;$('roomSkipButton').hidden=false;
 $('roomOverlay').classList.add('open');$('roomOverlay').setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 $('roomCompleteButton').focus();
}
function hideRoom(){
 $('roomOverlay').classList.remove('open');$('roomOverlay').setAttribute('aria-hidden','true');
 document.body.style.overflow='';roomTile=null;
}
function markRoomCompleted(){
 if(phase!=='room')return;
 phase='completed';teams[currentTeam].score+=3;updateUI();
 $('roomCompletion').textContent='✓ Room completed! Your team earned 3 points.';
 $('roomCompleteButton').hidden=true;$('roomSkipButton').hidden=true;
 $('roomContinueButton').hidden=false;
 $('roomContinueButton').focus();
}
function endRoomWithoutPoints(){
 if(phase!=='room')return;
 hideRoom();endTurn(true);
}
function showFinish(){
 phase='finished';$('endTurnButton').disabled=true;$('rollButton').disabled=true;
 const winner=teams[currentTeam];
 nextStarter=1-currentTeam; // Next game lets this round's other team start.
 $('taskPanel').innerHTML=`<div class="idle-task"><div class="idle-icon">🏆</div><h3>FINISH! ${winner.name} wins!</h3><p>Final score: Blue ${teams[0].score} — Red ${teams[1].score}. Press New game to play again.</p></div>`;
 $('rollMessage').textContent=`${winner.name} reached FINISH!`;
 $('victoryTitle').textContent=`${winner.name} wins!`;
 $('victoryTitle').style.color=currentTeam===0?'#397ac2':'#db564c';
 $('victoryScore').textContent=`Blue Team: ${teams[0].score} points · Red Team: ${teams[1].score} points`;
 $('victoryOverlay').hidden=false;
 launchConfetti();
}

async function rollDice(){
 if(phase!=='ready')return;
 unlockAudio();phase='moving';$('rollButton').disabled=true;$('endTurnButton').disabled=true;$('restartButton').disabled=true;$('diceSides').disabled=true;
 const count=1+Math.floor(Math.random()*Number($('diceSides').value));
 $('die').textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][count-1];
 $('rollMessage').textContent=`You rolled ${count}. Moving ${count} ${count===1?'space':'spaces'}…`;
 const team=teams[currentTeam];
 for(let step=0;step<count && team.pos<21;step++){
   team.pos+=1;updateUI();playStepSound(step);
   /* Wait for the token to finish moving onto this exact, numbered cell. */
   await wait(410);
 }
 $('restartButton').disabled=false;
 $('rollMessage').textContent=`Rolled ${count}. Landed on ${labelFor(team.pos)}.`;
 if(team.pos===21){showFinish();return;}
 const room=ROOM_CHALLENGES[team.pos];
 if(room){phase='room';showRoom(team.pos);renderIdle(`${room.name}: answer the three questions in the full-screen room challenge.`,`Room: ${room.name}`);}
 else{phase='task';renderTileTask(team.pos);}
}

function endTurn(fromRoom=false){
 if(!fromRoom && phase!=='completed')return;
 if(fromRoom && phase!=='room')return;
 hideRoom();currentTeam=1-currentTeam;phase='ready';activeTask=null;
 $('endTurnButton').disabled=true;$('rollButton').disabled=false;$('diceSides').disabled=false;
 $('die').textContent='🎲';$('rollMessage').textContent=`${teams[currentTeam].name}, roll the dice!`;
 updateUI();renderIdle(`It's ${teams[currentTeam].name}'s turn. Roll the dice and complete a task.`, 'Next team!');
}
function openWelcome(){
  const welcome=$('welcomeOverlay');
  $('welcomeTeam').textContent=`${teams[currentTeam].name} goes first this game`;
  welcome.hidden=false;
  document.body.classList.add('welcome-open');
  $('startGameButton').focus();
}
function startGame(){
  if(phase!=='intro')return;
  $('welcomeOverlay').hidden=true;
  document.body.classList.remove('welcome-open');
  phase='ready';
  $('rollButton').disabled=false;
  $('startGameButton').blur();
  $('rollButton').focus();
}
function newGame(ask=true){
 if(phase==='moving')return;
 if(ask&&!window.confirm('Start a new game? Both teams will go back to START and scores will be reset.'))return;
 if(ask && phase!=='finished')nextStarter=1-nextStarter;
 hideVictory();
 hideRoom();teams.forEach(t=>{t.pos=0;t.score=0});currentTeam=nextStarter;phase='intro';activeTask=null;
 $('rollButton').disabled=false;$('restartButton').disabled=false;$('endTurnButton').disabled=true;$('diceSides').disabled=false;
 $('die').textContent='🎲';$('rollMessage').textContent='Both teams begin at START.';
 renderIdle('Roll the dice to move your piece. A task will appear when it lands on a numbered space.');updateUI();openWelcome();
}

$('startGameButton').addEventListener('click',startGame);
$('rollButton').addEventListener('click',rollDice);
$('endTurnButton').addEventListener('click',()=>endTurn(false));
$('restartButton').addEventListener('click',()=>newGame(true));
$('victoryRestart').addEventListener('click',()=>newGame(false));
$('victoryClose').addEventListener('click',hideVictory);
$('soundButton').addEventListener('click',()=>setSound(!soundEnabled));
$('roomCompleteButton').addEventListener('click',markRoomCompleted);
$('roomContinueButton').addEventListener('click',()=>endTurn(false));
$('roomSkipButton').addEventListener('click',endRoomWithoutPoints);
$('showSuggestions').addEventListener('click',()=>{
 const el=$('roomSuggestions');el.hidden=!el.hidden;
 $('showSuggestions').textContent=el.hidden?'Show sample answers':'Hide sample answers';
});
updateUI();
$('rollButton').disabled=true;
openWelcome();
/* Useful diagnostics if tasks are edited later. */
for(let tile=1;tile<=20;tile++){
 if(ROOM_CHALLENGES[tile]){
   if(ROOM_CHALLENGES[tile].byTeam.length!==2 || ROOM_CHALLENGES[tile].byTeam.some(q=>q.length!==3))
     console.error(`Room on space ${tile} needs three questions for each team.`);
 }else if(!TILE_TASKS[tile] || TILE_TASKS[tile].length!==2){
   console.error(`Space ${tile} needs different tasks for BLUE and RED teams.`);
 }
}
