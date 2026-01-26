# KYNDO — Checklist de Endpoints (MVP)

Este documento define qué acciones básicas existen en el sistema.
No define cómo se programan, solo qué deben permitir.

Si algo no está aquí, no existe en el MVP.

## 1. Entrada al juego
- Entrar al juego sin registro complejo.
- Crear un jugador automáticamente si no existe.
- Permitir volver a entrar sin perder progreso.

## 2. Home
- Mostrar opción para iniciar una partida Memory.
- No mostrar información avanzada.

## 3. Iniciar Memory
- Crear una partida nueva.
- Decidir cuántas cartas se muestran.
- Preparar el tablero para celular y computador.

## 4. Jugar Memory
- Permitir voltear cartas.
- Registrar intentos y errores.
- Detectar cuándo la partida termina.

Cuando hay muchas cartas:
- El sistema debe permitir agrandar una carta.
- El tablero debe quedar congelado mientras la carta está grande.
- Al cerrar, todo vuelve exactamente al mismo estado.

## 5. Resultado
- Informar si la partida fue exitosa o no.
- Permitir volver al Home.

## 6. Persistencia mínima
- Guardar que el jugador jugó.
- No perder progreso básico.
