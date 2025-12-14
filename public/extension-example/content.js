// ============================================
// content.js - 쿠팡 상품 페이지용 (기존 기능 유지)
// ============================================

function injectStyles() {
  if (document.getElementById("wingStyle")) return;
  const style = document.createElement("style");
  style.id = "wingStyle";
  style.textContent = `
    #wingOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 999998; }
    #wingModal { 
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #f5f6f7; z-index: 999999; width: 800px; max-height: 90vh;
        overflow-y: auto; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        font-family: 'Apple SD Gothic Neo', sans-serif;
    }
    .wing-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; padding: 30px; border-radius: 16px 16px 0 0;
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        text-align: center;
    }
    .wh-item { display: flex; flex-direction: column; gap: 5px; }
    .wh-label { font-size: 13px; opacity: 0.9; font-weight: 500; }
    .wh-value { font-size: 28px; font-weight: 800; }
    
    .wing-body { padding: 20px; }
    .product-box {
        background: white; border-radius: 12px; padding: 20px;
        margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .pb-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #333; }
    .pb-brand { font-size: 13px; color: #666; margin-bottom: 20px; }
    
    .pb-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;
    }
    .pg-item {
        border: 1px solid #eee; border-radius: 10px; padding: 15px 10px;
        text-align: center; background: #fff;
    }
    .pg-label { font-size: 12px; color: #888; margin-bottom: 5px; }
    .pg-value { font-size: 18px; font-weight: bold; color: #333; }
    
    .c-green { color: #2ecc71; }
    .c-blue { color: #3498db; }
    .c-orange { color: #e67e22; }
    
    .close-btn {
        width: 100%; padding: 15px; background: #764ba2; color: white;
        border: none; font-size: 16px; font-weight: bold; cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function displayWingModal(products) {
  const oldModal = document.getElementById("wingModal");
  if (oldModal) oldModal.remove();
  const oldOverlay = document.getElementById("wingOverlay");
  if (oldOverlay) oldOverlay.remove();

  injectStyles();
  
  const overlay = document.createElement("div"); overlay.id = "wingOverlay";
  const modal = document.createElement("div"); modal.id = "wingModal";

  let tSales = 0, tViews = 0, tRevenue = 0, tProfit = 0;
  
  products.forEach(p => {
    p._sales = p.salesLast28d || 0;
    p._price = p.salePrice || 0;
    p._views = p.pvLast28Day || 0;
    p._rating = p.rating || 0;
    p._review = p.ratingCount || 0;
    
    p._revenue = p._sales * p._price;
    p._profit = p._revenue * 0.2;
    
    tSales += p._sales;
    tViews += p._views;
    tRevenue += p._revenue;
    tProfit += p._profit;
  });

  const avgConv = tViews > 0 ? ((tSales / tViews) * 100).toFixed(2) : "0.00";

  let html = `
    <div class="wing-header">
        <div class="wh-item"><span class="wh-label">상품 수</span><span class="wh-value">${products.length}</span></div>
        <div class="wh-item"><span class="wh-label">총 판매량(28일)</span><span class="wh-value">${tSales.toLocaleString()}</span></div>
        <div class="wh-item"><span class="wh-label">총 조회수</span><span class="wh-value">${tViews.toLocaleString()}</span></div>
        
        <div class="wh-item"><span class="wh-label">평균 전환율</span><span class="wh-value">${avgConv}%</span></div>
        <div class="wh-item"><span class="wh-label">총 매출(28일)</span><span class="wh-value">${Math.round(tRevenue).toLocaleString()}원</span></div>
        <div class="wh-item"><span class="wh-label">총 순수익(예상)</span><span class="wh-value">${Math.round(tProfit).toLocaleString()}원</span></div>
    </div>
    <div class="wing-body">
  `;

  products.forEach((p, i) => {
    const conv = p._views > 0 ? ((p._sales / p._views) * 100).toFixed(2) : "0.00";
    
    html += `
      <div class="product-box">
        <div class="pb-title">${i+1}. ${p.productName}</div>
        <div class="pb-brand">브랜드: ${p.brandName || '-'} / 제조사: ${p.manufacture || '-'}</div>
        
        <div class="pb-grid">
            <div class="pg-item"><div class="pg-label">판매량</div><div class="pg-value c-green">${p._sales.toLocaleString()}</div></div>
            <div class="pg-item"><div class="pg-label">판매가</div><div class="pg-value c-blue">${p._price.toLocaleString()}</div></div>
            <div class="pg-item"><div class="pg-label">매출</div><div class="pg-value c-orange">${Math.round(p._revenue).toLocaleString()}</div></div>
            <div class="pg-item"><div class="pg-label">순수익(20%)</div><div class="pg-value c-green">${Math.round(p._profit).toLocaleString()}</div></div>
            
            <div class="pg-item"><div class="pg-label">조회수</div><div class="pg-value c-blue">${p._views.toLocaleString()}</div></div>
            <div class="pg-item"><div class="pg-label">전환율</div><div class="pg-value">${conv}%</div></div>
            <div class="pg-item"><div class="pg-label">평점</div><div class="pg-value c-orange">⭐ ${p._rating}</div></div>
            <div class="pg-item"><div class="pg-label">리뷰수</div><div class="pg-value c-blue">${p._review.toLocaleString()}</div></div>
        </div>
      </div>
    `;
  });

  html += `</div><button class="close-btn" id="wingClose">닫기</button>`;
  
  modal.innerHTML = html;
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  const closeFunc = () => { overlay.remove(); modal.remove(); };
  overlay.onclick = closeFunc;
  document.getElementById('wingClose').onclick = closeFunc;
}

function initExtension() {
  const match = window.location.pathname.match(/\/products\/(\d+)/);
  if (!match) return;
  const productId = match[1];

  if (document.getElementById("wing-btn")) return;
  const btn = document.createElement('button');
  btn.id = "wing-btn";
  btn.innerText = "📈 쿠팡 분석";
  
  btn.style.cssText = `
    position: fixed; top: 120px; right: 20px; z-index: 9999;
    padding: 12px 20px; background: linear-gradient(135deg,#667eea,#764ba2);
    color: white; border: none; border-radius: 30px; 
    font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    font-family: sans-serif; font-size: 14px;
  `;

  btn.onclick = () => {
    btn.innerText = "분석 중...";
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: "GET_SALES", productId: productId }, (res) => {
      btn.disabled = false;
      if (chrome.runtime.lastError) {
        alert("업데이트됨. 새로고침 필요.");
        return;
      }
      
      if (!res.success && res.code === "LOGIN_REQUIRED") {
        btn.innerText = "⚠️ 윙 로그인 필요";
        btn.style.background = "#ff4b4b";
        btn.onclick = () => {
           window.open("https://wing.coupang.com/login", "_blank");
           location.reload(); 
        };
        return;
      }
      
      if (res.success) {
        btn.innerText = "📈 쿠팡 분석";
        btn.style.background = "linear-gradient(135deg,#667eea,#764ba2)";
        displayWingModal(res.result);
      } else {
        alert("데이터가 없습니다.");
        btn.innerText = "데이터 없음";
      }
    });
  };
  document.body.appendChild(btn);
}

initExtension();

// ============================================
// 배송 뱃지 조회 요청 처리 (background.js에서 요청)
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_DELIVERY_BADGE") {
    const { productId, vendorItemId } = request;
    console.log("[ContentScript] 배송 뱃지 조회 요청:", productId, vendorItemId);
    
    fetchDeliveryBadgeFromPage(productId, vendorItemId)
      .then(result => {
        console.log("[ContentScript] 배송 뱃지 결과:", result);
        sendResponse({ success: true, deliveryBadgeLabel: result });
      })
      .catch(err => {
        console.error("[ContentScript] 배송 뱃지 조회 실패:", err);
        sendResponse({ success: false, error: err.message });
      });
    
    return true; // 비동기 응답을 위해 필요
  }
});

async function fetchDeliveryBadgeFromPage(productId, vendorItemId) {
  const apiUrl = `https://www.coupang.com/next-api/products/quantity-info?productId=${productId}&vendorItemId=${vendorItemId}`;
  console.log("[ContentScript] API 호출:", apiUrl);
  
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { 
      "Accept": "application/json, text/plain, */*"
    },
    credentials: "include"
  });
  
  console.log("[ContentScript] 응답 상태:", response.status);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log("[ContentScript] 응답 데이터:", JSON.stringify(data).substring(0, 300));
  
  // moduleData 배열에서 pddList를 찾아 deliveryBadgeLabel 추출
  if (data.moduleData && Array.isArray(data.moduleData)) {
    for (const module of data.moduleData) {
      if (module.pddList && Array.isArray(module.pddList) && module.pddList.length > 0) {
        const deliveryBadgeLabel = module.pddList[0].deliveryBadgeLabel;
        if (deliveryBadgeLabel) {
          return deliveryBadgeLabel;
        }
      }
    }
  }
  
  return null;
}
