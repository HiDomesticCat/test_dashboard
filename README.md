# Project Sentinel Fusion - XDR 關聯分析儀表板

專為資安監控與事件調查設計的企業級儀表板，整合 NDR (Packetbeat) 與 EDR (FleetDM) 數據，提供即時威脅關聯分析與業務風險可視化。

## 核心特色

- **業務導向威脅分析**: 將技術告警與業務流程重要性關聯
- **EDR/NDR 統一視圖**: 端點行為與網路流量無縫整合
- **互動式調查工具**: 任何圖表元素都可作為篩選器
- **即時事件推播**: WebSocket 驅動的實時更新

## 技術架構

### 後端 (Backend)
- **框架**: Express.js + Socket.IO
- **數據來源**: 模擬 Packetbeat (NDR) 與 FleetDM (EDR) 數據
- **API**: RESTful endpoints + WebSocket 事件推播
- **端口**: 5050

### 前端 (Frontend)
- **框架**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **圖表**: ECharts (echarts-for-react)
- **狀態管理**: TanStack Query (React Query)
- **端口**: 5173

## 快速啟動

### 1. 啟動後端服務

```bash
cd sentinel-fusion-app/backend
npm install
npm run dev
```

後端將在 http://localhost:5050 提供 API 服務。

### 2. 啟動前端應用

```bash
cd sentinel-fusion-app/frontend
npm install
npm run dev
```

前端將在 http://localhost:5173 提供 Web 介面。

### 3. 訪問儀表板

開啟瀏覽器造訪 http://localhost:5173，即可看到完整的 XDR 關聯分析儀表板。

## 儀表板功能

### 第一排：安全狀態總覽
- **EDR 嚴重告警主機**: 遭遇 critical 威脅的主機數量
- **NDR 高風險連線**: 可疑 TLS 憑證或 DNS 查詢
- **受影響的關鍵業務**: 核心業務流程受威脅情況
- **告警總數 (24H)**: 過去 24 小時告警統計

### 第二排：威脅樣貌分析
- **全球威脅地圖**: 攻擊來源與目標地理分佈
- **Top 10 受攻擊業務流程**: 識別主要攻擊目標
- **Top 10 攻擊手法**: 當前主流 TTPs 分析

### 第三排：橫向移動監控
- **業務系統間存取熱力圖**: 發現異常跨業務存取
- **高流量資料外洩監控**: 偵測異常 outbound 流量

### 第四排：統一事件時間軸
- **EDR + NDR 整合視圖**: 完整攻擊鏈重建
- **互動式篩選**: 點擊任何圖表元素即時篩選相關事件

## 環境變數

### 前端 (.env)
```
VITE_API_BASE=http://localhost:5050
```

### 後端 (.env)
```
PORT=5050
NODE_ENV=development
```

## 開發指令

### 後端
```bash
npm run dev     # 開發模式 (nodemon)
npm start       # 生產模式
npm test        # 執行測試
```

### 前端
```bash
npm run dev     # 開發伺服器
npm run build   # 建置生產版本
npm run preview # 預覽建置結果
npm run lint    # ESLint 檢查
```

## 專案結構

```
sentinel-fusion-app/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express 主程式
│   │   └── services/
│   │       ├── data-service.js      # 數據處理服務
│   │       └── playback-service.js  # 事件播放服務
│   └── data/
│       ├── edr_alerts.json          # EDR 模擬數據
│       └── ndr_flows.json           # NDR 模擬數據
└── frontend/
    ├── src/
    │   ├── components/              # React 組件
    │   │   ├── MetricsGrid.tsx      # 安全狀態總覽
    │   │   ├── ThreatLandscape.tsx  # 威脅樣貌分析
    │   │   ├── LateralMovement.tsx  # 橫向移動監控
    │   │   └── Timeline.tsx         # 統一事件時間軸
    │   ├── hooks/
    │   │   └── useInvestigationFilters.tsx
    │   └── lib/
    │       ├── api.ts               # API 客戶端
    │       └── api.types.ts         # TypeScript 型別定義
    └── public/
```

## 範例調查流程

1. **發現威脅**: 在「受影響的關鍵業務」看到數字異常
2. **定位來源**: 點擊「Top 10 受攻擊業務流程」中的目標業務
3. **分析路徑**: 觀察「全球威脅地圖」確認攻擊來源地理位置
4. **追蹤行為**: 在「業務系統間存取熱力圖」發現異常橫向移動
5. **重建攻擊鏈**: 在「統一事件時間軸」查看完整 EDR/NDR 事件序列

## 技術說明

- 使用 ECS (Elastic Common Schema) 標準化數據格式
- 支援即時數據更新與歷史事件回放
- 響應式設計，支援桌面與平板設備
- 深色主題優化，適合 SOC 環境長時間使用

## 授權

本專案為 Project Sentinel Fusion 的一部分，專為企業資安監控需求設計。
