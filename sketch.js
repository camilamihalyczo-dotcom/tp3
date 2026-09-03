
// ======================================================
// TP3 - Minijuego "A Contrarreloj"
// Vibe: "llegando tarde de casa" - buscás tus cosas
// antes de que se acabe el tiempo.
// Máquina de estados: MENU -> INSTRUCCIONES -> JUEGO -> FIN
// (+ CREDITOS, una pantalla extra a la que se entra desde el menú)
// ======================================================

let gameState = "MENU"; // qué pantalla se dibuja: MENU, INSTRUCCIONES, CREDITOS, JUEGO, FIN
let gameMode = "2J";    // "1J" (carrera contra uno mismo) o "2J" (competitivo)
let pausado = false;    // true mientras el juego está en pausa (tecla P o click)
let tiempoAcumuladoPausa = 0; // milisegundos totales en pausa, para no desviar el timer
let momentoInicioPausa = 0;   // millis() de cuando arrancó la pausa actual
let sonidoActivado = true;    // false = juego en mudo (botón de sonido o tecla M)
let pestana = "CONTROLES";    // pestaña abierta en la pantalla de instrucciones

// --- Modo 1 jugador: cronómetro que cuenta hacia arriba + mejor tiempo ---
const CLAVE_MEJOR_TIEMPO = 'aContrarreloj_mejorTiempo1J'; // clave de localStorage
const MAX_TIEMPO_1J = 90; // si no termina en 90s, se considera "tiempo agotado"
let mejorTiempo = null;          // mejor tiempo guardado (segundos), null si nunca jugó
let objetivosRecolectados = new Set(); // qué tipos de objeto ya se juntaron en la ronda
let penalizacionAcumulada = 0;   // segundos sumados por trampas, restados por el reloj
let tiempoTranscurrido = 0;      // cronómetro actual del modo 1 jugador (segundos)
// Se llena al terminar la ronda: 'anterior' guarda el récord que había antes,
// para poder mostrarlo en la pantalla de fin (null si era el primer intento).
let resultado1J = { tiempoFinal: 0, esRecord: false, completo: true, anterior: null };

// --- Configuración general de pantalla y partida ---
// El canvas es cuadrado para que la imagen de fondo (el living visto desde
// arriba, que también es cuadrada) entre entera y sin deformarse.
const ANCHO = 700;
const ALTO = 700;
const DURACION_PARTIDA = 45; // duración de la partida en segundos (modo 2 jugadores)
let tiempoInicio = 0;        // momento (millis) en que arrancó la partida
let tiempoRestante = DURACION_PARTIDA;

// --- Tipografías (se cargan desde Google Fonts en el index.html) ---
// Pixel para los títulos, para que tenga onda de arcade; una sans redonda
// para los textos, que es lo que de verdad se tiene que poder leer.
// Ojo con las comillas de adentro: p5 arma el CSS como "36px " + fuente, y un
// nombre con espacios sin comillas no es CSS válido y se cae a la fuente por
// defecto. Por eso 'Press Start 2P' va entrecomillado dentro del string.
const FUENTE_TITULO = "'Press Start 2P'";
const FUENTE_TEXTO = "Nunito";

// --- Botones clickeables (requisito de interactividad por mouse/touch) ---
// Cada uno es un rectángulo {x, y, w, h}: alcanza para saber si el mouse
// está encima (hover) y si el click cayó adentro.
const BOTON_MENU_1J = { x: ANCHO / 2 - 140, y: 300, w: 280, h: 54 };
const BOTON_MENU_2J = { x: ANCHO / 2 - 140, y: 366, w: 280, h: 54 };
const BOTON_CREDITOS = { x: ANCHO / 2 - 85, y: 450, w: 170, h: 40 };
const BOTON_PESTANA_A = { x: ANCHO / 2 - 160, y: 140, w: 155, h: 42 }; // "CONTROLES"
const BOTON_PESTANA_B = { x: ANCHO / 2 + 5, y: 140, w: 155, h: 42 }; // "OBJETOS"
const BOTON_JUGAR = { x: ANCHO / 2 - 110, y: 590, w: 220, h: 54 };
const BOTON_VOLVER = { x: ANCHO / 2 - 110, y: 560, w: 220, h: 50 }; // en créditos y fin
const BOTON_ATRAS = { x: 20, y: 20, w: 100, h: 36 };               // esquina, vuelve al menú
const BOTON_PAUSA = { x: ANCHO - 56, y: ALTO - 46, w: 40, h: 34 };
const BOTON_SONIDO = { x: ANCHO - 104, y: ALTO - 46, w: 40, h: 34 };

// --- Paleta ---
const COLOR_FONDO = [43, 45, 66];        // se usa si todavía no está fondo.png
const COLOR_ALERTA = [255, 107, 53];     // naranja alarma
const COLOR_ACENTO = [255, 200, 87];     // amarillo luz
const COLOR_TRAMPA = [230, 57, 70];      // rojo trampa
const COLOR_BUENO = [120, 225, 160];     // verde de los power-ups
const COLOR_PERRO = [196, 138, 84];      // marrón, el que te persigue
const COLOR_GATO = [150, 150, 165];      // gris, el que vaga por la casa
const COLOR_J1 = [255, 200, 87];         // jugador 1 (amarillo)
const COLOR_J2 = [255, 107, 53];         // jugador 2 (naranja)
const VELO_PANTALLAS = [24, 22, 36, 165]; // oscurece el fondo en menús, para leer
const VELO_JUEGO = [22, 20, 34, 55];      // apenas oscurece durante la partida
const COLOR_BARRA = [22, 20, 34, 185];    // franjas del HUD

// --- Autoría ---
const AUTORES = ["Camila Mihalyczo", "Ana Robledo", "Álvaro Oxley"];
const CATEDRA = "Info Aplicada 1 — Prof. David Bedoian";
const FACULTAD = "Universidad Nacional de las Artes — 2026";

// --- Sprites: se cargan en preload() y se dibujan con imageMode(CENTER) ---
// Van en assets/img/ con estos nombres exactos, en PNG con fondo transparente:
// fondo.png, jugador1.png, jugador2.png, llaves.png, celular.png,
// billetera.png, zapato.png, tele.png, cafe.png, reloj.png, perro.png, gato.png
// El PNG se escala solo para entrar en la caja de TAM_ITEM sin deformarse,
// así que puede estar hecho a cualquier resolución.
let imgFondo;
let imgJugador1, imgJugador2;
let imgLlave, imgCelular, imgBilletera, imgZapato;
let imgTele;                  // trampa: la tele prendida, te distrae
let imgCafe, imgReloj;        // power-ups
let imgPerro, imgGato;        // las dos mascotas que se mueven por la casa

// Caja (ancho x alto) en la que entra el sprite de cada cosa. Está pensada
// para que el dibujo coincida más o menos con su radio de colisión.
const TAM_ITEM = {
  llave: { w: 40, h: 40 },
  celular: { w: 40, h: 40 },
  billetera: { w: 40, h: 40 },
  zapato: { w: 40, h: 40 },
  tele: { w: 46, h: 46 },
  cafe: { w: 40, h: 40 },
  reloj: { w: 40, h: 40 },
  jugador: { w: 56, h: 70 },
  enemigo: { w: 52, h: 52 },
};

