/* ============================================================
   Longsday — Case Studies / News Data
   ============================================================
   To add a new case:
     1. Add an entry to the CASES array below
     2. Or use /admin.html to generate entries visually
     3. Or run: python tools/upload_case.py your-file.docx
   ============================================================ */

var LONGSDAY_CASES = [
  {
    id: "case-001",
    date: "2026-05",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "850 Tons Steel Structure — Ningbo to Hamburg Turnkey Delivery",
    titleZh: "850吨钢结构 — 宁波至汉堡全程交付",
    summary: "Full container load shipment of prefabricated steel structures for a German construction project. Managed 52×40HQ containers over 8 weeks with on-time delivery and zero damage.",
    summaryZh: "整柜海运预制钢结构，服务德国建筑项目。8周内完成52个40尺高柜的发运，准时交付、零货损。",
    thumb: "assets/cases/case13-frame container delivery.jpg"
  },
  {
    id: "case-002",
    date: "2026-03",
    tag: "DDP",
    tagZh: "DDP税后到门",
    title: "DDP Door-to-Door: Consumer Electronics to 7 EU Countries",
    titleZh: "DDP门到门：消费电子产品覆盖7个欧盟国家",
    summary: "End-to-end DDP solution for a Shenzhen electronics brand expanding to Europe. Handled customs clearance, tax payment, and last-mile delivery across Germany, France, Italy, Spain, Netherlands, Belgium, and Poland.",
    summaryZh: "为深圳消费电子品牌提供欧盟7国DDP到门服务，含清关、缴税和最后一公里派送，覆盖德法意西荷比波。",
    thumb: "assets/cases/case8-electric tools delivery.jpg"
  },
  {
    id: "case-003",
    date: "2026-01",
    tag: "Railway",
    tagZh: "铁路",
    title: "China-Europe Railway Express — Auto Parts to Poland in 19 Days",
    titleZh: "中欧班列：汽车配件19天门到门波兰",
    summary: "Rail freight solution for automotive parts from Chongqing to Warsaw. 19-day transit, 40% cost saving vs air freight, reliable weekly departures for just-in-time supply chain.",
    summaryZh: "重庆至华沙铁路专线，汽车配件19天门到门。相比空运节省40%成本，每周稳定班次支持准时制供应链。",
    thumb: "assets/cases/case7-machine delivery.jpg"
  },
  {
    id: "case-004",
    date: "2025-11",
    tag: "DG Cargo",
    tagZh: "危险品运输",
    title: "Battery DG Cargo — Safe Sea Freight to North America",
    titleZh: "电池危险品 — 安全海运至北美",
    summary: "UN3480 lithium battery shipment handled under full IMO dangerous goods compliance. Special DG packaging, reinforced isolation, MSDS documentation, and certified DG container loading — all managed end-to-end with zero incidents.",
    summaryZh: "UN3480锂电池危险品海运至北美，全程符合IMO危规标准。专业危包、加固隔离、MSDS单证、持证装箱——端到端零事故交付。",
    thumb: "assets/cases/case6-battery delivery.jpg"
  },
  {
    id: "case-005",
    date: "2025-09",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "Security Door Export — Ningbo to Middle East Full Container",
    titleZh: "防盗门出口 — 宁波至中东整柜海运",
    summary: "Bulk shipment of security doors from Ningbo to Dubai. Custom packaging for long-haul ocean transport with reinforced crating to prevent in-transit damage.",
    summaryZh: "防盗门批量出口中东，宁波至迪拜整柜海运。定制加固包装方案，确保长途海运零货损。",
    thumb: "assets/cases/case1-security door delivery.jpg"
  },
  {
    id: "case-006",
    date: "2025-08",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "Fabric & Textile — Container Export to Southeast Asia",
    titleZh: "布料产品 — 集装箱海运至东南亚",
    summary: "Full container loads of fabric and textile products shipped from China to Southeast Asian markets. Competitive short-sea rates with fast transit times (5-8 days). Full export documentation, customs clearance, and port-to-port or door-to-door service across Vietnam, Thailand, Indonesia, and the Philippines.",
    summaryZh: "布料及纺织产品整柜从中国发往东南亚各国。近洋航线优势运价，航程仅5-8天。全套出口单证、报关清关、港到港或门到门服务，覆盖越南、泰国、印尼、菲律宾等主要市场。",
    thumb: "assets/cases/case2-fabric to Southeast Asia.jpg"
  },
  {
    id: "case-007",
    date: "2025-07",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "Outdoor Lighting — FCL to North America",
    titleZh: "户外灯具 — 整柜海运北美",
    summary: "Full container load of outdoor lighting fixtures from Ningbo to Los Angeles. Full service including export documentation, fumigation, and destination customs clearance.",
    summaryZh: "户外灯具整柜从宁波发往洛杉矶。全套出口单证、熏蒸处理和目的港清关一站式服务。",
    thumb: "assets/cases/case5-outdoor lamp (1).jpg"
  },
  {
    id: "case-008",
    date: "2025-06",
    tag: "Special Cargo",
    tagZh: "特种货运输",
    title: "Art Lighting Sculpture — Theme Park Delivery to Middle East",
    titleZh: "艺术灯光雕塑 — 主题公园项目交付中东客户",
    summary: "Oversized illuminated art sculpture transported from China to a theme park project in the Middle East. Climate-controlled container, custom crating for fragile components, and on-site crane-assisted unloading. White-glove delivery to the park installation site.",
    summaryZh: "大型艺术灯光雕塑从中国运输至中东主题公园项目。恒温柜运输、易碎部件定制木箱、目的地吊机卸货、白手套派送至园区安装点。",
    thumb: "assets/cases/case12-are sculpture delivery.jpg"
  },
  {
    id: "case-009",
    date: "2025-05",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "Garden Furniture — Multi-country DDP to Europe",
    titleZh: "户外花园家具 — 欧盟多国DDP到门",
    summary: "Garden benches and outdoor furniture DDP delivery to Germany, Netherlands, and France. Tax-paid door-to-door with customs clearance included.",
    summaryZh: "花园长椅和户外家具DDP到门派送德国、荷兰和法国。含税含清关门到门全程。",
    thumb: "assets/cases/case10-garden bench delivery.jpg"
  },
  {
    id: "case-010",
    date: "2025-04",
    tag: "Sea Freight",
    tagZh: "海运",
    title: "Vanity Cabinets — LCL Consolidation to Australia",
    titleZh: "浴室柜 — 拼箱海运至澳大利亚",
    summary: "Bathroom vanity cabinets shipped via LCL consolidation service to Sydney and Melbourne. Cost-effective solution for small-to-medium volume buyers.",
    summaryZh: "浴室柜通过拼箱服务发往悉尼和墨尔本。为中小批量客户提供高性价比物流方案。",
    thumb: "assets/cases/case4-vanitary base cabinet delivery.JPG"
  },
  {
    id: "case-011",
    date: "2025-03",
    tag: "LCL",
    tagZh: "拼箱 & 仓储",
    title: "LCL Consolidation & Yard Operations — Container Terminal, Warehouse & CFS",
    titleZh: "LCL拼箱 & 堆场作业 — 集装箱码头、仓库与CFS操作",
    summary: "Comprehensive LCL consolidation services from our bonded warehouse and container freight station (CFS). Cargo receiving, sorting, palletizing, consolidation into shared containers, and terminal delivery. Full yard and warehouse operation coverage with in-house team for maximum cost efficiency on small-to-medium shipments.",
    summaryZh: "保税仓 + CFS拼箱一站式服务：收货、分拣、打托、拼柜、进港全程自营操作。自有仓库和堆场团队，中小批量货物拼箱出口的最佳成本方案。",
    thumbs: [
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (1).jpg",
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (12).jpg",
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (13).jpg",
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (18).jpg",
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (19).jpg",
      "assets/cases/case14-warehouse&yard operation/case14-warehouse&yard operation (20).jpg"
    ]
  },
  {
    id: "case-012",
    date: "2025-02",
    tag: "Special Equipment",
    tagZh: "特种柜",
    title: "Open Top Container — Over-height Cargo Transport Solution",
    titleZh: "开顶集装箱 — 超高货物特种运输方案",
    summary: "When standard containers can't fit over-height cargo, open top containers provide the solution. We offer professional open top container loading, waterproof tarp covering, and lashing for machinery, large sculptures, and construction equipment. Full port handling and special equipment coordination included.",
    summaryZh: "当货物超高、标准集装箱无法装载时，开顶柜是最佳方案。提供专业开顶箱装箱、防水篷布遮盖和加固服务，适用于机械设备、大型雕塑、工程物资等超高货物。含港口特种柜协调和全程操作。",
    thumb: "assets/cases/case12-top open container delivery.jpg"
  }
];
