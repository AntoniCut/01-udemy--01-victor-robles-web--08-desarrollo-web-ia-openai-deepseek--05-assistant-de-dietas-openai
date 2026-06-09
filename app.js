/*
    *  ----------------------------------  *
    *  -----  /app.js  --  /app.js  -----  *
    *  ----------------------------------  *
*/


import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';


/*
    * ----------------------------------------------------------
    * -----  Servidor Express para chatbots usando OpenAI  -----
    * ----------------------------------------------------------
    * - Sirve frontend estático.
    * - Expone endpoint POST /api/chatbot.
    * - Interactúa con un modelo de OpenAI para generar respuestas.
    * --------------------------------------------------------------
*/


/*
    *  -----------------------------  *
    *  -----  Configuraciones  -----  *
    *  -----------------------------  *  
*/


/**  -----  Configuracion de variables de entorno con dotenv  ----- */
dotenv.config();

/** -----  `Ruta absoluta del archivo actual`  ----- */
const currentFilePath = fileURLToPath(import.meta.url);

/** -----  `Ruta absoluta del directorio actual`  ----- */
const currentDirPath = path.dirname(currentFilePath);

/** -----  `Ruta absoluta del frontend estatico`  ----- */
const publicDirPath = path.join(currentDirPath, 'public');

/**   -----  `Inicializacion de la aplicacion Express`  ----- */
const app = express();

/**  -----  `Puerto del servidor`  ----- */
const PORT = process.env.PORT || 3000;

/** @type {string} -----  `Ruta base del proyecto`  ----- */
const base = '/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/05-assistant-de-dietas-openai';


/*
    *  --------------------  *
    *  -----  OpenAI  -----  *
    *  --------------------  *  
*/

/** -----  `Validar que la API key de OpenAI está definida`  ----- */
if (!process.env.OPENAI_API_KEY) {
    throw new Error('La variable de entorno OPENAI_API_KEY es requerida.');
}

/**  -----  `Inicialización del cliente de OpenAI`  ----- */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});





/*
    *  -------------------------  *
    *  -----  Middlewares  -----  *
    *  -------------------------  *
*/


//*  -----  Servir archivos estaticos desde la carpeta 'public'  -----
app.use(base, express.static(publicDirPath));

//*  -----  Middleware para parsear JSON -----
app.use(express.json());

//*  -----  Middleware para parsear datos URL-encoded -----
app.use(express.urlencoded({ extended: true }));



/*
    *  ----------------------------------  *
    *  -----  Funciones de negocio  -----  *
    *  ----------------------------------  *
*/


/** @type {Record<number, UserData>} -----  `Diccionario de datos de usuario por ID`  ----- */
const userData = {};



/**
 * --------------------------------------
 * -----  `generateDiet(userInfo)`  -----
 * --------------------------------------
 * - `Genera una dieta semanal personalizada usando OpenAI con la información del usuario`
 * @async
 * @param {UserData} userResponses - La información del usuario
 * @returns {Promise<string>} - La dieta semanal personalizada
 * @throws {Error} - Si la API de OpenAI no devuelve contenido
 */

const generateDiet = async (userResponses) => {


    //*  -----  Extraer información del usuario  -----
    const {
        peso,
        altura,
        objetivo,
        alergias,
        alimentosNoGustan,
        comidasDiarias
    } = userResponses;



    //*  -----  Crear el prompt de sistema, indicadores para la IA  -----


    /** -----  `Prompt del sistema para la IA`  ----- */
    const promptSystem  = {
        role: /** @type {const} */ ('system'),
        content: `
            - Eres un nutricionista experto profesional y un asistente en crear dietas semanales personalizadas.
            - El usuario solo puede hacer preguntas relacionadoas con la dieta
              Acerca de su peso, altura, objetivo, alergias, alimentos que no le gustan y número de comidas diarias.
            - No puedes responder a preguntas que no estén relacionadas con la dieta semanal personalizada.
            - IMPORTANTE:Si el usuario hace preguntas que no estén relacionadas con la dieta semanal personalizada,
              debes responder que solo puedes responder a preguntas relacionadas con la dieta semanal personalizada.   
              Si el usuario no pasa toda la información necesaria para crear la dieta semanal personalizada, por ejemplo,
              peso, altura, etc debes pedirle que complete toda la información antes de generar la dieta.
        `
    }


    //*  -----  Crear el prompt de usuario con la información del usuario  -----

    /** -----  `Prompt del usuario para la IA`  ----- */
    const promptUser = {
        role: /** @type {const} */ ('user'),
        content: `
            - Crear una dieta semanal para una persona con las siguientes características:
                - Peso: ${peso} kg
                - Altura: ${altura} cm
                - Objetivo: ${objetivo} (Adelgazar, Mantener peso, Ganar Peso)
                - Alergias: ${alergias} (si no tiene alergias, escribir "ninguna")
                - Alimentos que no le gustan: ${alimentosNoGustan} (si no hay alimentos que no le gusten, escribir "ninguno")
                - Número de comidas diarias: ${comidasDiarias}
            - Crea una dieta semanal personalizada para el usuario basada en sus características.
            - Devuelve la dieta en un formato tabla markdown con las siguientes columnas:
                - Día, Comida, Alimentos, Nombre del plato o receta, calorias.
            - Y no digas nada mas, solo devuelve la tabla.
        `
    }


    //*  -----  Hacer petición al LLM de openAI  -----

    try {


        /** -----  `Hacer la solicitud a OpenAI`  ----- */
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                promptSystem,
                promptUser
            ],
            max_tokens: 1000,
            temperature: 0.75
        });

        /**  -----  `Devolver el resultado (dieta) generado`  ----- */
        const response = completion.choices[0]?.message?.content?.trim();

        if (!response)
            throw new Error('La API de OpenAI no devolvió contenido.');
        

        return response;

    }

    catch (error) {
        console.error('Error al generar la dieta:', error);
        throw new Error('Error al generar la dieta');
    }

}



