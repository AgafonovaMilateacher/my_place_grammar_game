'use strict';
/*
 * Edit game questions here. Each of the two teams has its OWN task on each
 * ordinary cell, and its OWN set of three open-ended room questions.
 * Room answers are judged orally by the teacher (no automatic checking).
 * All room questions are special questions (Where / What), not yes/no.
 */
const ROOM_CHALLENGES={
  1:{name:'Kitchen',image:'images/rooms/kitchen.png',byTeam:[
    [
      {q:'Where is the fridge?',example:'There is a fridge to the left of the cooker.'},
      {q:'What is there on the kitchen table?',example:'There is a vase with some flowers and a bowl of fruit on the table.'},
      {q:'Where is the sink?',example:'There is a sink under the window.'}
    ],[
      {q:'What is there above the cooker?',example:'There is an extractor hood above the cooker.'},
      {q:'What is there on the wall shelf?',example:'There are some plates and cups on the shelf.'},
      {q:'Where are the chairs?',example:'There are four chairs around the kitchen table.'}
    ]
  ]},
  3:{name:'Study',image:'images/rooms/study.png',byTeam:[
    [
      {q:'Where is the laptop?',example:'There is a laptop on the desk.'},
      {q:'What is there on the bookshelf?',example:'There are some books and a globe on the bookshelf.'},
      {q:'Where is the window?',example:'There is a window behind the desk.'}
    ],[
      {q:'Where is the chair?',example:'There is a chair in front of the desk.'},
      {q:'What is there next to the laptop?',example:'There are some books and a notebook next to the laptop.'},
      {q:'Where is the lamp?',example:'There is a lamp on the left side of the desk.'}
    ]
  ]},
  5:{name:'Bathroom',image:'images/rooms/bathroom.png',byTeam:[
    [
      {q:'Where is the bath?',example:'There is a bath to the right of the washbasin.'},
      {q:'What is there above the washbasin?',example:'There is a mirror above the washbasin.'},
      {q:'What is there on the floor?',example:'There is a blue rug on the floor.'}
    ],[
      {q:'Where is the toilet?',example:'There is a toilet to the left of the washbasin.'},
      {q:'Where are the towels?',example:'There are some towels on the wall shelves.'},
      {q:'What is there on the windowsill?',example:'There is a plant on the windowsill.'}
    ]
  ]},
  9:{name:'Bedroom',image:'images/rooms/bedroom.png',byTeam:[
    [
      {q:'Where is the lamp?',example:'There is a lamp on the bedside table to the right of the bed.'},
      {q:'What is there on the bed?',example:'There are some pillows on the bed.'},
      {q:'Where is the wardrobe?',example:'There is a wardrobe to the right of the window.'}
    ],[
      {q:'Where is the bed?',example:'There is a bed on the round carpet in the middle of the room.'},
      {q:'What is there above the bed?',example:'There are two paintings above the bed.'},
      {q:'Where are the curtains?',example:'There are some green curtains on either side of the window.'}
    ]
  ]},
 15:{name:'Living room',image:'images/rooms/living-room.png',byTeam:[
    [
      {q:'Where is the sofa?',example:'There is a sofa in front of the window, behind the coffee table.'},
      {q:'What is there on the sofa?',example:'There are some cushions on the sofa.'},
      {q:'Where is the fireplace?',example:'There is a fireplace on the left side of the room.'}
    ],[
      {q:'What is there to the left of the sofa?',example:'There is an armchair to the left of the sofa.'},
      {q:'What is there on the coffee table?',example:'There are some books and a plant on the coffee table.'},
      {q:'Where is the bookshelf?',example:'There is a bookshelf to the right of the sofa.'}
    ]
  ]}
};

/* Tile task types: Choose the word, Complete the sentence, Correct the mistake,
 * Make a sentence, Make a question, Make a negative sentence.
 * The first task is for BLUE, the second for RED. Every numbered tile has
 * a task for both teams, except the five room tiles above.
 */
