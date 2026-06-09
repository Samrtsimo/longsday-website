#!/usr/bin/env python3
"""
Longsday 案例上传工具 — Word 文档 → 中英双语案例代码

用法:
    python tools/upload_case.py 案例文件.docx
    python tools/upload_case.py 案例文件.docx --api-key sk-xxx
    python tools/upload_case.py 案例文件.docx --output cases.js

功能:
    1. 读取 Word 文档 (.docx)，提取标题和正文
    2. 调用 DeepSeek API 自动翻译为商务英文
    3. 生成可直接粘贴到 data/cases.js 的代码片段
    4. 支持批量：传入多个 docx 文件或目录

依赖:
    pip install python-docx requests

API Key:
    从环境变量 DEEPSEEK_API_KEY 读取
    或从 --api-key 参数读取
    或自动读取 SIMO 的 config.yaml (E:\Smartsimo\config.yaml)
"""

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from datetime import datetime

# --- DeepSeek Translation ---

DEEPSEEK_API = "https://api.deepseek.com/chat/completions"

SYSTEM_PROMPT = """你是一个专业的中英翻译助手，擅长物流和国际贸易领域的翻译。
翻译规则：
1. 专业术语不翻译：DDP, FBA, FCL, LCL, B/L, HS Code 等保持原样
2. 公司名、地名、人名保持原样或使用标准译名
3. 数字和百分比保持原格式
4. 英文必须专业、地道、简洁，适合商务网站使用
5. 只返回翻译结果，不要解释、不要问问题"""


def get_api_key(args):
    """Get API key from various sources."""
    # 1. Command line argument
    if args.api_key:
        return args.api_key
    # 2. Environment variable
    env_key = os.environ.get("DEEPSEEK_API_KEY")
    if env_key:
        return env_key
    # 3. SIMO config.yaml
    simo_config = Path("E:/Smartsimo/config.yaml")
    if simo_config.exists():
        try:
            import yaml
            with open(simo_config, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
            key = config.get("llm", {}).get("api_key")
            if key:
                return key
        except Exception:
            pass
    return None


def translate_text(api_key, text, model="deepseek-chat"):
    """Translate Chinese text to English using DeepSeek API."""
    import requests

    resp = requests.post(
        DEEPSEEK_API,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"将以下中文内容翻译为专业、地道的商务英文：\n\n{text}"},
            ],
            "max_tokens": 2048,
            "temperature": 0.3,
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()


def extract_from_docx(filepath):
    """Extract title and content from a Word document.

    Strategy:
    - Title = first heading (Heading 1/2/3) or first non-empty paragraph
    - Content = everything else concatenated
    """
    try:
        from docx import Document
    except ImportError:
        print("❌ 需要安装 python-docx: pip install python-docx")
        sys.exit(1)

    doc = Document(filepath)

    # Extract all paragraphs with their style info
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        is_heading = para.style.name.startswith("Heading") if para.style.name else False
        paragraphs.append((text, is_heading, para.style.name))

    if not paragraphs:
        raise ValueError("文档中未找到任何文字内容")

    # Find title: prefer first heading, fallback to first paragraph
    title = None
    title_idx = -1
    for i, (text, is_heading, style) in enumerate(paragraphs):
        if is_heading:
            title = text
            title_idx = i
            break

    if title is None:
        title = paragraphs[0][0]
        title_idx = 0

    # Content = remaining paragraphs
    content_parts = []
    for i, (text, is_heading, style) in enumerate(paragraphs):
        if i == title_idx:
            continue
        # Skip very short lines that look like metadata
        if len(text) < 4 and not is_heading:
            continue
        content_parts.append(text)

    content = "\n\n".join(content_parts)

    return title, content


def detect_tag(title, content):
    """Auto-detect the case tag based on keywords."""
    combined = (title + " " + content).upper()

    tag_map = {
        "Sea Freight": ["海运", "集装箱", "FCL", "LCL", "SEA FREIGHT", "OCEAN", "港口", "船"],
        "Air Freight": ["空运", "航空", "AIR FREIGHT", "机场", "航班"],
        "Railway": ["铁路", "中欧班列", "RAILWAY", "班列", "火车"],
        "DDP": ["DDP", "税后到门", "门到门", "DOOR"],
        "FBA": ["FBA", "AMAZON", "亚马逊", "入仓"],
        "Multimodal": ["多式联运", "MULTIMODAL", "联运"],
        "Express": ["快递", "EXPRESS", "DHL", "UPS", "FEDEX"],
        "Customs": ["清关", "报关", "CUSTOMS", "CUSTOM"],
    }

    for tag, keywords in tag_map.items():
        for kw in keywords:
            if kw in combined:
                return tag

    return "General"


def generate_case_code(title_zh, content_zh, title_en, content_en,
                       date_str=None, tag_en=None, tag_zh=None, thumb=""):
    """Generate JavaScript case entry code."""
    if date_str is None:
        date_str = datetime.now().strftime("%Y-%m")

    if tag_en is None:
        tag_en = detect_tag(title_zh, content_zh)

    if tag_zh is None:
        tag_zh_map = {
            "Sea Freight": "海运",
            "Air Freight": "空运",
            "Railway": "铁路",
            "DDP": "DDP税后到门",
            "FBA": "Amazon FBA",
            "Multimodal": "多式联运",
            "Express": "国际快递",
            "Customs": "清关",
            "General": "综合物流",
        }
        tag_zh = tag_zh_map.get(tag_en, "综合物流")

    case_id = "case-" + date_str.replace("-", "") + "-" + \
              __import__("random").choice("abcdefghijklmnopqrstuvwxyz0123456789") + \
              __import__("random").choice("abcdefghijklmnopqrstuvwxyz0123456789") + \
              __import__("random").choice("abcdefghijklmnopqrstuvwxyz0123456789") + \
              __import__("random").choice("abcdefghijklmnopqrstuvwxyz0123456789")

    # Escape for JS string
    def js_str(s):
        return json.dumps(s, ensure_ascii=False)

    code = f"""  {{
    id: "{case_id}",
    date: "{date_str}",
    tag: "{tag_en}",
    tagZh: "{tag_zh}",
    title: {js_str(title_en)},
    titleZh: {js_str(title_zh)},
    summary: {js_str(content_en)},
    summaryZh: {js_str(content_zh)},
    thumb: "{thumb}"
  }},"""

    return code, case_id


