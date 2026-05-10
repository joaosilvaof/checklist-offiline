# Checklist CMW - Melhores Práticas Aplicadas

## ✅ Arquitetura Correta

### 1. PWA (Progressive Web App)
- ✓ Manifest.json configurado
- ✓ Service Worker com estratégia Cache First
- ✓ Funciona 100% offline
- ✓ Ícones de 192x192 e 512x512

### 2. Armazenamento Offline
```
IndexedDB
├── Sessão do Motorista (válida por 30 dias)
└── Checklists Pendentes (ordenação por data)
```

### 3. Compressão de Imagens
- ✓ Redimensiona para max 1024px
- ✓ Qualidade JPEG 70%
- ✓ Limite de arquivo: 50MB
- ✓ Suporte a fotos verticais (portrait)

### 4. Sincronização em Batch
- ✓ Envio de 5 em 5 checklists
- ✓ Ordenação por data (mais antigos primeiro)
- ✓ Verificação de conectividade real entre batches
- ✓ Pausa automática se conexão cair

## 🔒 Segurança

### Autenticação Multi-camada
1. Token do APP (`cmw_chk_2026_...`)
2. Validação de dispositivo autorizado
3. PIN do motorista (hash SHA256)
4. Sessão offline com expiração

### Validações de Negócio
- ✓ Unidade do tablet vs unidade informada
- ✓ Status operacional baseado em itens críticos
- ✓ Campos obrigatórios quando há problemas

## 📊 Fluxo de Dados (n8n)

```
PWA → n8n Webhook
         │
         ├── Autenticar Dispositivo → Device ID válido?
         │
         ├── Validar Motorista → PIN correto?
         │
         ├── Receber Checklist → Validação completa
         │   ├── Erros? → Retorna 400 com detalhes
         │   └── OK? → Fluxo continua
         │
         ├── Salvar no Directus → Gera ID
         │
         └── Tem Foto?
             ├── Sim → Upload Google Drive → Atualiza Directus com link
             └── Não → Finaliza
```

## 🚀 Melhorias Implementadas

### Frontend
1. **`checkRealConnectivity()`** - Verifica conexão real além de `navigator.onLine`
2. **Feedback amigável** - Ícones e emojis nos alerts
3. **Preservação de dados** - Não limpa formulário em erro de validação
4. **Suporte a fotos verticais** - Redimensionamento proporcional

### Sincronização
1. **Ordenação por data** - Checklists antigos são enviados primeiro
2. **Verificação entre batches** - Se conexão cai, para imediatamente
3. **Mensagens contextuais** - Diferentes alerts para sucesso/partial/falha

## 📋 O que ainda pode ser feito

### Obrigatório
- [ ] Criar pasta específica no Google Drive (atualmente usa root)
- [ ] Adicionar endpoint `/check` simples no n8n para health check

### Melhorias Futuras
1. **Background Sync** - Usar `navigator.serviceWorker.ready.then(...)` para sync quando app estiver fechado
2. **Notificações Push** - Alertar usuário quando houver sincronização pendente
3. **Dashboard de métricas** - Taxa de envio, tempo de resposta, etc.
4. **Multi-foto** - Permitir múltiplas fotos por checklist

## 🧪 Testes Recomendados

### Cenários de Rede
```javascript
// Simular no DevTools:
1. Offline completo → Salva IndexedDB
2. Online com latência alta (3G) → Timeout e fallback
3. Conexão instável → Verificar comportamento entre batches
4. WiFi conectado sem internet → detecta via checkRealConnectivity()
```

### Cenários de Uso
```javascript
1. Checklist sem problemas → Status "Liberado"
2. Checklist com cinto ruim → Status "Restrição - cinto"
3. Checklist offline → Sincronização manual depois
4. Checklist com foto grande >50MB → Erro e reset
5. Login com PIN errado 3x → Bloquear temporariamente
```

## 📁 Estrutura de Arquivos

```
checklist-offiline/
├── index.html              # App completo (single file)
├── manifest.json           # PWA manifest
├── service-worker.js       # Cache e offline
├── icon-192.png            # Ícone PWA
├── icon-512.png            # Ícone PWA
├── CMW...json              # Fluxo n8n exportado
├── README.md               # Documentação geral
├── BEST_PRACTICES.md       # Este arquivo
└── n8n-improvements.md     # Sugestões para o backend
```

## 🔄 Ciclo de Vida dos Dados

```
1. CAPTURA (Offline OK)
   └── PWA → IndexedDB (checklist + foto base64)

2. SINCRONIZAÇÃO (Requer internet)
   ├── PWA → n8n Webhook (JSON)
   ├── n8n → Directus (dados do checklist)
   └── (opcional) n8n → Google Drive (foto)

3. ARMAZENAMENTO PERMANENTE
   └── Directus → Banco SQL
       └── Com link para foto no Drive
```

## 💡 Dicas para Produção

### Performance
- Limpar IndexedDB após 90 dias de checklists enviados
- Compactar base64 antes de salvar (reduz ~30% do espaço)

### Segurança
- Rotacionar token_app a cada 6 meses
- Hash de device ID em vez de UUID plain text
- Rate limiting no n8n (ex: max 100 req/min por device)

### Manutenção
- Logs de erro persistidos no IndexedDB para debug remoto
- Versão da app no localStorage para forçar update

## ✅ Checklist de Deploy

- [ ] Configurar credenciais Google Drive no n8n
- [ ] Configurar credenciais Directus no n8n
- [ ] Criar tabela `checklists_veiculares` no Directus
- [ ] Criar tabela `motoristas_checklist` no Directus
- [ ] Importar fluxo n8n e ativar
- [ ] Testar flow completo em ambiente de staging
- [ ] Configurar SSL no servidor PWA (requerido para PWA)
- [ ] Adicionar dispositivos à lista `tabletsAutorizados`
- [ ] Cadastrar motoristas com PIN hash

## 📞 Suporte

Se encontrar problemas:
1. Abra o app no Chrome/Edge
2. Aperte F12 → Console
3. Clique no botão ⚙️ (debug)
4. Gere um relatório com os logs
