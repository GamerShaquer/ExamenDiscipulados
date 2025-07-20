const KEY = '9090';
const keyModal = document.getElementById('key-modal');
const keyInput = document.getElementById('access-key');
const keySubmit = document.getElementById('key-submit');
const keyError = document.getElementById('key-error');


keySubmit.addEventListener('click', () => {
    if (keyInput.value === KEY) {
        keyModal.classList.add('hidden');
        startScreen.classList.remove('hidden');
    } else {
        keyError.classList.remove('hidden');
        keyInput.value = '';
        keyInput.focus();
    }
});

keyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') keySubmit.click();
});

let actividades = [];
let actividadActual = 0;
let preguntaIndex = 0;
let score = 0;
let jugador = '';
let tiempoPregunta = 15;
let timerInterval;
let isMuted = false;

// Referencias DOM
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const gameArea = document.getElementById('game-area');
const playerDisplay = document.getElementById('player-display');
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const activityScreen = document.getElementById('activity-screen');
const activityMessage = document.getElementById('activity-message');
const nextActivityBtn = document.getElementById('next-activity-btn');
const modalFinal = document.getElementById('modal-final');
const finalScoreDisplay = document.getElementById('final-score');
const starRating = document.getElementById('star-rating');
const rankingList = document.getElementById('ranking-list');
const restartBtn = document.getElementById('restart-btn');
const muteBtn = document.getElementById('mute-btn');
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const musicBg = document.getElementById('music-bg');

// Inicialmente deshabilitamos Start
startBtn.disabled = true;

// Listeners
startBtn.addEventListener('click', iniciarJuego);
nextActivityBtn.addEventListener('click', () => {
    activityScreen.classList.add('hidden');
    mostrarPregunta();
});
restartBtn.addEventListener('click', reiniciarJuego);
muteBtn.addEventListener('click', toggleMute);

// Cargar desde tu API pública
fetch('https://fredd7093.github.io/ApiSembrado/pensamientosBiblicos.json')
    .then(res => res.json())
    .then(data => {
        actividades = data;
        console.log('Actividades cargadas:', actividades);
        startBtn.disabled = false;
    })
    .catch(e => {
        alert('Error cargando datos: ' + e);
        console.error(e);
    });

// Función de inicio
function iniciarJuego() {
    if (actividades.length === 0) {
        alert('Aún no se han cargado las actividades, intenta en unos segundos.');
        return;
    }
    jugador = document.getElementById('player-name').value.trim() || 'Jugador';
    if (jugador.length > 15) jugador = jugador.substring(0, 15);

    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    actividadActual = 0;
    preguntaIndex = 0;
    score = 0;
    actualizarScore();
    playerDisplay.textContent = `Discípulo: ${jugador}`;
    resetProgressBar();
    iniciarMusica();
    mostrarPregunta();
}

// Mostrar pregunta y opciones
function mostrarPregunta() {
    clearInterval(timerInterval);
    gameArea.classList.remove('fade-out');
    gameArea.classList.add('fade-in');

    const actividad = actividades[actividadActual];
    const pregunta = actividad.preguntas[preguntaIndex];

    gameArea.innerHTML = '';

    // Título actividad
    const titulo = document.createElement('h2');
    titulo.className = 'text-3xl font-bold mb-5 text-yellow-400 neon-text';
    titulo.innerText = actividad.nombre;
    gameArea.appendChild(titulo);

    // Pregunta
    const card = document.createElement('div');
    card.className = 'card mb-6 p-6 bg-gray-800 rounded-lg neon-glow';

    const texto = document.createElement('p');
    texto.className = 'text-2xl mb-6';
    texto.innerText = pregunta.texto;
    card.appendChild(texto);

    // Opciones
    const opcionesDiv = document.createElement('div');
    opcionesDiv.className = 'grid grid-cols-1 sm:grid-cols-2 gap-6';

    pregunta.opciones.forEach(op => {
        const btn = document.createElement('button');
        btn.textContent = op;
        btn.className = 'px-5 py-3 bg-purple-700 hover:bg-purple-900 rounded font-bold text-white neon-button';
        btn.onclick = () => verificarRespuesta(btn, op, pregunta.correcta);
        opcionesDiv.appendChild(btn);
    });

    card.appendChild(opcionesDiv);
    gameArea.appendChild(card);

    // Reiniciar y comenzar timer
    tiempoPregunta = 300;
    timerDisplay.textContent = tiempoPregunta;
    iniciarTimer();

    actualizarProgressBar();
}

