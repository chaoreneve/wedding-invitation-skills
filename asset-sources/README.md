# 可再分发素材来源与重建

核对时间：2026-11-11。此目录仅含公开授权来源或由其产生的派生文件；不包含用户婚礼资料。

## ambientCG 纸纹

来源：ambientCG / Lennart Demes，CC0 1.0。官方许可：https://docs.ambientcg.com/license/ 。

- Paper001_1K-JPG_Color.jpg：从 https://ambientcg.com/get?file=Paper001_1K-JPG.zip 中提取同名 Color 文件。
- Paper002_1K-JPG_Color.jpg：从 https://ambientcg.com/get?file=Paper002_1K-JPG.zip 中提取同名 Color 文件。
- paper-warm.jpg：由上述两张色图通过 CSS 暖色混合后渲染。保持纸张颗粒，未使用旧纸纹作为输入。

## 卡农录音

曲目：Canon in D Major；录音者 Kevin MacLeod；ISRC USUAN1100301；CC BY 4.0。

- 曲目页：https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100301
- 原站曲目信息：https://incompetech.com/music/royalty-free/pieces.json
- 官方下载：https://incompetech.com/music/royalty-free/mp3-royaltyfree/Canon%20in%20D%20Major.mp3
- 原下载 MP3 的 SHA-256：`9377b058b8c132d87e977f6c1a7686b18c59e5f3a0ae457cd39005680363fadc`。
- 仓库保存版本移除了 ID3 标签与嵌入封面，将完整录音转为 96 kbps MP3，SHA-256 为 `fef6a20ed37ce252589af3ac8e15208fd9e67151e2068c784346cf03d3bf7fb7`。未截短乐曲。

可先将官方录音下载到仓库外的临时文件，然后运行：

```bash
python3 -m pip install -r tools/requirements-assets.txt
python3 tools/prepare-audio.py /path/to/downloaded.mp3 asset-sources/canon-in-d-major.mp3 --compress
```

## 许可原文

- CC-BY-4.0.txt：https://creativecommons.org/licenses/by/4.0/legalcode.txt
- CC0-1.0.txt：https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt

## 重建

安装根目录 package-lock.json 中的依赖及 Playwright Chromium 后运行：

```bash
node tools/build-assets.mjs
```

通过 WEDDING_BROWSER_PATH 可指定现有 Chromium 浏览器；实际机器路径不应提交。脚本会重建两版暖纸纹、见证者信封分享图、照片占位、素材说明页、许可副本及校验值。文件渲染可能随浏览器版本略有差异，重建后应检查手机截图和 SHA256.json 的变化。
