import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const ANALYSIS_MODEL = "claude-opus-5";

export interface PliegoAnalysisResult {
  resumen: string;
  montoEstimado: number | null;
  moneda: string;
  fechasClave: { tipo: string; fecha: string; detalle: string }[];
  requisitos: { descripcion: string; categoria: string; obligatorio: boolean }[];
  analisisLegal: {
    resumen: string;
    hallazgos: { clausula: string; riesgo: string; severidad: "BAJA" | "MEDIA" | "ALTA" }[];
  };
  analisisTecnico: {
    resumen: string;
    senalesDireccionamiento: { hallazgo: string; justificacion: string; severidad: "BAJA" | "MEDIA" | "ALTA" }[];
  };
  riesgoGeneral: "BAJA" | "MEDIA" | "ALTA";
}

const severityEnum = { type: "string", enum: ["BAJA", "MEDIA", "ALTA"] } as const;

const PLIEGO_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    resumen: { type: "string", description: "Resumen general del pliego de cargos, en español" },
    montoEstimado: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "Monto estimado del contrato detectado en el pliego, o null si no se menciona",
    },
    moneda: { type: "string", description: "Código de moneda detectado, ej. USD, PAB" },
    fechasClave: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", description: "Ej: cierre de recepción de ofertas, acto público, visita, consultas" },
          fecha: { type: "string", description: "Fecha en formato ISO 8601 si es posible, o texto tal como aparece" },
          detalle: { type: "string" },
        },
        required: ["tipo", "fecha", "detalle"],
        additionalProperties: false,
      },
    },
    requisitos: {
      type: "array",
      description: "Checklist de requisitos/documentos exigidos por el pliego",
      items: {
        type: "object",
        properties: {
          descripcion: { type: "string" },
          categoria: { type: "string", description: "legal | tecnico | financiero | administrativo | otro" },
          obligatorio: { type: "boolean" },
        },
        required: ["descripcion", "categoria", "obligatorio"],
        additionalProperties: false,
      },
    },
    analisisLegal: {
      type: "object",
      description: "Análisis legal de cláusulas riesgosas, plazos, garantías y penalidades",
      properties: {
        resumen: { type: "string" },
        hallazgos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              clausula: { type: "string" },
              riesgo: { type: "string" },
              severidad: severityEnum,
            },
            required: ["clausula", "riesgo", "severidad"],
            additionalProperties: false,
          },
        },
      },
      required: ["resumen", "hallazgos"],
      additionalProperties: false,
    },
    analisisTecnico: {
      type: "object",
      description:
        "Análisis técnico de las especificaciones del pliego buscando posibles señales de direccionamiento " +
        "(especificaciones atadas a una marca/proveedor específico, plazos u certificaciones inusuales, etc.)",
      properties: {
        resumen: { type: "string" },
        senalesDireccionamiento: {
          type: "array",
          items: {
            type: "object",
            properties: {
              hallazgo: { type: "string" },
              justificacion: { type: "string" },
              severidad: severityEnum,
            },
            required: ["hallazgo", "justificacion", "severidad"],
            additionalProperties: false,
          },
        },
      },
      required: ["resumen", "senalesDireccionamiento"],
      additionalProperties: false,
    },
    riesgoGeneral: severityEnum,
  },
  required: [
    "resumen",
    "montoEstimado",
    "moneda",
    "fechasClave",
    "requisitos",
    "analisisLegal",
    "analisisTecnico",
    "riesgoGeneral",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `Eres un analista de contrataciones públicas en Panamá, especializado en compliance y cumplimiento normativo.
Tu tarea es analizar el pliego de cargos de una licitación pública y producir un análisis objetivo, en español, con dos enfoques:

1. Análisis LEGAL: identifica cláusulas de riesgo (plazos muy cortos, garantías desproporcionadas, penalidades excesivas, causales de descalificación ambiguas, etc.).
2. Análisis TÉCNICO: evalúa las especificaciones técnicas buscando posibles señales de "direccionamiento" — es decir, especificaciones redactadas de forma que favorezcan a un proveedor o marca específica sin justificación técnica razonable (marcas nombradas sin "o equivalente", certificaciones muy específicas e inusuales, combinaciones de requisitos que solo cumple un producto conocido, plazos de entrega irrealistas que solo un proveedor local podría cumplir, etc.). Este análisis es para fines de debida diligencia y transparencia, no para ayudar a nadie a direccionar un proceso.

También extrae: un checklist de requisitos/documentos exigidos, las fechas clave del proceso, y el monto estimado si se menciona.
Sé conservador: si no hay evidencia clara de un riesgo o señal de direccionamiento, no la reportes. Responde únicamente en el formato JSON solicitado.`;

export async function analyzePliego(pliegoText: string): Promise<{ result: PliegoAnalysisResult; rawModel: string }> {
  const truncated = pliegoText.slice(0, 400_000); // margen amplio; el modelo tiene 1M de contexto

  const stream = client.messages.stream({
    model: ANALYSIS_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: PLIEGO_ANALYSIS_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analiza el siguiente pliego de cargos y responde en el formato JSON solicitado:\n\n${truncated}`,
      },
    ],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud de análisis. Intenta de nuevo o revisa el contenido del documento.");
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("El modelo no devolvió una respuesta de texto con el análisis.");
  }

  const result = JSON.parse(textBlock.text) as PliegoAnalysisResult;
  return { result, rawModel: ANALYSIS_MODEL };
}
