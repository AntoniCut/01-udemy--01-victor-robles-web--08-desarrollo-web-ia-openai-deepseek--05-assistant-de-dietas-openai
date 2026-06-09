/*
    --------------------------------------------------
    -----  /global.d.ts  --  /types/global.d.ts  -----
    --------------------------------------------------
*/


/// <reference lib="dom" />
/// <reference lib="es2022" />


/**
 * ----------------------------------------------------------------
 * -----  Tipos DOM extendidos para compatibilidad            -----
 * -----  (por si tu versión de lib.dom.d.ts no los incluye)  -----
 * ----------------------------------------------------------------
 */

interface HTMLHeaderElement extends HTMLElement { }
interface HTMLFooterElement extends HTMLElement { }
interface HTMLMainElement extends HTMLElement { }
interface HTMLNavElement extends HTMLElement { }
interface HTMLSectionElement extends HTMLElement { }
interface HTMLArticleElement extends HTMLElement { }
interface HTMLAsideElement extends HTMLElement { }
interface HTMLFigureElement extends HTMLElement { }
interface HTMLFigcaptionElement extends HTMLElement { }


/**
 * -----------------------------------------------
 * -----  Tipos globales para la aplicación  -----
 * -----------------------------------------------
 */

declare global {
    

    /**  -----  `Cuerpo de la solicitud para el chatbot`  ----- */
    type ChatbotRequestBody = {
        
        /** -----  Mensaje del usuario para el chatbot  ----- */
        message: string;

        /** -----  Identificador del usuario que envía el mensaje  ----- */
        userId: number;
    }


    /**  -----  `Respuesta del chatbot`  ----- */
    type ChatbotResponse = {

        /** -----  Respuesta textual del chatbot  ----- */
        reply: string;
    }


    /**
     * ---------------------------------------------------------
     * -----  Datos del usuario para el chatbot de dietas  -----
     * ---------------------------------------------------------
     * - Representa la información recopilada del usuario
     *   durante la conversación con el asistente de dietas.
     * - Cada propiedad corresponde a una pregunta del flujo
     *   conversacional y se almacena como cadena de texto.
     */
    type UserData = {

        /** -----  Peso del usuario en kilogramos  ----- */
        peso?: string;

        /** -----  Altura del usuario en centímetros  ----- */
        altura?: string;

        /** -----  Objetivo nutricional: Adelgazar, Mantener peso o Ganar Peso  ----- */
        objetivo?: string;

        /** -----  Alergias alimentarias del usuario  ----- */
        alergias?: string;

        /** -----  Alimentos que no gustan al usuario  ----- */
        alimentosNoGustan?: string;

        /** -----  Número de comidas diarias deseadas  ----- */
        comidasDiarias?: string;
    }
}


export { }