// --- Sonidos: se cargan en setup() (carpeta assets/audio/) ---
let sonidoRecolectar; // al agarrar un ítem bueno
let sonidoTrampa;     // al chocar con la tele o una mascota
let sonidoAlarma;     // loop de fondo durante el juego

// --- Jugadores ---
let jugador1, jugador2;

// --- Ítems en pantalla (las cosas que buscás para salir) ---
let items = [];
let intervaloSpawn = 45; // cada cuántos frames aparece un ítem nuevo
let contadorSpawn = 0;

// --- Enemigos: las mascotas, que se mueven por la casa y te distraen ---
// El perro persigue al jugador más cercano ("dirigido") y el gato camina
// hacia coordenadas al azar ("aleatorio").
let enemigos = [];

// --- Tipos de objetos a recolectar (no son trampa) ---
const TIPOS_OBJETO = ["llave", "celular", "billetera", "zapato"];

// ======================================================
// CLASE Jugador (OOP): maneja posición, movimiento y puntos
// ======================================================
class Jugador {
  constructor(x, y, color, teclas, nombre) {
    this.x = x;
    this.y = y;
    this.r = 22;
    this.velocidadBase = 4.4;
    this.velocidad = this.velocidadBase;
    this.color = color;
    this.teclas = teclas; // objeto con las teclas de cada dirección (arrays)
    this.puntos = 0;
    this.nombre = nombre;
    this.mirandoDer = true; // para orientar el dibujo del personaje

    // --- Efecto temporal de velocidad (café o penalización) ---
    this.multiplicadorVel = 1; // 1.6 = más rápido (café), 0.6 = más lento
    this.efectoVelHasta = 0;   // millis() hasta cuando dura el efecto activo

    // Después de chocar con una mascota queda un rato "invulnerable", así el
    // choque penaliza una sola vez y no en cada frame que siguen pegados.
    this.invulnerableHasta = 0;
  }

  // Aplica un cambio temporal de velocidad (café: 1.6 por 5000ms;
  // choque: 0.6 por 2000ms). Si ya había un efecto activo, lo reemplaza.
  aplicarEfectoVelocidad(multiplicador, duracionMs) {
    this.multiplicadorVel = multiplicador;
    this.efectoVelHasta = millis() + duracionMs;
  }

  // true si alguna de las teclas de esa dirección está apretada.
  // Cada dirección es un array para poder tener más de una tecla (ej. W y ↑).
  teclaPresionada(listaDeTeclas) {
    for (let codigo of listaDeTeclas) {
      if (keyIsDown(codigo)) return true;
    }
    return false;
  }

  // Lee el teclado y mueve al jugador dentro de los límites del canvas
  mover() {
    if (millis() > this.efectoVelHasta) this.multiplicadorVel = 1;
    this.velocidad = this.velocidadBase * this.multiplicadorVel;

    if (this.teclaPresionada(this.teclas.izquierda)) { this.x -= this.velocidad; this.mirandoDer = false; }
    if (this.teclaPresionada(this.teclas.derecha)) { this.x += this.velocidad; this.mirandoDer = true; }
    if (this.teclaPresionada(this.teclas.arriba)) this.y -= this.velocidad;
    if (this.teclaPresionada(this.teclas.abajo)) this.y += this.velocidad;

    this.x = constrain(this.x, this.r, ANCHO - this.r);
    this.y = constrain(this.y, this.r, ALTO - this.r);
  }

  // Dibuja al jugador: el sprite si está cargado, o una silueta simple
  // como fallback para poder probar el juego sin los PNG.
  mostrar(sprite) {
    push();
    translate(this.x, this.y);

    // Aura si hay un efecto de velocidad activo: verde si va rápido (café),
    // roja si va lento (chocó con una mascota o la tele).
    if (millis() < this.efectoVelHasta) {
      noStroke();
      fill(this.multiplicadorVel > 1 ? [130, 220, 130, 110] : [220, 100, 100, 110]);
      ellipse(0, 5, 40, 40);
    }

    if (!this.mirandoDer) scale(-1, 1); // espeja el dibujo si va para la izquierda

    if (sprite) {
      dibujarSprite(sprite, TAM_ITEM.jugador.w, TAM_ITEM.jugador.h);
    } else {
      noStroke();
      fill(this.color);
      ellipse(0, -8, 20, 20);   // cabeza
      rectMode(CENTER);
      rect(0, 8, 14, 22, 4);    // torso

      // piernas animadas con frameCount (simula pasos)
      let pasoPierna = sin(frameCount * 0.3) * 6;
      fill(30);
      rect(-4, 22 + pasoPierna, 5, 12, 2);
      rect(4, 22 - pasoPierna, 5, 12, 2);
    }

    pop();
  }
}

// ======================================================
// CLASE Item: objeto para recolectar, trampa que resta puntos,
// o power-up que cambia la velocidad o el tiempo.
// ======================================================
class Item {
  constructor(probabilidadTrampa, probabilidadPowerup, tiposFaltantes) {
    this.x = random(30, ANCHO - 30);
    this.y = random(60, ALTO - 60);
    this.r = 18;

    // Se decide la categoría con un solo random(): trampa, power-up
    // u objeto normal, según las probabilidades recibidas.
    let r = random();
    if (r < probabilidadTrampa) {
      this.categoria = "trampa";
      this.tipo = "tele";
    } else if (r < probabilidadTrampa + probabilidadPowerup) {
      this.categoria = "powerup";
      this.tipo = random(["cafe", "reloj"]); // café = velocidad, reloj = tiempo
    } else {
      this.categoria = "objeto";
      // En modo 1 jugador, tiposFaltantes trae solo los tipos que todavía no
      // se recolectaron, así siempre se puede completar el objetivo.
      this.tipo = (tiposFaltantes && tiposFaltantes.length > 0)
        ? random(tiposFaltantes)
        : random(TIPOS_OBJETO);
    }
  }

  // Dibuja el ítem: el sprite si está cargado, o la forma simple de respaldo.
  mostrar() {
    push();
    translate(this.x, this.y);
    noStroke();

    let sprite = spriteDe(this.tipo);
    let tam = TAM_ITEM[this.tipo];

    if (sprite) {
      dibujarSprite(sprite, tam.w, tam.h);
    } else {
      dibujarFormaDe(this.tipo);
    }
    pop();
  }
}

// ======================================================
// CLASE Enemigo (OOP): las mascotas, que se mueven por la pantalla,
// a diferencia de la tele, que aparece quieta. Dos modos de movimiento:
// - "aleatorio": el gato elige una coordenada al azar cada tanto y camina
//   hacia ahí; al llegar, elige otra.
// - "dirigido": el perro persigue al jugador más cercano, recalculando su
//   coordenada de destino en cada frame.
// ======================================================
class Enemigo {
  constructor(x, y, color, modo) {
    this.x = x;
    this.y = y;
    this.r = 22;
    this.velocidad = 2.4;
    this.color = color;
    this.modo = modo; // "aleatorio" o "dirigido"
    this.destino = createVector(x, y); // coordenada hacia la que camina
    this.proximoCambio = 0;            // millis() en que elige nuevo destino
  }

