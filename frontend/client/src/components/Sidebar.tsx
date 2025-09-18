import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { Sprout, BarChart3, Map, User, Globe } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function Sidebar({ activeTab, onTabChange, className = '' }: SidebarProps) {
  const { language, setLanguage, t } = useTranslation();

  const tabs = [
    { id: 'field-report', icon: BarChart3, label: t('field_report') },
    { id: 'my-field', icon: Map, label: t('my_field') },
    { id: 'data-analytics', icon: BarChart3, label: t('data_analytics') },
  ];

  return (
    <div className={`w-64 gradient-bg text-white flex-shrink-0 ${className}`}>
      <div className="p-6 h-full flex flex-col">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Sprout className="text-primary text-xl" />
          </div>
          <span className="text-xl font-bold">CROP DROP</span>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2 flex-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`w-full justify-start py-3 px-4 text-white hover:bg-white/20 font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white/20' : ''
              }`}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="mr-3 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </nav>
        
        {/* Language Selector */}
        <div className="mt-8">
          <label className="text-sm font-medium mb-2 block">
            <Globe className="inline mr-2 h-4 w-4" />
            {t('language')}
          </label>
          <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
            <SelectTrigger className="w-full bg-white/20 border-white/30 text-white" data-testid="language-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* User Profile */}
        <div className="mt-8 p-4 bg-white/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('farmer')}</p>
              <p className="text-xs opacity-75">{t('online')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
