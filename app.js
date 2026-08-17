/* ==========================================================================
   SANO BOT - LÓGICA DE APLICACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. TEMA CLARO / OSCURO (PERSISTIDO)
    // ----------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    
    // Cargar preferencia guardada
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
        themeIconLight.classList.add('hidden');
        themeIconDark.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        
        if (isDark) {
            themeIconLight.classList.add('hidden');
            themeIconDark.classList.remove('hidden');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIconLight.classList.remove('hidden');
            themeIconDark.classList.add('hidden');
            localStorage.setItem('theme', 'light');
        }
    });

    // ----------------------------------------------------------------------
    // 2. RASTREADOR DE HIDRATACIÓN (AGUA)
    // ----------------------------------------------------------------------
    const waterFill = document.getElementById('water-fill');
    const waterPctText = document.getElementById('water-pct');
    const waterCurrentText = document.getElementById('water-current');
    const waterProgressBar = document.getElementById('water-progress-bar');
    const waterButtons = document.querySelectorAll('.btn-water');
    const resetWaterBtn = document.getElementById('reset-water');

    const WATER_GOAL = 2000; // ml
    let currentWater = parseInt(localStorage.getItem('water-intake')) || 0;

    function updateWaterUI() {
        // Formatear texto de ml actuales
        waterCurrentText.textContent = `${currentWater} ml`;
        
        // Calcular porcentaje
        const percentage = Math.min(Math.round((currentWater / WATER_GOAL) * 100), 100);
        waterPctText.textContent = `${percentage}%`;
        
        // Actualizar visualizaciones
        waterFill.style.height = `${percentage}%`;
        waterProgressBar.style.width = `${percentage}%`;
        
        // Guardar progreso en localStorage
        localStorage.setItem('water-intake', currentWater);
    }

    // Agregar agua
    waterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.getAttribute('data-amount'));
            currentWater += amount;
            updateWaterUI();
            
            // Reacción del Bot al hidratarse
            if (currentWater === WATER_GOAL) {
                sendBotResponse("¡Increíble! 🎉 Has alcanzado tu meta de hidratación diaria de 2.0 Litros. Tu cuerpo y cerebro te lo agradecen. ¡Sigue así!");
            } else if (currentWater > 0 && currentWater % 1000 === 0) {
                sendBotResponse(`¡Excelente progreso! Llevas ${currentWater / 1000} Litros. Mantenerte hidratado ayuda a tu concentración y digestión.`);
            }
        });
    });

    // Resetear agua
    resetWaterBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres reiniciar tu registro de agua de hoy?')) {
            currentWater = 0;
            updateWaterUI();
            sendBotResponse("He reiniciado tu contador de agua. ¡Comencemos de nuevo, vaso a vaso! 💧");
        }
    });

    // Inicializar UI de agua al cargar
    updateWaterUI();


    // ----------------------------------------------------------------------
    // 3. WIDGET DE RESPIRACIÓN CONSCIENTE (BOX BREATHING)
    // ----------------------------------------------------------------------
    const breathingCircle = document.getElementById('breathing-circle');
    const breathingInstruction = document.getElementById('breathing-instruction');
    const btnBreathingToggle = document.getElementById('btn-breathing-toggle');
    const breathingTimerInfo = document.getElementById('breathing-timer-info');
    
    let breathingInterval = null;
    let isBreathingActive = false;
    let breathingStep = 0; // 0: inhale, 1: hold, 2: exhale, 3: rest

    const breathingSteps = [
        { text: 'Inhala', cssClass: 'breathing-active-inhale', duration: 4000 },
        { text: 'Retén', cssClass: 'breathing-active-hold', duration: 4000 },
        { text: 'Exhala', cssClass: 'breathing-active-exhale', duration: 4000 },
        { text: 'Espera', cssClass: 'breathing-active-rest', duration: 4000 }
    ];

    function clearBreathingClasses() {
        document.querySelector('.breathing-circle-container').className = 'breathing-circle-container';
    }

    function runBreathingCycle() {
        if (!isBreathingActive) return;

        const currentStepData = breathingSteps[breathingStep];
        breathingInstruction.textContent = currentStepData.text;
        
        clearBreathingClasses();
        document.querySelector('.breathing-circle-container').classList.add(currentStepData.cssClass);

        // Programar siguiente paso del ciclo
        breathingInterval = setTimeout(() => {
            breathingStep = (breathingStep + 1) % breathingSteps.length;
            runBreathingCycle();
        }, currentStepData.duration);
    }

    function startBreathing() {
        isBreathingActive = true;
        btnBreathingToggle.textContent = 'Detener Ejercicio';
        btnBreathingToggle.classList.replace('btn-primary', 'btn-secondary');
        breathingTimerInfo.textContent = 'Enfoca tu atención en el círculo. Respira profundo.';
        breathingStep = 0;
        runBreathingCycle();
        sendBotResponse("Has iniciado el ejercicio de respiración. Concéntrate en la animación: Inhala aire por la nariz cuando se expanda, mantén, y exhala suavemente cuando se contraiga. Esto calmará tu sistema nervioso. 🧘");
    }

    function stopBreathing() {
        isBreathingActive = false;
        clearTimeout(breathingInterval);
        btnBreathingToggle.textContent = 'Comenzar Respiración';
        btnBreathingToggle.classList.replace('btn-secondary', 'btn-primary');
        breathingTimerInfo.textContent = 'Técnica Box Breathing: 4s inhalar, 4s retener, 4s exhalar, 4s esperar.';
        breathingInstruction.textContent = 'Listo';
        clearBreathingClasses();
    }

    btnBreathingToggle.addEventListener('click', () => {
        if (isBreathingActive) {
            stopBreathing();
        } else {
            startBreathing();
        }
    });


    // ----------------------------------------------------------------------
    // 4. MOTOR Y REGLAS DE CONVERSACIÓN DE SANO BOT
    // ----------------------------------------------------------------------
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');

    // Base de datos de conocimientos/consejos saludables de Sano Bot
    const HEALTH_TIPS = {
        nutricion: [
            "🍎 **El plato del bien comer**: Trata de que la mitad de tu plato contenga vegetales y frutas, un cuarto de proteínas magras (pollo, pescado, tofu) y un cuarto de granos enteros (arroz integral, quinua).",
            "🥗 **Alimentos reales vs. ultraprocesados**: Intenta basar tu dieta en alimentos frescos y de un solo ingrediente. Los ultraprocesados suelen estar llenos de sodio, azúcares añadidos y grasas saturadas.",
            "🥑 **Grasas saludables**: Incorpora aguacate, nueces, semillas de chía o aceite de oliva en tus comidas. Son esenciales para la salud de tu cerebro y la absorción de vitaminas.",
            "🥦 **Snacks saludables**: Si tienes antojo entre comidas, prefiere una manzana con crema de cacahuate natural, yogur griego sin azúcar con arándanos, o bastones de zanahoria y pepino con hummus."
        ],
        ejercicio: [
            "🚶 **El poder de caminar**: Caminar 30 minutos al día mejora tu salud cardiovascular, fortalece tus huesos y reduce el estrés. ¡No necesitas un gimnasio para mantenerte activo!",
            "💻 **Pausas activas**: Si trabajas sentado, levántate cada 50 minutos a estirar las piernas y la espalda. Realiza rotaciones de hombros, estiramiento de cuello y 10 sentadillas libres.",
            "💪 **Entrenamiento de fuerza**: Levantar peso o hacer ejercicios de calistenia (flexiones, sentadillas) 2 o 3 veces por semana ayuda a mantener tu masa muscular y acelera tu metabolismo.",
            "🏃 **Escucha a tu cuerpo**: No necesitas terminar exhausto en cada entrenamiento. La consistencia en el ejercicio moderado es mucho más valiosa a largo plazo que la intensidad esporádica."
        ],
        sueño: [
            "😴 **Rutina de viento en popa**: Evita mirar pantallas (celular, televisión, computadora) al menos 45 minutos antes de dormir. La luz azul interrumpe la producción de melatonina, la hormona del sueño.",
            "☕ **Cafeína y sueño**: Procura no consumir cafeína (café, té verde, bebidas energéticas) después de las 3:00 PM. Tarda hasta 8 horas en salir completamente de tu sistema.",
            "🌙 **Ambiente óptimo**: Tu habitación debe estar lo más oscura, silenciosa y fresca posible (alrededor de 18-20°C es ideal para un descanso óptimo).",
            "🕒 **Horario regular**: Intenta acostarte y levantarte a la misma hora todos los días, incluso los fines de semana. Esto estabiliza tu reloj biológico."
        ],
        agua: [
            "💧 **¿Por qué tomar agua?** El agua transporta nutrientes, lubrica articulaciones, facilita la digestión y mantiene tu piel sana. La fatiga y el dolor de cabeza suelen ser signos tempranos de deshidratación.",
            "🍋 **Hazla divertida**: Si te cuesta tomar agua natural, agrégale rodajas de limón, pepino, hojas de menta o fresas para darle un toque de sabor natural y refrescante.",
            "📈 **Usa el rastreador**: En el panel lateral derecho tienes un **Rastreador de Hidratación**. Puedes ir sumando los vasos de agua que tomas hoy para llegar a tu meta de 2000 ml."
        ],
        respiracion: [
            "🧘 **Los beneficios de respirar bien**: La respiración pausada activa el sistema nervioso parasimpático, reduciendo el ritmo cardíaco, bajando la presión arterial y calmando la ansiedad.",
            "🌬️ **Técnica del Box Breathing**: Es la que usamos en nuestro widget de respiración lateral. Inhala en 4 segundos, mantén el aire 4 segundos, exhala en 4 segundos y espera vacío 4 segundos. ¡Pruébala!"
        ]
    };

    const GENERAL_RESPONSES = {
        bienvenida: "¡Hola! Estoy listo para apoyarte en tu camino de salud. Escribe tus dudas sobre **nutrición, ejercicio, agua, sueño o respiración**, o pulsa los botones rápidos de abajo. 😊",
        despedida: "¡Nos vemos! Recuerda que cada pequeño hábito saludable suma a tu bienestar general. ¡Cuídate mucho! 🌱",
        gracias: "¡Con gusto! Mi misión es ayudarte a llevar una vida más equilibrada. ¿Hay algo más en lo que te pueda apoyar hoy?",
        noEntendido: "Interesante pregunta. No estoy del todo seguro sobre ese tema en específico. ¿Podrías preguntarme sobre **alimentación, ejercicio físico, cómo dormir mejor, hidratación** o iniciar una **respiración consciente**?"
    };

    // Agregar un mensaje visual a la interfaz de chat
    function addMessage(text, isUser = false) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        // Reemplazar markdown simple (**negrita**) a HTML
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageDiv.innerHTML = `
            <div class="message-content">${formattedText}</div>
            <span class="message-time">${time}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll
    }

    // Mostrar el indicador de que el bot está escribiendo
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message typing-indicator-container';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return indicator;
    }

    // Lógica para enviar la respuesta del bot con retraso y animación
    function sendBotResponse(text) {
        const indicator = showTypingIndicator();
        
        setTimeout(() => {
            indicator.remove();
            addMessage(text, false);
        }, 700); // 700ms de retraso realista
    }

    // Procesar la entrada del usuario y generar la respuesta adaptada
    function processUserMessage(message) {
        const msg = message.toLowerCase().trim();
        
        // 1. Saludos
        if (msg.includes('hola') || msg.includes('buen dia') || msg.includes('buenas tardes') || msg.includes('buenos dias') || msg.includes('buenas noches')) {
            sendBotResponse("¡Hola! Qué gusto saludarte. ¿Cómo te has sentido hoy? Estoy listo para darte consejos de salud o ayudarte con tus hábitos. ☀️");
            return;
        }

        // 2. Agradecimientos
        if (msg.includes('gracias') || msg.includes('thank') || msg.includes('agradezco') || msg.includes('genial') || msg.includes('buenísimo') || msg.includes('buenisimo')) {
            sendBotResponse(GENERAL_RESPONSES.gracias);
            return;
        }

        // 3. Despedidas
        if (msg.includes('adios') || msg.includes('adiós') || msg.includes('chao') || msg.includes('hasta luego') || msg.includes('nos vemos')) {
            sendBotResponse(GENERAL_RESPONSES.despedida);
            return;
        }

        // 4. Intenciones específicas (búsqueda de palabras clave)
        
        // Agua / Hidratación
        if (msg.includes('agua') || msg.includes('hidrat') || msg.includes('sed') || msg.includes('beber') || msg.includes('vaso') || msg.includes('tomas')) {
            const tips = HEALTH_TIPS.agua;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            sendBotResponse(`**Sobre el Agua:**\n\n${randomTip}\n\n💡 _Tip adicional:_ Puedes registrar el agua que tomas hoy usando el rastreador de hidratación en la parte lateral derecha.`);
            return;
        }

        // Respiración / Relajación
        if (msg.includes('respir') || msg.includes('relaj') || msg.includes('estres') || msg.includes('estrés') || msg.includes('ansia') || msg.includes('calma') || msg.includes('medit')) {
            const tips = HEALTH_TIPS.respiracion;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            sendBotResponse(`**Sobre la Respiración y Calma:**\n\n${randomTip}\n\n💡 _Acción:_ Activa el círculo de respiración guiada de la derecha para calmar tu mente en solo un minuto.`);
            return;
        }

        // Ejercicio / Actividad física
        if (msg.includes('ejercicio') || msg.includes('entren') || msg.includes('deporte') || msg.includes('caminar') || msg.includes('correr') || msg.includes('gimnasio') || msg.includes('moverse') || msg.includes('sentarse') || msg.includes('estira')) {
            const tips = HEALTH_TIPS.ejercicio;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            sendBotResponse(`**Sobre la Actividad Física:**\n\n${randomTip}`);
            return;
        }

        // Nutrición / Alimentación
        if (msg.includes('comida') || msg.includes('aliment') || msg.includes('nutri') || msg.includes('comer') || msg.includes('receta') || msg.includes('fruta') || msg.includes('verdura') || msg.includes('sano') || msg.includes('gordo') || msg.includes('dieta')) {
            const tips = HEALTH_TIPS.nutricion;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            sendBotResponse(`**Sobre la Nutrición:**\n\n${randomTip}`);
            return;
        }

        // Sueño
        if (msg.includes('sueño') || msg.includes('dormir') || msg.includes('insomnio') || msg.includes('descans') || msg.includes('cansad') || msg.includes('noche')) {
            const tips = HEALTH_TIPS.sueño;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            sendBotResponse(`**Sobre el Descanso:**\n\n${randomTip}`);
            return;
        }

        // 5. Fallback si no entiende las palabras clave
        sendBotResponse(GENERAL_RESPONSES.noEntendido);
    }

    // Evento de Envío de Formulario
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // Añadir mensaje del usuario a la pantalla
        addMessage(text, true);
        chatInput.value = '';

        // Procesar y responder
        processUserMessage(text);
    });

    // Evento en botones sugeridos de acceso rápido
    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const intent = button.getAttribute('data-intent');
            const text = button.textContent;
            
            // Añadir mensaje simulado del usuario
            addMessage(text, true);
            
            // Simular respuesta basada en el intent
            let responseText = "";
            const tips = HEALTH_TIPS[intent];
            
            if (tips) {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                responseText = `Has seleccionado **${text}**. Aquí tienes un consejo útil:\n\n${randomTip}`;
                
                // Añadir contexto extra si es respiración o agua
                if (intent === 'agua') {
                    responseText += `\n\n💧 _Rastreador:_ No olvides ir marcando tus ml en el widget de hidratación a la derecha.`;
                } else if (intent === 'respiracion') {
                    responseText += `\n\n🧘 _Práctica:_ Dale clic al botón "Comenzar Respiración" a tu derecha para practicar ahora mismo.`;
                }
            } else {
                responseText = GENERAL_RESPONSES.noEntendido;
            }
            
            sendBotResponse(responseText);
        });
    // ----------------------------------------------------------------------
    // 5. SECCIÓN DE CITAS DE JIDDU KRISHNAMURTI Y MODAL INTERACTIVO
    // ----------------------------------------------------------------------
    const KRISHNAMURTI_QUOTES = [
        "La capacidad de observar sin evaluar es la forma más alta de inteligencia.",
        "No es saludable estar bien adaptado a una sociedad profundamente enferma.",
        "La libertad es esencial para el amor; no la libertad de la revuelta, sino la libertad de comprender.",
        "En uno mismo reside el mundo entero y, si sabes cómo mirar y aprender, la puerta está ahí y la llave está en tu mano.",
        "El amor no es el fin del pensamiento; el amor es cuando el pensamiento ya no es.",
        "Solo cuando la mente está libre de ideas y creencias puede actuar correctamente.",
        "Adquirir conocimientos es una forma de imitación; descubrir la verdad es un acto de creación.",
        "La verdad es una tierra sin caminos. El hombre no puede llegar a ella a través de ninguna organización, de ningún credo.",
        "El miedo corrompe la mente y destruye la sensibilidad; una mente libre de miedo es capaz de una gran compasión.",
        "Vivir en el presente es el milagro más grande; la mente siempre trata de escapar hacia el pasado o el futuro.",
        "El fin del dolor es el comienzo de la sabiduría. Comprenderse a uno mismo es el inicio de la paz interior."
    ];

    const quoteDisplay = document.getElementById('quote-display');
    const btnNextQuote = document.getElementById('btn-next-quote');

    function getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * KRISHNAMURTI_QUOTES.length);
        return KRISHNAMURTI_QUOTES[randomIndex];
    }

    // Cambiar frase del widget lateral al hacer clic
    if (btnNextQuote && quoteDisplay) {
        quoteDisplay.textContent = `"${getRandomQuote()}"`;

        btnNextQuote.addEventListener('click', () => {
            let newQuote = getRandomQuote();
            while (`"${newQuote}"` === quoteDisplay.textContent) {
                newQuote = getRandomQuote();
            }
            quoteDisplay.style.opacity = '0';
            setTimeout(() => {
                quoteDisplay.textContent = `"${newQuote}"`;
                quoteDisplay.style.opacity = '1';
            }, 150);
        });
    }

    // --- LÓGICA DEL MODAL DE KRISHNAMURTI ---
    const krishnamurtiModal = document.getElementById('krishnamurti-modal');
    const btnHeaderQuote = document.getElementById('btn-krishnamurti');
    const modalCloseBtn = document.getElementById('modal-close');
    const btnModalNextQuote = document.getElementById('btn-modal-next-quote');
    const modalQuoteDisplay = document.getElementById('modal-quote-display');

    function openModal() {
        if (!krishnamurtiModal) return;
        
        // Poner frase inicial en el modal
        if (modalQuoteDisplay) {
            modalQuoteDisplay.textContent = `"${getRandomQuote()}"`;
        }
        
        krishnamurtiModal.classList.add('active');
        krishnamurtiModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!krishnamurtiModal) return;
        krishnamurtiModal.classList.remove('active');
        krishnamurtiModal.setAttribute('aria-hidden', 'true');
    }

    // Eventos del modal
    if (btnHeaderQuote) {
        btnHeaderQuote.addEventListener('click', openModal);
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    // Cerrar al hacer clic en el fondo translúcido (overlay)
    if (krishnamurtiModal) {
        krishnamurtiModal.addEventListener('click', (e) => {
            if (e.target === krishnamurtiModal) {
                closeModal();
            }
        });
    }

    // Cerrar al presionar la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && krishnamurtiModal && krishnamurtiModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Cambiar frase dentro del modal
    if (btnModalNextQuote && modalQuoteDisplay) {
        btnModalNextQuote.addEventListener('click', () => {
            let newQuote = getRandomQuote();
            while (`"${newQuote}"` === modalQuoteDisplay.textContent) {
                newQuote = getRandomQuote();
            }
            
            modalQuoteDisplay.style.opacity = '0';
            setTimeout(() => {
                modalQuoteDisplay.textContent = `"${newQuote}"`;
                modalQuoteDisplay.style.opacity = '1';
            }, 150);
        });
    }
    });
});