  // Actualiza la coordenada de destino y avanza hacia ella.
  actualizar(jugadores) {
    if (this.modo === "aleatorio") {
      // Cada 1.5 a 3 segundos elige una nueva coordenada al azar
      if (millis() > this.proximoCambio) {
        this.destino = createVector(random(40, ANCHO - 40), random(60, ALTO - 60));
        this.proximoCambio = millis() + random(1500, 3000);
      }
    } else {
      // Modo dirigido: el destino es siempre la posición del jugador más
      // cercano, así lo persigue de forma constante.
      let objetivo = this.jugadorMasCercano(jugadores);
      this.destino.set(objetivo.x, objetivo.y);
    }

    // Mover hacia el destino sin pasarse (usa un vector normalizado)
    let direccion = p5.Vector.sub(this.destino, createVector(this.x, this.y));
    if (direccion.mag() > 2) {
      direccion.setMag(this.velocidad);
      this.x += direccion.x;
      this.y += direccion.y;
    }

    this.x = constrain(this.x, this.r, ANCHO - this.r);
    this.y = constrain(this.y, this.r, ALTO - this.r);
  }

  // Devuelve el jugador que está más cerca de esta mascota.
  jugadorMasCercano(jugadores) {
    let masCercano = jugadores[0];
    let distMin = dist(this.x, this.y, jugadores[0].x, jugadores[0].y);
    for (let j of jugadores) {
      let d = dist(this.x, this.y, j.x, j.y);
      if (d < distMin) { distMin = d; masCercano = j; }
    }
    return masCercano;
  }

  mostrar() {
    push();
    translate(this.x, this.y);
    noStroke();

    let sprite = this.obtenerSprite();
    if (sprite) {
      dibujarSprite(sprite, TAM_ITEM.enemigo.w, TAM_ITEM.enemigo.h);
    } else if (this.modo === "dirigido") {
      dibujarFormaDe("perro");
    } else {
      dibujarFormaDe("gato");
    }
    pop();
  }

  // El que persigue es el perro; el que vaga por la casa es el gato.
  obtenerSprite() {
    return this.modo === "dirigido" ? imgPerro : imgGato;
  }
}

// ======================================================
// DIBUJO: helpers que se usan en todas las pantallas
// ======================================================

// Devuelve la imagen cargada de ese tipo de cosa, o undefined si falta el PNG.
function spriteDe(tipo) {
  if (tipo === "llave") return imgLlave;
  if (tipo === "celular") return imgCelular;
  if (tipo === "billetera") return imgBilletera;
  if (tipo === "zapato") return imgZapato;
  if (tipo === "tele") return imgTele;
  if (tipo === "cafe") return imgCafe;
  if (tipo === "reloj") return imgReloj;
  if (tipo === "perro") return imgPerro;
  if (tipo === "gato") return imgGato;
  return undefined;
}

// Dibuja un sprite centrado en (0, 0), escalado para entrar en una caja de
// ancho x alto SIN deformarse: respeta la proporción original del PNG.
function dibujarSprite(sprite, ancho, alto) {
  let escala = min(ancho / sprite.width, alto / sprite.height);
  imageMode(CENTER);
  image(sprite, 0, 0, sprite.width * escala, sprite.height * escala);
}

// Formas de respaldo, por si falta algún PNG: se dibujan centradas en (0, 0).
function dibujarFormaDe(tipo) {
  noStroke();
  if (tipo === "tele") {
    fill(55, 55, 65);
    rectMode(CENTER);
    rect(0, 3, 28, 20, 3);   // mueble
    fill(130, 215, 240);
    rect(0, 2, 21, 13, 2);   // pantalla prendida
    stroke(55, 55, 65);
    strokeWeight(2);
    line(-6, -7, -11, -15);  // antenas
    line(6, -7, 11, -15);
    noStroke();
  } else if (tipo === "perro") {
    fill(COLOR_PERRO);
    ellipse(-11, 2, 9, 17);  // orejas caídas
    ellipse(11, 2, 9, 17);
    ellipse(0, 0, 29, 26);
    fill(60, 40, 30);
    ellipse(0, 6, 9, 6);     // hocico
    ellipse(-5, -3, 3, 3);
    ellipse(5, -3, 3, 3);
  } else if (tipo === "gato") {
    fill(COLOR_GATO);
    triangle(-11, -5, -4, -7, -9, -17); // orejas en punta
    triangle(11, -5, 4, -7, 9, -17);
    ellipse(0, 0, 27, 27);
    fill(60, 55, 60);
    ellipse(-5, -2, 3, 4);
    ellipse(5, -2, 3, 4);
    triangle(-3, 4, 3, 4, 0, 7);
  } else if (tipo === "cafe") {
    fill(150, 90, 40);
    rectMode(CENTER);
    rect(0, 2, 16, 12, 3);
    fill(90, 50, 20);
    ellipse(0, -2, 12, 6);
    noFill();
    stroke(150, 90, 40);
    strokeWeight(2);
    arc(11, 2, 8, 8, -HALF_PI, HALF_PI);
    noStroke();
  } else if (tipo === "reloj") {
    fill(100, 200, 140);
    ellipse(0, 0, 22, 22);
    fill(30);
    rect(-1, -1, 2, 8);
    rect(-1, -1, 6, 2);
  } else if (tipo === "llave") {
    fill(COLOR_ACENTO);
    ellipse(-6, 0, 12, 12);
    rect(0, -1, 14, 4);
  } else if (tipo === "celular") {
    fill(COLOR_ACENTO);
    rectMode(CENTER);
    rect(0, 0, 12, 20, 3);
  } else if (tipo === "billetera") {
    fill(COLOR_ACENTO);
    rectMode(CENTER);
    rect(0, 0, 20, 14, 2);
  } else if (tipo === "zapato") {
    fill(COLOR_ACENTO);
    rectMode(CENTER);
    rect(0, 2, 20, 8, 4);
    rect(6, -3, 8, 6, 2);
  }
}

// Dibuja el ícono de una cosa en (x, y). Se usa en las instrucciones para
// mostrar el objeto real al lado de su regla, en vez de describirlo.
function dibujarIcono(tipo, x, y) {
  push();
  translate(x, y);
  let sprite = spriteDe(tipo);
  if (sprite) {
    dibujarSprite(sprite, 34, 34);
  } else {
    dibujarFormaDe(tipo);
  }
  pop();
}

// Pinta el fondo: la foto del living si ya está cargada, o el color liso.
// El velo encima es lo que hace que los textos y los sprites se lean.
function dibujarFondo(velo) {
  if (imgFondo) {
    // "Cover": agranda la imagen lo justo para tapar todo el canvas sin
    // deformarla; lo que sobra de un lado queda fuera de pantalla. Así el
    // fondo llena la pantalla aunque el PNG no sea exactamente cuadrado.
    let escala = max(ANCHO / imgFondo.width, ALTO / imgFondo.height);
    imageMode(CENTER);
    image(imgFondo, ANCHO / 2, ALTO / 2, imgFondo.width * escala, imgFondo.height * escala);
  } else {
    background(COLOR_FONDO);
  }
  rectMode(CORNER);
  noStroke();
  fill(velo);
  rect(0, 0, ANCHO, ALTO);
}

// Devuelve true si el mouse está dentro del rectángulo de un botón.
function mouseEncimaDe(boton) {
  return mouseX > boton.x && mouseX < boton.x + boton.w &&
    mouseY > boton.y && mouseY < boton.y + boton.h;
}

