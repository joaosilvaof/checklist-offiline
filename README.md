# 🚛 CMW Transportes - Checklist Veicular PWA

Aplicativo Progressive Web App (PWA) para checklists veiculares offline, desenvolvido para a CMW Transportes.

---

## 📱 **Características**

- ✅ **Funciona offline** - Sem necessidade de internet constante
- ✅ **Sincronização automática** - Quando voltar online, envia os checklists pendentes
- ✅ **Compressão de imagens** - Reduz tamanho antes do upload (economiza dados 4G)
- ✅ **Segurança reforçada** - Login com PIN, validação de dispositivo
- ✅ **Multi-dispositivo** - Tablets autorizados por unidade (Extrema/Bragança)
- ✅ **PWA instalável** - Pode ser adicionado à tela inicial

---

## 🔧 **Tecnologias**

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: IndexedDB (dados offline)
- **Cache**: Service Worker (estratégia cache-first/network-first)
- **Backend**: n8n + Directus + Google Drive
- **Hospedagem**: Qualquer servidor web estático (GitHub Pages, Netlify, Vercel, etc.)

---

## 📂 **Estrutura de Arquivos**

```
checklist-cmw/
├── index.html                 # PWA principal (contém todo o JavaScript)
├── manifest.json              # Manifest PWA (ícone, nome, tema)
├── service-worker.js          # Service Worker (cache e offline)
├── icon-192.png               # Ícone PWA (192x192)
├── icon-512.png               # Ícone PWA (512x512)
├── MELHORIAS_APLICADAS.md     # Documentação das melhorias
└── README.md                  # Este arquivo
```

---

## 🚀 **Instalação / Deployment**

### Opção 1: Hospedagem Simplificada (Recomendada)

1. **Compacte** os arquivos (exceto `MELHORIAS_APLICADAS.md` se quiser):
   ```bash
   zip cmw-checklist.zip index.html manifest.json service-worker.js icon-192.png icon-512.png
   ```

2. **Suba** para um serviço de hospedagem estática:
   - **Netlify**: arraste e solte o ZIP
   - **Vercel**: `vercel --prod`
   - **GitHub Pages**: faça push na branch `gh-pages`
   - **Firebase Hosting**: `firebase deploy`

3. **HTTPS obrigatório**: O PWA requer HTTPS (ou localhost) para funcionar.

### Opção 2: Servidor Local (para testes)

```bash
# Com Python
python -m http.server 8080

# Com Node.js (http-server)
npx http-server -p 8080
```

Acesse: `http://localhost:8080`

---

## 🔐 **Configuração Inicial**

### 1. **Dispositivos Autorizados**

No fluxo n8n (`CMW - Checklist Veicular PWA Offline + Directus PIN.json`), adicione os device IDs dos tablets:

```json
{
  "device_id": "TABLET-OPERACAO-01",
  "nome_dispositivo": "Tablet Operação 01",
  "unidade": "Extrema",
  "status": "ativo"
}
```

**Como obter o device ID?**
- Na primeira execução, o app gera um ID automático.
- Esse ID aparece na tela de login (campo "Dispositivo NÃO autorizado").
- Copie e adicione na lista de dispositivos autorizados no n8n.

### 2. **Motoristas**

No Directus, crie os motoristas na coleção `motoristas_checklist` com:
- `matricula` (string)
- `pin_hash` (SHA-256 do `matricula:pin:pepper`)
- `nome`
- `unidade`
- `status` (ativo/inativo)
- `validade_offline_dias` (padrão 30)
- `tipo_acesso` (`garagem` ou `movel`)
- `exige_dispositivo_autorizado` (boolean: `true` para os 2 usuários/aparelhos de garagem, `false` para usuários móveis)

O Pepper é: `cmw_pin_pepper_2026`

Exemplo (Node.js):
```javascript
const crypto = require('crypto');
const pin = '1234';
const matricula = '0001';
const pepper = 'cmw_pin_pepper_2026';
const hash = crypto.createHash('sha256').update(`${matricula}:${pin}:${pepper}`).digest('hex');
console.log(hash);
```

### 3. **API Base**

No `index.html`, ajuste a URL base dos webhooks do n8n:

```javascript
const CONFIG = {
  API_BASE: 'https://SEU-N8N.com/webhook',
  // ...
};
```

Se houver proxy no mesmo domínio do PWA, pode manter `window.location.origin`. Também é possível sobrescrever em testes pelo navegador:

```javascript
localStorage.setItem('cmw_api_base', 'https://SEU-N8N.com/webhook')
```

Endpoints esperados no n8n:

```text
POST /checklist-validar-motorista
POST /checklist-validar-dispositivo
POST /checklist-veicular
```

---

