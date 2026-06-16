Clutchr Visual Learning Product Rules

Snapshot Read+ Film Room Operating System

1. Executive Decision

 Snapshot Read and Film Room are not extra content formats. They are visual learning layers inside the Clutchr Baseball career-path operating system. Their job is to turn one baseball moment into one useful read, decision, and Coach Cap breakdown. They should never become video trivia, passive highlight watching, or generic motivation.

.$$\text{ Snapshot Read}=\text{ still image/ freeze-frame analysis. It teaches what to notice right now.}$$

Film Room= video analysis. It teaches how a real game moment unfolds and why the athlete response mattered.

.Both can be standalone lessons, steps inside larger lessons, checkpoints, boss support, or Resources companions.

●Target content mix after rollout: 40% text, 35% visual/image, 25% interactive.

●Film Room does not save cues by default. It ends with analysis and a sharp takeaway.

2. Product Definitions



| Field | Rule/ Value |
| --- | --- |
| Snapshot Read | A still-image/freeze-frame rep. The athlete studies one paused baseball moment, selects the most important cue, receives Coach Cap feedback, and learns the read. |
| Film Room | A video-analysis rep. The athlete watches a short or curated clip, answers one interpretation/decision question, receives Coach Cap breakdown, and exits with one takeaway. |
| Coach's Eye | Optional umbrella label for visual analysis content across Resources, Film Room, and Snapshot Read. |
| Do not call it | Quiz,module, video lesson, course, worksheet,trivia, motivation clip. |


3. Difference Between Snapshot Read and Film Room



| Layer | Best Question | Best Media | Best Skill | Avoid |
| --- | --- | --- | --- | --- |
| Snapshot Read | What do you see first? What is the cue? What is the right read? | Custom image, diagram, owned photo, Al scene, genericized freeze-frame | Observation speed, baseball IQ, body- language read, mechanical cue recognition | Long explanations; generic stock photos; missing image; no answer feedback |
| Film Room | Why did this moment work? What decision mattered? What did the athlete control? | Official MLB/NCAA video, YouTube/archive link, short embedded clip with fallback | Context, sequencing, pressure interpretation, decision quality | Passive highlight watching; history trivia; saving/applying cues by default |


4. Placement Rules



| Use Case | Snapshot Read | Film Room | Rule |
| --- | --- | --- | --- |
| Standalone lesson | Yes- one frozen moment plus breakdown. | Yes- one clip plus breakdown. | Use when the visual itself carries the whole lesson objective. |
| Step inside larger lesson | Yes- especially mechanics, reads, scouting, body language. | Yes- but keep clip under 90 seconds. | Use when visual supports a broader 3-6 step lesson. |
| Checkpoint | Yes- test one cue or decision. | Yes- test interpretation of a famous moment. | Keep one question; do not stack multiple videos. |
| Boss support | Yes- freeze the critical decision before a boss beat. | Yes- show real-world analog before/after boss. | Never make boss dependent on external video working. |
| Resources companion | Yes- visual bank or cue card. | Yes-Film Room archive/card. | Resources can hold context, but Career lesson must remain playable. |


5. Clip and Image Rules

Film Room clip length

.Short step inside lesson: 20-90 seconds. Ideal= 30-60 seconds.

.$$\text{ Standalone Film Room lesson: 90 seconds-5 minutes. Ideal= 2-3 minutes.}$$

.Maximum: 10 minutes only when the whole lesson is designed around a full breakdown and the clip has strong teaching value.

.Always store start_sec and end_sec, even if start is 0. Future proof every asset for clipping.

.Always store canonical_url, fallback_url, backup_urls, reliability_rating, provider, and embed_status.

.Never make progress impossible if the video fails. Provide Open Video fallback and text summary fallback.

Snapshot Read image rules

.Aspect ratio: 4:5 preferred for mobile lesson cards. 16:9 acceptable for field maps only when needed.

.Minimum visual clarity: one main subject, one baseball cue, no crowded background, no readable brand/logos unless owned/licensed.

.Annotations: use restraint. One or two arrows/lines max. Green accent for active cue, gray for context.

