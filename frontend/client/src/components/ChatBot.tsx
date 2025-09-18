import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as CardModule from '@/components/ui/card';
const Card = CardModule.Card || CardModule.default || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
const CardHeader = CardModule.CardHeader || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
const CardContent = CardModule.CardContent || (({ children, className = '' }: any) => <div className={className}>{children}</div>);
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
// --- UPDATED IMPORTS ---
import { askCropQuestion, clearConversationHistory} from '@/lib/gemini';
import { MessageCircle, X, Mic, Send, Bot, User } from 'lucide-react';

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
      console.log('[ChatBot] sending question:', message);
      const response = await askCropQuestion(message);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      console.log('[ChatBot] got response:', response);
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorText = error?.message || "I'm having trouble connecting right now. Please try again later.";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
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

  const handleClearHistory = async () => {
    try {
      await clearConversationHistory();
      setMessages([{
        id: '1',
        text: t('chat_greeting'),
        isUser: false,
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };


  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 chat-bounce bg-primary hover:bg-primary/90"
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        data-testid="button-chat-toggle"
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </Button>

      {isOpen && (
        <Card id="chat-panel" className="absolute bottom-20 right-0 w-96 sm:w-[480px] lg:w-[520px] h-[600px] shadow-2xl">
          <CardHeader className="gradient-bg text-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-lg">{t('crop_assistant')}</p>
                  <p className="text-sm opacity-75">{t('ai_powered')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearHistory}
                  className="text-white hover:bg-white/10 p-2"
                  aria-label={t('clear_history') || 'Clear history'}
                  data-testid="button-clear-history"
                  disabled={isLoading}
                >
                  {t('clear_history')}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2"
                  aria-label={t('close') || 'Close chat'}
                  data-testid="button-chat-close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-full">
            <div
              role="log"
              aria-live="polite"
              className="flex-1 p-4 overflow-y-auto space-y-4"
              style={{ paddingBottom: '16px' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <Bot className="text-primary-foreground h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-xl max-w-[75%] break-words text-sm leading-relaxed shadow-sm ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground ml-3 rounded-br-md'
                        : 'bg-muted/50 text-foreground mr-3 rounded-bl-md'
                    }`}
                  >
                    {message.text}
                    <div className="text-xs opacity-60 mt-2 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.isUser && (
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                      <User className="text-accent-foreground h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <Bot className="text-primary-foreground h-5 w-5" />
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl rounded-bl-md">
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

            <div className="p-5 border-t border-border bg-background">
              <div className="flex items-center space-x-3 mb-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-sm p-2 rounded-lg border bg-white min-w-[140px]"
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
                  className={`${isRecording ? 'voice-recording' : ''} p-3`}
                  aria-pressed={isRecording}
                  data-testid="button-voice-input"
                >
                  <Mic className="h-5 w-5" />
                </Button>

                <Input
                  placeholder={'Type your question...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-11 text-sm"
                  aria-label={t('chat_input') || 'Chat input'}
                  data-testid="input-chat-message"
                />

                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3"
                  data-testid="button-send-message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question)}
                    className="text-sm px-3 py-2 h-auto whitespace-normal text-left"
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
