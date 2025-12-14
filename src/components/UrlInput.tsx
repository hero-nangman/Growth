import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { analyzeUrl, AnalysisResult } from '@/lib/extensionBridge';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface UrlInputProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export interface UrlInputRef {
  retryAnalysis: () => void;
}

export const UrlInput = forwardRef<UrlInputRef, UrlInputProps>(({ onAnalysisStart, onAnalysisComplete }, ref) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const isValidCoupangUrl = (string: string) => {
    return string.includes('coupang.com/vp/products/');
  };

  const runAnalysis = async (targetUrl: string) => {
    setIsLoading(true);
    setShowLoadingIndicator(false);
    onAnalysisStart();
    
    // 1초 후에 로딩 인디케이터 표시
    loadingTimerRef.current = setTimeout(() => {
      setShowLoadingIndicator(true);
    }, 1000);
    
    toast.info('익스텐션으로 분석 요청 전송 중...');
    
    const result = await analyzeUrl(targetUrl);
    
    console.log('[WebApp] 분석 결과:', result);
    
    // 타이머 클리어
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    setIsLoading(false);
    setShowLoadingIndicator(false);
    onAnalysisComplete(result);
    
    if (result.success) {
      toast.success('분석이 완료되었습니다!');
    } else {
      toast.error(result.error || '분석에 실패했습니다');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('URL을 입력해주세요');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (!isValidCoupangUrl(formattedUrl)) {
      toast.error('쿠팡 상품 URL을 입력해주세요 (예: https://www.coupang.com/vp/products/12345)');
      return;
    }

    lastUrlRef.current = formattedUrl;
    await runAnalysis(formattedUrl);
  };

  useImperativeHandle(ref, () => ({
    retryAnalysis: () => {
      if (lastUrlRef.current) {
        runAnalysis(lastUrlRef.current);
      }
    }
  }));

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Card className="p-2 card-shadow flex gap-2">
        <Input
          type="text"
          placeholder="쿠팡 상품 URL을 입력하세요... (예: coupang.com/vp/products/12345)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading}
          className="px-6"
        >
          {isLoading && showLoadingIndicator ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              분석 중...
            </>
          ) : isLoading ? (
            <>
              <Search className="w-4 h-4 mr-2" />
              분석하기
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              분석하기
            </>
          )}
        </Button>
      </Card>
    </form>
  );
});