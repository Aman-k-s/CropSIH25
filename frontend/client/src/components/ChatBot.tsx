import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// tolerant import for Card — falls back to minimal local components when the real Card
// export is missing or causes runtime issues. This avoids crashes while you debug the
// real UI library. Remove / simplify once the original Card module is fixed.
import * as CardModule from '@/components/ui/card';
const Card = CardModule.Card || CardModule.default || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
const CardHeader = CardModule.CardHeader || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
const CardContent = CardModule.CardContent || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { askCropQuestion } from '@/lib/gemini';
import { MessageCircle, X, Mic, Send, Bot, User } from 'lucide-react';
//import { askCropQuestion } from '@/lib/gemini';


interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatBot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    setTranscript,
    language,
    setLanguage,
  } = useVoiceRecording();

  // welcome message only when opening first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: t('chat_greeting'),
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (transcript && !isRecording) {
      setInputMessage(transcript);
      setTranscript('');
    }
  }, [transcript, isRecording, setTranscript]);

  // always scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isOpen]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await askCropQuestion(message);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(inputMessage);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    t('quick_crop_health'),
    t('quick_fertilizer'),
    t('quick_weather'),
  ];

  // UI improvements summary (in-code):
  // - Panel is slightly wider on larger screens and responsive on small screens
  // - Message list has a stable max-height with proper padding-bottom so input won't overlap
  // - Fixed alignment and spacing for avatars + bubbles
  // - Use onKeyDown instead of deprecated onKeyPress
  // - Added aria labels for accessibility

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      <Button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 chat-bounce bg-primary hover:bg-primary/90"
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        data-testid="button-chat-toggle"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <Card id="chat-panel" className="absolute bottom-16 right-0 w-80 sm:w-96 h-[420px] shadow-2xl">
          <CardHeader className="gradient-bg text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Bot className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{t('crop_assistant')}</p>
                  <p className="text-xs opacity-75">{t('ai_powered')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
                aria-label={t('close') || 'Close chat'}
                data-testid="button-chat-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-full">
            {/* Messages container */}
            <div
              role="log"
              aria-live="polite"
              className="flex-1 p-3 overflow-y-auto space-y-3"
              style={{ paddingBottom: '12px' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* left avatar for bot */}
                  {!message.isUser && (
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                      <Bot className="text-primary-foreground h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-lg max-w-[70%] break-words text-sm shadow-sm ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground ml-2'
                        : 'bg-muted/50 text-foreground mr-2'
                    }`}
                  >
                    {message.text}
                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* right avatar for user */}
                  {message.isUser && (
                    <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <User className="text-accent-foreground h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start">
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                    <Bot className="text-primary-foreground h-4 w-4" />
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center space-x-2">
                {/* Language selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs p-1 rounded border bg-white"
                  aria-label="Select language"
                  data-testid="select-language"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                </select>

                <Button
                  size="sm"
                  variant={isRecording ? 'destructive' : 'outline'}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'voice-recording' : ''}
                  aria-pressed={isRecording}
                  data-testid="button-voice-input"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Input
                  placeholder={t('type_your_question') || 'Type your question...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  aria-label={t('chat_input') || 'Chat input'}
                  data-testid="input-chat-message"
                />

                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isLoading}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question)}
                    className="text-xs"
                    data-testid={`button-quick-question-${index}`}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { ChatBot };