/*  
    *  ----------------------------------------------  *
    *  -----  Endpoint POST /api/nutri-chatbot  -----  *
    *  ----------------------------------------------  *
*/


/**
 * ----------------------------------------------
 * -----  `handleChatbotRequest(req, res)`  -----
 * ----------------------------------------------
 * - `Maneja la solicitud del chatbot: valida, genera respuesta y maneja errores`
 * @async
 * @param {express.Request<unknown, ChatbotResponse, ChatbotRequestBody>} req - La solicitud HTTP de Express
 * @param {express.Response<ChatbotResponse>} res - La respuesta HTTP de Express
 * @returns {Promise<express.Response<ChatbotResponse>>} - La respuesta se envía vía `res.json()`.
 */

const handleChatbotRequest = async (req, res) => {


    console.log('userData actual:', userData);


    //  -----  Validar el cuerpo de la solicitud  -----
    const { userId, message } = req.body;

    if (typeof userId !== 'number' || typeof message !== 'string') {
        return res.status(400).json({
            reply: 'Solicitud inválida. Se requieren los campos "userId" de tipo number y "message" de tipo string.'
        });
    }


    //  -----  Inicializar objeto del usuario si no existe  -----
    if(!userData[userId]) {
        
        console.log('Nuevo usuario:', userId);
        userData[userId] = {};
    } 
    
    else 
        console.log('Usuario existente:', userId);
    

    /** -----  `Obtener el usuario actual`  ----- */
    const currentUser = userData[userId];


    //  -----  Preguntar por el Peso  -----
    if (!currentUser.peso) {

        currentUser.peso = message;

        return res.json({
            reply: '¿Cuánto mides (cm)?'
        });
    }


    //  -----  Preguntar por la altura  -----
    if (!currentUser.altura) {

        currentUser.altura = message;

        return res.json({
            reply: '¿Cuál es tu objetivo? - Adelgazar, Mantener peso, Ganar Peso'
        });
    }


    //  -----  Preguntar por el Objetivo  -----
    if(!currentUser.objetivo) {

        currentUser.objetivo = message;

        return res.json({
            reply: '¿Tienes alguna alergia?'
        });
    }


    //  -----  Preguntar por las alergias  -----
    if(!currentUser.alergias) {

        currentUser.alergias = message;

        return res.json({
            reply: '¿Qué alimentos no te gustan?'
        });
    }


    //  -----  Preguntar por los alimentos que no le gustan  -----
    if(!currentUser.alimentosNoGustan) {

        currentUser.alimentosNoGustan = message;

        return res.json({
            reply: '¿Cuántas comidas diarias haces?'
        });
    }


    //  -----  Preguntar por las comidas diarias  -----
    if(!currentUser.comidasDiarias) {

        currentUser.comidasDiarias = message;

        try {
            //  -----  Ejecutar petición a OpenAI para generar la dieta semanal personalizada con un prompt  -----
            const diet = await generateDiet(currentUser);

            //  -----  Vaciamos el objeto del usuario para empezar de nuevo  -----
            userData[userId] = {};
            console.log('Usuario completó el proceso, datos reseteados:', userData);

            return res.json({
                reply: `¡Aqui tienes tu dieta! \n\n ${diet}`
            });

        } catch (error) {
            console.error('Error al procesar la solicitud del chatbot:', error);
            return res.status(500).json({
                reply: 'Error al generar la dieta. Por favor, inténtalo de nuevo más tarde.'
            });
        }
    }


    return res.json({
        reply: '¡Gracias por tus respuestas!. Ya tienes tu dieta creada. Usa los ingredientes para hacer una receta.'
    });



}



//*  -----  Endpoint POST /api/nutri-chatbot que maneja la solicitud del chatbot usando la funcion handleChatbotRequest  -----
app.post(`${base}/api/nutri-chatbot`, handleChatbotRequest);



/*
    *  ---------------------------------------------------------------  *
    *  -----  Inicia el servidor HTTP en el puerto especificado  -----  * 
    *  -----  y muestra un mensaje en consola                    -----  *
    *  ---------------------------------------------------------------  *
*/

app.listen(PORT, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${PORT}${base} ✅`);
});
