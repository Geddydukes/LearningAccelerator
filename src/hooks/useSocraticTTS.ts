import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useSocraticTTS = (prompt: string, voice: string = 'Adam') => {
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { user } = useAuth()

  // Check for reduced motion or data saver
  const shouldSkipTTS = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           (navigator as any).connection?.saveData
  }

  const generateAudio = async () => {
    if (!user || !prompt || shouldSkipTTS()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({ prompt, voice })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Voice limit reached. Try again tomorrow.')
        } else {
          toast.error('Voice temporarily unavailable')
        }
        setError(data.error)
        return
      }

      setAudioUrl(data.audio_url)
    } catch (err) {
      toast.error('Voice temporarily unavailable')
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  return {
    generateAudio,
    playAudio,
    pauseAudio,
    isLoading,
    isPlaying,
    audioUrl,
    error,
    audioRef
  }
}