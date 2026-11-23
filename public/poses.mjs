export const modes = Object.freeze({ solo: 'Solo', duo: 'Duo', group: 'Group' });

export const poses = Object.freeze([
  { id: 'three-idiots', mode: 'group', name: 'The 3 Idiots', tip: 'Squeeze in shoulder to shoulder. One person thinks hard; the others make their biggest surprised faces.' },
  { id: 'office-handshake', mode: 'duo', name: 'The Office Handshake', tip: 'Shake hands like it’s a huge business deal. Both look straight at the camera and try not to laugh.' },
  { id: 'success-kid', mode: 'solo', name: 'Success Kid', tip: 'Clench a little fist by your chest, press your lips together, and look like you just got away with a tiny win.' },
  { id: 'charlies-angels', mode: 'group', name: 'Charlie’s Angels', tip: 'Stand back to back. Make finger hearts or dramatic pointing hands and look in different directions.' },
  { id: 'smile-and-wave', mode: 'group', name: 'Just Smile and Wave', tip: 'Line up like the Madagascar penguins: one tall in the middle, the others huddle close, and everyone gives a little wave.' },
  { id: 'math-lady', mode: 'solo', name: 'Confused Math Lady', tip: 'Look up and to the side, furrow your brow, and put a hand near your chin like you’re doing impossible maths.' },
  { id: 'cheek-squish', mode: 'duo', name: 'The Cheek Squish', tip: 'Gently cup your own or each other’s cheeks, lean your heads close, and make your best pout.' },
  { id: 'side-eye', mode: 'solo', name: 'Disaster Girl Smirk', tip: 'Turn away, then look back over your shoulder with the tiniest mischievous smile.' },
  { id: 'wide-angle-trio', mode: 'group', name: 'The Wide-Angle Trio', tip: 'Put the phone below eye level. Lean in from three sides and grin like the camera is a very old friend.' },
  { id: 'facepalm', mode: 'solo', name: 'The Facepalm', tip: 'Cover part of your forehead with one palm, tilt your head down, and act like the joke just went very wrong.' },
  { id: 'main-character', mode: 'duo', name: 'Main Character Energy', tip: 'One person angles away with folded arms. The other looks up at them like they just walked into the wrong scene.' },
  { id: 'wait-what', mode: 'group', name: 'Wait, What?!', tip: 'Two people turn in and gesture at the person in the middle. The middle person reacts like they heard the wildest news.' },
  { id: 'heart-squad', mode: 'group', name: 'Heart Squad', tip: 'Stand in a row and make big hearts above your heads. If you want, bend one knee for a little extra drama.' },
  { id: 'proud-and-peace', mode: 'duo', name: 'Proud & Peace', tip: 'One person crosses their arms and smiles. The other leans into the frame with a peace sign.' },
  { id: 'forest-duo', mode: 'duo', name: 'Forest Duo', tip: 'One person dips down with a hand by their chin. The other stands tall with one hand on their hip.' },
  { id: 'big-gasp', mode: 'duo', name: 'The Big Gasp', tip: 'One person looks up and away. The other leans in from behind and gives the biggest open-mouthed gasp.' },
  { id: 'arm-in-arm', mode: 'duo', name: 'Arm in Arm', tip: 'Stand side by side with an arm around each other. Look at the camera like you’re on an album cover.' },
  { id: 'peace-and-panic', mode: 'duo', name: 'Peace & Panic', tip: 'One person grins with a peace sign; the other grabs their own hair like everything just went off script.' },
  { id: 'cool-and-chaos', mode: 'duo', name: 'Cool & Chaos', tip: 'One person stays serious and holds up a peace sign. The other leans in close like they have a ridiculous secret.' },
  { id: 'grin-and-pout', mode: 'duo', name: 'Grin vs. Pout', tip: 'Lean your shoulders together. One person gives their biggest smile while the other gives their biggest pout.' },
  { id: 'flying-dab', mode: 'duo', name: 'The Flying Dab', tip: 'Stand apart and mirror each other’s diagonal arms. Keep one or both feet planted; the angle sells it.' },
  { id: 'double-claws', mode: 'duo', name: 'Double Claws', tip: 'One person sits, one stands behind. Both curl their fingers into silly claws and pull matching faces.' },
  { id: 'stacked-selfie', mode: 'group', name: 'The Stacked Selfie', tip: 'Fit your faces in a diagonal line, lean together, and frame the shot with your arms.' },
  { id: 'phone-face-swap', mode: 'solo', name: 'Phone Face Swap', tip: 'Pull up a cartoon face on a phone and hold it right over your own face. Keep your hair and outfit in frame so the swap looks seamless.' },
  { id: 'monkey-heart', mode: 'duo', name: 'Monkey Business Heart', tip: 'One person makes a hand heart at their chest with a cheeky grin. The other leans in and hides their face behind one hand.' },
  { id: 'peekaboo-hands', mode: 'duo', name: 'Peekaboo Hands', tip: 'Press your cheeks together and cover your nose and mouth with both hands. Only your wide, startled eyes should show.' },
  { id: 'leg-pop-hug', mode: 'duo', name: 'The Leg-Pop Hug', tip: 'One person hugs the other from behind. The person in front kicks one leg up and pulls a big surprised face.' },
  { id: 'finger-gun-face-off', mode: 'duo', name: 'Finger-Gun Face-Off', tip: 'Sunglasses on. One person points both arms straight at their partner, who throws their hands up like they just got caught.' },
  { id: 'runway-pair', mode: 'duo', name: 'Runway Pair', tip: 'Stand close. One person rests a hand on their hip, the other touches the top of their head. Serious model faces only.' },
  { id: 'finger-heart-frame', mode: 'duo', name: 'Heart Frame Close-Up', tip: 'Get a friend to make a big hand heart close to the lens. Squeeze both faces inside it: one blows a kiss, one smiles.' },
  { id: 'drama-faint', mode: 'duo', name: 'The Drama Faint', tip: 'Both lean way back with the back of a hand on your forehead, like the news was simply too much to bear.' },
  { id: 'chin-cradle-pout', mode: 'duo', name: 'Chin Cradle & Pout', tip: 'Lean your heads together and rest your chins in your hands. One person flashes a big smile; the other blows a kiss.' },
  { id: 'head-stack', mode: 'group', name: 'The Head Stack', tip: 'Stack up in rows. The back row rests their hands on the heads in front; the front row cups their faces and grins.' },
  { id: 'take-off-line', mode: 'group', name: 'Ready for Take-Off', tip: 'Line up on a diagonal, stretch your arms out like aeroplane wings, and kick one leg back. Everyone leans the same way.' },
  { id: 'big-heart-arch', mode: 'group', name: 'The Big Heart Arch', tip: 'The two people on the ends join their arms overhead to form a giant heart. Everyone in the middle frames their face with their hands.' },
  { id: 'lean-in-crew', mode: 'group', name: 'Lean-In Crew', tip: 'Huddle close and all lean toward the camera with soft smiles. One person steps forward in the middle to anchor the shot.' },
  { id: 'boss-squad', mode: 'group', name: 'Boss Squad', tip: 'The leader stands in front with arms crossed and sunglasses on. The rest of the crew peeks out from behind, looking just as serious.' },
]);

export const poseById = new Map(poses.map(pose => [pose.id, pose]));

export function referenceImage(id, width = 760) {
  return `/.netlify/images?url=${encodeURIComponent(`/img/${id}.jpg`)}&w=${width}&fm=webp`;
}
