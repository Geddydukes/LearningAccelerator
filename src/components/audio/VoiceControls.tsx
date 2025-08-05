import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  FileText,
  Settings,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface VoiceControlsProps {
  isRecording: boolean;
  isPlaying: boolean;
  audioUrl?: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayAudio: () => void;
  onPauseAudio: () => void;
  showTranscript?: boolean;
  onToggleTranscript?: () => void;
  className?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecording,
  isPlaying,
  audioUrl,
  onStartRecording,
  onStopRecording,
  onPlayAudio,
  onPauseAudio,
  showTranscript = false,
  onToggleTranscript,
  className = ''
}) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio visualization
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));

  useEffect(() => {
    if (isRecording) {
      // Simulate audio levels during recording
      const interval = setInterval(() => {
        setAudioLevels(prev => 
          prev.map(() => Math.random() * 100)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevels(new Array(20).fill(0));
    }
  }, [isRecording]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Voice Controls
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Audio Visualization */}
        <div className="flex items-center justify-center h-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-end space-x-1 h-12">
            {audioLevels.map((level, index) => (
              <motion.div
                key={index}
                className="w-2 bg-gradient-to-t from-teal-400 to-teal-600 rounded-full"
                style={{ height: `${Math.max(4, level * 0.4)}px` }}
                animate={{ height: `${Math.max(4, level * 0.4)}px` }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Record Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={isRecording ? "secondary" : "primary"}
              size="lg"
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`w-16 h-16 rounded-full p-0 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : ''
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </motion.div>

          {/* Play/Pause Button */}
          {audioUrl && (
            <Button
              variant="outline"
              size="lg"
              onClick={isPlaying ? onPauseAudio : onPlayAudio}
              className="w-12 h-12 rounded-full p-0"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="p-2"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label="Volume control"
            />
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center space-x-2">
          {onToggleTranscript && (
            <Button
              variant={showTranscript ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleTranscript}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Transcript</span>
            </Button>
          )}

          {audioUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = audioUrl;
                link.download = 'voice-message.mp3';
                link.click();
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          )}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <VoiceSettings />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRecording ? (
              <span className="text-red-500 font-medium">Recording...</span>
            ) : isPlaying ? (
              <span className="text-teal-500 font-medium">Playing audio</span>
            ) : (
              "Ready to record"
            )}
          </p>
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={onPauseAudio}
          className="hidden"
        />
      )}
    </Card>
  );
};

// Voice Settings Component
const VoiceSettings: React.FC = () => {
  const [voice, setVoice] = useState('alloy');
  const [speed, setSpeed] = useState(1.0);
  const [autoPlay, setAutoPlay] = useState(true);

  const voices = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
    { id: 'echo', name: 'Echo', description: 'Warm, engaging' },
    { id: 'fable', name: 'Fable', description: 'Expressive, dynamic' },
    { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
    { id: 'nova', name: 'Nova', description: 'Bright, energetic' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle' }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 dark:text-white">Voice Settings</h4>
      
      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Voice
        </label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} - {v.description}
            </option>
          ))}
        </select>
      </div>

      {/* Speed Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Speed: {speed}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>

      {/* Auto-play Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Auto-play responses
        </label>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoPlay ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoPlay ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

// Recording Status Component
interface RecordingStatusProps {
  isRecording: boolean;
  duration: number;
  className?: string;
}

export const RecordingStatus: React.FC<RecordingStatusProps> = ({
  isRecording,
  duration,
  className = ''
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      <span className="text-sm font-medium text-red-600 dark:text-red-400">
        Recording {formatDuration(duration)}
      </span>
    </motion.div>
  );
};