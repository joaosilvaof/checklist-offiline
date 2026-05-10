#!/usr/bin/env node
/*
  Cria/atualiza as coleções do Checklist CMW no Directus.

  Uso:
    DIRECTUS_URL="https://base.cmwtransportes.org" \
    DIRECTUS_TOKEN="SEU_TOKEN_ADMIN" \
    node create-directus-schema.js
*/

const DIRECTUS_URL = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('Informe DIRECTUS_URL e DIRECTUS_TOKEN nas variáveis de ambiente.');
  process.exit(1);
}

async function api(path, options = {}) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}\n${msg}`);
  }
  return data;
}

async function collectionExists(collection) {
  const data = await api('/collections');
  return (data.data || []).some(c => c.collection === collection);
}

async function createCollection(collection, note) {
  if (await collectionExists(collection)) {
    console.log(`✓ Coleção já existe: ${collection}`);
    return;
  }

  await api('/collections', {
    method: 'POST',
    body: JSON.stringify({
      collection,
      meta: {
        collection,
        icon: 'assignment',
        note,
        hidden: false,
        singleton: false,
        accountability: 'all',
      },
      schema: { name: collection },
    }),
  });
  console.log(`+ Coleção criada: ${collection}`);
}

async function getFields(collection) {
  const data = await api(`/fields/${collection}`);
  return new Set((data.data || []).map(f => f.field));
}

function field(field, type, opts = {}) {
  const dataTypeByType = {
    uuid: 'uuid',
    string: 'varchar',
    text: 'text',
    integer: 'integer',
    boolean: 'boolean',
    dateTime: 'timestamp',
    json: 'json',
  };

  return {
    field,
    type,
    meta: {
      interface: opts.interface || null,
      special: opts.special || null,
      required: !!opts.required,
      readonly: !!opts.readonly,
      hidden: !!opts.hidden,
      note: opts.note || null,
      options: opts.options || null,
      display: opts.display || null,
      width: opts.width || 'full',
    },
    schema: {
      name: field,
      data_type: dataTypeByType[type] || 'varchar',
      is_nullable: !opts.required,
      is_unique: !!opts.unique,
      default_value: opts.default ?? null,
      max_length: type === 'string' ? (opts.maxLength || 255) : null,
    },
  };
}

async function createFields(collection, fields) {
  const existing = await getFields(collection);

  for (const f of fields) {
    if (existing.has(f.field)) {
      console.log(`  ✓ Campo já existe: ${collection}.${f.field}`);
      continue;
    }

    await api(`/fields/${collection}`, {
      method: 'POST',
      body: JSON.stringify(f),
    });
    console.log(`  + Campo criado: ${collection}.${f.field}`);
  }
}

const commonDateFields = [
  field('created_at', 'dateTime', { readonly: true, special: ['date-created'], interface: 'datetime', note: 'Criado em' }),
  field('updated_at', 'dateTime', { readonly: true, special: ['date-updated'], interface: 'datetime', note: 'Atualizado em' }),
];

const schemas = {
  motoristas_checklist: [
    field('id', 'uuid', { required: true, unique: true, readonly: true, special: ['uuid'], interface: 'input', default: null }),
    field('matricula', 'string', { required: true, unique: true }),
    field('nome', 'string', { required: true }),
    field('pin_hash', 'string', { required: true, maxLength: 128 }),
    field('unidade', 'string', { required: true }),
    field('status', 'string', { required: true, default: 'ativo' }),
    field('validade_offline_dias', 'integer', { required: true, default: 30 }),
    field('tipo_acesso', 'string', { required: true, default: 'movel', note: 'garagem ou movel' }),
    field('exige_dispositivo_autorizado', 'boolean', { required: true, default: false }),
    ...commonDateFields,
  ],

  dispositivos_checklist: [
    field('id', 'uuid', { required: true, unique: true, readonly: true, special: ['uuid'], interface: 'input' }),
    field('device_id', 'string', { required: true, unique: true }),
    field('nome_dispositivo', 'string', { required: true }),
    field('unidade', 'string', { required: true }),
    field('status', 'string', { required: true, default: 'ativo' }),
    field('tipo', 'string', { required: true, default: 'garagem' }),
    field('observacoes', 'text'),
    ...commonDateFields,
  ],

  checklists_veiculares: [
    field('id', 'uuid', { required: true, unique: true, readonly: true, special: ['uuid'], interface: 'input' }),
    field('protocolo', 'string', { required: true, unique: true }),
    field('protocolo_local', 'string', { required: true, unique: true, note: 'Chave de idempotência do PWA' }),
    field('status_operacional', 'string', { required: true, default: 'Liberado' }),
    field('prioridade', 'string', { required: true, default: 'Normal' }),
    field('unidade', 'string', { required: true }),
    field('unidade_tablet', 'string'),
    field('nome_dispositivo', 'string'),
    field('device_id', 'string', { required: true }),
    field('tipo_acesso', 'string'),
    field('exige_dispositivo_autorizado', 'boolean'),
    field('dispositivo_autorizado', 'boolean'),
    field('motorista_id', 'string', { required: true }),
    field('motorista_matricula', 'string', { required: true }),
    field('motorista_nome', 'string', { required: true }),
    field('tipo_veiculo', 'string', { required: true }),
    field('prefixo', 'string', { required: true }),
    field('placa', 'string', { required: true }),
    field('km', 'integer', { required: true }),
    field('condutor_nome', 'string', { required: true }),
    field('cinto_motorista_ok', 'string', { required: true }),
    field('cintos_passageiros_ok', 'string', { required: true }),
    field('problema_cinto_detalhe', 'text'),
    field('freio_ok', 'string', { required: true }),
    field('pneus_ok', 'string', { required: true }),
    field('farol_lanterna_seta_ok', 'string', { required: true }),
    field('porta_ok', 'string', { required: true }),
    field('extintor_ok', 'string', { required: true }),
    field('saida_emergencia_ok', 'string', { required: true }),
    field('observacoes', 'text'),
    field('itens_criticos', 'text'),
    field('criado_em_aparelho', 'dateTime'),
    field('recebido_em', 'dateTime', { required: true }),
    field('online_no_momento', 'boolean'),
    field('origem', 'string'),
    field('foto_url', 'string', { maxLength: 1024 }),
    field('foto_drive_id', 'string'),
    ...commonDateFields,
  ],
};

async function main() {
  console.log(`Directus: ${DIRECTUS_URL}`);

  await createCollection('motoristas_checklist', 'Motoristas/usuários do checklist offline CMW');
  await createFields('motoristas_checklist', schemas.motoristas_checklist);

  await createCollection('dispositivos_checklist', 'Dispositivos fixos/autorizados para checklist CMW');
  await createFields('dispositivos_checklist', schemas.dispositivos_checklist);

  await createCollection('checklists_veiculares', 'Registros de checklist veicular CMW');
  await createFields('checklists_veiculares', schemas.checklists_veiculares);

  console.log('\nConcluído. Verifique no Directus se os campos id foram marcados como chave primária.');
}

main().catch(err => {
  console.error('\nErro ao criar schema:');
  console.error(err.message);
  process.exit(1);
});
