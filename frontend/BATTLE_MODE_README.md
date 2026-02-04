KYNDO — Documento Maestro del Juego de Combate (A/D)
Versión: v1.0 (Fuente Única de Verdad)
________________________________________
0. Propósito
Definir, sin ambigüedades, el modo de combate Ataque/Defensa (A/D) de KYNDO para que una IA (Copilot/LLM) pueda codificar el motor, el flujo y la UI de forma consistente. Este documento congela reglas, estados, cálculos y visibilidad.
________________________________________
1. Principios Rectores
1.	Memoria aplicada > memoria pasiva: el jugador gana cuando recuerda y aplica fortalezas en el momento correcto.
2.	Contexto > fuerza bruta: el entorno y la coherencia deciden.
3.	Perder bien jugado progresa: la energía premia criterio, no solo victoria.
4.	Roles dinámicos: atacante/defensor cambian cada ronda.
5.	Explicabilidad: todo resultado debe poder explicarse.
________________________________________
2. Cartas A / B / C (por especie)
•	Carta A: siempre visible; muestra ATK y DEF (0–99). Jugable desde inicio.
•	Carta B: se desbloquea en Memory; revela subatributos y composición.
•	Carta C: se desbloquea en Memory avanzado; activa habilidades (deltas discretos).
El valor final A/D es visible desde A; la explicación se desbloquea con B y C.
________________________________________
3. Factores del Motor A/D
3.0 Fortaleza principal de la carta (primaryStrength)
Cada carta DEBE declarar explícitamente sus fortalezas para permitir evaluar coherencia y estimulación.
•	primaryStrength (obligatoria): una característica dominante.
•	secondaryStrength (opcional): segunda característica relevante.
Valores permitidos:
•	Ataque: {P, S, W, H, A}
•	Defensa: {AD, C, E, SD, R}
Regla dura:
•	Solo se puede estimular primaryStrength o secondaryStrength.
•	La evaluación de “jugar bien” usa estas declaraciones, no inferencias.
________________________________________
3.1 Ataque (0–10)
•	P Depredación
•	S Velocidad
•	W Anatomía ofensiva
•	H Estrategia
•	A Agresividad
3.2 Defensa (0–10)
•	AD Adaptabilidad
•	C Camuflaje
•	E Evasión
•	SD Defensa social
•	R Robustez
Pesos recomendados (defensa): AD 0.30, C 0.25, E 0.20, SD 0.15, R 0.10
________________________________________
4. Cálculo Matemático (cerrado y explícito)
Esta sección define las fórmulas exactas para calcular Ataque y Defensa. No hay interpretaciones.
4.1 Variables base (0–10)
Ataque
•	P = Depredación
•	S = Velocidad
•	W = Anatomía ofensiva
•	H = Estrategia de caza
•	A = Agresividad
Defensa
•	AD = Adaptabilidad
•	C = Camuflaje
•	E = Evasión
•	SD = Defensa social
•	R = Robustez
________________________________________
4.2 Pesos oficiales (suman 1.0)
Pesos de Ataque
•	wP = 0.25
•	wS = 0.20
•	wW = 0.20
•	wH = 0.20
•	wA = 0.15
Pesos de Defensa
•	wAD = 0.30
•	wC = 0.25
•	wE = 0.20
•	wSD = 0.15
•	wR = 0.10
Nota de diseño: Adaptabilidad y Camuflaje dominan la defensa. Robustez es secundaria.
________________________________________
4.3 Cálculo base (sin entorno ni habilidades)
Ataque base (0–10):
ATK_base_0_10 = (P*wP) + (S*wS) + (W*wW) + (H*wH) + (A*wA)
Defensa base (0–10):
DEF_base_0_10 = (AD*wAD) + (C*wC) + (E*wE) + (SD*wSD) + (R*wR)
________________________________________
4.4 Normalización a escala de combate (0–99)
ATK_base_0_99 = round( (ATK_base_0_10 / 10) * 99 )
DEF_base_0_99 = round( (DEF_base_0_10 / 10) * 99 )
Los valores 00–99 son los que se muestran en Carta A.
________________________________________
4.5 Modificadores por entorno (porcentuales)
Cada entorno define un factor porcentual independiente para ataque y defensa:
ATK_env = ATK_base_0_99 * (1 + envAtkPct)
DEF_env = DEF_base_0_99 * (1 + envDefPct)
Ejemplo:
•	envDefPct = +0.20 → +20% defensa
•	envAtkPct = −0.30 → −30% ataque
________________________________________
4.6 Estimulación de característica (Contenedor 1)
Si el jugador usa energía para estimular una característica, el estímulo se aplica ANTES del entorno y SOLO a la característica seleccionada.
4.6.1 Aplicación del estímulo (0–10)
Sea stimChar la característica elegida y stimBonus el bono según energía:
•	≥20% → +5
•	≥40% → +10
•	≥60% → +15
•	≥80% → +20
// ejemplo para ataque
if stimChar ∈ {P,S,W,H,A}:
    stimChar = min(stimChar + stimBonus , 10)

