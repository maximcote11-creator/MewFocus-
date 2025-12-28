
import React, { useState, useEffect, useCallback } from 'react';
import { parseVoiceCommand } from '../services/gemini';

interface VoiceAssistantProps {
  onNewTask: (title: string, priority: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNewTask }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsProcessing(true);
      const result = await parseVoiceCommand(text);
      if (result) {
        onNewTask(result.title, result.priority);
      }
      setIsProcessing(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <button 
        onClick={startListening}
        disabled={isListening || isProcessing}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'
        } text-white`}
      >
        {isProcessing ? (
          <i className="fas fa-spinner animate-spin"></i>
        ) : (
          <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-xl`}></i>
        )}
      </button>
      
      {isListening && (
        <div className="absolute bottom-16 right-0 bg-white p-3 rounded-2xl shadow-xl border border-indigo-100 min-w-[200px] animate-bounce">
          <p className="text-xs text-indigo-600 font-bold mb-1">Mew est à l'écoute...</p>
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-5 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-1 h-4 bg-indigo-600 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
