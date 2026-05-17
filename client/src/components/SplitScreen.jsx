import { motion } from 'framer-motion';
import { PEER_TYPING_CLASS } from '../styles';

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
    <motion.div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
      <motion.div className="pointer-events-none text-center w-full max-w-lg px-2">
        {peerName !== undefined && (
          <p className={PEER_TYPING_CLASS}>{peerName || '...'}</p>
        )}
        {peerDate !== undefined && (
          <p className={`${PEER_TYPING_CLASS} tracking-widest`}>{peerDate || '...'}</p>
        )}
        {peerContent}
      </motion.div>
    </motion.div>
  );

  const ownPanel = (
    <motion.div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
      {children}
    </motion.div>
  );

  return (
    <motion.div className="h-full w-full flex flex-col" layout>
      {slot === 2 ? (
        <>
          {ownPanel}
          <motion.div className="border-t border-zinc-700 shrink-0" />
          {peerPanel}
        </>
      ) : (
        <>
          {peerPanel}
          <motion.div className="border-t border-zinc-700 shrink-0" />
          {ownPanel}
        </>
      )}
    </motion.div>
  );
}
