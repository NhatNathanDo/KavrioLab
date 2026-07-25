import 'dotenv/config';
import { PrismaClient, ExerciseCategory, MuscleGroup, Equipment } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const exercises = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press', slug: 'barbell-bench-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BARBELL, instructions: 'Lie flat on a bench. Grip bar slightly wider than shoulder-width. Lower bar to mid-chest, then press up to lockout.' },
  { name: 'Incline Barbell Bench Press', slug: 'incline-barbell-bench-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BARBELL, instructions: 'Set bench to 30-45°. Lower to upper chest, press up.' },
  { name: 'Decline Barbell Bench Press', slug: 'decline-barbell-bench-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BARBELL, instructions: 'Set decline bench to -15°. Lower bar to lower chest, press up.' },
  { name: 'Dumbbell Bench Press', slug: 'dumbbell-bench-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Lie on bench with dumbbells at chest level. Press up and together at top.' },
  { name: 'Incline Dumbbell Press', slug: 'incline-dumbbell-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Set bench to 30-45°. Press dumbbells from upper chest up.' },
  { name: 'Decline Dumbbell Press', slug: 'decline-dumbbell-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Lie on decline bench. Press dumbbells up and together.' },
  { name: 'Dumbbell Floor Press', slug: 'dumbbell-floor-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Lie on the floor. Lower dumbbells until triceps touch floor, press up.' },
  { name: 'Barbell Floor Press', slug: 'barbell-floor-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BARBELL, instructions: 'Lie on floor under barbell. Lower until triceps touch floor, press up.' },
  { name: 'Cable Fly', slug: 'cable-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.CABLE, instructions: 'Step forward, draw handles together in a wide arc, squeeze chest.' },
  { name: 'Incline Cable Fly', slug: 'incline-cable-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.CABLE, instructions: 'Set incline bench between low cables. Pull handles up and together over upper chest.' },
  { name: 'Decline Cable Fly', slug: 'decline-cable-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.CABLE, instructions: 'Set high cables. Pull handles down and together in front of hips.' },
  { name: 'Dumbbell Fly', slug: 'dumbbell-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Lie flat. Lower dumbbells out in wide arc with slight elbow bend. Return.' },
  { name: 'Incline Dumbbell Fly', slug: 'incline-dumbbell-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Set bench to 30°. Lower dumbbells out in wide arc, return over chest.' },
  { name: 'Pec Deck Fly', slug: 'pec-deck-fly', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.MACHINE, instructions: 'Sit on fly machine. Squeeze pads/handles together in front of chest.' },
  { name: 'Hammer Strength Chest Press', slug: 'hammer-strength-chest-press', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.MACHINE, instructions: 'Sit in machine. Press handles forward, keeping chest up.' },
  { name: 'Push-Up', slug: 'push-up', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Plank position, hands slightly wider than shoulders. Lower chest to floor, push back up.' },
  { name: 'Diamond Push-Up', slug: 'diamond-push-up', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Hands close together forming a diamond with index fingers and thumbs. Lower chest, push up.' },
  { name: 'Decline Push-Up', slug: 'decline-push-up', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Place feet on bench, hands on floor. Lower chest to floor, push up.' },
  { name: 'Wide Grip Push-Up', slug: 'wide-grip-push-up', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Set hands wider than shoulders. Lower chest, push up.' },
  { name: 'Archer Push-Up', slug: 'archer-push-up', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Wide push-up. Lower to one side, keeping the opposite arm straight. Alternate sides.' },
  { name: 'Chest Dip', slug: 'chest-dip', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Lean forward at about 30°. Lower until shoulders dip below elbows. Push up.' },
  { name: 'Weighted Chest Dip', slug: 'weighted-chest-dip', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.BODYWEIGHT, instructions: 'Attach weight belt. Lean forward at 30°, lower shoulders below elbows, push up.' },
  { name: 'Dumbbell Pullover', slug: 'dumbbell-pullover', category: ExerciseCategory.CHEST, primaryMuscle: MuscleGroup.CHEST, equipment: Equipment.DUMBBELL, instructions: 'Lie across bench. Lower dumbbell backward overhead, pull back over chest.' },

  // ── BACK ───────────────────────────────────────────────────────────────────
  { name: 'Barbell Deadlift', slug: 'barbell-deadlift', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BARBELL, instructions: 'Stand with bar over feet. Hinge, grip bar. Drive through floor, lock hips at top.' },
  { name: 'Sumo Deadlift', slug: 'sumo-deadlift', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BARBELL, instructions: 'Wide stance, toes flared. Grip bar inside knees. Keep back flat, stand up.' },
  { name: 'Barbell Rack Pull', slug: 'barbell-rack-pull', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LOWER_BACK, equipment: Equipment.BARBELL, instructions: 'Set bar on safety pins at knee height. Hinge, pull bar back to lock hips.' },
  { name: 'Barbell Row', slug: 'barbell-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.UPPER_BACK, equipment: Equipment.BARBELL, instructions: 'Hinge forward 45°. Pull bar to lower chest.' },
  { name: 'T-Bar Row', slug: 't-bar-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.UPPER_BACK, equipment: Equipment.MACHINE, instructions: 'Straddle bar, grip handles. Pull platform up to chest, keeping chest supported.' },
  { name: 'Meadows Row', slug: 'meadows-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BARBELL, instructions: 'Stand perpendicular to landmine bar. Row the sleeve end of the bar with one hand.' },
  { name: 'Pull-Up', slug: 'pull-up', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang from bar, pronated grip. Pull until chin clears bar.' },
  { name: 'Chin-Up', slug: 'chin-up', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Supinated grip. Pull until chin clears bar.' },
  { name: 'Weighted Pull-Up', slug: 'weighted-pull-up', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Attach weight belt. Hang pronated, pull chin clear of bar.' },
  { name: 'Neutral Grip Pull-Up', slug: 'neutral-grip-pull-up', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang from parallel bars. Pull chin clear of handles.' },
  { name: 'Archer Pull-Up', slug: 'archer-pull-up', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang wide. Pull body up to one hand, keeping the other arm straight. Alternate.' },
  { name: 'Lat Pulldown', slug: 'lat-pulldown', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.CABLE, instructions: 'Grip bar wide. Pull to upper chest while leaning back slightly.' },
  { name: 'Underhand Lat Pulldown', slug: 'underhand-lat-pulldown', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.CABLE, instructions: 'Underhand shoulder-width grip. Pull bar to chest, elbows tucked.' },
  { name: 'Single-Arm Lat Pulldown', slug: 'single-arm-lat-pulldown', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.CABLE, instructions: 'Kneel or sit. Pull single handle down to shoulder, squeezing lat.' },
  { name: 'Seated Cable Row', slug: 'seated-cable-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.UPPER_BACK, equipment: Equipment.CABLE, instructions: 'Sit upright. Pull handle to abdomen, squeeze shoulder blades.' },
  { name: 'Dumbbell Row', slug: 'dumbbell-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.DUMBBELL, instructions: 'Brace on bench. Pull dumbbell to hip, elbow close to body.' },
  { name: 'Dumbbell Renegade Row', slug: 'dumbbell-renegade-row', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.UPPER_BACK, equipment: Equipment.DUMBBELL, instructions: 'Plank holding dumbbells. Row one dumbbell to ribs, alternate.' },
  { name: 'Face Pull', slug: 'face-pull', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.TRAPS, equipment: Equipment.CABLE, instructions: 'Set cable high. Pull rope to face, elbows flared out.' },
  { name: 'Band Pull-Apart', slug: 'band-pull-apart', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.UPPER_BACK, equipment: Equipment.RESISTANCE_BAND, instructions: 'Pull band outward in front of chest until it touches chest.' },
  { name: 'Cable Lat Pullover', slug: 'cable-lat-pullover', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.CABLE, instructions: 'Pull high cable bar down to thighs using lats with locked arms.' },
  { name: 'Dumbbell Lat Pullover', slug: 'dumbbell-lat-pullover', category: ExerciseCategory.BACK, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.DUMBBELL, instructions: 'Lie on bench. Lower dumbbell backward overhead, pull up using lats.' },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  { name: 'Overhead Press', slug: 'overhead-press', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL, instructions: 'Stand with bar at collarbone. Press straight up to lockout.' },
  { name: 'Push Press', slug: 'push-press', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.BARBELL, instructions: 'Dip knees slightly, drive barbell up overhead using leg drive.' },
  { name: 'Dumbbell Shoulder Press', slug: 'dumbbell-shoulder-press', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Press dumbbells from ear level up to full extension.' },
  { name: 'Lateral Raise', slug: 'lateral-raise', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Raise dumbbells to shoulder height with slight elbow bend.' },
  { name: 'Seated Lateral Raise', slug: 'seated-lateral-raise', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Sit on bench. Raise dumbbells to shoulder height.' },
  { name: 'Incline Lateral Raise', slug: 'incline-lateral-raise', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Lie sideways on incline bench. Raise dumbbell upward.' },
  { name: 'Front Raise', slug: 'front-raise', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Raise dumbbells in front of thighs to shoulder height.' },
  { name: 'Arnold Press', slug: 'arnold-press', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Rotate dumbbells outward from chin as you press overhead.' },
  { name: 'Cable Lateral Raise', slug: 'cable-lateral-raise', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE, instructions: 'Low cable on one side. Raise arm to shoulder height.' },
  { name: 'Dumbbell Rear Delt Fly', slug: 'dumbbell-rear-delt-fly', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.DUMBBELL, instructions: 'Hinge forward. Raise dumbbells out to sides, leading with elbows.' },
  { name: 'Cable Rear Delt Fly', slug: 'cable-rear-delt-fly', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.CABLE, instructions: 'Cross cables. Pull handles backward out to sides.' },
  { name: 'Barbell Upright Row', slug: 'barbell-upright-row', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.TRAPS, equipment: Equipment.BARBELL, instructions: 'Pull bar vertically up to collarbone, elbows high.' },
  { name: 'Dumbbell Upright Row', slug: 'dumbbell-upright-row', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.TRAPS, equipment: Equipment.DUMBBELL, instructions: 'Pull dumbbells up along torso to upper chest.' },
  { name: 'Handstand Push-Up', slug: 'handstand-push-up', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.BODYWEIGHT, instructions: 'Handstand against wall. Lower head to floor, press up.' },
  { name: 'Handstand Hold', slug: 'handstand-hold', category: ExerciseCategory.SHOULDERS, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.BODYWEIGHT, instructions: 'Hold handstand position against wall for duration.' },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  { name: 'Barbell Curl', slug: 'barbell-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.BARBELL, instructions: 'Curl bar to chin, keeping elbows fixed. Lower.' },
  { name: 'Ez-Bar Bicep Curl', slug: 'ez-bar-bicep-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.BARBELL, instructions: 'Grip Ez-bar inner handles. Curl up to shoulders.' },
  { name: 'Dumbbell Curl', slug: 'dumbbell-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Curl dumbbells, supinate wrists at top.' },
  { name: 'Hammer Curl', slug: 'hammer-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Neutral grip. Curl dumbbells up without rotating wrists.' },
  { name: 'Incline Dumbbell Curl', slug: 'incline-dumbbell-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Sit on incline bench. Curl dumbbells up strictly.' },
  { name: 'Spider Curl', slug: 'spider-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Lie chest-down on incline bench. Curl dumbbells up.' },
  { name: 'Drag Curl', slug: 'drag-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.BARBELL, instructions: 'Pull bar up vertically along torso, elbows moving backward.' },
  { name: 'Zottman Curl', slug: 'zottman-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Curl up supinated, rotate palms down at top, lower pronated.' },
  { name: 'Cable Curl', slug: 'cable-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.CABLE, instructions: 'Curl low cable bar up maintaining constant tension.' },
  { name: 'Band Bicep Curl', slug: 'band-bicep-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.RESISTANCE_BAND, instructions: 'Curl resistance band handles up to shoulders.' },
  { name: 'Concentration Curl', slug: 'concentration-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.DUMBBELL, instructions: 'Sit on bench, elbow inside thigh. Curl dumbbell up.' },
  { name: 'Preacher Curl (Ez-Bar)', slug: 'preacher-curl-ez-bar', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.BARBELL, instructions: 'Curl Ez-Bar with arms resting on preacher pad.' },
  { name: 'Cable Rope Curl', slug: 'cable-rope-curl', category: ExerciseCategory.BICEPS, primaryMuscle: MuscleGroup.BICEPS, equipment: Equipment.CABLE, instructions: 'Hold rope attachment, neutral grip. Curl up.' },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  { name: 'Tricep Pushdown', slug: 'tricep-pushdown', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.CABLE, instructions: 'Push down cable rope or bar until arms fully extended.' },
  { name: 'Single-Arm Tricep Pushdown', slug: 'single-arm-tricep-pushdown', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.CABLE, instructions: 'Push single handle down with one arm, focus on tricep.' },
  { name: 'Skull Crusher', slug: 'skull-crusher', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.BARBELL, instructions: 'Lie on bench. Lower bar to forehead, extend up.' },
  { name: 'Overhead Tricep Extension', slug: 'overhead-tricep-extension', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.DUMBBELL, instructions: 'Hold dumbbell overhead, lower behind head, extend.' },
  { name: 'Lying Dumbbell Tricep Extension', slug: 'lying-dumbbell-tricep-extension', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.DUMBBELL, instructions: 'Lie flat. Lower dumbbells next to ears, extend up.' },
  { name: 'Tate Press', slug: 'tate-press', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.DUMBBELL, instructions: 'Lie flat. Flare elbows, lower dumbbells to center chest, press up.' },
  { name: 'Dips (Triceps)', slug: 'dips-triceps', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.BODYWEIGHT, instructions: 'Stay upright on bars. Lower to 90°, push up.' },
  { name: 'Bench Dip', slug: 'bench-dip', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.BODYWEIGHT, instructions: 'Hands on bench, feet forward. Lower hips, push up.' },
  { name: 'Close-Grip Bench Press', slug: 'close-grip-bench-press', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.BARBELL, instructions: 'Narrow grip. Lower bar to sternum, press up.' },
  { name: 'Close-Grip Push-Up', slug: 'close-grip-push-up', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.BODYWEIGHT, instructions: 'Set hands shoulder-width or closer. Lower chest, push up.' },
  { name: 'Cable Overhead Tricep Extension', slug: 'cable-overhead-tricep-extension', category: ExerciseCategory.TRICEPS, primaryMuscle: MuscleGroup.TRICEPS, equipment: Equipment.CABLE, instructions: 'Face away from cable, hold rope behind head, extend arms overhead.' },

  // ── LEGS ───────────────────────────────────────────────────────────────────
  { name: 'Barbell Back Squat', slug: 'barbell-back-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BARBELL, instructions: 'Bar on upper traps. Squat parallel, stand up.' },
  { name: 'Front Squat', slug: 'front-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BARBELL, instructions: 'Bar on front delts. Squat keeping elbows high.' },
  { name: 'Sumo Squat', slug: 'sumo-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Wide stance, hold dumbbell down. Squat low, stand.' },
  { name: 'Zercher Squat', slug: 'zercher-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BARBELL, instructions: 'Hold bar in elbows crook. Squat to depth, stand.' },
  { name: 'Romanian Deadlift', slug: 'romanian-deadlift', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.HAMSTRINGS, equipment: Equipment.BARBELL, instructions: 'Hinge hips back, lower bar along legs, drive hips forward.' },
  { name: 'Leg Press', slug: 'leg-press', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Push foot platform away, don\'t lock knees.' },
  { name: 'Single-Leg Press', slug: 'single-leg-press', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Perform leg press using one leg at a time.' },
  { name: 'Leg Extension', slug: 'leg-extension', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Extend legs to full extension on machine.' },
  { name: 'Single-Leg Extension', slug: 'single-leg-extension', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Extend one leg at a time on extension machine.' },
  { name: 'Leg Curl', slug: 'leg-curl', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE, instructions: 'Curl legs toward glutes on lying curl machine.' },
  { name: 'Single-Leg Curl', slug: 'single-leg-curl', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE, instructions: 'Curl one leg at a time on curl machine.' },
  { name: 'Seated Leg Curl', slug: 'seated-leg-curl', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.HAMSTRINGS, equipment: Equipment.MACHINE, instructions: 'Sit in machine. Curl legs down and back.' },
  { name: 'Bulgarian Split Squat', slug: 'bulgarian-split-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Elevated rear foot. Lower front knee, drive up.' },
  { name: 'Barbell Bulgarian Split Squat', slug: 'barbell-bulgarian-split-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BARBELL, instructions: 'Bar on back. Elevated rear foot. Lower and stand.' },
  { name: 'Walking Lunge', slug: 'walking-lunge', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Step forward lunging, alternate legs walking.' },
  { name: 'Deficit Reverse Lunge', slug: 'deficit-reverse-lunge', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Stand on plate. Step backward into lunge, return.' },
  { name: 'Dumbbell Step-Up', slug: 'dumbbell-step-up', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Step onto box, drive up, step down, alternate.' },
  { name: 'Calf Raise', slug: 'calf-raise', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.CALVES, equipment: Equipment.MACHINE, instructions: 'Rise on toes fully on platform, lower.' },
  { name: 'Dumbbell Standing Calf Raise', slug: 'dumbbell-standing-calf-raise', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.CALVES, equipment: Equipment.DUMBBELL, instructions: 'Hold dumbbells. Rise on toes, squeeze calves.' },
  { name: 'Pistol Squat', slug: 'pistol-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.BODYWEIGHT, instructions: 'Single-leg squat, opposite leg held straight forward.' },
  { name: 'Kettlebell Goblet Squat', slug: 'kettlebell-goblet-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.KETTLEBELL, instructions: 'Squat while holding kettlebell close to chest.' },
  { name: 'Dumbbell Goblet Squat', slug: 'dumbbell-goblet-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.DUMBBELL, instructions: 'Squat while holding dumbbell vertically under chin.' },
  { name: 'Dumbbell Romanian Deadlift', slug: 'dumbbell-romanian-deadlift', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.HAMSTRINGS, equipment: Equipment.DUMBBELL, instructions: 'Hinge hips back holding dumbbells, lower to shins.' },
  { name: 'Horizontal Leg Press', slug: 'horizontal-leg-press', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Sit on horizontal carriage, push footplate.' },
  { name: 'Seated Machine Calf Press', slug: 'seated-machine-calf-press', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.CALVES, equipment: Equipment.MACHINE, instructions: 'Push leg press plate using only ankles.' },
  { name: 'Hack Squat', slug: 'hack-squat', category: ExerciseCategory.LEGS, primaryMuscle: MuscleGroup.QUADS, equipment: Equipment.MACHINE, instructions: 'Stand in hack squat carriage. Squat deep, stand.' },

  // ── GLUTES ─────────────────────────────────────────────────────────────────
  { name: 'Hip Thrust', slug: 'hip-thrust', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BARBELL, instructions: 'Upper back on bench. Bar over hips. Drive hips up.' },
  { name: 'Single-Leg Hip Thrust', slug: 'single-leg-hip-thrust', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT, instructions: 'Perform hip thrust on bench using one working leg.' },
  { name: 'B-Stance Hip Thrust', slug: 'b-stance-hip-thrust', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.DUMBBELL, instructions: 'One leg forward as kickstand, drive hip thrust.' },
  { name: 'Glute Bridge', slug: 'glute-bridge', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT, instructions: 'Lie on floor. Drive hips up, squeeze glutes.' },
  { name: 'Cable Kickback', slug: 'cable-kickback', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.CABLE, instructions: 'Ankle strap. Kick leg back and up.' },
  { name: 'Cable Rope Pull-Through', slug: 'cable-rope-pull-through', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.CABLE, instructions: 'Stand facing away. Hinge, pull cable through legs.' },
  { name: 'Glute Kickback (Bodyweight)', slug: 'glute-kickback-bodyweight', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT, instructions: 'All fours. Kick one heel up to ceiling, alternate.' },
  { name: 'Fire Hydrant', slug: 'fire-hydrant', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT, instructions: 'All fours. Raise one knee out to the side.' },
  { name: 'Frog Pump', slug: 'frog-pump', category: ExerciseCategory.GLUTES, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.BODYWEIGHT, instructions: 'Lie flat, feet soles together close to hips. Pump hips up.' },

  // ── CORE ───────────────────────────────────────────────────────────────────
  { name: 'Plank', slug: 'plank', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Forearm plank. Keep hips level, core braced.' },
  { name: 'Hanging Leg Raise', slug: 'hanging-leg-raise', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang. Raise straight legs to 90° or higher.' },
  { name: 'Hanging Knee Raise', slug: 'hanging-knee-raise', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang. Pull knees up to chest, lower slowly.' },
  { name: 'Decline Bench Crunch', slug: 'decline-bench-crunch', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Secure feet on decline bench. Crunch torso up.' },
  { name: 'Cable Crunch', slug: 'cable-crunch', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.CABLE, instructions: 'Kneel below high cable. Crunch torso down toward floor.' },
  { name: 'Ab Wheel Rollout', slug: 'ab-wheel-rollout', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.OTHER, instructions: 'Kneeling, roll out wheel, pull back using abs.' },
  { name: 'Russian Twist', slug: 'russian-twist', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.OBLIQUES, equipment: Equipment.BODYWEIGHT, instructions: 'Seated, lean 45°, rotate torso side to side.' },
  { name: 'Side Plank', slug: 'side-plank', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.OBLIQUES, equipment: Equipment.BODYWEIGHT, instructions: 'One forearm side support. Keep body straight.' },
  { name: 'L-Sit', slug: 'l-sit', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Lift hips and straight legs off floor in L shape.' },
  { name: 'Dead Bug', slug: 'dead-bug', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Lie flat. Alternate lowering opposite arm and leg.' },
  { name: 'Bird Dog', slug: 'bird-dog', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'All fours. Extend opposite arm and leg. Alternate.' },
  { name: 'Cable Woodchop', slug: 'cable-woodchop', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.OBLIQUES, equipment: Equipment.CABLE, instructions: 'Pull cable diagonally down across body, rotating torso.' },
  { name: 'Cable Pallof Press', slug: 'cable-pallof-press', category: ExerciseCategory.CORE, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.CABLE, instructions: 'Hold cable at chest. Press out, resisting rotation.' },

  // ── CARDIO / HIIT & FULL BODY ──────────────────────────────────────────────
  { name: 'Burpee', slug: 'burpee', category: ExerciseCategory.CARDIO, primaryMuscle: MuscleGroup.OTHER, equipment: Equipment.BODYWEIGHT, instructions: 'Drop into plank, push-up, jump feet in, jump up.' },
  { name: 'Kettlebell Swing', slug: 'kettlebell-swing', category: ExerciseCategory.CARDIO, primaryMuscle: MuscleGroup.GLUTES, equipment: Equipment.KETTLEBELL, instructions: 'Swing kettlebell to chest height using hip hinge drive.' },
  { name: 'Jumping Jack', slug: 'jumping-jack', category: ExerciseCategory.CARDIO, primaryMuscle: MuscleGroup.OTHER, equipment: Equipment.BODYWEIGHT, instructions: 'Jump feet out, raise arms overhead, jump back.' },
  { name: 'Mountain Climber', slug: 'mountain-climber', category: ExerciseCategory.CARDIO, primaryMuscle: MuscleGroup.ABS, equipment: Equipment.BODYWEIGHT, instructions: 'Pull knees in toward chest dynamically in plank.' },
  { name: 'Rowing Machine', slug: 'rowing-machine', category: ExerciseCategory.CARDIO, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.MACHINE, instructions: 'Drive with legs, lean back, pull handle to ribs.' },
  { name: 'Muscle-Up', slug: 'muscle-up', category: ExerciseCategory.FULL_BODY, primaryMuscle: MuscleGroup.LATS, equipment: Equipment.BODYWEIGHT, instructions: 'Hang. Pull chest high, transition over bar, dip up.' },
  { name: 'Kettlebell Turkish Get-Up', slug: 'kettlebell-turkish-get-up', category: ExerciseCategory.FULL_BODY, primaryMuscle: MuscleGroup.SHOULDERS, equipment: Equipment.KETTLEBELL, instructions: 'Lie to stand up holding kettlebell overhead.' },
];

async function seedExercises() {
  console.log('🌱 Seeding exercises...');

  let created = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    const existing = await prisma.exercise.findUnique({ where: { slug: exercise.slug } });
    if (existing) {
      // Update existing if any info changes
      await prisma.exercise.update({
        where: { slug: exercise.slug },
        data: {
          category: exercise.category,
          primaryMuscle: exercise.primaryMuscle,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
        }
      });
      skipped++;
      continue;
    }
    await prisma.exercise.create({ data: exercise });
    created++;
  }

  console.log(`✅ Done: ${created} created, ${skipped} updated/skipped.`);
}

seedExercises()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