// Botón principal: relleno amarillo, se pone naranja al pasarle el mouse.
function dibujarBoton(boton, etiqueta, tamTexto) {
  let encima = mouseEncimaDe(boton);
  rectMode(CORNER);
  noStroke();
  fill(0, 0, 0, 90);
  rect(boton.x + 3, boton.y + 4, boton.w, boton.h, 4); // sombrita
  fill(encima ? COLOR_ALERTA : COLOR_ACENTO);
  rect(boton.x, boton.y, boton.w, boton.h, 4);

  fill(30, 28, 40);
  textAlign(CENTER, CENTER);
  textFont(FUENTE_TEXTO);
  textStyle(BOLD);
  textSize(tamTexto || 19);
  text(etiqueta, boton.x + boton.w / 2, boton.y + boton.h / 2 + 1);
  textStyle(NORMAL);
}

// Botón secundario: solo contorno, para lo que no es la acción principal.
function dibujarBotonSecundario(boton, etiqueta, activo, tamTexto) {
  let encima = mouseEncimaDe(boton);
  rectMode(CORNER);
  noStroke();
  fill(activo ? [255, 200, 87, 45] : [255, 255, 255, 14]);
  rect(boton.x, boton.y, boton.w, boton.h, 4);

  noFill();
  stroke(activo || encima ? COLOR_ACENTO : [255, 255, 255, 90]);
  strokeWeight(2);
  rect(boton.x, boton.y, boton.w, boton.h, 4);

  noStroke();
  fill(activo || encima ? COLOR_ACENTO : 235);
  textAlign(CENTER, CENTER);
  textFont(FUENTE_TEXTO);
  textStyle(BOLD);
  textSize(tamTexto || 16);
  text(etiqueta, boton.x + boton.w / 2, boton.y + boton.h / 2 + 1);
  textStyle(NORMAL);
}

// Botón chiquito y redondo del HUD (pausa y sonido).
function dibujarBotonRedondo(boton) {
  let encima = mouseEncimaDe(boton);
  rectMode(CORNER);
  noStroke();
  fill(encima ? COLOR_ALERTA : [26, 24, 38, 225]);
  rect(boton.x, boton.y, boton.w, boton.h, 999);
  noFill();
  stroke(COLOR_ACENTO);
  strokeWeight(1.5);
  rect(boton.x, boton.y, boton.w, boton.h, 999);
  noStroke();
}

// Ícono de pausa (dos barritas) o de play (triangulito).
function dibujarIconoPausa(boton) {
  dibujarBotonRedondo(boton);
  let cx = boton.x + boton.w / 2;
  let cy = boton.y + boton.h / 2;
  fill(255);
  if (pausado) {
    triangle(cx - 4, cy - 7, cx - 4, cy + 7, cx + 7, cy);
  } else {
    rectMode(CENTER);
    rect(cx - 4, cy, 4, 14, 1);
    rect(cx + 4, cy, 4, 14, 1);
  }
}

// Ícono de parlante, con una barra roja cruzada cuando está en mudo.
function dibujarIconoSonido(boton) {
  dibujarBotonRedondo(boton);
  let cx = boton.x + boton.w / 2;
  let cy = boton.y + boton.h / 2;
  fill(255);
  rectMode(CENTER);
  rect(cx - 5, cy, 5, 8, 1);                              // cuerpo
  triangle(cx - 3, cy, cx + 3, cy - 8, cx + 3, cy + 8);   // cono
  if (sonidoActivado) {
    noFill();
    stroke(255);
    strokeWeight(1.6);
    arc(cx + 4, cy, 10, 12, -QUARTER_PI, QUARTER_PI);     // ondita
    noStroke();
  } else {
    stroke(COLOR_TRAMPA);
    strokeWeight(2.5);
    line(cx - 9, cy - 8, cx + 9, cy + 8);                 // tachado
    noStroke();
  }
}

// Título en fuente pixel, centrado.
// OJO: Press Start 2P no tiene mayúsculas con tilde (Á É Í Ó Ú): si se le
// pasa una, la dibuja en minúscula y queda "CRéDITOS". Los títulos van sin
// tildes; los textos con tilde van siempre en la otra fuente.
function dibujarTitulo(texto, y, tam, color) {
  textFont(FUENTE_TITULO);
  textAlign(CENTER, CENTER);
  fill(color || COLOR_ACENTO);
  textSize(tam);
  text(texto, ANCHO / 2, y);
}

// Panel oscuro donde se apoyan los textos largos, para que se lean.
function dibujarPanel(x, y, w, h) {
  rectMode(CORNER);
  noStroke();
  fill(18, 16, 30, 170);
  rect(x, y, w, h, 6);
  noFill();
  stroke(255, 255, 255, 40);
  strokeWeight(1.5);
  rect(x, y, w, h, 6);
  noStroke();
}

// Devuelve el otro jugador. Solo tiene sentido en modo 2 jugadores.
function rivalDe(jugador) {
  return jugador === jugador1 ? jugador2 : jugador1;
}

// Devuelve los jugadores que participan según el modo actual.
function jugadoresActivos() {
  return gameMode === "1J" ? [jugador1] : [jugador1, jugador2];
}

// ======================================================
// CARGA DE ARCHIVOS
// ======================================================

// Carga una imagen de assets/img/. Si el archivo no está, deja la variable
// en null y el juego usa la forma dibujada como fallback (no se rompe).
function cargarImagen(nombre, alCargar) {
  loadImage('assets/img/' + nombre, alCargar, () => alCargar(null));
}

function preload() {
  cargarImagen('fondo.png', img => imgFondo = img);
  //cargarImagen('jugador1.png',  img => imgJugador1 = img);
  //cargarImagen('jugador2.png',  img => imgJugador2 = img);
  cargarImagen('llaves.png', img => imgLlave = img);
  cargarImagen('celular.png', img => imgCelular = img);
  cargarImagen('billetera.png', img => imgBilletera = img);
  cargarImagen('zapato.png', img => imgZapato = img);
  cargarImagen('tele.png', img => imgTele = img);
  cargarImagen('cafe.png', img => imgCafe = img);
  cargarImagen('reloj.png', img => imgReloj = img);
  cargarImagen('perro.png', img => imgPerro = img);
  cargarImagen('gato.png', img => imgGato = img);
}

function setup() {
  createCanvas(ANCHO, ALTO);
  textFont(FUENTE_TEXTO);
  cargarSonidos();
  cargarMejorTiempo();
  reiniciarJuego();
}

// Los sonidos se cargan acá y NO en preload(): si un loadSound de preload no
// encuentra el archivo, p5 se queda esperándolo para siempre y el juego nunca
// arranca. Así, si falta un mp3, se juega igual pero sin ese sonido.
function cargarSonidos() {
  sonidoRecolectar = loadSound('assets/audio/recolectar.mp3', () => { }, () => sonidoRecolectar = null);
  sonidoTrampa = loadSound('assets/audio/trampa.mp3', () => { }, () => sonidoTrampa = null);
  sonidoAlarma = loadSound('assets/audio/alarma.mp3', () => { }, () => sonidoAlarma = null);
}

// true solo si ese sonido terminó de cargar y se puede reproducir.
function sonidoListo(sonido) {
  return !!(sonido && sonido.isLoaded && sonido.isLoaded());
}

// Lee el mejor tiempo guardado del modo 1 jugador desde localStorage.
function cargarMejorTiempo() {
  try {
    let guardado = localStorage.getItem(CLAVE_MEJOR_TIEMPO);
    mejorTiempo = guardado ? parseFloat(guardado) : null;
  } catch (e) {
    mejorTiempo = null;
  }
}

