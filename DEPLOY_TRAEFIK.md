# Deploy na VPS Hostinger com Docker + Traefik

## Arquivos criados

- `Dockerfile`
- `nginx.conf`
- `docker-compose.yml`
- `.env.example`
- `.dockerignore`

## 1. No GitHub

Envie o projeto para um repositório contendo pelo menos:

```txt
index.html
service-worker.js
manifest.json
image.png
icon-192.png
icon-512.png
Dockerfile
nginx.conf
docker-compose.yml
.dockerignore
.env.example
```

## 2. DNS

Crie um registro DNS apontando para o IP da VPS:

```txt
Tipo: A
Nome: checklist
Valor: IP_DA_VPS
```

Exemplo final:

```txt
checklist.seudominio.com
```

## 3. Na VPS

Acesse a VPS:

```bash
ssh usuario@IP_DA_VPS
```

Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

Crie o `.env`:

```bash
cp .env.example .env
nano .env
```

Edite:

```env
CHECKLIST_DOMAIN=checklist.seudominio.com
```

## 4. Subir com Docker Compose

Como o Traefik já está usando a rede externa `web`, suba apenas este app:

```bash
docker compose up -d --build
```

Ver logs:

```bash
docker compose logs -f
```

Acesse:

```txt
https://checklist.seudominio.com
```

## 5. Atualizar depois de mudanças

Na VPS:

```bash
cd SEU_REPOSITORIO
git pull
docker compose up -d --build
```

## Observação

O app não publica porta `80:80`, porque o Traefik já usa as portas 80 e 443. O Traefik acessa o container pela rede Docker externa `web`.
