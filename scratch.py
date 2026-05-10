import json

with open('/Users/joaosilva/Documents/DEV/checklist-offiline/CMW - Checklist Veicular PWA Offline + Directus PIN.json', 'r') as f:
    data = json.load(f)

conns = data['connections']

# 1. Preparar Registro -> É Crítico?
conns['Preparar Registro']['main'][0][0]['node'] = 'É Crítico?'

# 2. Add Responder OK - Crítico -> Remover Foto Do Payload
conns['Responder OK - Crítico'] = {
    'main': [[{'node': 'Remover Foto Do Payload', 'type': 'main', 'index': 0}]]
}

# 3. Add Responder OK - Normal -> Remover Foto Do Payload
conns['Responder OK - Normal'] = {
    'main': [[{'node': 'Remover Foto Do Payload', 'type': 'main', 'index': 0}]]
}

# 4. Tem Foto? (false) -> nothing
# Current is: "main": [[{Converter Foto...}], [{É Crítico?}]]
# We want just "main": [[{Converter Foto...}]]
conns['Tem Foto?']['main'] = [ conns['Tem Foto?']['main'][0] ]

# 5. Salvar Link Foto Directus -> nothing
if 'Salvar Link Foto Directus' in conns:
    del conns['Salvar Link Foto Directus']

with open('/Users/joaosilva/Documents/DEV/checklist-offiline/CMW - Checklist Veicular PWA Offline + Directus PIN.json', 'w') as f:
    json.dump(data, f, indent=2)

print("JSON updated successfully!")