function verificarRespuesta(btn, seleccionada, correcta) {
    clearInterval(timerInterval);
    // Deshabilitar todos botones para evitar doble click
    const botones = gameArea.querySelectorAll('button');
    botones.forEach(b => b.disabled = true);

    if (seleccionada === correcta) {
        btn.classList.add('correcto');
        if (!isMuted) soundCorrect.play();
        score += Math.floor(10000 / totalPreguntas());
        actualizarScore();

        // Avanzar automático a siguiente pregunta
        setTimeout(() => siguientePregunta(), 1200);

    } else {
        btn.classList.add('incorrecto');
        if (!isMuted) soundWrong.play();

        // Marcar la respuesta correcta
        botones.forEach(boton => {
            if (boton.textContent === correcta) {
                boton.classList.add('correcto');
            }
        });

        actualizarScore();

        // Crear botón "Siguiente pregunta"
        const siguienteBtn = document.createElement('button');
        siguienteBtn.textContent = 'Siguiente pregunta';
        siguienteBtn.className = 'mt-6 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded font-bold text-black neon-button';
        siguienteBtn.onclick = () => {
            siguienteBtn.remove();
            siguientePregunta();
        };

        gameArea.appendChild(siguienteBtn);
    }
}

function siguientePregunta() {
    preguntaIndex++;
    const actividad = actividades[actividadActual];
    if (preguntaIndex >= actividad.preguntas.length) {
        actividadActual++;
        preguntaIndex = 0;

        if (actividadActual >= actividades.length) {
            mostrarFinal();
            return;
        } else {
            mostrarActividadIntermedia();
            return;
        }
    }
    mostrarPregunta();
}

function totalPreguntas() {
    return actividades.reduce((sum, act) => sum + act.preguntas.length, 0);
}

function actualizarScore() {
    scoreDisplay.textContent = score;
}

function iniciarTimer() {
    timerInterval = setInterval(() => {
        tiempoPregunta--;
        timerDisplay.textContent = tiempoPregunta;
        if (tiempoPregunta <= 0) {
            clearInterval(timerInterval);
            marcarTiempoAgotado();
        }
    }, 1000);
}

function marcarTiempoAgotado() {
    // Marca la respuesta como errada si no respondieron
    const botones = gameArea.querySelectorAll('button');
    botones.forEach(b => b.disabled = true);
    if (!isMuted) soundWrong.play();
    // Esperar y pasar a siguiente
    setTimeout(() => siguientePregunta(), 1200);
}

function resetProgressBar() {
    progressBar.style.width = '0%';
}

function actualizarProgressBar() {
    const total = totalPreguntas();
    const actual = actividades
        .slice(0, actividadActual)
        .reduce((sum, act) => sum + act.preguntas.length, 0) + preguntaIndex + 1;
    const porcentaje = (actual / total) * 100;
    progressBar.style.width = `${porcentaje}%`;
}

// Pantalla intermedia entre actividades
function mostrarActividadIntermedia() {
    gameContainer.classList.add('hidden');
    activityMessage.textContent = `¡Has completado ${actividades[actividadActual - 1].nombre}!`;
    activityScreen.classList.remove('hidden');

    // Asegurar que al salir se muestre el contenedor del juego
    nextActivityBtn.onclick = () => {
        activityScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        mostrarPregunta();
    };
}

// Mostrar modal final con estrellas y ranking
function mostrarFinal() {
    gameContainer.classList.add('hidden');
    modalFinal.classList.remove('hidden');
    finalScoreDisplay.textContent = `${score} / 10000`;

    // Calcular estrellas (máx 5)
    let estrellas = 0;
    if (score >= 8000) estrellas = 5;
    else if (score >= 6000) estrellas = 4;
    else if (score >= 4000) estrellas = 3;
    else if (score >= 2000) estrellas = 2;
    else if (score > 0) estrellas = 1;

    starRating.innerHTML = '★'.repeat(estrellas) + '☆'.repeat(5 - estrellas);

    guardarRanking(jugador, score);
    mostrarRanking();
    pararMusica();
}

function reiniciarJuego() {
    modalFinal.classList.add('hidden');
    activityScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    actividadActual = 0;
    preguntaIndex = 0;
    score = 0;
    actualizarScore();
    resetProgressBar();
    iniciarMusica();
    mostrarPregunta();
}

function toggleMute() {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔈' : '🔊';
    if (isMuted) {
        musicBg.pause();
    } else {
        musicBg.play();
    }
}

function iniciarMusica() {
    if (!isMuted) {
        musicBg.volume = 0.15;
        musicBg.play();
    }
}

function pararMusica() {
    musicBg.pause();
    musicBg.currentTime = 0;
}

// Ranking en localStorage
function guardarRanking(nombre, puntaje) {
    const ranking = JSON.parse(localStorage.getItem('rankingMenteInteractiva') || '[]');
    ranking.push({ nombre, puntaje });
    ranking.sort((a, b) => b.puntaje - a.puntaje);
    if (ranking.length > 10) ranking.splice(10);
    localStorage.setItem('rankingMenteInteractiva', JSON.stringify(ranking));
}

function mostrarRanking() {
    const ranking = JSON.parse(localStorage.getItem('rankingMenteInteractiva') || '[]');
    rankingList.innerHTML = '';
    ranking.forEach(({ nombre, puntaje }, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${nombre} - ${puntaje} pts`;
        li.className = 'mb-1 neon-text';
        rankingList.appendChild(li);
    });
}
