// ============================================
// background.js - 쿠팡 윙 스마트 분석기
// 내부(content.js) + 외부(웹앱) 메시지 처리
// ============================================

// 대기 중인 분석 요청 저장 (로그인 후 재시도용)
let pendingAnalysis = null;
let loginTabId = null;

// ========================================
// 내부 메시지 처리 (content.js에서 오는 요청)
// ========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_SALES") {
    chrome.cookies.getAll({ domain: "wing.coupang.com" }, (cookies) => {
      if (!cookies || cookies.length === 0) {
        sendResponse({ success: false, code: "LOGIN_REQUIRED" });
        return;
      }
      requestWingApi(request.productId, sendResponse);
    });
    return true;
  }
});

// ========================================
// 탭 업데이트 모니터링 (로그인 완료 감지)
// ========================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 로그인 탭이 아니면 무시
  if (tabId !== loginTabId) return;
  
  // URL 변경 또는 페이지 로드 완료 시
  if (changeInfo.url || changeInfo.status === "complete") {
    const currentUrl = changeInfo.url || tab.url;
    console.log("[Extension] 로그인 탭 상태:", changeInfo.status, "URL:", currentUrl);
    
    if (!currentUrl) return;
    
    // Wing 로그인 페이지가 아닌 Wing 페이지로 이동했으면 로그인 성공
    // 또는 Wing 메인/대시보드로 리다이렉트 된 경우
    const isWingPage = currentUrl.includes("wing.coupang.com");
    const isLoginPage = currentUrl.includes("/login") || currentUrl.includes("/sso");
    
    if (isWingPage && !isLoginPage) {
      console.log("[Extension] Wing 로그인 성공 감지! URL:", currentUrl);
      
      // 약간의 딜레이 후 쿠키 확인 (쿠키 설정 대기)
      setTimeout(() => {
        chrome.cookies.getAll({ domain: "wing.coupang.com" }, (cookies) => {
          console.log("[Extension] Wing 쿠키 수:", cookies ? cookies.length : 0);
          
          if (cookies && cookies.length > 0) {
            console.log("[Extension] Wing 쿠키 확인됨, 탭 닫고 분석 재시도");
            
            // 로그인 탭 닫기
            chrome.tabs.remove(tabId);
            loginTabId = null;
            
            // 대기 중인 분석 재시도
            if (pendingAnalysis) {
              const { productId, vendorItemId, url, serverUrl, sendResponse } = pendingAnalysis;
              pendingAnalysis = null;
              requestWingApiForExternal(productId, vendorItemId, url, serverUrl, sendResponse);
            }
          }
        });
      }, 500);
    }
  }
});

// 탭 닫힘 감지 (사용자가 수동으로 닫은 경우)
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === loginTabId) {
    console.log("[Extension] 로그인 탭이 닫힘");
    loginTabId = null;
    
    // 대기 중인 요청에 취소 응답
    if (pendingAnalysis) {
      pendingAnalysis.sendResponse({
        success: false,
        url: pendingAnalysis.url,
        error: "로그인이 취소되었습니다.",
        code: "LOGIN_CANCELLED",
        timestamp: Date.now()
      });
      pendingAnalysis = null;
    }
  }
});

// ========================================
// Wing 로그인 페이지 열기
// ========================================
function openWingLogin(productId, vendorItemId, url, serverUrl, sendResponse) {
  console.log("[Extension] Wing 로그인 페이지 열기");
  
  // 이미 로그인 탭이 열려있으면 포커스
  if (loginTabId) {
    chrome.tabs.update(loginTabId, { active: true });
    return;
  }
  
  // 대기 중인 분석 요청 저장
  pendingAnalysis = { productId, vendorItemId, url, serverUrl, sendResponse };
  
  // 로그인 페이지 열기
  chrome.tabs.create({ 
    url: "https://wing.coupang.com/login",
    active: true
  }, (tab) => {
    loginTabId = tab.id;
    console.log("[Extension] 로그인 탭 생성:", tab.id);
  });
}

// ========================================
// 외부 메시지 처리 (웹앱에서 오는 요청)
// ========================================
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log("[Extension] 외부 메시지 수신:", request, "from:", sender.origin);

  // 연결 확인용 핑
  if (request.type === "PING") {
    sendResponse({ success: true, message: "Extension connected" });
    return true;
  }

  // URL 분석 요청
  if (request.type === "ANALYZE_URL") {
    const url = request.url;
    
    // 쿠팡 상품 URL인지 확인 + vendorItemId 추출
    const productMatch = url.match(/coupang\.com\/vp\/products\/(\d+)/);
    const vendorItemMatch = url.match(/vendorItemId=(\d+)/);
    
    if (!productMatch) {
      sendResponse({
        success: false,
        url: url,
        error: "쿠팡 상품 URL이 아닙니다. (예: https://www.coupang.com/vp/products/12345)",
        timestamp: Date.now()
      });
      return true;
    }

    const productId = productMatch[1];
    const vendorItemId = vendorItemMatch ? vendorItemMatch[1] : null;

    // 쿠키 확인 후 API 호출
    chrome.cookies.getAll({ domain: "wing.coupang.com" }, (cookies) => {
      if (!cookies || cookies.length === 0) {
        // 로그인 안됨 -> 로그인 페이지 열기
        openWingLogin(productId, vendorItemId, url, request.serverUrl, sendResponse);
        return;
      }

      // Wing API 호출
      requestWingApiForExternal(productId, vendorItemId, url, request.serverUrl, sendResponse);
    });
    return true;
  }
});