## 📱 **Como Usar**

### Primeiro Acesso
1. Abra o app no tablet
2. Digite **matrícula** e **PIN** do motorista
3. Toque em **Entrar**

Se o dispositivo não estiver autorizado, aparecerá alerta. Contate o gestor.

### Preenchimento do Checklist
1. Selecione **Tipo de veículo** e **Unidade** (já pré-selecionada conforme tablet)
2. Preencha **Prefixo**, **Placa**, **KM** e **Condutor**
3. Marque os itens de segurança (desmarque se houver problema)
4. Se houver problema, desmarque o item e **preencha o detalhe**
5. (Opcional) Adicione **foto** do veículo/problema
6. Toque em **Salvar checklist**

Se estiver online, enviará imediatamente. Se offline, salvará localmente.

### Sincronização
- **Automática**: Ao restaurar conexão, o app sincroniza automaticamente.
- **Manual**: Toque no botão "Sincronizar pendentes" (aparece quando há Checklists offline).

### Foto
- O app **comprime** automaticamente (max 1024px, qualidade 70%)
- Mostra **progresso** e **redução de tamanho**
- Upload para **Google Drive** e link salvo no Directus
- Espelho opcional no **Google Sheets** via n8n (redundância/consulta operacional)
- Cada envio possui `protocolo_local` único para evitar duplicidade em reenvios
- O workflow n8n verifica `protocolo_local` antes de criar no Directus. Crie esse campo na coleção `checklists_veiculares` e, se possível, marque como único/indexado.

### Logout
Toque em **Sair** (disponível no topo após login) para limpar a sessão.

---

## 🛠️ **Painel de Debug**

Para administradores: clique no botão ⚙️ (canto inferior direito) para ver logs detalhados.

---

## ⚠️ **Limitações e Considerações**

### Offline
- Dados são armazenados localmente (IndexedDB). Podem ser perdidos se o usuário limpar cache do navegador.
- Máximo de ~50 checklists pesados (com foto) antes de alcançar limite do navegador.
- Recomenda-se sincronizar frequentemente.

### Segurança
- O token da aplicação está no frontend (obfuscado). Para maior segurança, implemente JWT temporário.
- O PIN é transmitido via HTTPS e hash no backend.
- Dispositivos não autorizados não conseguem login.

### Performance
- Compressão de imagem reduz drasticamente tamanho (de 3-5MB para ~300KB).
- Batch de 3 checklists por sincronização (ajustável em `CONFIG.BATCH_SIZE`).
- Checklists já enviados são mantidos localmente por 15 dias e depois limpos automaticamente.

---

## 📊 **Monitoramento**

### Logs no n8n
- Veja execuções dos workflows:
  - `Validar Motorista PIN Hash`
  - `Validar Checklist`
  - `Salvar Checklist Directus`
  - `Upload Google Drive`

### Directus
- Tabela `checklists_veiculares` contém todos os registros.
- Campo `foto_url` contém link do Google Drive.
- Campo `status_operacional` indica `Liberado` ou `Restrição operacional`.

### Google Drive
- Fotos são salvas em `My Drive/checklists_veiculares/`.
- Nome do arquivo: `{protocolo}_{timestamp}.jpg`

---

## 🐛 **Troubleshooting**

### App não instala (PWA)
- Verifique se está em **HTTPS**.
- Limpe cache do navegador e tente novamente.
- Consulte `chrome://serviceworker-internals` (Chrome) para ver erros.

### Login falha
- Verifique se o **device ID** está na lista de dispositivos autorizados no n8n.
- Confirme se a **matrícula** e **PIN** estão corretos.
- Verifique se o motorista está `ativo` no Directus.

### Foto não faz upload
- Verifique credenciais do Google Drive no n8n.
- Verifique se a foto está em `base64` (payload inclui `foto`).

### Sincronização não envia
- Verifique conexão com a internet.
- Abra o painel de debug (⚙️) e veja logs.
- Force uma sincronização manual (botão).

### Service Worker não atualiza
-Faça um hard refresh: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac).
- No console, rode `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))` e recarregue.

---

## 📈 **Próximos Passos (Sugestões)**

- [ ] Push notifications para checklists críticos
- [ ] Dashboard de acompanhamento (Directus)
- [ ] Lista de Checklists pendentes na interface
- [ ] Exportação de dados (CSV/Excel)
- [ ] Assinatura digital do checklist
- [ ] Múltiplas fotos por checklist
- [ ] Modo escuro

---

## 📞 **Suporte**

Para dúvidas técnicas ou adição de novos dispositivos, contate o responsável pelo sistema.

---

**Versão**: 2.0  
**Última atualização**: 2026-05-10  
**Desenvolvido para**: CMW Transportes