.Text overlay: avoid readable text baked into the image. Put questions in UI, not the asset.

.Use diagrams when teaching mechanics, strike zone, runner paths, set height, release overlays, or coverage geometry.

.Use realistic scenes when teaching posture, pressure, body language, dugout energy, mound presence, or role communication.

6. Snapshot Read Data Contract

Current MVP content should be compatible with the existing cue-quality grading model and the future normalized responses model. Every cue must include quality: correct, acceptable, or poor.



"question":"What matters first here?",

"image_ generation prompt":"Create a realistic 4:5 baseball freeze frame, right-handed pitcher at foot strike, ball just beginning to appear from behind body, premium dark stadium lighting, no logos, no readable text, hitter-eye perspective."

\},"responses":{"correct_id":"first_light","acceptable_ids":["closed_ shoulder"\},"feedback":{"acceptable":"Good read. Tigh rso..","wrong":"That is noise. Recheck}

Required Snapshot Read fields

step.ui_variant= snapshot_read

 data.prompt- short setup line, even if current component needs patch to display it.

data.situation-inning/count/outs/runners/score/role lens.

data.cue_description- the exact baseball cue being tested.

data.cues[]- answer options with id, label, description, quality.

data.question- one main question only.

responses.correct_id and acceptable_ids- included for validator/future patch.

feedback.correct, feedback.acceptable, feedback.wrong- short, role-aware coaching feedback.

Snapshot Read fallback behavior

● If image_uri missing but diagram_mode is valid: render diagram placeholder and keep step playable.

● If image_uri missing and no diagram_mode: render safe fallback card: This rep needs an image. Continue with text read.

●If cues missing: do not render blank. Show unsupported-content card and allow safe skip without awarding mastery.

● If question missing: use data.prompt as question; if both missing, show safe malformed-step fallback.

● If cue quality missing: validator fails import; runtime treats as poor and logs developer warning.

7. Film Room Data Contract

"type":"decision","ui_variant":"film_room","data":{"provider":"external_video","youtube_id": null,"canonical_url":"https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883","fallback_url":"https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883","backup_urls":["https://www.mlb.com/video/must-c-gibson-s-1988-ws-homer-c1864676883"],"start_sec": 0,"end_sec": 69,"reliability_rating":"A","event":"World Series Game 1- Dodgers- Dodgers vs Athletics","year": 1988,"athletes":"Kirk Gibson","setup":"Watch for the baseball behavior before the highlight result.","question":"Why does this at-bat still look mechanically quiet under max pressure?","choices":[{"id":"best_read","label":"He hunted a pitch he handle let pain or crowd volume sp"quality":"correct"

\}, $\{$ "id":"wrong_1","label":"He sold out because the moment was huge.","quality":"poor"},{"id":"wrong_2","label":"Big moments need a harder swing.","quality":"poor"],"coach_breakdown":"Pressure did not create the swing. It exposed a prepared swing.""takeaway":"Big moments still want your normal move."},"responses":{"correct_id":"best_read","acceptable_ids":[]},"feedback":{"correct":"Pressure did not create the swing. It exposed a prepared swing.","wrong":"Rewatch the clip. The highlight is not the lesson; the decision before is."

Required Film Room fields

●step.ui_variant= film_room- new engineering required before import.

●data.provider-youtube,external_video, mlb, ncaa, vimeo, or hosted.

●data.youtube_id optional, because many official assets are MLB/NCAA links, not YouTube.

●data.canonical_url, fallback_url, backup_urls.

●data.start_sec, end_sec, reliability_rating.

●data.setup, question, choices, coach_breakdown, takeaway.

●responses.correct_id and feedback.correct/wrong.

●asset_rights_note at lesson row level for audit.

Film Room fallback behavior

●If embedded playback works: athlete watches in-app.

●● If embed blocked: show Open Video CTA and keep lesson playable after return.

●● If link fails: show backup_urls selector and text setup summary.

●If all video sources fail: render safe Film Room unavailable card with the question and Coach Cap breakdown disabled or marked as review-only.

●Never block completion solely because an external video failed.

8. Existing Snapshot Read Audit Checklist

●Find every step where ui_variant= snapshot_read.

●Confirm data.image_uri or data.diagram_mode exists.

●Confirm data.question exists and is baseball-specific.

●Confirm data.situation includes base/count/out/role context where relevant.

●Confirm data.cues has 3-4 options with quality values.

●Confirm responses.correct_id matches a cue id.

.Confirm acceptable_ids match cue ids.

.Confirm feedback has correct/acceptable/wrong text.

.Confirm role_tags and skill_tags fit the world.

●Confirm no classroom words: quiz, submit, module, objective.

●Confirm no generic prompt: What do you notice? unless followed by a specific cue lens.

.Flag rows where image exists but question/answers are missing. Those are broken playable reps.

9. World Integration Map



| World | Best Use | Example | Question Style | Best Media | Difficulty |
| --- | --- | --- | --- | --- | --- |
| Foundation | Bad-call reset, body language, routine reads | Bad-call box reset | What should the athlete control next? | Snapshot | rookie-builder |
| Pressure& Resilience | Postseason moments, late-inning posture | Freeman grand slam / bad-call reset | What stayed normal under pressure? | Film+ Snapshot | builder-performer |
| Baseball IQ | Pitcher/catcher/runner reads | Spin vs heater out of hand | What clue changes the decision? | Snapshot | builder-competitor |
| Hitter Path | Release, damage zone, count leverage | 2-0 Hunt Lane | What pitch is yours? | Snapshot+ Film | rookie-performer |
| Pitcher Path | Command, set height, tempo, runner control | Set Height Consistency | What are you showing hitters? | Snapshot | builder-performer |
| Catcher Path | Setup disguise, mound visit, receiving target | Block Ready Without Tipping | What does your body reveal? | Snapshot+ Film | builder-performer |
| Infield Path | PPP, slow roller, priority plays | Slow Roller Clock | Where is the priority throw? | Snapshot | rookie-competitor |
| Outfield Path | First step, no- backpedal, cutoffs | Depth First | What is the first move? | Snapshot+ Film | builder-competitor |
| Baserunner Path | Lead, first move, dirt- ball, tag-up | First Move Read | Go, hold, or dive? | Snapshot+ Film | builder-performer |
| Opponent Intel | Tells, scouting patterns, dugout info | Second-Ear Hitting | How much can you trust this clue? | Snapshot+ Film | competitor-performer |
| Coach's Eye | Premium visual analysis library | Inside Alonso Biggest AB | What did the pro filter out? | Film | competitor-performer |
| Team Chaos | Dugout, communication, final out, chaos plays | Stay in the Clip | Who kept playing after chaos? | Film+ Snapshot | builder-performer |
| Readiness/Recovery | Arm health, throw readiness, pain flags | Front-Side Stability | What should stay smooth? | Snapshot | rookie-builder |


10. QA Rules

●One moment per screen. One main question. One primary cue.

Do not place Film Room directly after Film Room unless it is a standalone Film Room collection.

●No more than 1 Film Room per 8-10 lessons in normal Career flow at MVP.

.No more than 1 Snapshot Read every 3-4 lessons in one world until the component is proven stable.

.Alternate visual, text, and interaction families: spark/scenario-> visual-> feedback/reflection-> interactive.

.Every feedback line must name the baseball behavior, not just say correct/wrong.

Every media asset must have rights note and fallback plan.

.Every external video must have reliability rating A/B/C and replacement notes.

●Every Snapshot Read must remain playable without image via diagram or fallback card.

11.MVP Checklist

1. Patch Snapshot Read rendering and fallback behavior.

2. Add Film Room component behind feature flag.

3. Add validator for snapshot_read and film_room steps.

4. Repair existing broken snapshot_read rows before adding new content.

5.Import 10 internal QA lessons only.

6. Test video playback and fallback across iOS/Android/Expo.

7. Import MVP 25 Snapshot Reads+ 25 Film Room assets only after QA passes.

8. Use Batch 6 as a controlled rollout, not a full visual-content dump.
