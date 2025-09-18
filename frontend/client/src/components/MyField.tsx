import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import  MapView  from './MapView';
import { Mic, MicOff } from 'lucide-react';

export function MyField() {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  
  const { isRecording, transcript, startRecording, stopRecording, setTranscript } = useVoiceRecording();

  const crops = [
    { value: 'wheat', label: 'Wheat / गेहूं / ਕਣਕ' },
    { value: 'rice', label: 'Rice / चावल / ਚਾਵਲ' },
    { value: 'maize', label: 'Maize / मक्का / ਮੱਕੀ' },
    { value: 'cotton', label: 'Cotton / कपास / ਕਪਾਹ' },
    { value: 'sugarcane', label: 'Sugarcane / गन्ना / ਗੰਨਾ' },
  ];

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('my_field')}</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Field Information Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Crop Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crop_type')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger data-testid="select-crop-type">
                  <SelectValue placeholder={t('select_crop')} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {crop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          

          {/* Voice Input */}
          <Card>
            <CardHeader>
              <CardTitle>{t('voice_notes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleVoiceToggle}
                className={`w-full p-6 border-2 border-dashed transition-colors ${
                  isRecording
                    ? 'border-destructive bg-destructive/10 voice-recording'
                    : 'border-primary/30 hover:border-primary/50'
                }`}
                variant="outline"
                data-testid="button-voice-record"
              >
                {isRecording ? (
                  <MicOff className="text-destructive text-2xl mb-2" />
                ) : (
                  <Mic className="text-primary text-2xl mb-2" />
                )}
                <p className="text-sm text-muted-foreground">
                  {isRecording ? 'Recording... Click to stop' : t('click_record')}
                </p>
              </Button>
              {transcript && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Interface */}
        <div className="xl:col-span-2">
          <MapView />
        </div>

        {/* Field Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('field_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="field-name">{t('field_name')}</Label>
              <Input
                id="field-name"
                placeholder="Enter field name"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                data-testid="input-field-name"
              />
            </div>
            <div>
              <Label htmlFor="field-size">{t('field_size')}</Label>
              <Input
                id="field-size"
                type="number"
                placeholder="0.0"
                value={fieldSize}
                onChange={(e) => setFieldSize(e.target.value)}
                data-testid="input-field-size"
              />
            </div>
            <div>
              <Label htmlFor="planting-date">{t('planting_date')}</Label>
              <Input
                id="planting-date"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                data-testid="input-planting-date"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
