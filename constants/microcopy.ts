// CLUTCHR BASEBALL — COMPLETE MICROCOPY SYSTEM
// File: constants/microcopy.ts
//
// HOW THIS WORKS:
// 1. Athlete picks a Cap Voice Style in onboarding → stored in AthleteContext as capVoice: 'direct' | 'mentor' | 'firedUp'
// 2. App reads context (gameDay, slump, streak, etc.) from AthleteContext/season state
// 3. useMicrocopy() hook picks the right pool + selects a random non-repeating line
// 4. At KEY MOMENTS ONLY: inject athlete's saved primary cue via {CUE} replacement
// 5. Non-repetition: track last 3 shown per category in AsyncStorage, skip repeats
//
// IMPLEMENTATION NOTES FOR CLAUDE CODE:
// - Create a useMicrocopy() hook in hooks/useMicrocopy.ts
// - Hook accepts: (category: string, context?: MicrocopyContext) => string
// - It reads capVoice from AthleteContext
// - It reads primaryCue from athlete's Playbook (first/featured saved cue)
// - It randomly selects from the right pool, skipping recently shown
// - {CUE} gets replaced with athlete's primaryCue if they have one saved
// - If no primaryCue saved, use the _noCue fallback variant instead
// - Log last 3 shown per category to AsyncStorage under key 'microcopy_history'

// ─────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────

export type CapVoice = 'direct' | 'mentor' | 'firedUp';

export interface MicrocopyPool {
  direct: string[];
  mentor: string[];
  firedUp: string[];
}

export interface CueMicrocopyPool {
  withCue: {
    direct: string[];
    mentor: string[];
    firedUp: string[];
  };
  noCue: {
    direct: string[];
    mentor: string[];
    firedUp: string[];
  };
}

// ─────────────────────────────────────────────
// SECTION 1 — ONBOARDING: CAP VOICE SELECTION
// ─────────────────────────────────────────────
// Screen copy for the voice selection step in onboarding.
// Show all three cards; athlete taps one. Store as capVoice.

export const ONBOARDING_VOICE_SELECTION = {
  screenTitle: "How should Cap talk to you?",
  screenSubtitle: "You can change this anytime in Settings.",

  styles: {
    direct: {
      label: "DIRECT",
      tagline: "Short. Sharp. No fluff.",
      preview: "Rep done. Next.",
      description: "Cap keeps it tight. One cue, one line, move on.",
    },
    mentor: {
      label: "MENTOR",
      tagline: "Coaching voice. Real talk.",
      preview: "That's the work. Carry it forward.",
      description: "Cap sounds like your best coach. Calm, honest, purposeful.",
    },
    firedUp: {
      label: "FIRED UP",
      tagline: "Energy. Intensity. Let's go.",
      preview: "LOCKED IN. That's how we do it.",
      description: "Cap brings the heat. Best for players who need that dial turned up.",
    },
  },
};

// ─────────────────────────────────────────────
// SECTION 2 — HOME SCREEN GREETING
// Context-aware: time of day + game day flag
// ─────────────────────────────────────────────

