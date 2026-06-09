# Longsday.com — 国际货运代理公司官网

中英双语静态网站，Vercel 一键部署。

## 项目结构

```
website/
├── index.html          # 首页 (Hero + 服务概览 + 优势 + CTA)
├── services.html       # 服务详情 (海运/空运/铁路/DDP/FBA/多式联运)
├── about.html          # 关于我们 (公司介绍 + 价值观 + 地址)
├── tools.html          # 物流工具 (HS编码查询 + 集装箱/提单追踪)
├── contact.html        # 联系我们 (表单 + 联系信息)
├── cases.html          # 案例展示 (从 data/cases.js 动态加载)
├── admin.html          # 🔐 后台管理 (传中文→自动翻译中英双语)
├── css/
│   └── style.css       # 全局样式 (品牌色体系)
├── js/
│   ├── i18n.js         # 中英双语切换系统
│   ├── main.js         # 导航/菜单/滚动
│   └── tools.js        # HS编码 + 集装箱追踪逻辑
├── data/
│   └── cases.js        # 案例数据 (LONGSDAY_CASES 数组)
├── assets/
│   ├── logo.png        # 公司 Logo
│   └── cases/          # 案例图片目录
├── tools/
│   └── upload_case.py  # Word文档→双语案例 (命令行工具)
└── README.md           # 本文件
```

## 🚀 部署到 Vercel (免费)

### 方法一：Vercel CLI (推荐)

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 进入项目目录部署
cd E:\longsday\website
vercel

# 3. 按提示操作：
#    - Set up and deploy? → Y
#    - Which scope? → 你的账号
#    - Link to existing project? → N
#    - Project name? → longsday
#    - Root directory? → ./
#    - Override settings? → N

# 4. 绑定自定义域名
vercel domain add longsday.com
```

### 方法二：拖拽部署

1. 打开 https://vercel.com/new
2. 把 `website/` 整个文件夹拖进去
3. 自动部署完成

### 方法三：GitHub 自动部署

```bash
cd E:\longsday\website
git init
git add .
git commit -m "Initial: Longsday website"
gh repo create longsday-website --public --push
# 然后在 vercel.com 导入 GitHub 仓库
```

### 域名解析 (longsday.com)

之前调研确认：DNS 由网易 IT 团队代管。

部署到 Vercel 后：
1. 在 Vercel Dashboard → Settings → Domains → 添加 `longsday.com`
2. Vercel 会给出 CNAME 记录值（类似 `cname.vercel-dns.com`）
3. 把 CNAME 记录值发给网易 IT 团队，请他们添加解析
4. 等待 DNS 生效（1-10分钟）

## 🔐 后台管理 (admin.html)

### 访问地址
- 线上：`https://longsday.com/admin.html`
- 本地：双击 `admin.html` 在浏览器打开

### 默认密码
```
longsday2026
```
修改密码：编辑 `admin.html`，搜索 `ADMIN_PASSWORD` 并修改值。

### 工作流程

1. **设置 API Key**（首次使用）
   - 展开页面顶部的「⚙️ API 设置」
   - 输入 DeepSeek API Key（`sk-...`）
   - 点击「测试」确认有效 → 自动保存到浏览器

2. **创建案例**
   - 左侧输入中文标题 + 内容
   - 点击「🌐 翻译为英文」→ 右侧自动填充
   - 检查和微调英文翻译
   - 点击「📋 生成案例代码」→ 「📎 复制代码」

3. **发布案例**
   - 打开 `data/cases.js`
   - 粘贴到 `LONGSDAY_CASES` 数组里
   - 重新部署（`vercel --prod`）或提交 git

## 📄 Word 文档批量上传 (命令行)

```bash
# 安装依赖 (只需一次)
pip install python-docx requests

# 单个文件
python tools/upload_case.py "案例-海运大单.docx"

# 多个文件
python tools/upload_case.py 案例1.docx 案例2.docx 案例3.docx

# 整个目录
python tools/upload_case.py ./待上传案例/

# 仅提取内容不翻译 (预览用)
python tools/upload_case.py 案例.docx --dry-run

# 指定输出文件
python tools/upload_case.py 案例.docx -o data/cases.js
```

API Key 自动从以下来源读取（优先级从高到低）：
1. `--api-key sk-xxx` 命令行参数
2. `DEEPSEEK_API_KEY` 环境变量
3. `E:\Smartsimo\config.yaml` (SIMO 项目配置)

## 📧 联系表单配置

使用 Vercel Serverless Function + 网易企业邮箱 SMTP，零第三方依赖。

### 部署前唯一需要做的事：获取 SMTP 授权码

1. 登录网易企业邮箱管理后台：https://qiye.163.com
2. 找到「邮箱设置 → 客户端授权密码」
3. 为 `lily-qian@longsday.com` 生成一个**客户端授权码**（不是登录密码）
4. 在 Vercel 后台 → Settings → Environment Variables 添加：
   ```
   SMTP_PASS = 你的授权码
   ```
5. 重新部署：`vercel --prod`

> ⚠️ 如果不设置 SMTP_PASS 环境变量，联系表单会返回 500 错误。

## 🎨 品牌色板

| 色值 | 用途 |
|------|------|
| `#162d59` | 主色 (Navy) — 按钮、标题、强调 |
| `#142a53` | 深色 — Footer 背景 |
| `#46659b` | 辅助色 (Steel) — 链接、装饰 |
| `#97aab1` | 浅钢蓝 — 次要文字 |
| `#f9f7e8` | 背景 (Cream) — Hero、区块底色 |
| `#1c1b19` | 正文黑 — 段落文字 |

## 🗺️ 待补充的内容

- [ ] 公司办公室照片 (`about.html` 中替换占位区)
- [ ] 各服务流程图/航线图 (`services.html` 中替换虚线框)
- [ ] 案例配图 (放入 `assets/cases/` 并在 `data/cases.js` 中引用)
- [ ] 百度/谷歌地图嵌入 (`about.html` 底部)
- [ ] 联系表单 Formspree ID 替换
- [ ] 修改 admin 默认密码

## 📝 技术说明

- **纯静态**：无后端、无数据库，部署到任何静态托管
- **双语系统**：基于 CSS `[lang]` 属性 + localStorage 记忆
- **响应式**：桌面/平板/手机三端适配
- **SEO**：每页独立 `<title>` + `<meta description>`
- **无框架**：零依赖，打开即用
