#!/usr/bin/env bash
# ==============================================================================
# Setup Nginx HTTPS & Let's Encrypt SSL for xq.firelu.com
# 参考 xhmould 与 mycrm 项目的标准上线流程
# ==============================================================================
set -euo pipefail

echo "===> 1. 安装 Nginx 站点配置到 /etc/nginx/sites-available/ 与 sites-enabled/..."
sudo cp /home/vbcmlouis/www/xiangqi/deploy/xq.firelu.com.conf /etc/nginx/sites-available/xq.firelu.com.conf
sudo ln -sf /etc/nginx/sites-available/xq.firelu.com.conf /etc/nginx/sites-enabled/

echo "===> 2. 测试 Nginx 语法并平滑重载..."
sudo nginx -t
sudo systemctl reload nginx

echo "===> 3. 申请 Let's Encrypt 免费 SSL 证书并配置 443 HTTPS 自动重定向..."
sudo certbot --nginx -d xq.firelu.com --redirect --agree-tos --no-eff-email

echo "===> 4. 再次验证 Nginx 运行状态并平滑生效..."
sudo nginx -t
sudo systemctl reload nginx

echo "=============================================================================="
echo "🎉 SSL 配置完成！"
echo "您现在可以通过公网标准 HTTPS 访问象棋项目："
echo "👉 https://xq.firelu.com"
echo "=============================================================================="
