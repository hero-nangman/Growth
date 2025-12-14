import { useState, useRef } from 'react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { UrlInput, UrlInputRef } from '@/components/UrlInput';
import { AnalysisResultDisplay } from '@/components/AnalysisResult';
import { AnalysisResult } from '@/lib/extensionBridge';
import { BarChart3 } from 'lucide-react';

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const urlInputRef = useRef<UrlInputRef>(null);

  const handleAnalysisStart = () => {
    setIsLoading(true);
    setResult(null);
  };

  const handleAnalysisComplete = (analysisResult: AnalysisResult) => {
    setIsLoading(false);
    setResult(analysisResult);
  };

  const handleRetryAnalysis = () => {
    urlInputRef.current?.retryAnalysis();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-base font-bold text-foreground">쿠팡 판매량 분석</h1>
          </div>
          <ConnectionStatus />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* URL Input */}
          <UrlInput 
            ref={urlInputRef}
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
          />

          {/* Analysis Result */}
          <AnalysisResultDisplay 
            result={result} 
            isLoading={isLoading} 
            onRetryAnalysis={handleRetryAnalysis}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;