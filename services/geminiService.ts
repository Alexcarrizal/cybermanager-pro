
// AI functionality has been disabled as per user request.
// This service now returns static placeholders to maintain type compatibility.

export const generateBusinessInsight = async (contextData: string, query: string): Promise<string> => {
  return "La asistencia por Inteligencia Artificial está desactivada.";
};

export const generateMarketingCopy = async (productName: string): Promise<string> => {
    return "Descripción no disponible (IA desactivada).";
};