// Si el tiempo final supera al mejor guardado (o sea, es menor), lo actualiza
// y lo persiste en localStorage. Devuelve true si hubo récord.
function guardarMejorTiempoSiCorresponde(tiempoFinal) {
  let esRecord = mejorTiempo === null || tiempoFinal < mejorTiempo;
  if (esRecord) {
    mejorTiempo = tiempoFinal;
    try {
      localStorage.setItem(CLAVE_MEJOR_TIEMPO, tiempoFinal.toFixed(2));
    } catch (e) {
      // si el navegador bloquea localStorage el juego sigue funcionando,
      // solo que no persiste el récord entre sesiones
    }
  }
  return esRecord;
}

// ======================================================
// LOOP PRINCIPAL: el estado decide qué pantalla se dibuja
// ======================================================
function draw() {
  if (gameState === "MENU") {
    pantallaMenu();
  } else if (gameState === "INSTRUCCIONES") {
    pantallaInstrucciones();
  } else if (gameState === "CREDITOS") {
    pantallaCreditos();
  } else if (gameState === "JUEGO") {
    pantallaJuego();
  } else if (gameState === "FIN") {
    pantallaFin();
  }
}

// ======================================================
// PANTALLA 1: MENÚ
// ======================================================
function pantallaMenu() {
  dibujarFondo(VELO_PANTALLAS);

  dibujarPanel(70, 90, ANCHO - 140, 190);
  dibujarTitulo("¡LLEGO", 145, 36);
  dibujarTitulo("TARDE!", 200, 36);

  textFont(FUENTE_TEXTO);
  textAlign(CENTER, CENTER);
  fill(235);
  textSize(18);
  text("Juntá tus cosas y salí corriendo", ANCHO / 2, 250);

  if (mejorTiempo !== null) {
    dibujarPanel(150, 495, ANCHO - 300, 42);
    fill(COLOR_BUENO);
    textFont(FUENTE_TEXTO);
    textStyle(BOLD);
    textSize(15);
    text("Mejor tiempo (1 jugador): " + nf(mejorTiempo, 1, 2) + "s", ANCHO / 2, 517);
    textStyle(NORMAL);
  }

  dibujarBoton(BOTON_MENU_1J, "1 JUGADOR");
  dibujarBoton(BOTON_MENU_2J, "2 JUGADORES");
  dibujarBotonSecundario(BOTON_CREDITOS, "CRÉDITOS", false);

  dibujarIconoSonido(BOTON_SONIDO);
}

// ======================================================
// PANTALLA 2: INSTRUCCIONES, dividida en dos pestañas
// (CONTROLES y OBJETOS) para no llenar todo de texto
// ======================================================
function pantallaInstrucciones() {
  dibujarFondo(VELO_PANTALLAS);

  dibujarTitulo("INSTRUCCIONES", 72, 20);

  textFont(FUENTE_TEXTO);
  textAlign(CENTER, CENTER);
  fill(190);
  textSize(16);
  text(gameMode === "1J" ? "modo 1 jugador" : "modo 2 jugadores", ANCHO / 2, 108);

  dibujarBotonSecundario(BOTON_PESTANA_A, "CONTROLES", pestana === "CONTROLES");
  dibujarBotonSecundario(BOTON_PESTANA_B, "OBJETOS", pestana === "OBJETOS");

  dibujarPanel(60, 200, ANCHO - 120, 360);
  if (pestana === "CONTROLES") {
    panelControles();
  } else {
    panelObjetos();
  }

  dibujarBotonSecundario(BOTON_ATRAS, "‹ MENÚ", false, 14);
  dibujarBoton(BOTON_JUGAR, "JUGAR");
}

// Dibuja una fila "etiqueta : valor" del panel de controles.
function filaControl(y, etiqueta, valor) {
  textFont(FUENTE_TEXTO);
  textStyle(BOLD);
  textAlign(RIGHT, CENTER);
  fill(COLOR_ACENTO);
  textSize(16);
  text(etiqueta, 250, y);

  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  fill(235);
  textSize(16);
  text(valor, 275, y);
}

function panelControles() {
  if (gameMode === "1J") {
    filaControl(250, "Moverse", "W A S D  o  las flechas");
    filaControl(305, "Pausar", "P  o  el botón de abajo");
    filaControl(360, "Objetivo", "Juntar una cosa de cada tipo");
    filaControl(415, "Tiempo", "90 segundos como máximo");
    filaControl(470, "Ganar", "Bajar tu mejor tiempo guardado");
    filaControl(515, "Sonido", "M  o  el botón del parlante");
  } else {
    filaControl(250, "Jugador 1", "W A S D");
    filaControl(305, "Jugador 2", "Las flechas");
    filaControl(360, "Pausar", "P  o  el botón de abajo");
    filaControl(415, "Tiempo", "45 segundos de partida");
    filaControl(470, "Ganar", "Tener más puntos al final");
    filaControl(515, "Sonido", "M  o  el botón del parlante");
  }
}

// Dibuja una fila del panel de objetos: el sprite y su regla al lado.
function filaObjeto(y, tipos, texto, color) {
  for (let i = 0; i < tipos.length; i++) {
    dibujarIcono(tipos[i], 110 + i * 38, y);
  }
  textFont(FUENTE_TEXTO);
  textAlign(LEFT, CENTER);
  fill(color);
  textSize(16);
  text(texto, 110 + tipos.length * 38 + 10, y);
}

function panelObjetos() {
  if (gameMode === "1J") {
    filaObjeto(245, TIPOS_OBJETO, "Juntá una de cada una", 235);
    filaObjeto(310, ["cafe"], "Café: te acelera 5 segundos", COLOR_BUENO);
    filaObjeto(365, ["reloj"], "Reloj: te descuenta 3 segundos", COLOR_BUENO);
    filaObjeto(425, ["tele"], "Tele: +3 segundos y te frena", COLOR_TRAMPA);
    filaObjeto(480, ["perro"], "Perro: te persigue, +3 segundos", COLOR_TRAMPA);
    filaObjeto(530, ["gato"], "Gato: anda suelto, +3 segundos", COLOR_TRAMPA);
  } else {
    filaObjeto(245, TIPOS_OBJETO, "+1 punto cada una", 235);
    filaObjeto(310, ["cafe"], "Café: +1 punto y te acelera", COLOR_BUENO);
    filaObjeto(365, ["reloj"], "Reloj: +1 punto y le robás 1 al rival", COLOR_BUENO);
    filaObjeto(425, ["tele"], "Tele: -1 punto y te frena", COLOR_TRAMPA);
    filaObjeto(480, ["perro"], "Perro: te persigue, -1 punto", COLOR_TRAMPA);
    filaObjeto(530, ["gato"], "Gato: anda suelto, -1 punto", COLOR_TRAMPA);
  }
}

// ======================================================
// PANTALLA EXTRA: CRÉDITOS (antes estaban apretados en instrucciones)
// ======================================================
function pantallaCreditos() {
  dibujarFondo(VELO_PANTALLAS);

  dibujarTitulo("CREDITOS", 110, 24);

  dibujarPanel(90, 190, ANCHO - 180, 300);

  textFont(FUENTE_TEXTO);
  textAlign(CENTER, CENTER);
  fill(COLOR_ACENTO);
  textSize(22);
  text("A Contrarreloj", ANCHO / 2, 235);

  fill(235);
  textSize(19);
  for (let i = 0; i < AUTORES.length; i++) {
    text(AUTORES[i], ANCHO / 2, 300 + i * 34);
  }

  fill(180);
  textSize(15);
  text(CATEDRA, ANCHO / 2, 420);
  text(FACULTAD, ANCHO / 2, 448);

  dibujarBoton(BOTON_VOLVER, "VOLVER");
  dibujarIconoSonido(BOTON_SONIDO);
}

