export interface Typewriter {
  typingSpeed: Speed;
  erasingSpeed: Speed;
}

interface Speed {
  numUnits: number;
  timeMs: number;
  startDelayMs: number;
}

export interface TypewriterProgress {
  phrase: string;
  phraseIdx: number;
  status: TypewriterStatus;
}

export enum TypewriterStatus {
  WaitingToType = "waitingToType",
  Typing = "typing",
  WaitingToErase = "waitingToErase",
  Erasing = "erasing",
}
export const defaultTypewriterProgress: TypewriterProgress = {
  phrase: "",
  phraseIdx: 0,
  status: TypewriterStatus.WaitingToType,
};

export const typeNext = (
  phrases: string[],
  typewriter: Typewriter,
  progress: TypewriterProgress,
  onNext: (progress: TypewriterProgress) => void
) => {
  const delay = getDelay(typewriter, progress);

  const timeoutId = setTimeout(() => {
    const nextProgress = getNext(phrases, typewriter, progress);
    onNext(nextProgress);
  }, delay);

  return () => clearTimeout(timeoutId);
};

const getDelay = (
  { typingSpeed, erasingSpeed }: Typewriter,
  { status }: TypewriterProgress
): number => {
  if (!status) {
    return typingSpeed.startDelayMs;
  }

  const stateDelays = {
    [TypewriterStatus.WaitingToType]: typingSpeed.startDelayMs,
    [TypewriterStatus.Typing]: typingSpeed.timeMs,
    [TypewriterStatus.WaitingToErase]: erasingSpeed.startDelayMs,
    [TypewriterStatus.Erasing]: erasingSpeed.timeMs,
  };
  return stateDelays[status];
};

const getNext = (
  phrases: string[],
  typewriter: Typewriter,
  progress: TypewriterProgress
): TypewriterProgress => {
  const fullPhrase = phrases[progress.phraseIdx];

  if (progress.status === TypewriterStatus.Typing) {
    const startIdx = progress.phrase.length;
    const endIdx = startIdx + typewriter.typingSpeed.numUnits;
    const eolReached = endIdx >= fullPhrase.length;

    return {
      phrase: fullPhrase.substring(0, endIdx),
      phraseIdx: progress.phraseIdx,
      status: eolReached
        ? TypewriterStatus.WaitingToErase
        : TypewriterStatus.Typing,
    };
  } else if (progress.status === TypewriterStatus.WaitingToErase) {
    return {
      phrase: progress.phrase,
      phraseIdx: progress.phraseIdx,
      status: TypewriterStatus.Erasing,
    };
  } else if (progress.status === TypewriterStatus.Erasing) {
    let phraseIdx = progress.phraseIdx;
    const startIdx = 0;
    const endIdx = progress.phrase.length - typewriter.erasingSpeed.numUnits;
    const isFullyErased = endIdx <= 0;

    if (isFullyErased) {
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }

    return {
      phrase: fullPhrase.substring(startIdx, endIdx),
      phraseIdx,
      status: isFullyErased
        ? TypewriterStatus.WaitingToType
        : TypewriterStatus.Erasing,
    };
  }
  return {
    phrase: progress.phrase,
    phraseIdx: progress.phraseIdx,
    status: TypewriterStatus.Typing,
  };
};