const TILE_TASKS={
 2:[
   {type:'Choose the word',prompt:'There is ___ armchair near the fireplace.',answers:['an'],example:'There is an armchair near the fireplace.'},
   {type:'Choose the word',prompt:'There are ___ cushions on the sofa.',answers:['some'],example:'There are some cushions on the sofa.'}
 ],
 4:[
   {type:'Correct the mistake',prompt:'There are a cushions on the sofa.',answers:['there are some cushions on the sofa'],example:'There are some cushions on the sofa.'},
   {type:'Correct the mistake',prompt:'There is some paintings on the wall.',answers:['there are some paintings on the wall'],example:'There are some paintings on the wall.'}
 ],
 6:[
   {type:'Make a question',prompt:'Make a question: any / towels / in the bathroom',answers:['are there any towels in the bathroom'],example:'Are there any towels in the bathroom?'},
   {type:'Make a question',prompt:'Make a question: a / mirror / above the washbasin',answers:['is there a mirror above the washbasin'],example:'Is there a mirror above the washbasin?'}
 ],
 7:[
   {type:'Complete the sentence',prompt:"There aren't ___ books on the coffee table.",answers:['any',"there aren't any books on the coffee table"],example:"There aren't any books on the coffee table."},
   {type:'Complete the sentence',prompt:'There are ___ flowers in the vase.',answers:['some','there are some flowers in the vase'],example:'There are some flowers in the vase.'}
 ],
 8:[
   {type:'Make a sentence',prompt:'Make a sentence: a lamp / on the bedside table',answers:['there is a lamp on the bedside table'],example:'There is a lamp on the bedside table.'},
   {type:'Make a sentence',prompt:'Make a sentence: some curtains / at the window',answers:['there are some curtains at the window'],example:'There are some curtains at the window.'}
 ],
 10:[
   {type:'Choose the word',prompt:'There is ___ painting above the bed.',answers:['a'],example:'There is a painting above the bed.'},
   {type:'Choose the word',prompt:'There is ___ orange carpet on the floor.',answers:['an'],example:'There is an orange carpet on the floor.'}
 ],
 11:[
   {type:'Correct the mistake',prompt:'There are an armchair next to the sofa.',answers:['there is an armchair next to the sofa'],example:'There is an armchair next to the sofa.'},
   {type:'Correct the mistake',prompt:'There is some books on the shelf.',answers:['there are some books on the shelf'],example:'There are some books on the shelf.'}
 ],
 12:[
   {type:'Make a negative sentence',prompt:'Make a negative sentence: any / flowers / in the vase',answers:["there aren't any flowers in the vase"],example:"There aren't any flowers in the vase."},
   {type:'Make a negative sentence',prompt:'Make a negative sentence: any / paintings / above the sofa',answers:["there aren't any paintings above the sofa"],example:"There aren't any paintings above the sofa."}
 ],
 13:[
   {type:'Choose the word',prompt:'There is ___ interesting painting on the wall.',answers:['an'],example:'There is an interesting painting on the wall.'},
   {type:'Choose the word',prompt:'Is there ___ lamp in the living room?',answers:['a'],example:'Is there a lamp in the living room?'}
 ],
 14:[
   {type:'Make a question',prompt:'Make a question: a fireplace / in the living room',answers:['is there a fireplace in the living room'],example:'Is there a fireplace in the living room?'},
   {type:'Make a question',prompt:'Make a question: any / books / on the coffee table',answers:['are there any books on the coffee table'],example:'Are there any books on the coffee table?'}
 ],
 16:[
   {type:'Complete the sentence',prompt:'There are ___ curtains at the window.',answers:['some'],example:'There are some curtains at the window.'},
   {type:'Complete the sentence',prompt:'Are there ___ newspapers on the table?',answers:['any'],example:'Are there any newspapers on the table?'}
 ],
 17:[
   {type:'Correct the mistake',prompt:'There is some books on the coffee table.',answers:['there are some books on the coffee table'],example:'There are some books on the coffee table.'},
   {type:'Correct the mistake',prompt:"There isn't some milk in the fridge.",answers:["there isn't any milk in the fridge"],example:"There isn't any milk in the fridge."}
 ],
 18:[
   {type:'Make a sentence',prompt:'Make a sentence: a vase / on the coffee table',answers:['there is a vase on the coffee table'],example:'There is a vase on the coffee table.'},
   {type:'Make a sentence',prompt:'Make a sentence: some flowers / in the vase',answers:['there are some flowers in the vase'],example:'There are some flowers in the vase.'}
 ],
 19:[
   {type:'Choose the word',prompt:"There aren't ___ newspapers on the sofa.",answers:['any'],example:"There aren't any newspapers on the sofa."},
   {type:'Choose the word',prompt:'Is there ___ painting above the fireplace?',answers:['a'],example:'Is there a painting above the fireplace?'}
 ],
 20:[
   {type:'Make a negative sentence',prompt:'Make a negative sentence: any / cushions / on the armchair',answers:["there aren't any cushions on the armchair"],example:"There aren't any cushions on the armchair."},
   {type:'Make a sentence',prompt:'Make a sentence: some flowers / next to the window',answers:['there are some flowers next to the window'],example:'There are some flowers next to the window.'}
 ]
};