// ======================================================
// PANTALLA 3: JUEGO
// ======================================================
function pantallaJuego() {
  if (gameMode === "1J") {
    pantallaJuego1J();
  } else {
    pantallaJuego2J();
  }
}

// ======================================================
// PANTALLA 3a: JUEGO en modo 2 JUGADORES (competitivo)
// ======================================================
function pantallaJuego2J() {
  controlarAlarmaDeJuego();

  // --- Timer según tiempo real transcurrido, descontando las pausas ---
  if (!pausado) {
    let elapsed = (millis() - tiempoInicio - tiempoAcumuladoPausa) / 1000;
    tiempoRestante = max(0, DURACION_PARTIDA - elapsed);
  }

  if (tiempoRestante <= 0) {
    gameState = "FIN";        // se acabó el tiempo
    controlarAlarmaDeJuego(); // se llama después de cambiar de estado, para cortar la alarma
    return;
  }

  dibujarFondo(VELO_JUEGO);

  // --- Si está pausado, se dibuja todo "congelado" y no se actualiza nada ---
  if (pausado) {
    dibujarEscena();
    dibujarVeloDePausa();
    dibujarHUD2J();
    return;
  }

  // --- Spawn de ítems nuevos cada cierta cantidad de frames ---
  contadorSpawn++;
  if (contadorSpawn >= intervaloSpawn && items.length < 8) {
    // La probabilidad de trampa arranca en 30% y sube hasta 55% cerca del
    // final de la partida, para que se ponga más difícil con el tiempo.
    let progreso = 1 - (tiempoRestante / DURACION_PARTIDA);
    let probabilidadTrampa = map(progreso, 0, 1, 0.3, 0.55);
    let probabilidadPowerup = 0.12;
    items.push(new Item(probabilidadTrampa, probabilidadPowerup, null));
    contadorSpawn = 0;
  }

  for (let e of enemigos) e.actualizar(jugadoresActivos());
  jugador1.mover();
  jugador2.mover();

  // --- Colisiones jugador-ítem (por distancia) ---
  for (let i = items.length - 1; i >= 0; i--) {
    let it = items[i];
    if (dist(jugador1.x, jugador1.y, it.x, it.y) < jugador1.r + it.r) {
      resolverColisionConItem(jugador1, it);
      items.splice(i, 1);
      continue;
    }
    if (dist(jugador2.x, jugador2.y, it.x, it.y) < jugador2.r + it.r) {
      resolverColisionConItem(jugador2, it);
      items.splice(i, 1);
    }
  }

  // --- Colisiones jugador-mascota ---
  for (let e of enemigos) {
    if (dist(jugador1.x, jugador1.y, e.x, e.y) < jugador1.r + e.r) resolverColisionConEnemigo(jugador1);
    if (dist(jugador2.x, jugador2.y, e.x, e.y) < jugador2.r + e.r) resolverColisionConEnemigo(jugador2);
  }

  dibujarEscena();
  dibujarHUD2J();
}

// ======================================================
// PANTALLA 3b: JUEGO en modo 1 JUGADOR (carrera contra uno mismo)
// ======================================================
function pantallaJuego1J() {
  controlarAlarmaDeJuego();

  if (!pausado) {
    let elapsedMs = millis() - tiempoInicio - tiempoAcumuladoPausa;
    tiempoTranscurrido = max(0, elapsedMs / 1000 + penalizacionAcumulada);
  }

  // --- Si se pasó del tiempo máximo sin completar, termina como "no llegaste" ---
  if (tiempoTranscurrido >= MAX_TIEMPO_1J) {
    resultado1J = { tiempoFinal: tiempoTranscurrido, esRecord: false, completo: false, anterior: mejorTiempo };
    gameState = "FIN";
    controlarAlarmaDeJuego();
    return;
  }

  dibujarFondo(VELO_JUEGO);

  if (pausado) {
    dibujarEscena();
    dibujarVeloDePausa();
    dibujarHUD1J();
    return;
  }

  // --- Spawn: en 1 jugador los objetos priorizan los que todavía faltan ---
  contadorSpawn++;
  if (contadorSpawn >= intervaloSpawn && items.length < 8) {
    let tiposFaltantes = TIPOS_OBJETO.filter(t => !objetivosRecolectados.has(t));
    items.push(new Item(0.35, 0.15, tiposFaltantes));
    contadorSpawn = 0;
  }

  for (let e of enemigos) e.actualizar(jugadoresActivos());
  jugador1.mover();

  for (let i = items.length - 1; i >= 0; i--) {
    let it = items[i];
    if (dist(jugador1.x, jugador1.y, it.x, it.y) < jugador1.r + it.r) {
      resolverColisionConItem(jugador1, it);
      items.splice(i, 1);
    }
  }

  // Si al recolectar el último objeto se completó el objetivo, gameState ya
  // pasó a "FIN": cortamos acá para no dibujar un frame de más.
  if (gameState !== "JUEGO") return;

  for (let e of enemigos) {
    if (dist(jugador1.x, jugador1.y, e.x, e.y) < jugador1.r + e.r) resolverColisionConEnemigo(jugador1);
  }

  dibujarEscena();
  dibujarHUD1J();
}

// Dibuja los ítems, las mascotas y los jugadores que estén en juego.
function dibujarEscena() {
  for (let it of items) it.mostrar();
  for (let e of enemigos) e.mostrar();
  jugador1.mostrar(imgJugador1);
  if (gameMode === "2J") jugador2.mostrar(imgJugador2);
}

function dibujarVeloDePausa() {
  rectMode(CORNER);
  noStroke();
  fill(20, 18, 32, 200);
  rect(0, 0, ANCHO, ALTO);
  dibujarTitulo("PAUSA", ALTO / 2 - 10, 30, 255);
  textFont(FUENTE_TEXTO);
  textAlign(CENTER, CENTER);
  fill(200);
  textSize(16);
  text("P o el botón para seguir", ANCHO / 2, ALTO / 2 + 30);
}

// ======================================================
// COLISIONES: qué pasa cuando el jugador toca algo
// ======================================================

// En 2 jugadores todo se juega en puntos; en 1 jugador los objetos marcan el
// objetivo y la tele, el reloj y las mascotas afectan al cronómetro.
function resolverColisionConItem(jugador, it) {
  if (it.categoria === "trampa") {
    if (gameMode === "1J") {
      penalizacionAcumulada += 3;
    } else {
      jugador.puntos -= 1;
    }
    jugador.aplicarEfectoVelocidad(0.6, 2000);
    reproducirSonidoDeItem(it);
  } else if (it.categoria === "powerup") {
    if (gameMode === "2J") jugador.puntos += 1;

    if (it.tipo === "cafe") {
      jugador.aplicarEfectoVelocidad(1.6, 5000); // 60% más rápido por 5 segundos
    } else if (it.tipo === "reloj") {
      if (gameMode === "1J") {
        penalizacionAcumulada -= 3;   // le baja 3 segundos al cronómetro
      } else {
        rivalDe(jugador).puntos -= 1; // además del +1 de arriba: le robás un punto
      }
    }
    reproducirSonidoDeItem(it);
  } else {
    if (gameMode === "1J") {
      objetivosRecolectados.add(it.tipo);
      revisarObjetivoCompleto1J();
    } else {
      jugador.puntos += 1;
    }
    reproducirSonidoDeItem(it);
  }
}