// ========================================
// Wing API 호출 함수 (내부용 - content.js)
// ========================================
function requestWingApi(productId, sendResponse) {
  const apiUrl = "https://wing.coupang.com/tenants/seller-web/pre-matching/search";
  const payload = {
    keyword: productId,
    excludedProductIds: [],
    searchPage: 0,
    searchOrder: "DEFAULT",
    sortType: "DEFAULT"
  };

  fetch(apiUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then((res) => {
      if (res.type === "opaqueredirect" || res.status === 0 || res.status >= 400) {
        throw new Error("LOGIN_REQUIRED");
      }
      return res.text();
    })
    .then((text) => {
      try {
        const data = JSON.parse(text);
        if (data.result && Array.isArray(data.result)) {
          sendResponse({ success: true, result: data.result });
        } else {
          sendResponse({ success: false, message: "NO_DATA" });
        }
      } catch (e) {
        throw new Error("LOGIN_REQUIRED");
      }
    })
    .catch((err) => {
      sendResponse({ success: false, code: "LOGIN_REQUIRED" });
    });
}


// ========================================
// deliveryMethod 값 변환 함수
// ========================================
function getDeliveryMethodLabel(deliveryMethod) {
  if (!deliveryMethod) return null;
  if (deliveryMethod === "OVERSEA") return "해외 배송";
  if (deliveryMethod === "DOMESTIC") return "국내배송";
  return deliveryMethod;
}

// ========================================
// Wing API 호출 함수 (외부용 - 웹앱)
// ========================================
async function requestWingApiForExternal(productId, vendorItemId, originalUrl, serverUrl, sendResponse) {
  const apiUrl = "https://wing.coupang.com/tenants/seller-web/pre-matching/search";
  const payload = {
    keyword: productId,
    excludedProductIds: [],
    searchPage: 0,
    searchOrder: "DEFAULT",
    sortType: "DEFAULT"
  };

  try {
    console.log("[Extension] Wing API 호출 시작");

    const res = await fetch(apiUrl, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.type === "opaqueredirect" || res.status === 0 || res.status >= 400) {
      throw new Error("LOGIN_REQUIRED");
    }

    const text = await res.text();
    const data = JSON.parse(text);
    
    if (data.result && Array.isArray(data.result)) {
      const products = data.result;

      // 데이터 가공
      let totalSales = 0, totalViews = 0, totalRevenue = 0;
      let thumbnail = null;
      
      const processedProducts = products.map((p, index) => {
        const sales = p.salesLast28d || 0;
        const price = p.salePrice || 0;
        const views = p.pvLast28Day || 0;
        const revenue = sales * price;
        const profit = revenue * 0.2;

        totalSales += sales;
        totalViews += views;
        totalRevenue += revenue;

        // 첫 번째 상품의 imagePath로 썸네일 URL 구성
        if (index === 0 && p.imagePath) {
          thumbnail = "https://thumbnail6.coupangcdn.com/thumbnails/remote/260x260/image/" + p.imagePath;
          console.log("[Extension] Wing API 썸네일:", thumbnail);
        }

        return {
          productName: p.productName,
          brandName: p.brandName || "-",
          manufacture: p.manufacture || "-",
          sales: sales,
          price: price,
          views: views,
          rating: p.rating || 0,
          reviewCount: p.ratingCount || 0,
          revenue: revenue,
          profit: profit,
          conversionRate: views > 0 ? ((sales / views) * 100).toFixed(2) : "0.00",
          imagePath: p.imagePath || null,
          deliveryMethod: getDeliveryMethodLabel(p.deliveryMethod)
        };
      });

      const analysisResult = {
        success: true,
        url: originalUrl,
        productId: productId,
        thumbnail: thumbnail,
        timestamp: Date.now(),
        summary: {
          totalProducts: products.length,
          totalSales: totalSales,
          totalViews: totalViews,
          totalRevenue: totalRevenue,
          totalProfit: totalRevenue * 0.2,
          avgConversionRate: totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(2) : "0.00"
        },
        products: processedProducts
      };

      // 서버로 전송 (serverUrl이 제공된 경우)
      if (serverUrl) {
        try {
          await sendToServer(serverUrl, analysisResult);
          console.log("[Extension] 서버 전송 완료");
          sendResponse({ ...analysisResult, serverSent: true });
        } catch (err) {
          console.error("[Extension] 서버 전송 실패:", err);
          sendResponse({ ...analysisResult, serverSent: false, serverError: err.message });
        }
      } else {
        sendResponse(analysisResult);
      }
    } else {
      sendResponse({
        success: false,
        url: originalUrl,
        error: "해당 상품에 대한 데이터가 없습니다.",
        timestamp: Date.now()
      });
    }
  } catch (err) {
    sendResponse({
      success: false,
      url: originalUrl,
      error: "윙(Wing) 로그인이 필요합니다.",
      code: "LOGIN_REQUIRED",
      timestamp: Date.now()
    });
  }
}

// ========================================
// 서버로 데이터 전송
// ========================================
async function sendToServer(serverUrl, data) {
  const response = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return response.json();
}
