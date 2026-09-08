# 合成国科大

一个以高校校徽为主题的物理合成游戏。选择横向落点后放下校徽球，两个相同等级的球接触时会合成下一级。目标是逐步合成最终的中国科学院大学校徽。

线上地址：[https://ball-merge-eleven-m7q9.minstring169.chatgpt.site/](https://ball-merge-eleven-m7q9.minstring169.chatgpt.site/)

## 主要功能

- 重力、圆形碰撞体和无回弹边界。
- 11 个分立的校徽球尺寸，新球只会从最小的 5 级中生成。
- 同级球相遇自动合成，合成 X 号球获得 `2^X` 分。
- 总分、历史最高分和历史最大校徽保存在浏览器中。
- 高清校徽渲染、快速合成动画和最终校徽礼花动画。
- 鼠标、触屏和键盘操作。
- 隐藏彩蛋：连续点击“最大”10 次后只生成最小球，再点击一次恢复正常生成。

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
npm ci --include=optional
npm run dev
```

启动后打开 [http://localhost:3000/](http://localhost:3000/)。

### Linux 下 `sharp` 安装失败

`sharp` 依赖针对当前系统的预编译可选包，因此不要使用 `--omit=optional`。如果在 x64 glibc Linux 上看到 `Attempting to build from source via node-gyp`，可显式指定平台重新安装：

```bash
npm ci --include=optional --os=linux --cpu=x64 --libc=glibc
```

安装前请先确认项目所在磁盘可写：

```bash
test -w . && echo "目录可写" || echo "目录只读"
```

如果项目位于只读挂载的 NTFS 分区，请先修复或重新以可写模式挂载该分区。也可以将项目复制到 Linux 主目录后再安装：

```bash
mkdir -p ~/Projects/GreatUCAS
rsync -a --exclude node_modules ./ ~/Projects/GreatUCAS/
cd ~/Projects/GreatUCAS
npm ci --include=optional --os=linux --cpu=x64 --libc=glibc
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
npm ci --include=optional
npm run build
```

本地检查生产构建：

```bash
npm run start
```

### 使用 OpenAI Sites 发布

项目已经通过 `.openai/hosting.json` 关联 OpenAI Sites。在 Codex 中打开项目后，请求“构建并发布这个站点”即可执行构建、版本保存和上线更新。

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
