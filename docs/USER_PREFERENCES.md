# KYNDO — SISTEMA DE PREFERENCIAS DE USUARIO

Documento técnico que define cómo los usuarios personalizan su experiencia en KYNDO.

---

## 1. Preferencias disponibles (MVP)

### 1.1 Formato de nombres de cartas

**Configuración:** `card_name_format`

**Valores:** `scientific` | `english` | `colombian`

**Default:** `scientific`

**Ubicación en BD:** `player_state.card_name_format`

**Afecta a:**
- Cartas en colección
- Cartas en Memory
- Cartas en Battle
- Overlay de foco
- Pantalla de resultado

**NO afecta a:**
- Base de datos (siempre tiene los 3 nombres)
- Otros jugadores
- Búsqueda (busca en los 3 nombres)

---

## 2. Lógica de aplicación

### 2.1 Orden de prioridad
```javascript
function getCardDisplayNames(card, userFormat) {
  const allNames = {
    scientific: card.scientific_name,
    english: card.english_name,
    colombian: card.colombian_name
  };
  
  // Definir orden según preferencia
  const orders = {
    scientific: ['scientific', 'english', 'colombian'],
    english: ['english', 'scientific', 'colombian'],
    colombian: ['colombian', 'scientific', 'english']
  };
  
  const order = orders[userFormat] || orders.scientific;
  
  return {
    title: allNames[order[0]],      // Título principal
    subtitle1: allNames[order[1]],  // Subtítulo 1
    subtitle2: allNames[order[2]]   // Subtítulo 2
  };
}
```

---

### 2.2 Renderizado dinámico

**React/Flutter ejemplo:**
```javascript
function CardComponent({ card, userPreference }) {
  const names = getCardDisplayNames(card, userPreference);
  
  return (
    <div className="card">
      <div className="card-image">
        <img src={card.image_url} alt={names.title} />
      </div>
      <div className="card-names">
        <h2 className="card-title">{names.title.toUpperCase()}</h2>
        <p className="card-subtitle">{names.subtitle1}</p>
        <p className="card-subtitle">{names.subtitle2}</p>
      </div>
    </div>
  );
}
```

---

## 3. UX de configuración

### 3.1 Ubicación recomendada

**Opción A (preferida):**
```
Home → ⚙️ Settings → Display → Card Name Format
```

**Opción B:**
```
Collection → ⚙️ → Card Name Format
```

---

### 3.2 Componente de configuración
```javascript
function CardNameFormatSettings({ currentFormat, onChange }) {
  const formats = [
    {
      id: 'scientific',
      label: 'Nombre científico (defecto)',
      example: {
        title: 'AQUILA CHRYSAETOS',
        subtitle1: 'Golden Eagle',
        subtitle2: 'Águila Real'
      }
    },
    {
      id: 'english',
      label: 'Nombre en inglés',
      example: {
        title: 'GOLDEN EAGLE',
        subtitle1: 'Aquila chrysaetos',
        subtitle2: 'Águila Real'
      }
    },
    {
      id: 'colombian',
      label: 'Nombre común en Colombia',
      example: {
        title: 'ÁGUILA REAL',
        subtitle1: 'Aquila chrysaetos',
        subtitle2: 'Golden Eagle'
      }
    }
  ];
  
  return (
    <div className="format-selector">
      {formats.map(format => (
        <div key={format.id} className="format-option">
          <input 
            type="radio" 
            id={format.id}
            checked={currentFormat === format.id}
            onChange={() => onChange(format.id)}
          />
          <label htmlFor={format.id}>
            <h3>{format.label}</h3>
            <div className="format-preview">
              <div className="preview-title">{format.example.title}</div>
              <div className="preview-subtitle">{format.example.subtitle1}</div>
              <div className="preview-subtitle">{format.example.subtitle2}</div>
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. API Endpoints

### POST `/player/settings/card-format`
```json
{
  "player_id": "uuid",
  "format": "english"
}
```

**Response:**
```json
{
  "success": true,
  "format": "english",
  "updated_at": "2025-01-29T10:30:00Z"
}
```

### GET `/player/settings`

**Response:**
```json
{
  "player_id": "uuid",
  "card_name_format": "scientific",
  "updated_at": "2025-01-29T10:30:00Z"
}
```

---

## 5. Testing

### 5.1 Casos de prueba

**Test 1: Cambio de formato**
```
DADO un usuario con formato 'scientific'
CUANDO cambia a 'english'
ENTONCES todas las cartas visibles se actualizan inmediatamente
Y el cambio persiste al recargar
```

**Test 2: Primera carga**
```
DADO un usuario nuevo sin preferencia
CUANDO carga la app por primera vez
ENTONCES se usa 'scientific' por defecto
```

**Test 3: Sincronización**
```
DADO un usuario con formato 'colombian' en web
CUANDO inicia sesión en móvil
ENTONCES móvil usa formato 'colombian'
```

**Test 4: Búsqueda**
```
DADO un usuario con formato 'english'
CUANDO busca "Águila Real" (colombiano)
ENTONCES encuentra la carta correctamente
(la búsqueda opera en los 3 nombres)
```

---

## Estado del documento

- **Versión:** v1.0
- **Dependencias:** Manual-UX-UI.md, Esquema-BD.md
- **Última actualización:** Enero 2025

---

**Fin de USER_PREFERENCES.md v1.0**
