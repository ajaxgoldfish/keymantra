import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SENTENCE_BANK = [
  {
    id: 'practice',
    prompt: '我不喜欢在这里',
    tokens: [
      { type: 'word', text: 'Practice' },
      { type: 'word', text: 'makes' },
      { type: 'word', text: 'perfect' },
      { type: 'symbol', text: '.' },
    ],
  },
  {
    id: 'fox',
    prompt: '敏捷的棕狐跳过懒狗',
    tokens: [
      { type: 'word', text: 'The' },
      { type: 'word', text: 'quick' },
      { type: 'word', text: 'brown' },
      { type: 'word', text: 'fox' },
      { type: 'word', text: 'jumps' },
      { type: 'word', text: 'over' },
      { type: 'word', text: 'the' },
      { type: 'word', text: 'lazy' },
      { type: 'word', text: 'dog' },
      { type: 'symbol', text: '.' },
    ],
  },
]

function prepareSentenceTokens(definition) {
  return definition.tokens.map((token, index) => {
    if (token.type === 'word') {
      return {
        ...token,
        id: `${definition.id}-${index}`,
        userInput: '',
        incorrect: false,
      }
    }

    return { ...token, id: `${definition.id}-${index}` }
  })
}

function findNextWordIndex(tokens, fromIndex) {
  for (let i = fromIndex + 1; i < tokens.length; i += 1) {
    if (tokens[i]?.type === 'word') return i
  }
  return -1
}

function findPreviousWordIndex(tokens, fromIndex) {
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (tokens[i]?.type === 'word') return i
  }
  return -1
}

function joinTokensToText(tokens) {
  return tokens
    .map((token, index) => {
      if (token.type === 'symbol') {
        return `${token.text}${index === tokens.length - 1 ? '' : ' '}`
      }
      return token.text
    })
    .join(' ')
    .replace(/\s([.,!?])/g, '$1')
}

function computePlaceholderWidth(word) {
  const characterCount = Math.max(2, word.length)
  return `${characterCount + 1}ch`
}

function normalizeWord(value) {
  return value.trim().toLowerCase()
}

function useTone() {
  const ctxRef = useRef(null)

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return null
    if (!ctxRef.current) {
      ctxRef.current = new AudioContextCtor()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }, [])

  const playTone = useCallback((frequency, duration = 0.12, volume = 0.18) => {
    const ctx = ensureContext()
    if (!ctx) return

    const now = ctx.currentTime + 0.01
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(now)
    oscillator.stop(now + duration)

    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }, [ensureContext])

  const playTyping = useCallback(() => playTone(440, 0.06, 0.12), [playTone])
  const playFocus = useCallback(() => playTone(720, 0.1, 0.2), [playTone])
  const playBlur = useCallback(() => playTone(240, 0.12, 0.18), [playTone])
  const playSuccess = useCallback(() => playTone(1020, 0.18, 0.22), [playTone])
  const playError = useCallback(() => playTone(180, 0.18, 0.22), [playTone])

  return {
    playTyping,
    playFocus,
    playBlur,
    playSuccess,
    playError,
  }
}

