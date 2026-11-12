# 素材许可与替换记录

经典版现按用户要求恢复原项目纸纹，其再分发授权仍待确认，不属于 CC0，须保持私有。见证者纸纹仍为 CC0，音乐为 CC BY 4.0，新绘制的基础装饰为 CC0。各 skill 自带说明和许可，代码许可状态另见 [LICENSE.md](LICENSE.md)。

| 素材 | 当前来源与许可 | 改动及再分发要求 |
| --- | --- | --- |
| 经典版 `assets/paper-warm.jpg` | 恢复的原经典项目纸纹；再分发授权待确认 | **严禁商用，授权状态未确认**；此标注不是原作者授权。非 CC0，校验值及例外见 assets/PAPER_OVERRIDE.txt，保持私有 |
| 见证者 `assets/paper-warm.jpg` 与仓库替代纸纹 | ambientCG / Lennart Demes 的 Paper001、Paper002；CC0 1.0 | CSS 混合色图并调为暖纸色；允许免费修改、商用和再分发，不强制署名 |
| 两版 `assets/canon-in-d-major.mp3` | Kevin MacLeod 的 Canon in D Major，ISRC USUAN1100301；CC BY 4.0 | 移除 ID3 与内嵌封面，转为适合手机加载的 96 kbps MP3；再分发时保留作者、来源、许可及修改说明 |
| 见证者 `assets/og-witness-letter.png` | 项目重新绘制的信封、玫瑰线稿、封蜡，加上述 CC0 纸纹 | 新几何绘图采用 CC0 1.0；由 tools/build-assets.mjs 重建 |
| 两版 `assets/placeholder.svg` | 项目重新绘制的基本几何照片占位 | CC0 1.0；不是实际人物照片 |
| 见证者波纹 | CSS 重复径向渐变重新绘制 | CC0 1.0；不再使用原波纹图片 |
| 文档预览图 | 虚构示例的网页截图 | 不含真实照片或宾客；底层新纸纹及装饰为 CC0，项目代码许可另见 LICENSE.md |

## 原始来源和许可

- [Paper001](https://ambientcg.com/view?id=Paper001)、[Paper002](https://ambientcg.com/view?id=Paper002)；[ambientCG 官方许可说明](https://docs.ambientcg.com/license/)明确允许原始文件随项目再分发。
- [CC0 1.0 许可](https://creativecommons.org/publicdomain/zero/1.0/)，全文已随每个 skill 保存。
- [Canon in D Major 作者页面](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100301)，该页按 ISRC 从作者的 pieces.json 加载曲目，并给出 Kevin MacLeod / CC BY 4.0 的署名说明。
- [CC BY 4.0 许可](https://creativecommons.org/licenses/by/4.0/)，全文已随每个 skill 保存。许可允许免费再分发、改编和商业使用，但要求署名、许可链接及改动说明；没有附加非商业限制。
- 新几何信封、玫瑰、占位和波纹绘图在本次替换中以 CC0 1.0 提供。该说明只覆盖新绘图，不把既有项目所有代码都标为 CC0。

## 文件与构建

来源下载地址、原始录音校验值和处理命令见 [asset-sources/README.md](asset-sources/README.md)。可再分发文件的 SHA-256 见 [asset-sources/SHA256.json](asset-sources/SHA256.json)，恢复的经典纸纹校验值另见 assets/PAPER_OVERRIDE.txt。音乐转为 96 kbps MP3，未截短乐曲。见证者纸纹及信封由 CSS／SVG 重建；经典版现使用原项目纸纹。

生成网站含“素材说明”入口，指向 materials.html；发布包必须包含 assets/NOTICES.txt 和 assets/licenses/ 下的许可全文。校验和打包脚本会检查这些文件。替换音乐后，替换曲目的授权与署名需另行处理，默认音乐的许可不能替代它。

## 尚未转公开的原因

旧素材已经从当前工作树中移除，但仍存在于私有仓库的既有历史。当前更新不会擅自改写已上传历史或切换可见性。真正公开前需决定项目代码许可证，并从审核后的文件创建干净公开历史，或在明确授权后清理旧历史；不能仅靠最新一次提交删除素材来完成公开清理。