export const HOME_GREETING = {
  // Morning (before noon)
  morning: {
    direct: [
      "Morning. Let's get a rep in.",
      "Day's starting. You know what to do.",
      "Early work. Right call.",
      "Morning. Cap's got your next rep.",
      "Start right. One rep.",
    ],
    mentor: [
      "Morning. Your next rep is waiting.",
      "Good morning. The program doesn't take days off.",
      "Morning. Build something today that carries.",
      "Start the day with a rep. Everything else follows.",
      "Cap's here. Let's build something this morning.",
    ],
    firedUp: [
      "MORNING. Let's go — your rep is right here.",
      "Early. Locked in. That's the edge.",
      "Morning grind hits different. Let's get it.",
      "RISE. Your next rep is loaded and ready.",
      "Cap's up. You should be too. Let's work.",
    ],
  },

  // Afternoon
  afternoon: {
    direct: [
      "Afternoon. One rep.",
      "Good time to get a rep in.",
      "Afternoon check-in. Cap's ready.",
      "Mid-day work. Let's go.",
      "Your next rep is here.",
    ],
    mentor: [
      "Afternoon. Good time to sharpen something.",
      "Cap's here. Let's use this window.",
      "The afternoon rep is underrated. Let's build.",
      "Good players use every window. This is yours.",
      "Afternoon. Your next rep is waiting.",
    ],
    firedUp: [
      "AFTERNOON and still working. Let's go.",
      "Mid-day rep. Most players are sleeping on this.",
      "Your competition is resting. You're working. GO.",
      "Afternoon grind. Cap loves to see it.",
      "This is how you separate. Afternoon rep. NOW.",
    ],
  },

  // Evening / Night
  evening: {
    direct: [
      "End of day. One more rep.",
      "Evening session. Let's close it out.",
      "Night rep. Good call.",
      "Cap's still here. One more.",
      "Close the day right.",
    ],
    mentor: [
      "Good evening. One rep before you shut it down.",
      "The night rep is the one most players skip. Don't.",
      "End of day. This is where habits get built.",
      "Cap's here for the evening session. Let's close right.",
      "Night session. Builds character. Let's go.",
    ],
    firedUp: [
      "NIGHT REP. Most quit by now. You didn't. Let's GO.",
      "Evening grind. This is the difference maker.",
      "Late session energy. Cap respects it. LET'S WORK.",
      "Night rep incoming. LOCK IN.",
      "While they sleep, you build. Evening rep. GO.",
    ],
  },

  // GAME DAY — overrides time of day when isGameDay = true
  gameDay: {
    direct: [
      "Game day. Get ready.",
      "It's game day. You know what to do.",
      "Game day. One rep to lock in.",
      "Today's the day. Cap's ready when you are.",
      "Game day. Let's prep.",
    ],
    mentor: [
      "Game day. Let's get you locked in before first pitch.",
      "Cap's with you today. Prep, reset, compete.",
      "Game day session. This is what the reps were for.",
      "The game is today. Everything you've built shows up now.",
      "It's game day. Let's make your preparation count.",
    ],
    firedUp: [
      "GAME DAY. Cap's fired up. You should be too.",
      "TODAY IS THE DAY. Let's get you LOCKED IN.",
      "GAME DAY. The reps were for this moment. LET'S GO.",
      "It's game day and Cap is READY. Are you?",
      "GAME DAY REP. This is what separates. GO.",
    ],
  },

  // Return after 3+ days away
  returnAfterAbsence: {
    direct: [
      "You're back. Good.",
      "Back in the building. Let's go.",
      "Back. One rep gets you right.",
      "Welcome back. Cap's here.",
      "Back. Don't overthink it — just rep.",
    ],
    mentor: [
      "You're back. That's the most important rep right there.",
      "Cap's glad you're back. Let's start simple — one rep.",
      "The come-back rep is always the hardest. You showed up. That counts.",
      "Welcome back. No judgment. Just your next rep.",
      "Back in it. The program picks up right where you left off.",
    ],
    firedUp: [
      "YOU'RE BACK. Cap missed the energy. LET'S GO.",
      "Return rep incoming. Don't ease in — LOCK IN.",
      "Back in the building. Time to remind them why. LET'S WORK.",
      "Cap knew you'd be back. Now let's make it count. GO.",
      "RETURN. REST IS OVER. REP IS WAITING.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 3 — LESSON STEP FEEDBACK
// Fires on every correct/incorrect answer
// NO cue injection — keep it fast and non-interrupting
// ─────────────────────────────────────────────

export const STEP_CORRECT: MicrocopyPool = {
  direct: [
    "Locked.",
    "That's it.",
    "Clean.",
    "Right call.",
    "Good read.",
    "Yes.",
    "Dialed.",
    "Correct.",
    "Sharp.",
    "On it.",
  ],
  mentor: [
    "That's the rep.",
    "Good baseball mind.",
    "Right thought, right time.",
    "That's exactly it.",
    "Locked in. Keep going.",
    "Good read on that one.",
    "That's how you think the game.",
    "Exactly right.",
    "That's a player who thinks.",
    "Good decision.",
  ],
  firedUp: [
    "LET'S GO.",
    "THAT'S IT. Keep pushing.",
    "YES. Next one.",
    "LOCKED. Don't stop.",
    "PERFECT. Keep going.",
    "RIGHT CALL. GO.",
    "FIRED UP. Next.",
    "DIALED IN.",
    "THAT'S THE ONE.",
    "LET'S WORK.",
  ],
};

export const STEP_INCORRECT: MicrocopyPool = {
  direct: [
    "Not quite. Think it through.",
    "Wrong call. Here's why.",
    "Missed it. Read the situation again.",
    "Not the move. Let's look at it.",
    "Off on that one.",
    "Wrong read. Here's the correct play.",
    "Not this time. Next rep.",
    "Think through the situation.",
  ],
  mentor: [
    "Not quite — but good to know where your thinking went.",
    "Missed that one. Let's look at the right call together.",
    "The game punishes that decision. Here's the better play.",
    "Off on that one. Here's how to think through it next time.",
    "Not the call Cap would make. Here's why.",
    "Wrong read, but you're in the right area. Close.",
    "That's a common miss. Here's the sharper take.",
    "Missed it — but this is exactly why we rep it.",
  ],
  firedUp: [
    "WRONG CALL — but now you know. Get it right next time.",
    "Not it. Process fast. Move on.",
    "Missed. Reset. Next pitch.",
    "Wrong read. Acknowledge it and GO.",
    "Not the move. That's why we train. Next rep.",
    "Off on that one. Short memory. Next.",
    "Wrong — shake it and lock in.",
    "Cap's seen better. Let's go again.",
  ],
};

// ─────────────────────────────────────────────
// SECTION 4 — LESSON COMPLETION
// KEY MOMENT — CUE INJECTION ACTIVE
// ─────────────────────────────────────────────

export const LESSON_COMPLETE: CueMicrocopyPool = {
  withCue: {
    direct: [
      "Rep done. Carry {CUE}.",
      "Locked. {CUE} goes with you.",
      "Rep complete. {CUE}.",
      "Done. {CUE} is your carry.",
      "Good rep. {CUE} stays with you.",
      "Clean rep. Take {CUE} into the next one.",
    ],
    mentor: [
      "Rep complete. Carry {CUE} into the next moment.",
      "Good work. That cue — {CUE} — is yours to keep.",
      "That's the rep. {CUE} travels with you.",
      "Nice work. Remember {CUE} when it matters.",
      "Rep locked. {CUE} stays with you today.",
      "That was real work. Your carry: {CUE}.",
    ],
    firedUp: [
      "REP LOCKED. CARRY {CUE}. LET'S GO.",
      "DONE. {CUE}. That's your cue. USE IT.",
      "REP COMPLETE. {CUE} goes with you into battle.",
      "LOCKED IN. {CUE}. Next pitch mentality.",
      "THAT'S THE WORK. {CUE}. Don't forget it.",
      "REP DONE. {CUE} is your weapon. CARRY IT.",
    ],
  },
  noCue: {
    direct: [
      "Rep done. Take something with you.",
      "Locked. Good rep.",
      "Rep complete. Carry the cue.",
      "Done. What's your takeaway?",
      "Good rep. Save a cue.",
      "Clean. What carries forward?",
    ],
    mentor: [
      "Good work. Take one thing with you from that rep.",
      "Rep complete. Cap wants you to carry something forward.",
      "Nice work. What's the one cue from that session?",
      "That's the rep. Save a cue before you move on.",
      "Good session. What does your playbook need from that one?",
      "Rep locked. Identify your carry before the next one.",
    ],
    firedUp: [
      "REP DONE. TAKE SOMETHING WITH YOU. GO.",
      "LOCKED. What's YOUR cue from that? Save it.",
      "COMPLETE. Build your playbook. Add a cue. NOW.",
      "DONE. Don't leave without your carry. What is it?",
      "REP FINISHED. Cue up. What do you need for the next moment?",
      "THAT'S THE WORK. Your cue is in there. Pull it out.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 5 — WORLD / CHAPTER COMPLETION
// KEY MOMENT — CUE INJECTION ACTIVE
// ─────────────────────────────────────────────

export const WORLD_COMPLETE: CueMicrocopyPool = {
  withCue: {
    direct: [
      "World done. {CUE}. That's yours.",
      "Chapter complete. Carry {CUE} into the next one.",
      "Done. {CUE} is built in now.",
      "World finished. {CUE} goes with you.",
    ],
    mentor: [
      "World complete. You've earned {CUE}. That cue is built on reps now.",
      "Cap's proud of that one. Carry {CUE} into everything that follows.",
      "Chapter done. The real takeaway: {CUE}. Don't lose it.",
      "That world is behind you. {CUE} travels forward.",
    ],
    firedUp: [
      "WORLD DONE. {CUE} IS LOCKED IN. WHAT'S NEXT.",
      "CHAPTER COMPLETE. {CUE}. THAT'S EARNED. LET'S GO.",
      "YOU FINISHED IT. {CUE}. NOW TAKE THAT INTO THE NEXT WORLD.",
      "LOCKED. {CUE} IS YOURS. NEXT WORLD. LET'S WORK.",
    ],
  },
  noCue: {
    direct: [
      "World done. Good work.",
      "Chapter complete. Next.",
      "That world's behind you. Keep going.",
      "Done. Solid reps in that one.",
    ],
    mentor: [
      "World complete. Cap sees the work you put in.",
      "Chapter done. That foundation is real now. Build on it.",
      "Good work through that world. What carries forward?",
      "That world is yours. What's the cue you take into the next one?",
    ],
    firedUp: [
      "WORLD COMPLETE. LET'S GO. WHAT'S NEXT.",
      "DONE. CAP IS FIRED UP FOR YOU. NEXT WORLD. GO.",
      "CHAPTER LOCKED. YOU EARNED THAT. KEEP PUSHING.",
      "THAT'S A WORLD DOWN. DON'T SLOW DOWN NOW. LET'S WORK.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 6 — BOSS CHALLENGE
// KEY MOMENT — CUE INJECTION ACTIVE
// ─────────────────────────────────────────────

export const BOSS_COMPLETE: CueMicrocopyPool = {
  withCue: {
    direct: [
      "Boss down. {CUE}. Take that.",
      "You handled the pressure. {CUE} stays.",
      "Boss cleared. {CUE}. Carry it.",
      "That was the test. You passed. {CUE}.",
    ],
    mentor: [
      "That was a pressure rep and you handled it. {CUE} is earned now.",
      "Boss challenge complete. Not everyone gets there. {CUE} is yours.",
      "Cap watched that one closely. You showed up. Carry {CUE}.",
      "That's what the training is for. {CUE}. Remember that feeling.",
    ],
    firedUp: [
      "BOSS CLEARED. {CUE}. THAT'S CLUTCH PERFORMANCE. LET'S GO.",
      "YOU TOOK DOWN THE BOSS. {CUE}. THAT'S BUILT INTO YOU NOW.",
      "PRESSURE MET. {CUE} EARNED. CAP IS FIRED UP.",
      "BOSS DONE. {CUE}. THAT'S WHAT YOU'RE MADE OF. KEEP GOING.",
    ],
  },
  noCue: {
    direct: [
      "Boss down. That was a real pressure rep.",
      "Cleared it. Good under pressure.",
      "Boss challenge done. That was earned.",
      "That was the test. You passed.",
    ],
    mentor: [
      "Boss challenge complete. That's not something everyone does.",
      "Cap respects how you handled that pressure rep.",
      "You showed up when the stakes were highest. That's the job.",
      "That rep is going to carry. Well done.",
    ],
    firedUp: [
      "BOSS CLEARED. THAT'S HOW WE DO IT. LET'S GO.",
      "YOU JUST HANDLED PRESSURE. CAP IS FIRED UP. NEXT.",
      "BOSS DOWN. THAT'S CLUTCH. KEEP THAT ENERGY.",
      "FINISHED THE BOSS. THAT'S EARNED. NOW CARRY IT.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 7 — STREAK SYSTEM
// Daily + milestone moments
// ─────────────────────────────────────────────

// Daily streak extension (fires each new day a lesson is completed)
export const STREAK_EXTENDED: MicrocopyPool = {
  direct: [
    "Streak extended. Keep going.",
    "Day added. Don't stop.",
    "Streak alive. Good.",
    "Another day. Stack it.",
    "Rep logged. Streak holds.",
    "Day recorded. Next.",
    "Streak continues.",
    "Keep stacking.",
    "One more day. That's how it works.",
    "Streak locked in.",
  ],
  mentor: [
    "Another day, another rep. That's the program.",
    "Streak extended. Consistency is the whole game.",
    "Day added. Cap sees the pattern building.",
    "One more rep. Habits don't happen overnight — but they're happening.",
    "Streak alive. This is how champions are built.",
    "Another day in the program. Keep showing up.",
    "Streak continues. It doesn't feel like much today. It adds up.",
    "Day locked. Trust the program.",
    "Cap's keeping track. Every day matters.",
    "One more day. The program rewards showing up.",
  ],
  firedUp: [
    "STREAK EXTENDED. DON'T BREAK IT. LET'S GO.",
    "ANOTHER DAY. STACK IT. KEEP GOING.",
    "STREAK ALIVE. CAP IS WATCHING. KEEP WORKING.",
    "DAY ADDED. THIS IS HOW YOU BUILD AN EDGE.",
    "STREAK LOCKED. CONSISTENCY IS YOUR WEAPON.",
    "ONE MORE. KEEP THAT FIRE GOING.",
    "ANOTHER REP DAY. STACK IT UP.",
    "STREAK HOLDS. NOW DO IT AGAIN TOMORROW.",
    "DAY RECORDED. CAP IS FIRED UP. KEEP STACKING.",
    "STREAK CONTINUES. DON'T YOU DARE STOP NOW.",
  ],
};

// Streak milestone moments — specific day counts
export const STREAK_MILESTONES: Record<number, MicrocopyPool> = {
  7: {
    direct: [
      "7 days. One week. That's real.",
      "Week one done. Don't stop here.",
      "7-day streak. You showed up all week.",
    ],
    mentor: [
      "Seven days. A week of reps. Most people don't make it here.",
      "One week in the program. Cap notices who shows up every day.",
      "7-day streak. Week one is done. The habit is starting to form.",
    ],
    firedUp: [
      "7 DAYS. ONE WEEK. THE EDGE IS BUILDING. LET'S GO.",
      "WEEK ONE LOCKED. CAP IS FIRED UP. KEEP THAT STREAK ALIVE.",
      "7-DAY STREAK. YOU'RE DIFFERENT. KEEP GOING.",
    ],
  },
  14: {
    direct: [
      "14 days. Two weeks straight.",
      "Two-week streak. Habit territory.",
      "14 days. That's discipline.",
    ],
    mentor: [
      "Two weeks. Research says 14 days is where habits start to stick.",
      "14-day streak. Cap calls this 'habit territory.' You're in it.",
      "Two weeks straight. This is no longer new — it's becoming yours.",
    ],
    firedUp: [
      "14 DAYS. TWO WEEKS. THE PROGRAM IS IN YOUR BLOOD NOW. GO.",
      "TWO-WEEK STREAK. CAP IS FIRED UP. THIS IS REAL MOMENTUM.",
      "14 DAYS LOCKED. CONSISTENCY IS YOUR EDGE. DON'T STOP.",
    ],
  },
  30: {
    direct: [
      "30 days. One month.",
      "Month one complete. Rare.",
      "30-day streak. That's rare company.",
    ],
    mentor: [
      "30 days. One full month of reps. Very few athletes get here.",
      "Month one complete. The program is part of you now.",
      "30-day streak. Cap wants you to know — this is rare. Don't take it for granted.",
    ],
    firedUp: [
      "30 DAYS. ONE MONTH. THAT'S ELITE CONSISTENCY. LET'S GO.",
      "A MONTH STRAIGHT. CAP IS SERIOUSLY FIRED UP. YOU'RE BUILT DIFFERENT.",
      "30-DAY STREAK. RARE. EARNED. DON'T BREAK IT NOW.",
    ],
  },
  50: {
    direct: [
      "50 days. Uncommon.",
      "50 straight. That speaks for itself.",
      "50-day streak. You're built different.",
    ],
    mentor: [
      "50 days. Not many athletes reach this point. This is commitment.",
      "50-day streak. Cap can say with confidence — you trust the program.",
      "Fifty reps of showing up. The mental game is built on exactly this.",
    ],
    firedUp: [
      "50 DAYS. FIFTY. THAT'S NOT AN ACCIDENT. THAT'S WHO YOU ARE.",
      "FIFTY-DAY STREAK. CAP DOESN'T HAVE MANY WORDS. JUST: LET'S KEEP GOING.",
      "50 STRAIGHT. YOU'VE OUTWORKED ALMOST EVERYONE. DON'T STOP.",
    ],
  },
  100: {
    direct: [
      "100 days. Done.",
      "100-day streak. That's a career.",
      "One hundred days in the program.",
    ],
    mentor: [
      "One hundred days. Cap has coached a lot of players. This kind of commitment is rare.",
      "100 days. You didn't just build a habit — you built a system. This is who you are now.",
      "A hundred reps of showing up. The mental game is no longer something you work on. It's something you have.",
    ],
    firedUp: [
      "100 DAYS. ONE HUNDRED. CAP IS AT A LOSS FOR WORDS. THIS IS LEGENDARY.",
      "A HUNDRED STRAIGHT. YOU'VE EARNED EVERYTHING. NOW GO WIN SOMETHING.",
      "100-DAY STREAK. BUILT DIFFERENT DOESN'T EVEN COVER IT. LET'S GO.",
    ],
  },
};

// Streak at risk (user hasn't opened app all day — push notification)
export const STREAK_AT_RISK: MicrocopyPool = {
  direct: [
    "Your streak is at risk. One rep.",
    "Don't break it. One rep left today.",
    "Streak on the line. Cap's waiting.",
    "Last chance today. One rep.",
  ],
  mentor: [
    "Your streak is in danger. Cap knows one rep is all it takes.",
    "Don't let today be the day. One rep keeps it alive.",
    "The program doesn't ask for much. Just one rep today.",
    "Your streak means something. Don't give it up today.",
  ],
  firedUp: [
    "YOUR STREAK IS AT RISK. GET IN HERE. ONE REP.",
    "DON'T BREAK IT NOW. CAP IS WAITING. LET'S GO.",
    "ONE REP. THAT'S ALL. DON'T LOSE YOUR STREAK TODAY.",
    "CLOCK IS TICKING. ONE REP. DO IT.",
  ],
};

// ─────────────────────────────────────────────
// SECTION 8 — PUSH NOTIFICATIONS
// Context-aware by trigger type
// ─────────────────────────────────────────────

export const PUSH_NOTIFICATIONS = {
  // Daily habit reminder (mid-morning if no session yet)
  dailyReminder: {
    direct: [
      "Your next rep is waiting.",
      "Cap's got today's lesson ready.",
      "One rep. That's it.",
      "Today's session is ready.",
      "Your rep is here.",
    ],
    mentor: [
      "Cap has your next rep loaded. Come get it.",
      "Today's rep is waiting. The program works when you do.",
      "Don't leave today's work on the table.",
      "One rep closer. Cap's here.",
      "Your daily rep. It's ready when you are.",
    ],
    firedUp: [
      "YOUR REP IS WAITING. LET'S GO.",
      "CAP HAS YOUR NEXT LESSON READY. GET IN HERE.",
      "DON'T SKIP TODAY. ONE REP. LET'S WORK.",
      "THE PROGRAM IS LOADED. ARE YOU READY?",
      "TODAY'S REP. DO IT NOW.",
    ],
  },

  // Game day morning
  gameDayMorning: {
    direct: [
      "Game day. Let's prep.",
      "It's game day. Cap's ready.",
      "Game day session is waiting.",
      "Today's the game. You know what to do.",
    ],
    mentor: [
      "Game day. Cap has a pregame session ready for you.",
      "It's game day. Let's get you locked in before first pitch.",
      "Game day — this is what the reps were building toward.",
      "Your game is today. One session to get your mind right.",
    ],
    firedUp: [
      "GAME DAY. CAP IS FIRED UP. LET'S GET YOU LOCKED IN.",
      "IT'S GAME DAY. GET IN HERE. PREGAME REP. NOW.",
      "TODAY IS THE DAY. CLUTCHR HAS YOU READY. LET'S GO.",
      "GAME DAY AND CAP IS WAITING. LET'S WORK.",
    ],
  },

  // Post-game check-in
  postgameCheckIn: {
    direct: [
      "Game done. Debrief?",
      "How'd it go? Win/Fix/Carry.",
      "Post-game check-in. 2 minutes.",
      "Game's over. Log it.",
    ],
    mentor: [
      "Game over. Cap wants to know how it went. 2 minutes.",
      "Debrief time. What's one thing you carry forward?",
      "Win or loss — the debrief is where you get better. 2 minutes.",
      "Game done. Let's turn it into tomorrow's rep.",
    ],
    firedUp: [
      "GAME DONE. CAP WANTS THE DEBRIEF. LET'S GO.",
      "HOW'D IT GO? LOG IT. WIN/FIX/CARRY. NOW.",
      "POST-GAME REP. DON'T SKIP THIS ONE.",
      "GAME'S OVER. WHAT DO YOU CARRY? LOG IT.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 9 — EMPTY STATES
// Shown when sections have no content yet
// ─────────────────────────────────────────────

export const EMPTY_STATES = {
  noSavedCues: {
    direct: [
      "No cues saved yet. Finish a rep and lock one in.",
      "Your Playbook is empty. Complete a lesson to add a cue.",
      "No cues here yet. Start a rep.",
    ],
    mentor: [
      "Your Playbook is waiting. Finish a lesson and save a cue that resonates.",
      "No saved cues yet. Cap wants you to build this out — finish a rep and lock something in.",
      "The Playbook fills as you work. Finish a rep to save your first cue.",
    ],
    firedUp: [
      "PLAYBOOK IS EMPTY. FIX THAT. FINISH A REP AND ADD A CUE.",
      "NO CUES YET. GET TO WORK. FIRST REP IS WAITING.",
      "YOUR PLAYBOOK IS BARE. CAP WANTS IT FILLED. GO DO A REP.",
    ],
  },

  noPostgameHistory: {
    direct: [
      "No game history yet. Log your first game.",
      "Post-game debrief is empty. Use it after your next game.",
      "Nothing logged yet. After your next game, debrief here.",
    ],
    mentor: [
      "No game history yet. Cap wants you to start logging. The debrief is where the growth lives.",
      "Empty here. After your next game — win or loss — come log the debrief.",
      "Your game history starts with your next game. Cap will be here after.",
    ],
    firedUp: [
      "NO GAME HISTORY. GO PLAY. THEN LOG IT HERE.",
      "EMPTY. AFTER YOUR NEXT GAME, CAP WANTS THE DEBRIEF. DON'T SKIP IT.",
      "NO HISTORY YET. PLAY YOUR GAME. COME BACK. LOG IT.",
    ],
  },

  worldLocked: {
    direct: [
      "Locked. Complete earlier worlds to unlock.",
      "Not yet. Keep working through your path.",
      "Locked. Finish what's before this.",
    ],
    mentor: [
      "This world unlocks when you're ready. Keep building through your current path.",
      "Locked for now. The program sequences for a reason — keep going.",
      "Cap wants you to earn this one. Finish your current world first.",
    ],
    firedUp: [
      "LOCKED. EARN IT. FINISH YOUR CURRENT WORLD.",
      "NOT YET. CAP SAYS FINISH WHAT'S IN FRONT OF YOU FIRST.",
      "THIS ONE IS LOCKED. WORK YOUR WAY HERE. LET'S GO.",
    ],
  },

  noLessonsInWorld: {
    direct: [
      "Content coming soon.",
      "Cap's building this world. Check back.",
      "Coming soon.",
    ],
    mentor: [
      "Cap's still building this world. Content is coming — check back soon.",
      "This world is under construction. Good things take reps.",
      "Not ready yet. Cap's writing this one. Check back soon.",
    ],
    firedUp: [
      "CAP IS BUILDING THIS. COME BACK SOON. IT'S GOING TO BE WORTH IT.",
      "COMING SOON. CAP IS WORKING. SO SHOULD YOU — GO DO ANOTHER WORLD.",
      "UNDER CONSTRUCTION. CHECK BACK. CAP DOESN'T MISS.",
    ],
  },
};

// ─────────────────────────────────────────────
// SECTION 10 — TOAST / CONFIRMATION MESSAGES
// Short, snappy, baseball-native
// ─────────────────────────────────────────────

export const TOASTS = {
  cueSaved: {
    direct: ["Cue saved.", "Locked into Playbook.", "Cue added."],
    mentor: ["Cue saved to your Playbook.", "Locked in. That one's yours.", "Added to your Playbook."],
    firedUp: ["CUE SAVED. USE IT.", "LOCKED. PLAYBOOK UPDATED.", "THAT CUE IS IN YOUR ARSENAL."],
  },
  routineSaved: {
    direct: ["Routine saved.", "Locked.", "Routine stored."],
    mentor: ["Routine saved. Cap wants you to use it.", "Locked in your Playbook.", "Routine stored. Build the habit."],
    firedUp: ["ROUTINE SAVED. NOW USE IT EVERY TIME.", "LOCKED. THAT ROUTINE IS YOURS. GO.", "STORED. ROUTINE IS READY."],
  },
  postgameSaved: {
    direct: ["Logged. See you next game.", "Debrief saved.", "Logged."],
    mentor: ["Debrief saved. That's how you get better — game by game.", "Logged. Cap will use that tomorrow.", "Postgame locked. See you next time."],
    firedUp: ["DEBRIEF LOGGED. THAT'S THE WORK. SEE YOU NEXT GAME.", "SAVED. TURN THAT GAME INTO TOMORROW'S REP.", "LOGGED. CAP SEES THE PROGRESS. KEEP GOING."],
  },
  settingsSaved: {
    direct: ["Saved.", "Settings updated.", "Done."],
    mentor: ["Settings saved.", "Updated. Cap adjusts accordingly.", "Got it. Settings saved."],
    firedUp: ["SAVED. CAP ADJUSTS. LET'S GO.", "SETTINGS LOCKED. LET'S WORK.", "UPDATED. BACK TO REPS."],
  },
  xpEarned: (amount: number) => ({
    // These use a function since the amount varies
    direct: [`+${amount} XP`, `+${amount} XP locked.`, `${amount} XP earned.`],
    mentor: [`+${amount} XP earned. Keep building.`, `${amount} XP added to your career.`, `+${amount} XP. Every rep counts.`],
    firedUp: [`+${amount} XP. LET'S GO.`, `${amount} XP LOCKED. KEEP WORKING.`, `+${amount} XP. STACK IT UP.`],
  }),
};

// ─────────────────────────────────────────────
// SECTION 11 — BADGE / LEVEL UP MODALS
// ─────────────────────────────────────────────

export const BADGE_EARNED: MicrocopyPool = {
  direct: [
    "Badge earned. That's real.",
    "New badge. You put in the work.",
    "Earned. Not given.",
    "Badge unlocked. Good work.",
  ],
  mentor: [
    "New badge earned. That one took real reps.",
    "Earned, not given. That's what Cap always says.",
    "A new badge. This is what showing up looks like.",
    "You earned that. Cap's keeping track.",
  ],
  firedUp: [
    "NEW BADGE. EARNED. NOT GIVEN. LET'S GO.",
    "BADGE UNLOCKED. THAT'S WHAT THE WORK GETS YOU.",
    "EARNED IT. CAP IS FIRED UP. KEEP GOING.",
    "BADGE LOCKED IN. THAT'S YOURS. NOW EARN THE NEXT ONE.",
  ],
};

export const LEVEL_UP: MicrocopyPool = {
  direct: [
    "Level up. Keep building.",
    "New level. Good.",
    "Leveled up. What's next.",
    "Level up. The reps are adding up.",
  ],
  mentor: [
    "Level up. The reps are compounding, whether you feel it or not.",
    "New level reached. Cap's watching the progress.",
    "Leveled up. That's not an accident — that's the program.",
    "New level. The work is showing.",
  ],
  firedUp: [
    "LEVEL UP. THE PROGRAM IS WORKING. LET'S GO.",
    "NEW LEVEL. KEEP BUILDING. DON'T SLOW DOWN.",
    "LEVELED UP. THAT'S THE EDGE BUILDING. MORE.",
    "LEVEL UP. CAP IS FIRED UP. WHAT'S NEXT.",
  ],
};

// ─────────────────────────────────────────────
// SECTION 12 — ONBOARDING COPY
// Full screen-by-screen script
// ─────────────────────────────────────────────

export const ONBOARDING_COPY = {
  welcome: {
    headline: "Your Next Rep Is Waiting.",
    subhead: "Clutchr Baseball is the mental performance system built for how baseball actually works.",
    cta: "Let's Build Your Path",
  },

  roleSelect: {
    headline: "What's Your Game?",
    subhead: "Your career path is built around your position.",
    cta: "That's My Role",
    roles: {
      pitcher: { label: "Pitcher", tagline: "Command the mound." },
      catcher: { label: "Catcher", tagline: "Run the game." },
      hitter: { label: "Hitter", tagline: "Win the at-bat." },
      infielder: { label: "Infielder", tagline: "Know the situation." },
      outfielder: { label: "Outfielder", tagline: "Read and react." },
      baserunner: { label: "Baserunner", tagline: "Turn speed into runs." },
    },
  },

  seasonPhase: {
    headline: "Where Are You in Your Season?",
    subhead: "Your rep cadence adjusts based on where you are in the year.",
    cta: "That's My Season",
    phases: {
      preseason: { label: "Preseason", tagline: "Building toward Opening Day." },
      inSeason: { label: "In Season", tagline: "Game days matter most." },
      postseason: { label: "Postseason", tagline: "Every game is the season." },
      offseason: { label: "Offseason", tagline: "Building for what's coming." },
    },
  },

  voiceSelect: {
    // Pulled from ONBOARDING_VOICE_SELECTION above — reference it here
    headline: "How Should Cap Talk to You?",
    subhead: "Pick the coaching voice that fits how you work best. You can change it anytime.",
    cta: "That's My Cap",
  },

  firstCue: {
    headline: "One More Thing.",
    subhead: "Give Cap one cue you already use — a word or phrase that locks you in. This goes straight into your Playbook.",
    placeholder: "e.g. ATTACK / SEE IT / NEXT PITCH / STAY CLOSED",
    skipLabel: "Skip for now — I'll add cues as I go",
    cta: "Lock It In",
  },

  allSet: {
    headline: "You're Set Up.",
    subhead: "Cap has your first rep ready.",
    ctaMain: "Start Your First Rep",
    ctaSub: "Explore your career path first",
  },
};

// ─────────────────────────────────────────────
// IMPLEMENTATION: useMicrocopy HOOK SPEC
// For Claude Code — paste this spec with the hook prompt
// ─────────────────────────────────────────────

/*
BUILD THIS HOOK: hooks/useMicrocopy.ts

The hook should:

1. Read `capVoice: CapVoice` from AthleteContext
2. Read `primaryCue: string | null` from athlete's Playbook (first saved cue)
3. Accept: (pool: MicrocopyPool | CueMicrocopyPool, options?: { injectCue?: boolean }) => string
4. For CueMicrocopyPool:
   - If injectCue === true AND primaryCue exists → use withCue pool, replace {CUE} with primaryCue
   - Otherwise → use noCue pool
5. Anti-repetition: keep last 3 shown per pool in AsyncStorage key 'microcopy_seen_{poolKey}'
   - Randomly pick from pool, excluding recently seen
   - Once all lines seen, reset and shuffle
6. Export specific helpers:
   - useStepFeedback(correct: boolean) → string
   - useLessonComplete() → string  (auto-injects cue)
   - useWorldComplete() → string   (auto-injects cue)
   - useBossComplete() → string    (auto-injects cue)
   - useStreak(days: number) → string
   - useHomeGreeting(context: { isGameDay: boolean, isReturn: boolean }) → string
   - useToast(category: keyof typeof TOASTS) → string
   - useEmptyState(category: keyof typeof EMPTY_STATES) → string

EXAMPLE USAGE in a component:
  const { useLessonComplete } = useMicrocopy();
  const completionLine = useLessonComplete(); 
  // Returns: "Rep locked. Carry ATTACK into the next one." (if athlete's cue is "ATTACK")
  // Returns: "Good rep. Save a cue." (if no cue saved yet)
*/
