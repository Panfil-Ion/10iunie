import { motion } from 'framer-motion';
import { getName } from '../utils/names';

const SCORE_PHASES = [
  'PHASE_3',
  'PHASE_3_RESULT',
  'PHASE_4',
  'PHASE_4_ROUND_RESULT',
  'PHASE_4_GAME_RESULT',
  'PHASE_5',
  'PHASE_5_RESULT',
  'PHASE_6',
];

export default function Scoreboard({ state }) {
  if (!state || !SCORE_PHASES.includes(state.phase)) return null;

  const n1 = getName(state, 1);
  const n2 = getName(state, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <p className="text-base md:text-lg text-zinc-400 tracking-wide">
        [ {n1}: {state.scores[1]} — {n2}: {state.scores[2]} ]
      </p>
    </motion.div>
  );
}