def main():
    parser = argparse.ArgumentParser(
        description="Longsday 案例上传工具 — Word 文档 → 中英双语案例代码"
    )
    parser.add_argument("files", nargs="+", help="Word 文档路径 (.docx)，支持多个文件")
    parser.add_argument("--api-key", help="DeepSeek API Key")
    parser.add_argument("--model", default="deepseek-chat", help="模型名称")
    parser.add_argument("--output", "-o", help="输出文件路径（追加模式）")
    parser.add_argument("--date", help="案例日期 (YYYY-MM)，默认当前月份")
    parser.add_argument("--tag", help="手动指定英文标签")
    parser.add_argument("--tag-zh", help="手动指定中文标签")
    parser.add_argument("--thumb", default="", help="图片文件名")
    parser.add_argument("--dry-run", action="store_true", help="仅提取内容，不翻译")
    parser.add_argument("--print-only", action="store_true", help="仅打印结果，不保存")

    args = parser.parse_args()

    # Get API key
    api_key = None if args.dry_run else get_api_key(args)
    if not args.dry_run and not api_key:
        print("❌ 未找到 DeepSeek API Key！")
        print("   请通过以下方式之一提供：")
        print("   1. --api-key sk-xxx")
        print("   2. 环境变量 DEEPSEEK_API_KEY")
        print("   3. 自动读取 E:\\Smartsimo\\config.yaml")
        print("   4. --dry-run 仅提取内容不翻译")
        sys.exit(1)

    all_codes = []

    for filepath in args.files:
        filepath = Path(filepath)

        # Handle directories
        if filepath.is_dir():
            docx_files = list(filepath.glob("*.docx"))
            print(f"📁 目录 {filepath}: 找到 {len(docx_files)} 个 .docx 文件")
            for f in docx_files:
                try:
                    code, _ = process_file(f, api_key, args)
                    all_codes.append(code)
                except Exception as e:
                    print(f"  ❌ {f.name}: {e}")
            continue

        if not filepath.exists():
            print(f"❌ 文件不存在: {filepath}")
            continue

        if filepath.suffix.lower() != ".docx":
            print(f"⚠️  跳过非 .docx 文件: {filepath}")
            continue

        try:
            code, _ = process_file(filepath, api_key, args)
            all_codes.append(code)
        except Exception as e:
            print(f"❌ {filepath.name}: {e}")
            continue

    # Output
    if all_codes:
        print("\n" + "=" * 60)
        print("📋 生成的案例代码汇总:\n")
        combined = "\n".join(all_codes)
        print(combined)

        if args.output:
            output_path = Path(args.output)
            mode = "a" if output_path.exists() else "w"
            with open(output_path, mode, encoding="utf-8") as f:
                f.write("\n" + combined + "\n")
            print(f"\n✅ 已{'追加' if mode == 'a' else '写入'}到: {output_path}")
            print(f"   请将该文件内容复制到 data/cases.js 的 LONGSDAY_CASES 数组中")

        print(f"\n💡 共处理 {len(all_codes)} 个文件")
        print("   将以上代码块粘贴到 data/cases.js 的 LONGSDAY_CASES 数组里即可")


def process_file(filepath, api_key, args):
    """Process a single .docx file."""
    print(f"\n{'='*60}")
    print(f"📄 处理: {filepath.name}")

    # Extract
    title_zh, content_zh = extract_from_docx(filepath)
    print(f"   标题: {title_zh[:60]}...")
    print(f"   内容: {len(content_zh)} 字")

    if args.dry_run:
        print("\n   --- 提取内容 ---")
        print(f"   标题: {title_zh}")
        print(f"   内容: {content_zh[:200]}...")
        return "", ""

    print("   🌐 翻译中...")

    # Translate
    title_en = translate_text(api_key, title_zh, args.model)
    print(f"   EN 标题: {title_en[:80]}...")

    content_en = translate_text(api_key, content_zh, args.model)
    print(f"   EN 内容: {len(content_en)} 字符")

    # Generate code
    code, case_id = generate_case_code(
        title_zh=title_zh,
        content_zh=content_zh,
        title_en=title_en,
        content_en=content_en,
        date_str=args.date,
        tag_en=args.tag,
        tag_zh=args.tag_zh,
        thumb=args.thumb,
    )

    # Save individual file
    if not args.print_only:
        out_dir = Path(filepath).parent / "_generated"
        out_dir.mkdir(exist_ok=True)
        out_file = out_dir / f"{case_id}.js"
        with open(out_file, "w", encoding="utf-8") as f:
            f.write("// 案例代码片段 — 请复制到 data/cases.js 的 LONGSDAY_CASES 数组中\n")
            f.write(code + "\n")
        print(f"   ✅ 已生成: {out_file}")

    print(f"   ✅ 案例 ID: {case_id}")
    return code, case_id


if __name__ == "__main__":
    main()