// Revisa si en 1 jugador ya se juntó una cosa de cada tipo; si es así, frena
// el cronómetro, guarda el récord si corresponde y pasa a la pantalla de fin.
function revisarObjetivoCompleto1J() {
  if (objetivosRecolectados.size >= TIPOS_OBJETO.length) {
    let mejorAnterior = mejorTiempo; // null si es el primer intento completado
    let esRecord = guardarMejorTiempoSiCorresponde(tiempoTranscurrido);
    resultado1J = { tiempoFinal: tiempoTranscurrido, esRecord: esRecord, completo: true, anterior: mejorAnterior };
    gameState = "FIN";
    controlarAlarmaDeJuego();
  }
}

// Chocar con una mascota: en 2 jugadores resta un punto, en 1 jugador suma
// tiempo; en los dos casos ralentiza un par de segundos.
function resolverColisionConEnemigo(jugador) {
  // Sin este corte, quedar pegado a la mascota penalizaba en CADA frame
  // (60 veces por segundo). Ahora penaliza una vez cada segundo y medio.
  if (millis() < jugador.invulnerableHasta) return;
  jugador.invulnerableHasta = millis() + 1500;

  if (gameMode === "1J") {
    penalizacionAcumulada += 3;
  } else {
    jugador.puntos -= 1;
  }
  jugador.aplicarEfectoVelocidad(0.6, 2000);
  reproducirSonidoDeItem({ categoria: "trampa" });
}

// ======================================================
// HUD: franjas oscuras arriba y abajo para que se lea sobre el fondo
// ======================================================
function dibujarBarrasHUD() {
  rectMode(CORNER);
  noStroke();
  fill(COLOR_BARRA);
  rect(0, 0, ANCHO, 46);
  rect(0, ALTO - 56, ANCHO, 56);
}

function dibujarBotonesDeJuego() {
  dibujarIconoPausa(BOTON_PAUSA);
  dibujarIconoSonido(BOTON_SONIDO);
}

// Timer y puntajes de los dos jugadores (modo 2 jugadores).
function dibujarHUD2J() {
  dibujarBarrasHUD();

  textFont(FUENTE_TITULO);
  textAlign(CENTER, CENTER);
  // el timer se pone rojo y "tiembla" cuando quedan pocos segundos
  if (tiempoRestante < 10) {
    fill(COLOR_TRAMPA);
    textSize(20 + sin(frameCount * 0.5) * 1.5);
  } else {
    fill(255);
    textSize(19);
  }
  text(nf(tiempoRestante, 1, 1), ANCHO / 2, 24);

  textFont(FUENTE_TEXTO);
  textStyle(BOLD);
  textSize(20);
  textAlign(LEFT, CENTER);
  fill(COLOR_J1);
  text("J1: " + jugador1.puntos, 20, 24);
  textAlign(RIGHT, CENTER);
  fill(COLOR_J2);
  text("J2: " + jugador2.puntos, ANCHO - 20, 24);
  textStyle(NORMAL);

  dibujarBotonesDeJuego();
}

// Cronómetro, mejor tiempo y checklist de las 4 cosas (modo 1 jugador).
function dibujarHUD1J() {
  dibujarBarrasHUD();

  textFont(FUENTE_TITULO);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(19);
  text(nf(tiempoTranscurrido, 1, 2), ANCHO / 2, 24);

  textFont(FUENTE_TEXTO);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  textSize(15);
  fill(COLOR_BUENO);
  text(mejorTiempo !== null ? "Mejor: " + nf(mejorTiempo, 1, 2) + "s" : "Mejor: --", 20, 24);
  textStyle(NORMAL);

  // Checklist de las 4 cosas, en la franja de abajo y a la izquierda de los
  // botones, así nunca se superponen.
  let etiquetas = { llave: "Llaves", celular: "Celular", billetera: "Billetera", zapato: "Zapato" };
  textAlign(CENTER, CENTER);
  textSize(14);
  let espacio = (ANCHO - 150) / TIPOS_OBJETO.length;
  for (let i = 0; i < TIPOS_OBJETO.length; i++) {
    let tipo = TIPOS_OBJETO[i];
    let recolectado = objetivosRecolectados.has(tipo);
    fill(recolectado ? COLOR_BUENO : [170, 170, 180]);
    text((recolectado ? "✓ " : "· ") + etiquetas[tipo], 30 + espacio * i + espacio / 2, ALTO - 28);
  }

  dibujarBotonesDeJuego();
}

// ======================================================
// PANTALLA 4: FIN
// ======================================================
function pantallaFin() {
  dibujarFondo(VELO_PANTALLAS);
  dibujarPanel(90, 185, ANCHO - 180, 320);
  if (gameMode === "1J") {
    pantallaFin1J();
  } else {
    pantallaFin2J();
  }
  dibujarBoton(BOTON_VOLVER, "VOLVER AL MENÚ");
  dibujarIconoSonido(BOTON_SONIDO);
}

function pantallaFin2J() {
  let resultado;
  if (jugador1.puntos > jugador2.puntos) resultado = "¡GANA J1!";
  else if (jugador2.puntos > jugador1.puntos) resultado = "¡GANA J2!";
  else resultado = "¡EMPATE!";

  dibujarTitulo(resultado, 250, 30);

  textFont(FUENTE_TEXTO);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(26);
  fill(COLOR_J1);
  text("J1: " + jugador1.puntos, ANCHO / 2 - 70, 330);
  fill(COLOR_J2);
  text("J2: " + jugador2.puntos, ANCHO / 2 + 70, 330);
  textStyle(NORMAL);

  fill(200);
  textSize(16);
  text("Presioná R o el botón para volver al menú", ANCHO / 2, 420);
}

function pantallaFin1J() {
  textAlign(CENTER, CENTER);

  if (!resultado1J.completo) {
    dibujarTitulo("¡SIN TIEMPO!", 240, 22, COLOR_TRAMPA);
    textFont(FUENTE_TEXTO);
    fill(235);
    textSize(19);
    text("No llegaste a juntar las 4 cosas a tiempo", ANCHO / 2, 320);
    text("¡Probá de nuevo!", ANCHO / 2, 350);
  } else {
    // La primera vez que se completa no hay nada que superar todavía
    let titulo = resultado1J.anterior === null ? "¡PRIMER TIEMPO!" : "¡NUEVA MARCA!";
    if (resultado1J.esRecord) {
      dibujarTitulo(titulo, 240, 21, COLOR_BUENO);
    } else {
      dibujarTitulo("¡LISTO!", 240, 28);
    }

    textFont(FUENTE_TEXTO);
    textStyle(BOLD);
    fill(255);
    textSize(30);
    text(nf(resultado1J.tiempoFinal, 1, 2) + "s", ANCHO / 2, 320);
    textStyle(NORMAL);

    fill(190);
    textSize(16);
    if (resultado1J.esRecord && resultado1J.anterior !== null) {
      text("Tu marca anterior era " + nf(resultado1J.anterior, 1, 2) + "s", ANCHO / 2, 365);
    } else if (!resultado1J.esRecord) {
      text("Tu mejor tiempo sigue siendo " + nf(mejorTiempo, 1, 2) + "s", ANCHO / 2, 365);
    }
  }

  fill(200);
  textSize(16);
  text("Presioná R o el botón para volver al menú", ANCHO / 2, 460);
}

