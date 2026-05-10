# Melhorias para o Fluxo n8n

## 1. Verificar ID do Directus antes do Drive

No node "Converter Foto Para Binario", adicione verificação:

```javascript
// No node "Converter Foto Para Binario"
const checklistId = $json.id || $json.directus_id;

if (!checklistId) {
  // Se não houve ID, não tem onde salvar o link da foto
  return [{
    json: { 
      erro: 'Checklist não foi salvo no Directus',
      usar_foto_emergency: true 
    }
  }];
}
```

## 2. Pasta específica no Google Drive

Configure o `folderId` para uma pasta dedicada:

```json
{
  "folderId": {
    "__rl": true,
    "value": "ID_DA_PASTA_CMW_CHECKLIST",
    "mode": "id"
  }
}
```

Como criar:
1. Crie pasta "Checklist CMW" no Drive
2. Pegue o ID da URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
3. Substitua no n8n

## 3. Fallback se Drive falhar

Adicione um node de erro que salva a base64 no Directus em campo `foto_backup`:

```javascript
// Node "Fallback Foto no Directus"
if ($json.id || $json.erro === 'drive_upload_failed') {
  return [{
    json: {
      id: $('Preparar Registro').item.json.directus_id,
      foto_base64_backup: $('Preparar Registro').item.json.foto_base64.substring(0, 50000) // Limitado
    }
  }];
}
```

## 4. Notificação WhatsApp/Email para críticos

Adicione após "Preparar Ocorrência Crítica":

- Node HTTP com webhook do Whatsapp Business API
- Ou node Gmail/SendGrid para email

## 5. Retry automático para pendências

Configure no n8n Workflow Settings:
- Error Workflow: Crie um workflow separado para reprocessar falhas
- Ou use n8n Queue mode com Redis para garantir entrega

