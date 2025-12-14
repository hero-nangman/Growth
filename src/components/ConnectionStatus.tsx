import { useEffect, useState } from 'react';
import { checkExtensionStatus } from '@/lib/extensionBridge';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const status = await checkExtensionStatus();
    setIsConnected(status);
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isChecking && "animate-spin")} />
      </button>
      
      <div className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium",
        isConnected === null && "bg-muted text-muted-foreground",
        isConnected === true && "bg-green-100 text-green-700",
        isConnected === false && "bg-red-100 text-red-700"
      )}>
        {isConnected === null ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
            <span>확인 중</span>
          </>
        ) : isConnected ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>연결됨</span>
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5" />
            <span>쿠팡 판매량 추적기를 설치해 주세요</span>
          </>
        )}
      </div>
    </div>
  );
};