// ======================================================
// SONIDO
// ======================================================

// Reproduce el sonido que corresponde al ítem tocado, si el juego no está
// en mudo y ese archivo ya terminó de cargar.
function reproducirSonidoDeItem(it) {
  if (!sonidoActivado) return;
  if (typeof userStartAudio === 'function') userStartAudio();

  if (it.categoria === "trampa") {
    if (sonidoListo(sonidoTrampa)) sonidoTrampa.play();
  } else {
    if (sonidoListo(sonidoRecolectar)) sonidoRecolectar.play();
  }
}

// Prende la alarma de fondo mientras se juega, y la corta en pausa, en mudo
// o cuando la partida termina.
function controlarAlarmaDeJuego() {
  if (!sonidoListo(sonidoAlarma)) return;

  if (gameState !== "JUEGO" || !sonidoActivado) {
    if (sonidoAlarma.isPlaying()) sonidoAlarma.stop();
    return;
  }

  if (pausado) {
    if (sonidoAlarma.isPlaying()) sonidoAlarma.pause();
  } else {
    if (!sonidoAlarma.isPlaying()) sonidoAlarma.loop();
  }
}

// Prende o apaga todo el sonido del juego (botón del parlante o tecla M).
function alternarSonido() {
  sonidoActivado = !sonidoActivado;
  controlarAlarmaDeJuego();
}

// ======================================================
// Reinicia variables de partida (jugadores, ítems, mascotas, timer)
// ======================================================
function reiniciarJuego() {
  if (gameMode === "1J") {
    // En 1 jugador andan las dos cosas: WASD o las flechas
    jugador1 = new Jugador(ANCHO / 2, ALTO / 2, COLOR_J1, {
      arriba: [87, UP_ARROW],
      abajo: [83, DOWN_ARROW],
      izquierda: [65, LEFT_ARROW],
      derecha: [68, RIGHT_ARROW],
    }, "J1");
    jugador2 = null;
    objetivosRecolectados = new Set();
    penalizacionAcumulada = 0;
    tiempoTranscurrido = 0;
    resultado1J = { tiempoFinal: 0, esRecord: false, completo: true, anterior: null };
  } else {
    jugador1 = new Jugador(150, ALTO / 2, COLOR_J1, {
      arriba: [87], abajo: [83], izquierda: [65], derecha: [68], // teclas W A S D
    }, "J1");
    jugador2 = new Jugador(ANCHO - 150, ALTO / 2, COLOR_J2, {
      arriba: [UP_ARROW], abajo: [DOWN_ARROW], izquierda: [LEFT_ARROW], derecha: [RIGHT_ARROW],
    }, "J2");
    tiempoRestante = DURACION_PARTIDA;
  }

  // Arranca con 4 objetos ya en pantalla (0% trampa, 0% power-up) para no
  // empezar la partida mirando un canvas vacío hasta el primer spawn.
  items = [];
  for (let i = 0; i < 4; i++) items.push(new Item(0, 0, TIPOS_OBJETO));
  contadorSpawn = 0;

  enemigos = [
    new Enemigo(ANCHO / 2, 90, COLOR_PERRO, "dirigido"),
    new Enemigo(ANCHO / 2, ALTO - 90, COLOR_GATO, "aleatorio"),
  ];
}

// ======================================================
// TECLADO
// ======================================================
function keyPressed() {
  if (typeof userStartAudio === 'function') userStartAudio();

  if (key === "m" || key === "M") {
    alternarSonido();
  } else if (key === " " && gameState === "MENU") {
    gameMode = "2J"; // ESPACIO elige 2 jugadores por defecto
    irAInstrucciones();
  } else if (key === "1" && gameState === "MENU") {
    gameMode = "1J";
    irAInstrucciones();
  } else if (key === " " && gameState === "INSTRUCCIONES") {
    iniciarPartida();
  } else if ((key === "r" || key === "R") && gameState === "FIN") {
    volverAlMenu();
  } else if ((key === "p" || key === "P") && gameState === "JUEGO") {
    alternarPausa();
  }
}

// ======================================================
// MOUSE Y TOUCH: interactividad en tiempo real por click/toque
// ======================================================
function mousePressed() {
  if (typeof userStartAudio === 'function') userStartAudio();

  // El botón del parlante está en las mismas coordenadas en casi todas las
  // pantallas, así que se chequea primero y por separado.
  if (gameState !== "INSTRUCCIONES" && mouseEncimaDe(BOTON_SONIDO)) {
    alternarSonido();
    return;
  }

  if (gameState === "MENU") {
    if (mouseEncimaDe(BOTON_MENU_1J)) { gameMode = "1J"; irAInstrucciones(); }
    else if (mouseEncimaDe(BOTON_MENU_2J)) { gameMode = "2J"; irAInstrucciones(); }
    else if (mouseEncimaDe(BOTON_CREDITOS)) gameState = "CREDITOS";
  } else if (gameState === "INSTRUCCIONES") {
    if (mouseEncimaDe(BOTON_PESTANA_A)) pestana = "CONTROLES";
    else if (mouseEncimaDe(BOTON_PESTANA_B)) pestana = "OBJETOS";
    else if (mouseEncimaDe(BOTON_ATRAS)) gameState = "MENU";
    else if (mouseEncimaDe(BOTON_JUGAR)) iniciarPartida();
  } else if (gameState === "CREDITOS") {
    if (mouseEncimaDe(BOTON_VOLVER)) gameState = "MENU";
  } else if (gameState === "JUEGO") {
    if (mouseEncimaDe(BOTON_PAUSA)) alternarPausa();
  } else if (gameState === "FIN") {
    if (mouseEncimaDe(BOTON_VOLVER)) volverAlMenu();
  }
}

// p5 también detecta el toque en pantallas táctiles; reusamos la misma
// lógica que mousePressed para que funcione igual en tablet o celular.
function touchStarted() {
  if (typeof userStartAudio === 'function') userStartAudio();
  mousePressed();
  return false; // evita el scroll/zoom por defecto del navegador
}

// ======================================================
// CAMBIOS DE PANTALLA
// ======================================================
function irAInstrucciones() {
  pestana = "CONTROLES"; // siempre se entra por la primera pestaña
  gameState = "INSTRUCCIONES";
}

// Arranca una partida nueva: reinicia variables y guarda el momento de inicio.
function iniciarPartida() {
  reiniciarJuego();
  tiempoInicio = millis();
  tiempoAcumuladoPausa = 0;
  pausado = false;
  gameState = "JUEGO";
  controlarAlarmaDeJuego();
}

// Vuelve al menú principal y corta la alarma de fondo.
function volverAlMenu() {
  gameState = "MENU";
  controlarAlarmaDeJuego();
}

// Activa o desactiva la pausa. Al despausar, suma el tiempo que estuvo
// pausado a tiempoAcumuladoPausa para que el timer no salte hacia adelante.
function alternarPausa() {
  if (!pausado) {
    pausado = true;
    momentoInicioPausa = millis();
  } else {
    pausado = false;
    tiempoAcumuladoPausa += millis() - momentoInicioPausa;
  }
  controlarAlarmaDeJuego();
}
