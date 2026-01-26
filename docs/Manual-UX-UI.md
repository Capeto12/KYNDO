# KYNDO — Manual UX/UI Técnico

Este documento define cómo se comporta el juego para el usuario.
No define diseño gráfico ni colores.

## 1. Dispositivos
KYNDO debe funcionar correctamente en:
- Celulares (prioridad)
- Tablets
- Computadores

No se optimiza para marcas específicas.

## 2. Pantallas del MVP
El MVP incluye solo estas pantallas:
- Home
- Memory
- Resultado

No existen otras pantallas en esta fase.

## 3. Home
La pantalla Home muestra:
- Nombre del juego
- Opción para entrar a Memory

No muestra progreso complejo ni estadísticas avanzadas.

## 4. Memory (regla clave)
El juego Memory puede mostrar muchas cartas al mismo tiempo.

Cuando hay pocas cartas:
- Se muestran todas normalmente.

Cuando hay muchas cartas:
- Las cartas se ven pequeñas.
- Al tocar una carta:
  - El tablero se congela.
  - La carta se agranda y ocupa el centro de la pantalla.
  - El fondo se oscurece.
- Al cerrar:
  - La carta vuelve exactamente a su lugar.
  - El tablero continúa igual.

Esta transición es obligatoria para que el juego funcione bien en celular.

## 5. Resultado
Después de terminar una partida:
- Se muestra si fue éxito o fallo.
- Se permite volver a Home.
