import { motion } from 'framer-motion';

export default function Scoreboard({ state }) {
  if (!state) return null;
  const show =
    ['PHASE_4', 'PHASE_4_RESULT', 'PHASE_5_INTRO', 'PHASE_5', 'PHASE_5_RESULT', 'PHASE_6', 'PHASE_6_END'].includes(
      state.phase,
    );
  if (!show) return null;

  const n1 = state.names[1] || 'Player 1';
  const n2 = state.names[2] || 'Player 2';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <p className="text-xs text-zinc-500 tracking-widest font-light">
        [ {n1}: {state.scores[1]} — {n2}: {state.scores[2]} ]
      </p>
    </motion.div>
  );
}
