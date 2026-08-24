# A Contrarreloj

**TP3 – Info Aplicada 1 (UNA 2026)**
Minijuego interactivo bidimensional desarrollado en p5.js.

---

## Sobre el juego

Estás llegando tarde y tenés que salir de casa, pero no encontrás nada. Hay que juntar las llaves, el celular, la billetera y el zapato mientras el perro te persigue, el gato anda dando vueltas y la tele prendida te distrae.

El juego tiene **dos modos**, que se eligen desde el menú:

| Modo | De qué se trata |
|---|---|
| **1 jugador** | Carrera contra vos mismo. Juntá una cosa de cada tipo lo más rápido posible. El cronómetro cuenta para arriba y tu mejor tiempo queda guardado en el navegador. |
| **2 jugadores** | Competitivo en la misma pantalla. WASD contra las flechas, 45 segundos, gana el que tenga más puntos. |

---

## Controles

| Acción | Modo 1 jugador | Modo 2 jugadores |
|---|---|---|
| Mover | `W` `A` `S` `D` o las flechas | J1: `W` `A` `S` `D` · J2: `↑` `↓` `←` `→` |
| Pausar | `P` o el botón de pausa | `P` o el botón de pausa |
| Sonido | `M` o el botón del parlante | `M` o el botón del parlante |
| Volver al menú | `R` en la pantalla de fin | `R` en la pantalla de fin |

Todos los botones del juego se pueden clickear con el mouse, y también funcionan por toque en pantallas táctiles.

---

## Qué hay en pantalla

### Objetos a juntar

Llaves, celular, billetera y zapato.

- En **1 jugador** hay que juntar uno de cada tipo; solo aparecen los que todavía faltan, así siempre se puede terminar.
- En **2 jugadores** cada uno vale **+1 punto**.

### Power-ups

| Objeto | 1 jugador | 2 jugadores |
|---|---|---|
| ☕ **Café** | Te acelera un 60% durante 5 segundos | +1 punto y te acelera igual |
| ⏰ **Reloj** | Te descuenta 3 segundos del cronómetro | +1 punto y le **roba** 1 punto al rival |

### Distracciones

| Quién | Cómo se mueve | 1 jugador | 2 jugadores |
|---|---|---|---|
| 📺 **Tele prendida** | Aparece quieta, como los objetos | +3 segundos y te frena | −1 punto y te frena |
| 🐕 **Perro** | Te persigue todo el tiempo | +3 segundos y te frena | −1 punto y te frena |
| 🐈 **Gato** | Camina hacia lugares al azar | +3 segundos y te frena | −1 punto y te frena |

Chocar con el perro o con el gato penaliza **una vez cada segundo y medio**, no en cada frame, así que quedarse pegado no arruina la partida.

En 2 jugadores la dificultad sube con el tiempo: la probabilidad de que aparezca la tele arranca en 30% y llega al 55% cerca del final.

### Condición de fin

- **1 jugador**: se detiene el cronómetro al juntar las 4 cosas. Si pasan 90 segundos sin completarlo, perdés.
- **2 jugadores**: a los 45 segundos gana el que tenga más puntos. Si empatan, es empate.

---

## Flujo de pantallas

1. **Menú** — título, mejor tiempo guardado y los dos modos. También lleva a los créditos.
2. **Instrucciones** — dividida en dos pestañas: **Controles** y **Objetos**, con el sprite de cada cosa al lado de su regla.
3. **Créditos** — autoría, cátedra y facultad, en su propia pantalla.
4. **Juego** — loop principal: moverse, recolectar, esquivar.
5. **Fin** — resultado de la partida y vuelta al menú.

---

## Tecnología

- **p5.js** (librería principal, vía CDN) y **p5.sound** para los efectos y el loop de alarma
- **Google Fonts**: Press Start 2P (títulos) y Nunito (textos)
- **Programación orientada a objetos**: clases `Jugador`, `Item` y `Enemigo`
- **Máquina de estados** con las pantallas obligatorias de la consigna
- **Detección de colisiones** por distancia radial con `dist()`
- **Control de tiempo** con `millis()`, descontando lo que estuvo en pausa
- **Movimiento fluido** con `keyIsDown()`
- **Interactividad por mouse y touch** con `mousePressed()` y `touchStarted()`
- **`localStorage`** para guardar el mejor tiempo entre sesiones
- **`p5.Vector`** para el movimiento de las mascotas

---

## Estructura del proyecto

```
├── index.html
├── sketch.js
├── README.md
├── guion-presentacion.md
└── assets/
    ├── img/
    │   ├── fondo.png          (el living visto desde arriba, cuadrado)
    │   ├── jugador1.png
    │   ├── jugador2.png
    │   ├── llaves.png
    │   ├── celular.png
    │   ├── billetera.png
    │   ├── zapato.png
    │   ├── tele.png
    │   ├── cafe.png
    │   ├── reloj.png
    │   ├── perro.png
    │   └── gato.png
    └── audio/
        ├── recolectar.mp3
        ├── trampa.mp3
        └── alarma.mp3
```

### Sobre los sprites

Los PNG van con **fondo transparente** y el dibujo **centrado**. No importa a qué resolución estén hechos: cada uno se escala solo para entrar en su caja de referencia (`TAM_ITEM`) **sin deformarse**, respetando su proporción original.

Si falta alguno de los archivos, el juego no se rompe: dibuja una forma simple de respaldo en su lugar y sigue andando.

---

## Cómo probarlo localmente

1. Cloná el repositorio.
2. Abrí la carpeta en VS Code.
3. Usá la extensión **Live Server** y hacé clic en "Open with Live Server" sobre `index.html`.

> No lo abras haciendo doble clic en el archivo: los navegadores bloquean la carga de imágenes y sonidos por CORS si no corre en un servidor local.

---

## Autoría

Camila Mihalyczo, Ana Robledo y Álvaro Oxley
UNA 2026 — Info Aplicada 1 (Prof. David Bedoian)