// ejemplo para defensa
if stimChar ∈ {AD,C,E,SD,R}:
    stimChar = min(stimChar + stimBonus , 10)
El estímulo no puede crear una fortaleza inexistente: solo se permite si la característica es una fortaleza real de la carta.
Luego se recalcula el ATK_base_0_10 o DEF_base_0_10 con los valores estimulados.
________________________________________
4.7 Penalización por contexto impuesto (combate avanzado)
Si el defensor impone un contexto (p. ej. ALTURA) con umbral T:
if attacker.AD < T:
    ATK_env = ATK_env * penaltyFactor
Valores recomendados:
•	penaltyFactor ∈ [0.30 , 0.50]
________________________________________
4.7 Habilidades (Carta C) — deltas discretos
Las habilidades no escalan porcentualmente. Aplican deltas:
ATK_final = ATK_env + Σ(deltaATK)
DEF_final = DEF_env + Σ(deltaDEF)
________________________________________
4.8 Clamp final (regla dura)
ATK_final = clamp(ATK_final , 0 , 99)
DEF_final = clamp(DEF_final , 0 , 99)
Estos valores finales son los que se comparan en la Arena.
________________________________________
5. Iniciativa y Flujo de Rondas
5.1 Ronda Inicial (Iniciativa)
•	Ambos juegan una carta en la Arena.
•	ATK vs ATK, sin entorno, sin énfasis, sin habilidades.
•	No puntúa; define atacante de la Ronda 1.
•	Empate: repetir.
5.2 Rondas Normales
•	Atacante = ganador de la ronda anterior.
•	Atacante actúa primero; defensor reacciona.
Empate: el defensor pasa a ser atacante.
________________________________________
6. Tablero de Combate (Layout Fijo)
Fuente geométrica: tablero oficial con 2 filas: arriba 3 contenedores, abajo 5 contenedores.
6.1 Disposición exacta (IDs y orden)
FILA SUPERIOR (PREPARACIÓN / REGLAS)
[Cont1]   [Cont2]   [Cont3]

FILA INFERIOR (COMBATE)
[Cont4] [Cont5] [Cont6] [Cont7] [Cont8]
•	No reordenar. Los IDs son contractuales para la IA.

Ver tablerodebatalla.pdf

