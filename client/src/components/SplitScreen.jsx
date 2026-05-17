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
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
      <motion.div className="opacity-50 pointer-events-none text-center w-full max-w-md">
        {peerName !== undefined && (
          <p className="text-2xl text-zinc-400 font-light min-h-[36px]">{peerName || '...'}</p>
        )}
        {peerDate !== undefined && (
          <p className="text-2xl text-zinc-400 font-light tracking-widest min-h-[36px]">
            {peerDate || '...'}
          </p>
        )}
        {peerContent}
      </motion.div>
    </div>
  );

  const ownPanel = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
      {children}
    </div>
  );

  return (
    <motion.div className="h-full w-full flex flex-col" layout>
      {slot === 2 ? (
        <>
          {ownPanel}
          <div className="border-t border-zinc-800 shrink-0" />
          {peerPanel}
        </>
      ) : (
        <>
          {peerPanel}
          <div className="border-t border-zinc-800 shrink-0" />
          {ownPanel}
        </>
      )}
    </motion.div>
  );
}