function App() {
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [tokens, setTokens] = useState(() => prepareSentenceTokens(SENTENCE_BANK[0]))
  const [activeIndex, setActiveIndex] = useState(() => findNextWordIndex(tokens, -1))
  const [inputValue, setInputValue] = useState('')
  const [focusing, setFocusing] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const inputRef = useRef(null)
  const lastTypingTs = useRef(0)

  const { playTyping, playFocus, playBlur, playSuccess, playError } = useTone()

  const activeSentence = useMemo(() => SENTENCE_BANK[sentenceIndex] ?? SENTENCE_BANK[0], [sentenceIndex])

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const resetCurrentSentence = useCallback(() => {
    const prepared = prepareSentenceTokens(activeSentence)
    const firstWordIndex = findNextWordIndex(prepared, -1)
    setTokens(prepared)
    setActiveIndex(firstWordIndex)
    setInputValue(firstWordIndex !== -1 ? prepared[firstWordIndex].userInput ?? '' : '')
    setShowAnswer(false)
    focusInput()
  }, [activeSentence, focusInput])

  useEffect(() => {
    resetCurrentSentence()
  }, [resetCurrentSentence])

  useEffect(() => {
    const handleWindowFocus = () => {
      focusInput()
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [focusInput])

  useEffect(() => {
    const currentWord = tokens[activeIndex]
    if (currentWord?.type === 'word') {
      setInputValue(currentWord.userInput ?? '')
    } else {
      setInputValue('')
    }
  }, [tokens, activeIndex])

  const handleChange = (event) => {
    const value = event.target.value
    setInputValue(value)
    setTokens((prev) => prev.map((token, index) => {
      if (index !== activeIndex || token.type !== 'word') return token
      return { ...token, userInput: value, incorrect: false }
    }))
  }

  const handleFocus = () => {
    setFocusing(true)
    playFocus()
  }

  const handleBlur = () => {
    setFocusing(false)
    playBlur()
  }

  const handleMouseDown = (event) => {
    event.preventDefault()
    focusInput()
  }

  const handleDoubleClick = (event) => {
    event.preventDefault()
  }

  const deletePreviousWord = useCallback(() => {
    const previousIndex = findPreviousWordIndex(tokens, activeIndex)
    if (previousIndex === -1) return

    const updated = tokens.map((token, index) => {
      if (index === previousIndex && token.type === 'word') {
        return { ...token, userInput: '', incorrect: false }
      }
      if (index === activeIndex && token.type === 'word') {
        return { ...token, userInput: '', incorrect: false }
      }
      return token
    })

    setTokens(updated)
    setActiveIndex(previousIndex)
    setInputValue('')
    focusInput()
  }, [tokens, activeIndex, focusInput])

  const finishCurrentWord = useCallback(() => {
    const current = tokens[activeIndex]
    if (!current || current.type !== 'word') return

    const rawInput = inputValue.trim()
    const normalizedInput = normalizeWord(rawInput)
    const normalizedTarget = normalizeWord(current.text)
    const isCorrect = rawInput.length > 0 && normalizedInput === normalizedTarget

    const updatedTokens = tokens.map((token, index) => {
      if (index !== activeIndex) return token
      return { ...token, userInput: rawInput, incorrect: !isCorrect }
    })

    setTokens(updatedTokens)

    if (isCorrect) {
      playSuccess()
      const nextIndex = findNextWordIndex(updatedTokens, activeIndex)
      if (nextIndex !== -1) {
        setActiveIndex(nextIndex)
        setInputValue(updatedTokens[nextIndex].userInput ?? '')
      } else {
        setInputValue('')
      }
    } else {
      playError()
      setInputValue(rawInput)
    }
  }, [tokens, activeIndex, inputValue, playSuccess, playError])

  const handleSubmit = useCallback(() => {
    let hasError = false

    setTokens((prev) => prev.map((token) => {
      if (token.type !== 'word') return token
      if (!token.userInput) {
        hasError = true
        return { ...token, incorrect: true }
      }
      const correct = normalizeWord(token.userInput) === normalizeWord(token.text)
      if (!correct) hasError = true
      return { ...token, incorrect: !correct }
    }))

    if (hasError) {
      playError()
    } else {
      playSuccess()
    }
  }, [playSuccess, playError])

  const handlePlaySound = useCallback(() => {
    if (typeof window === 'undefined') return
    const text = joinTokensToText(tokens)
    if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
      window.speechSynthesis.cancel()
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
      return
    }
    playFocus()
  }, [tokens, playFocus])

  const handleToggleAnswer = () => {
    setShowAnswer((prev) => !prev)
  }

  const handleMarkMastered = () => {
    playSuccess()
  }

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Backspace') {
      event.preventDefault()
      deletePreviousWord()
      return
    }

    if (event.key === ' ' && !isComposing) {
      event.preventDefault()
      finishCurrentWord()
      return
    }

    if (event.key === 'Enter' && !isComposing) {
      event.preventDefault()
      handleSubmit()
      return
    }

    const shouldPlay = () => {
      if (event.metaKey || event.altKey || event.ctrlKey) return false
      if (event.key.length === 1) return true
      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return true
      return false
    }

    if (shouldPlay()) {
      const now = window.performance?.now?.() ?? Date.now()
      if (now - lastTypingTs.current > 60) {
        playTyping()
        lastTypingTs.current = now
      }
    }
  }

  const goNextSentence = () => {
    setSentenceIndex((prev) => (prev + 1) % SENTENCE_BANK.length)
  }

  const goPreviousSentence = () => {
    setSentenceIndex((prev) => (prev - 1 + SENTENCE_BANK.length) % SENTENCE_BANK.length)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 items-stretch justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl flex-1 grid-rows-3 gap-6 md:gap-8">
          <div className="flex flex-col items-center justify-center bg-background/70 px-8 py-14 text-center shadow-xl backdrop-blur-sm md:px-12 md:py-20">
            <h1 className="text-4xl font-semibold tracking-wide text-foreground md:text-6xl">
              {activeSentence.prompt}
            </h1>
            {showAnswer && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-lg font-medium text-foreground md:mt-8 md:gap-4 md:text-xl">
                {tokens.map((token) => (
                  <span key={`answer-text-${token.id}`} style={{ minWidth: token.type === 'word' ? computePlaceholderWidth(token.text) : undefined }}>
                    {token.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex flex-col items-center justify-center bg-background/80 px-6 py-10 shadow-2xl backdrop-blur-sm md:px-12 md:py-16">
            <div className="relative flex flex-wrap justify-center gap-3 md:gap-4">
              {tokens.map((token, index) => (
                token.type === 'word' ? (
                  <div
                    key={token.id}
                    className={cn(
                      'relative flex items-end justify-center rounded-[2px] px-3 pb-2 text-[1.6em] leading-none transition-all md:h-[4rem] md:text-[3em] after:absolute after:-bottom-[2px] after:left-1/2 after:h-[3px] after:w-[calc(100%-12px)] after:-translate-x-1/2 after:rounded-full after:transition-all after:duration-200',
                      index === activeIndex && focusing
                        ? token.incorrect
                          ? 'text-destructive after:bg-destructive'
                          : 'text-primary after:bg-primary'
                        : token.incorrect
                          ? 'text-destructive after:bg-destructive/80'
                          : 'text-muted-foreground after:bg-border/80'
                    )}
                    style={{ minWidth: computePlaceholderWidth(token.text) }}
                  >
                    <span className="pointer-events-none select-none">
                      {token.userInput || '\u00A0'}
                    </span>
                  </div>
                ) : (
                  <div
                    key={token.id}
                    className="flex items-end justify-center px-1 pb-2 text-[1.6em] font-medium text-muted-foreground md:text-[3em]"
                    style={{ minWidth: '2ch' }}
                  >
                    {token.text}
                  </div>
                )
              ))}

              <input
                lang="en"
                ref={inputRef}
                className="absolute inset-0 h-full w-full cursor-text opacity-0"
                type="text"
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 bg-background/70 px-6 py-10 text-sm shadow-xl backdrop-blur-sm md:px-12 md:py-16">
            <div className="flex w-full flex-wrap items-center gap-2 md:flex-row">
              <Button
                variant="outline"
                className="flex h-12 flex-1 min-w-[140px] items-center justify-center gap-2 text-base"
                onClick={goPreviousSentence}
              >
                <ChevronLeft className="h-5 w-5" />
                上一句
              </Button>
              <div className="flex flex-1 min-w-[240px] flex-wrap items-center justify-center gap-2 md:gap-3">
                <Button variant="outline" className="h-12 px-6" onClick={handleSubmit}>
                  提交 (Enter)
                </Button>
                <Button variant="outline" className="h-12 px-6" onClick={handleToggleAnswer}>
                  {showAnswer ? '隐藏答案' : '显示答案'} (Ctrl ;)
                </Button>
                <Button variant="outline" className="h-12 px-6" onClick={handlePlaySound}>
                  播放声音 (Ctrl ')
                </Button>
                <Button variant="outline" className="h-12 px-6" onClick={resetCurrentSentence}>
                  重置 (Ctrl N)
                </Button>
                <Button variant="outline" className="h-12 px-6" onClick={handleMarkMastered}>
                  标记掌握 (Ctrl M)
                </Button>
              </div>
              <Button
                variant="outline"
                className="flex h-12 flex-1 min-w-[140px] items-center justify-center gap-2 text-base"
                onClick={goNextSentence}
              >
                下一句
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 bg-background/80 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Typing Practice</span>
        </div>
      </footer>
    </div>
  )
}

export default App
