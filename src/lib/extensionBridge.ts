// Extension communication bridge for Coupang Wing Analyzer
// 실제 익스텐션 ID로 변경하세요 (chrome://extensions 에서 확인)
const EXTENSION_ID = 'lhlclfoenmbnghjpiajilbebohmadabo';

export interface ProductAnalysis {
  productName: string;
  brandName: string;
  manufacture: string;
  sales: number;
  price: number;
  views: number;
  rating: number;
  reviewCount: number;
  revenue: number;
  profit: number;
  conversionRate: string;
  deliveryMethod?: string;
  deliveryBadgeLabel?: string;
  thumbnail?: string;
  imagePath?: string;
}

export interface AnalysisSummary {
  totalProducts: number;
  totalSales: number;
  totalViews: number;
  totalRevenue: number;
  totalProfit: number;
  avgConversionRate: string;
}

export interface AnalysisResult {
  success: boolean;
  url: string;
  productId?: string;
  thumbnail?: string;
  error?: string;
  code?: string;
  timestamp: number;
  summary?: AnalysisSummary;
  products?: ProductAnalysis[];
  serverSent?: boolean;
  serverError?: string;
}

interface ChromeRuntime {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response: AnalysisResult | { success?: boolean } | undefined) => void
  ) => void;
  lastError?: { message: string };
}

interface ChromeAPI {
  runtime?: ChromeRuntime;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getChrome = (): ChromeAPI | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  if (typeof win !== 'undefined' && win.chrome && win.chrome.runtime) {
    return win.chrome as ChromeAPI;
  }
  return undefined;
};

// 익스텐션으로 URL 분석 요청
export const analyzeUrl = (url: string, serverUrl?: string): Promise<AnalysisResult> => {
  return new Promise((resolve) => {
    const chromeApi = getChrome();
    
    if (chromeApi?.runtime?.sendMessage) {
      try {
        chromeApi.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'ANALYZE_URL', url, serverUrl },
          (response) => {
            if (chromeApi.runtime?.lastError) {
              resolve({
                success: false,
                url,
                error: '쿠팡 판매량 추적기를 설치해 주세요.',
                timestamp: Date.now(),
              });
            } else {
              resolve((response as AnalysisResult) || {
                success: false,
                url,
                error: '응답을 받지 못했습니다.',
                timestamp: Date.now(),
              });
            }
          }
        );
      } catch {
        resolve({
          success: false,
          url,
          error: '메시지 전송 중 오류가 발생했습니다.',
          timestamp: Date.now(),
        });
      }
    } else {
      resolve({
        success: false,
        url,
        error: '크롬 브라우저에서만 사용 가능합니다.\n쿠팡 판매량 추적기가 설치되어 있는지 확인해주세요.',
        timestamp: Date.now(),
      });
    }
  });
};

// 익스텐션 연결 상태 확인
export const checkExtensionStatus = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const chromeApi = getChrome();
    
    if (chromeApi?.runtime?.sendMessage) {
      try {
        chromeApi.runtime.sendMessage(
          EXTENSION_ID,
          { type: 'PING' },
          (response) => {
            const hasError = chromeApi.runtime?.lastError;
            resolve(!hasError && (response as { success?: boolean })?.success === true);
          }
        );
      } catch {
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
};

// 익스텐션 ID 설정 (동적으로 변경할 수 있도록)
export const setExtensionId = (id: string) => {
  // Note: 실제로는 EXTENSION_ID를 변경할 수 없으므로
  // localStorage에 저장하여 관리하는 방식 사용
  localStorage.setItem('coupang_extension_id', id);
};

export const getExtensionId = (): string => {
  return localStorage.getItem('coupang_extension_id') || EXTENSION_ID;
};
