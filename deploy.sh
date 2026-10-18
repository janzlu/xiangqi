#!/usr/bin/env bash
set -e

# ==============================================================================
# 中国象棋 · 智弈争雄 (Xiangqi Master) - VPS 轻量部署脚本
# 特点：纯静态托管，零 Docker 依赖，独立端口/目录，绝不干扰 VPS 现有服务与项目
# ==============================================================================

VPS_USER="${1:-root}"
VPS_HOST="${2}"
VPS_PORT="${3:-22}"
REMOTE_DIR="${4:-/var/www/xiangqi}"

if [ -z "$VPS_HOST" ]; then
  echo "使用说明:"
  echo "  ./deploy.sh <VPS用户名> <VPS_IP或域名> [SSH端口] [远程安装目录]"
  echo ""
  echo "示例:"
  echo "  ./deploy.sh root 123.45.67.89"
  echo "  ./deploy.sh ubuntu 123.45.67.89 22 /var/www/xiangqi"
  exit 1
fi

echo "==> 1. 执行本地生产打包 (tsc -b && vite build)..."
npm run build

echo "==> 2. 同步静态产物到 VPS ($VPS_USER@$VPS_HOST:$REMOTE_DIR)..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p '$REMOTE_DIR'"
rsync -avz --delete -e "ssh -p $VPS_PORT" ./dist/ "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"

echo "==> 3. 部署完成！"
echo "静态文件已就绪于 VPS 目录: $REMOTE_DIR"
echo ""
echo "如使用 Nginx 独立端口（例如 8088，互不干扰），可将以下配置添加至 /etc/nginx/conf.d/xiangqi.conf 并 reload："
echo "--------------------------------------------------------"
cat << 'EOF'
server {
    listen 8088;
    server_name _;

    root /var/www/xiangqi;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
echo "--------------------------------------------------------"
echo "命令: sudo nginx -t && sudo nginx -s reload"
