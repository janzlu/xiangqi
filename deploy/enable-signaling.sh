#!/bin/bash
set -e

CONF_FILE="/etc/nginx/sites-available/xq.firelu.com.conf"

echo "===> 1. 更新 Nginx 配置以支持 PeerJS WebSocket 独立信令中继..."
cat << 'CONF' > "$CONF_FILE"
# ==============================================================================
# Nginx Virtual Host for xq.firelu.com (中国象棋 · 智弈争雄)
# 与 xhmould / erp.firelu.com / huahua.firelu.com / zx.firelu.com 完美共存，互不干扰
# ==============================================================================

server {
    server_name xq.firelu.com;

    client_max_body_size 20M;

    # Let's Encrypt ACME 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    root /home/vbcmlouis/www/xiangqi;
    index index.html;

    # PeerJS P2P 独立信令中继与 WebSocket 升级
    location /peerjs {
        proxy_pass http://127.0.0.1:3190;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长期缓存
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    listen [::]:443 ssl; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/xq.firelu.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/xq.firelu.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

server {
    if ($host = xq.firelu.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name xq.firelu.com;
    return 404; # managed by Certbot
}
CONF

echo "===> 2. 测试 Nginx 配置文件语法..."
nginx -t

echo "===> 3. 平滑重载 Nginx 服务..."
systemctl reload nginx

echo "=============================================================================="
echo "🎉 自建独立信令中继已全部就绪！"
echo "信令接口：https://xq.firelu.com/peerjs"
echo "=============================================================================="
