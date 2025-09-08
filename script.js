let player; // Variable global para el objeto del reproductor de YouTube
let bovinosData = []; // Para almacenar los datos de los bovinos una vez cargados
let youtubeAPIReady = false; // Estado para saber si la API de YouTube está lista
let domLoaded = false; // Estado para saber si el DOM está cargado

// Esta función será llamada automáticamente por la API de YouTube cuando esté lista
function onYouTubeIframeAPIReady() {
    youtubeAPIReady = true;
    console.log("API de YouTube está lista.");
    checkAndInitializeApp(); // Intenta inicializar la aplicación
}

document.addEventListener('DOMContentLoaded', async () => {
    domLoaded = true;
    console.log("DOM está cargado.");

    const bovinoGallery = document.getElementById('bovino-gallery');
    // const youtubePlayerContainer = document.getElementById('youtube-player'); // Ya no es necesario obtenerlo aquí si solo lo usas en playYouTubeVideo

    try {
        const response = await fetch('bovinos_youtube_data.json');
        bovinosData = await response.json();
        console.log("Response URL:", response.url);
        console.log("bovinosData length:", bovinosData.length);
        console.log("Primeros 2:", bovinosData.slice(0,2));
        console.log("Últimos 2:", bovinosData.slice(-2));
        loadBovinosGallery(); // Carga la galería una vez que los datos están disponibles
    } catch (error) {
        console.error("Error al cargar los datos de bovinos:", error);
        // Utiliza SweetAlert2 si lo tienes, sino un alert normal
        // Swal.fire({
        //     icon: 'error',
        //     title: 'Oops...',
        //     text: 'No se pudieron cargar los datos de los bovinos. Asegúrate de que "bovinos_youtube_data.json" existe y es accesible.',
        // });
        alert("No se pudieron cargar los datos de los bovinos. Asegúrate de que 'bovinos_youtube_data.json' existe y es accesible.");
        return; // Detener la ejecución si no hay datos
    }

    checkAndInitializeApp(); // Intenta inicializar la aplicación
});

/**
 * Función para verificar si todo está listo e inicializar la app.
 */
function checkAndInitializeApp() {
    if (domLoaded && youtubeAPIReady && bovinosData.length > 0) {
        console.log("Ambos: DOM y API de YouTube están listos, y los datos cargados. Inicializando reproductor con el primer video.");
        playYouTubeVideo(bovinosData[0].youtube_video_id);
    }
}


/**
 * Carga las miniaturas de los bovinos en la galería.
 */
function loadBovinosGallery() {
    const bovinoGallery = document.getElementById('bovino-gallery'); // Obtener aquí por si el DOM no estaba listo antes
    bovinoGallery.innerHTML = ''; // Limpiar por si se llama más de una vez

    bovinosData.forEach(bovino => {
        if (bovino.thumbnail_image && bovino.youtube_video_id) {
            const bovinoItem = document.createElement('div');
            bovinoItem.classList.add('bovino-item');
            bovinoItem.dataset.videoId = bovino.youtube_video_id;

            bovinoItem.innerHTML = `
                <img src="${bovino.thumbnail_image}" alt="${bovino.name}">
                <h3>${bovino.name}</h3>
            `;

            bovinoItem.addEventListener('click', () => {
                playYouTubeVideo(bovino.youtube_video_id);
                scrollToTop(); // Llama a la función para desplazar la vista
            });

            bovinoGallery.appendChild(bovinoItem);
        }
    });
}

/**
 * Reproduce el video de YouTube usando la API de IFrame Player.
 * @param {string} videoId - El ID del video de YouTube a reproducir.
 */
function playYouTubeVideo(videoId) {
    if (typeof YT !== 'undefined' && YT.Player) {
        if (!player) {
            player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'controls': 0,
                    'rel': 0,
                    'showinfo': 0,
                    'modestbranding': 1,
                    'mute': 1,
                    'loop': 1,
                    'fs': 0,
                    'autoplay': 1, // Asegúrate de que autoplay esté en 1 si quieres que inicie automáticamente
                    // ***** LA CLAVE ES AÑADIR ESTO *****
                    'playlist': videoId // Reproduce este video como si fuera una playlist de un solo elemento
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        } else {
            // Si el reproductor ya existe, para que el loop funcione al cambiar de video,
            // debes cargar el nuevo video especificando también la playlist.
            player.loadVideoById({
                videoId: videoId,
                // Y aquí también debes especificar la playlist para el loop continuo
                playlist: videoId
            });
        }
    } else {
        console.warn("La API de YouTube no está cargada aún. No se puede crear/reproducir el video.");
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // La API de YouTube nos dice que el estado "finalizado" es el código 0.
    // YT.PlayerState.ENDED es la variable oficial que contiene ese valor.
    if (event.data === YT.PlayerState.ENDED) {
        // Si el video terminó, simplemente le damos play de nuevo.
        player.playVideo(); 
    }
}

/**
 * Desplaza la ventana del navegador al inicio de la página.
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}