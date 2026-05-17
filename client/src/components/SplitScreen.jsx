import { motion } from 'framer-motion';

export default function SplitScreen({
  slot,
  peerName,
  peerDate,
  peerContent,
  children,
  unified = false,
}) {
  if (unified) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="h-full w-full flex flex-col items-center justify-center px-6"
      >
        {children}
      </motion.div>
    );
  }

  const peerPanel = (
    <motion.div
      layout
      className="flex-1 flex flex-col items-center justify-center border-zinc-800/60 px-6 min-h-0"
    >
      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-4">
        {slot === 1 ? 'Player 2' : 'Player 1'}
      </span>
      <div className="opacity-40 pointer-events-none text-center w-full max-w-xs">
        {peerName !== undefined && (
          <p className="text-lg text-zinc-400 font-light tracking-wide min-h-[28px]">
            {peerName || '...'}
          </p>
        )}
        {peerDate !== undefined && (
          <p className="text-lg text-zinc-400 font-light tracking-wide min-h-[28px]">
            {peerDate || '...'}
          </p>
        )}
        {peerContent}
      </div>
    </motion.div>
  );

  const ownPanel = (
    <motion.div
      layout
      className="flex-1 flex flex-col items-center justify-center px-6 min-h-0 border-zinc-800/60"
    >
      {children}
    </motion.div>
  );

  return (
    <motion.div className="h-full w-full flex flex-col" layout>
      {slot === 2 ? (
        <>
          {ownPanel}
          <div className="border-t border-zinc-800/60 shrink-0" />
          {peerPanel}
        </>
      ) : (
        <>
          {peerPanel}
          <motion.div className="border-t border-zinc-800/60 shrink-0" />
          {ownPanel}
        </>
      )}
    </motion.div>
  );
}
