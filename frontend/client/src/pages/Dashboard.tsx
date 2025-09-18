import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FieldReport } from '@/components/FieldReport';
import { MyField } from '@/components/MyField';
import { DataAnalytics } from '@/components/DataAnalytics';
import { ChatBot } from '@/components/ChatBot';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import MapView from "@/components/MapView";


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('field-report');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'field-report':
        return <FieldReport />;
      case 'my-field':
        return <MyField />;
      case 'data-analytics':
        return <DataAnalytics />;
      default:
        return <FieldReport />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="hidden lg:block"
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        className={`fixed left-0 top-0 bottom-0 z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">CROP DROP</h1>
          <div></div>
        </div>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Floating Chatbot */}
      <ChatBot />
    </div>
  );
}
