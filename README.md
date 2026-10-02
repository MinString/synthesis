# 合成国科大

一个以高校校徽为主题的物理合成游戏。选择横向落点后放下校徽球，两个相同等级的球接触时会合成下一级。目标是逐步合成最终的中国科学院大学校徽。

线上地址：[https://minstring.github.io/synthesis/](https://minstring.github.io/synthesis/)

## 主要功能

- 重力、圆形碰撞体和无回弹边界。
- 11 个分立的校徽球尺寸，新球只会从最小的 5 级中生成。
- 同级球相遇自动合成，合成 X 号球获得 `2^X` 分。
- 总分、历史最高分和历史最大校徽保存在浏览器中。
- 高清校徽渲染、快速合成动画和最终校徽礼花动画。
- 鼠标、触屏和键盘操作。
- 隐藏彩蛋：连续点击“最大”10 次后只生成北京大学校徽球，再点击一次恢复正常生成。

## 校徽等级

| 等级 | 学校 |
| --- | --- |
| 1 | 西安交通大学 |
| 2 | 武汉大学 |
| 3 | 哈尔滨工业大学 |
| 4 | 中国人民大学 |
| 5 | 北京理工大学 |
| 6 | 浙江大学 |
| 7 | 上海交通大学 |
| 8 | 复旦大学 |
| 9 | 北京大学 |
| 10 | 清华大学 |
| 11 | 中国科学院大学 |

校徽资源位于 `public/logos/1.svg` 至 `public/logos/11.svg`，文件编号与上表等级一致。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci --include=optional
npm run dev
```

启动后打开 [http://localhost:3000/](http://localhost:3000/)。

### Linux 下 `sharp` 安装失败

`sharp` 依赖针对当前系统的预编译可选包，因此不要使用 `--omit=optional`。如果系统中安装了全局 `libvips`，`sharp` 可能会自动改为源码编译。本项目建议忽略全局 `libvips`，直接使用官方预编译包：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci --include=optional
```

如果仍然没有选中正确的 Linux 预编译包，可显式指定 x64 glibc 平台：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci --include=optional --os=linux --cpu=x64 --libc=glibc
```

## 局域网访问

让开发服务器监听局域网网卡：

```bash
npm run dev -- --hostname 0.0.0.0
```

查看本机的局域网 IP，然后让同一 Wi-Fi 或同一局域网内的玩家访问 `http://局域网IP:3000/`。例如本机 IP 为 `192.168.1.20`，访问地址就是 `http://192.168.1.20:3000/`。如果无法访问，请确认系统防火墙允许 Node.js 或 3000 端口的局域网连接。

## 构建和部署

生成生产构建：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci --include=optional
npm run build
```

本地检查生产构建：

```bash
npm run start
```

### 使用 GitHub Pages 发布

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 分支后，GitHub Actions 会自动构建并发布到 GitHub Pages：

```text
https://minstring.github.io/synthesis/
```

也可以在仓库的 **Actions → Deploy GitHub Pages → Run workflow** 中手动触发部署。

### 部署到 Cloudflare Workers

首次部署需要登录 Cloudflare：

```bash
npx wrangler login
npm run build
npx wrangler deploy --config dist/server/wrangler.json
```

Cloudflare 会在部署完成后返回可公开访问的网址。

## 项目结构

- `app/page.tsx`：游戏界面、Canvas 渲染与交互。
- `app/physics.mjs`：重力、碰撞、边界、合成和计分规则。
- `app/globals.css`：页面布局与视觉样式。
- `public/logos/`：当前使用的 11 个校徽资源。
- `public/OLD_logos/`：旧版校徽备份。