6.2 Jerarquía de tamaños (obligatoria)
•	Grandes: Cont1, Cont4, Cont5
•	Medio–Grande: Cont6 (ARENA)
•	Medio: Cont2
•	Pequeños: Cont3, Cont7, Cont8
Los contenedores pequeños representan acciones/movimiento y no deben competir visualmente con las cartas activas.
6.3 Función por contenedor
•	Cont1 (GRANDE):
o	Envase de Energía (Maestría)
o	Selector de característica a estimular
o	Botón READY (bloquea decisiones)
•	Cont2 (MEDIO):
o	Enfoque del ATACANTE (ataque normal o característica enfatizada)
•	Cont3 (PEQUEÑO):
o	Acción del DEFENSOR (selección defensiva). Contenido oculto al rival.
•	Cont4 (GRANDE):
o	Carta activa Jugador A (visible solo para su dueño hasta el reveal)
•	Cont5 (GRANDE):
o	Carta activa Jugador B (visible solo para su dueño hasta el reveal)
•	Cont6 (ARENA – MEDIO/GRANDE):
o	Reveal simultáneo
o	Cálculo (base → entorno → deltas)
o	Resultado y explicación (explicabilidad)
•	Cont7 (PEQUEÑO):
o	Reserva / movimiento Jugador A (oculto al rival)
•	Cont8 (PEQUEÑO):
o	Reserva / movimiento Jugador B (oculto al rival)
6.4 Reglas de visibilidad (críticas)
•	Antes del reveal:
o	Cont4 y Cont5: boca abajo para el oponente.
o	Cont3, Cont7, Cont8: siempre ocultos al oponente (solo indicador de acción).
•	Reveal:
o	Solo en Cont6 se revela todo (cartas, enfoques, penalizaciones, deltas).
6.5 Flujo de interacción por ronda (tablero)
1.	Cont1: elegir carta, característica (si aplica) y presionar READY.
2.	Cont2: el ATACANTE fija enfoque.
3.	Cont3: el DEFENSOR fija respuesta.
4.	Cont4/5: cartas bloqueadas (ocultas).
5.	Cont6: reveal, resolución y explicación.
6.	Ganador toma iniciativa de la siguiente ronda.
________________________________________
7. Contenedor 1 — Energía, Selector y READY
7.1 Energía (Maestría)
•	Rango 0–100%.
•	+20% si la ronda fue bien jugada y ganada.
•	+10% si fue bien jugada pero perdida (rival superior).
•	0% si fue incoherente.
7.2 Selector de Característica
•	Se elige una característica real de la carta.
•	Potencia según energía disponible:
o	≥20%: +5
o	≥40%: +10
o	≥60%: +15
o	≥80%: +20
•	Aplica solo a la siguiente ronda.
7.3 READY
•	Bloquea carta, característica y consumo.
•	Avanza solo cuando ambos están READY.
________________________________________
8. ¿Qué es “Jugar Bien”?
Una ronda es bien jugada si cumple los 3 pilares:
1.	Rol correcto: atacar cuando corresponde, defender cuando corresponde.
2.	Fortaleza correcta: usar/estimular la característica principal del ave.
3.	Momento correcto: usar la carta adecuada al contexto.
Ganar no implica jugar bien; perder no implica jugar mal.
________________________________________
9. Combate Avanzado — Énfasis por Característica
•	El atacante elige enfoque ofensivo.
•	El defensor elige enfoque defensivo.
•	Si el defensor impone un contexto (p. ej., altura) y el atacante no cumple umbral, su ATK se penaliza.
________________________________________
10. Aves Comunes y Defensa Alta
•	Alta frecuencia ⇒ defensa estructural alta (AD, C, E), no robustez.
•	Pueden neutralizar ataques superiores imponiendo contexto.
________________________________________
11. Habilidades Extraordinarias (Carta C)
•	Representan traits únicos (velocidad extrema, camuflaje excepcional, canto, inteligencia, etc.).
•	Implementadas como deltas discretos y/o condiciones.
________________________________________
12. Telemetría y Explicabilidad
Registrar por ronda:
•	cartas, entorno, enfoque, deltas, resultado.
Mostrar en Arena: por qué ganó/perdió.
________________________________________
13. Reglas de Implementación (IA)
•	Motor puro (sin UI).
•	Config por datos (pesos, entornos, umbrales).
•	Determinismo (seed).
•	Tests: unitarios, integración y golden.
________________________________________
14. Ejemplo numérico completo (canónico)
Carta: Colibrí de páramo
•	primaryStrength = AD
•	secondaryStrength = E
Valores base (0–10):
•	Ataque: P=2, S=6, W=2, H=4, A=2
•	Defensa: AD=9, C=5, E=8, SD=3, R=1
Energía: 60% → estimulación +15 a AD
Paso 1 — Estimulación
•	AD: min(9 + 15, 10) = 10
Paso 2 — Cálculo base (0–10)
•	ATK_base_0_10 = (20.25)+(60.20)+(20.20)+(40.20)+(2*0.15) = 3.30
•	DEF_base_0_10 = (100.30)+(50.25)+(80.20)+(30.15)+(1*0.10) = 7.40
Paso 3 — Normalización (0–99)
•	ATK_base_0_99 = round((3.30/10)*99) = 33
•	DEF_base_0_99 = round((7.40/10)*99) = 73
Paso 4 — Entorno (páramo)
•	envDefPct = +0.20 → DEF_env = 73 * 1.20 = 88
•	envAtkPct = −0.10 → ATK_env = 33 * 0.90 = 30
Paso 5 — Penalización por contexto
•	Atacante AD = 4 < umbral 7 → penaltyFactor = 0.4
•	ATK_env = 30 * 0.4 = 12
Paso 6 — Habilidades C
•	No aplica
Paso 7 — Clamp final
•	ATK_final = 12
•	DEF_final = 88
Resultado: el colibrí sobrevive y gana por defensa contextual, aunque su ataque sea bajo.
________________________________________
15. Checklist DoD
•	PvE/PvP funcional.
•	Iniciativa correcta.
•	Energía coherente.
•	Explicabilidad visible.
•	Sin hardcodeo de balance.
________________________________________
Fin del Documento Maestro — Combate KYNDO v1.0

