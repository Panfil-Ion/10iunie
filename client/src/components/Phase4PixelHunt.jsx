import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SplitScreen from './SplitScreen';
import LiveCamera from './LiveCamera';
import LoadingSpinner from './LoadingSpinner';
import GameLoopButtons from './GameLoopButtons';
import { BTN_ACK } from '../styles';
import { getName, waitingForPeer } from '../utils/names';

export default function Phase4PixelHunt({ slot, state, emit }) {
  const [captured, setCaptured] = useState(false);
  const n1 = getName(state, 1);
  const n2 = getName(state, 2);
  const g2 = state?.game2;

  useEffect(() => {
    setCaptured(false);
  }, [g2?.currentRound, state?.phase]);

  if (state?.phase === 'PHASE_4_GAME_RESULT') {
    const w1 = g2.roundWins[1];
    const w2 = g2.roundWins[2];
    const winner = g2.gameWinner;
    const winnerName = winner ? getName(state, winner) : null;

    let summary = `${n1} a câștigat ${w1} runde, ${n2} a câștigat ${w2} runde.`;
    if (winnerName) summary += ` Punct adjudecat de ${winnerName}.`;
    else summary += ' Egalitate la Jocul 2.';

    return (
      <SplitScreen slot={slot} unified>
        <motion.div className="flex flex-col items-center text-center px-6 max-w-xl">
          <p className="text-xl md:text-2xl text-zinc-100 leading-relaxed mb-4">{summary}</p>
          <GameLoopButtons state={state} slot={slot} emit={emit} game={2} />
        </motion.div>
      </SplitScreen>
    );
  }

  if (state?.phase === 'PHASE_4_ROUND_RESULT') {
    const lastRound = g2.rounds[g2.rounds.length - 1];
    const roundNum = lastRound?.round || g2.currentRound;
    const rw = lastRound?.winner;
    const rwName = rw ? getName(state, rw) : null;
    const t1 = lastRound ? (lastRound.uploadTimes[1] / 1000).toFixed(2) : '—';
    const t2 = lastRound ? (lastRound.uploadTimes[2] / 1000).toFixed(2) : '—';

    let line = `Runda ${roundNum}: ${n1} ${lastRound?.visionResults[1]} (${t1}s), ${n2} ${lastRound?.visionResults[2]} (${t2}s).`;
    if (rwName) line += ` Câștigător rundă: ${rwName}.`;

    const acked = g2.nextRoundReady?.[slot];
    const otherAcked = g2.nextRoundReady?.[slot === 1 ? 2 : 1];

    return (
      <SplitScreen slot={slot} unified>
        <motion.div className="flex flex-col items-center text-center px-6 max-w-xl gap-6">
          <p className="text-xl md:text-2xl text-zinc-100 leading-relaxed">{line}</p>
          <button
            type="button"
            onClick={() => emit('game2-next-round')}
            disabled={acked}
            className={BTN_ACK}
          >
            Următorul Obiect
          </button>
          {acked && !otherAcked && (
            <p className="text-lg text-zinc-400">{waitingForPeer(state, slot)}</p>
          )}
        </motion.div>
      </SplitScreen>
    );
  }

  const submitted = g2?.submitted?.[slot];
  const processing = g2?.processing;

  const handleCapture = useCallback(
    (base64) => {
      if (submitted || captured) return;
      setCaptured(true);
      emit('game2-photo', { base64 });
    },
    [submitted, captured, emit]
  );

  return (
    <div className="game2-stage">
      <p className="shrink-0 text-center text-lg text-zinc-400 py-2">
        Runda {g2?.currentRound} / 3
      </p>
      <div className="game2-play-area">
        {submitted || captured ? (
          <LoadingSpinner
            text={processing ? 'AI validează imaginile...' : waitingForPeer(state, slot)}
          />
        ) : (
          <LiveCamera
            key={`cam-r${g2?.currentRound}-${slot}`}
            object={g2?.object}
            onCapture={handleCapture}
            disabled={submitted}
          />
        )}
      </div>
    </div>
  );
}
