import { AnalysisResult } from '@/lib/extensionBridge';
import { Card } from '@/components/ui/card';
import { 
  ExternalLink,
  AlertCircle,
  ShoppingCart,
  Star,
  TrendingUp,
  DollarSign,
  Eye,
  Percent,
  Truck,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisResultProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  onRetryAnalysis?: () => void;
}

export const AnalysisResultDisplay = ({ result, isLoading, onRetryAnalysis }: AnalysisResultProps) => {
  if (isLoading) {
    return (
      <Card className="p-8 card-shadow">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-blue-200" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-blue-600 text-sm font-medium">Wing 데이터를 분석하는 중...</p>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="p-8 card-shadow border-dashed">
        <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              쿠팡 상품 URL을 입력하면 분석 결과가 여기에 표시됩니다
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!result.success) {
    return (
      <Card className="p-8 card-shadow border-destructive/30">
        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive mb-1">분석 실패</h3>
            <p className="text-muted-foreground text-sm max-w-md whitespace-pre-line">{result.error}</p>
            {(result.code === 'LOGIN_REQUIRED' || result.code === 'WING_NOT_LOGGED_IN') && (
              <div className="flex flex-col gap-2 mt-4">
                <a 
                  href="https://wing.coupang.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  쿠팡 Wing 로그인하기
                </a>
                {onRetryAnalysis && (
                  <button
                    onClick={onRetryAnalysis}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                  >
                    로그인 완료
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const { summary, products } = result;

  return (
    <div className="space-y-4">
      {/* Summary Header with Gradient - 2x3 Grid */}
      {summary && (
        <Card className="overflow-hidden card-shadow">
          <div className="bg-gradient-header text-white p-6">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <SummaryItem label="상품 수" value={summary.totalProducts.toString()} />
              <SummaryItem label="총 판매량" value={summary.totalSales.toLocaleString()} />
              <SummaryItem label="총 조회수 (28일)" value={summary.totalViews.toLocaleString()} />
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <SummaryItem label="평균 전환율" value={`${summary.avgConversionRate}%`} />
              <SummaryItem label="총 매출 (28일)" value={`${Math.round(summary.totalRevenue).toLocaleString()}원`} />
              <SummaryItem label="총 순수익 (28일)" value={`${Math.round(summary.totalProfit).toLocaleString()}원`} />
            </div>
          </div>
        </Card>
      )}

      {/* Products List */}
      {products && products.length > 0 && (
        <div className="space-y-4">
          {products.map((product, index) => (
            <Card key={index} className="p-5 card-shadow">
              {/* Product Header with Thumbnail */}
              <div className="mb-4 pb-4 border-b border-border flex gap-4">
                {/* Thumbnail */}
                {(product.thumbnail || product.imagePath) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={product.thumbnail || `https://thumbnail6.coupangcdn.com/thumbnails/remote/260x260/image/${product.imagePath}`}
                      alt={product.productName}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-foreground mb-1 line-clamp-2">
                    {index + 1}. {product.productName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    브랜드: {product.brandName} | 제조사: {product.manufacture}
                  </p>
                </div>
              </div>
              
              {/* Metrics Grid - 2x4 Layout with Icons */}
              <div className="space-y-3">
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard 
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    iconColor="text-emerald-500"
                    label="판매량 (28일)" 
                    value={product.sales.toLocaleString()} 
                    highlight
                    valueColor="text-emerald-600"
                  />
                  <MetricCard 
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    iconColor="text-blue-500"
                    label="판매가" 
                    value={`${product.price.toLocaleString()}원`} 
                  />
                  <MetricCard 
                    icon={<Package className="w-3.5 h-3.5" />}
                    iconColor="text-orange-500"
                    label="매출 (28일)" 
                    value={`${Math.round(product.revenue).toLocaleString()}원`}
                    highlight
                    valueColor="text-orange-500"
                  />
                  <MetricCard 
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    iconColor="text-emerald-500"
                    label="순수익 (28일)" 
                    value={`${Math.round(product.profit).toLocaleString()}원`}
                    highlight
                    valueColor="text-emerald-600"
                  />
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-3">
                  <MetricCard 
                    icon={<Eye className="w-3.5 h-3.5" />}
                    iconColor="text-teal-500"
                    label="조회수 (28일)" 
                    value={product.views.toLocaleString()} 
                  />
                  <MetricCard 
                    icon={<Percent className="w-3.5 h-3.5" />}
                    iconColor="text-indigo-500"
                    label="전환율" 
                    value={`${product.conversionRate}%`} 
                  />
                  <MetricCard 
                    icon={<Star className="w-3.5 h-3.5 fill-amber-400" />}
                    iconColor="text-amber-400"
                    label="평점" 
                    value={`${product.rating} (${product.reviewCount.toLocaleString()})`} 
                  />
                  <MetricCard 
                    icon={<Truck className="w-3.5 h-3.5" />}
                    iconColor="text-green-500"
                    label="배송" 
                    value={product.deliveryMethod || '-'} 
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface SummaryItemProps {
  label: string;
  value: string;
}

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <div>
    <p className="text-sm text-white/90 font-medium mb-1">{label}</p>
    <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
  </div>
);

interface MetricCardProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  highlight?: boolean;
  valueColor?: string;
}

const MetricCard = ({ icon, iconColor, label, value, highlight, valueColor }: MetricCardProps) => {
  // 값이 0이거나 빈 값인 경우 "데이터 수집중" 표시
  const isEmptyValue = value === '0' || value === '0원' || value === '0%' || value === '' || value === '-';
  const displayValue = isEmptyValue ? '데이터 수집중' : value;
  
  return (
    <div className="bg-slate-100 rounded-lg p-4 border border-slate-200 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className={iconColor}>{icon}</span>
        <p className="text-sm text-slate-600 font-medium">{label}</p>
      </div>
      <p className={cn(
        highlight ? "text-xl font-extrabold" : "text-lg font-bold",
        isEmptyValue ? "text-blue-500 text-sm" : (valueColor || "text-primary")
      )}>{displayValue}</p>
    </div>
  );
};