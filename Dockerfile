FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html manifest.json service-worker.js image.png icon-192.png icon-512.png /usr/share/nginx/html/

EXPOSE 80
