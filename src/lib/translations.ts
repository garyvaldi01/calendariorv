export type Language = 'es' | 'en';

const translations: Record<string, { es: string; en: string }> = {
  // Header
  'app.title.prefix': { es: 'Casino Club', en: 'Casino Club' },
  'app.title.suffix': { es: 'RV', en: 'RV' },
  'app.badge.ig': { es: 'Algoritmo IG Activo', en: 'IG Algorithm Active' },
  'app.btn.pdf': { es: 'PDF', en: 'PDF' },
  'app.btn.word': { es: 'Word', en: 'Word' },
  'app.btn.config': { es: 'Configurar', en: 'Settings' },

  // Tabs
  'tab.calendar': { es: 'Dossier Semanal', en: 'Weekly Dossier' },
  'tab.analysis': { es: 'Análisis & Recomendaciones de IA', en: 'AI Analysis & Recommendations' },
  'tab.optimize': { es: 'Optimizar Post', en: 'Optimize Post' },
  'tab.comments': { es: 'Extraer Comentarios (Sorteos)', en: 'Extract Comments (Giveaways)' },

  // Input Section
  'input.title': { es: 'Ingresa Información', en: 'Enter Information' },
  'input.desc': { es: 'Sube un documento o pega el texto. Generaremos un calendario estructurado y profesional.', en: 'Upload a document or paste text. We will generate a structured, professional calendar.' },
  'input.click_upload': { es: 'Click para subir archivo', en: 'Click to upload file' },
  'input.file_types': { es: 'PDF, TXT, DOCX, Imágenes', en: 'PDF, TXT, DOCX, Images' },
  'input.history': { es: 'Historial de Calendarios', en: 'Calendar History' },
  'input.select_prev': { es: 'Selecciona un calendario anterior...', en: 'Select a previous calendar...' },
  'input.week_start': { es: 'Inicio de semana', en: 'Week start' },
  'input.or_write': { es: 'O escribe a mano', en: 'Or write manually' },
  'input.placeholder': { es: 'Ejemplo: Torneo el jueves. Promoción súper VIP de nuevos usuarios.', en: 'Example: Tournament on Thursday. Super VIP promotion for new users.' },
  'input.generate': { es: 'Generar Calendario para Instagram', en: 'Generate Instagram Calendar' },

  // Analysis Tab
  'analysis.title': { es: 'Auditor Experto & Analizador de Rotación', en: 'Expert Auditor & Rotation Analyzer' },
  'analysis.desc': { es: 'Auditoría inteligente sobre tus últimos {count} calendarios para garantizar un feed diverso.', en: 'Smart audit of your last {count} calendars to ensure a diverse feed.' },
  'analysis.reaudit': { es: 'Volver a Auditar', en: 'Re-audit' },
  'analysis.empty_title': { es: 'Historial Vacío', en: 'Empty History' },
  'analysis.empty_desc': { es: 'Necesitamos que generes al menos un calendario de contenido.', en: 'You need to generate at least one content calendar first.' },
  'analysis.generate_first': { es: 'Generar tu Primer Calendario', en: 'Generate Your First Calendar' },
  'analysis.diagnosis': { es: 'Diagnóstico de Diversidad de Marca', en: 'Brand Diversity Diagnosis' },
  'analysis.high_freq': { es: 'Alta Frecuencia (Evitar Saturación)', en: 'High Frequency (Avoid Saturation)' },
  'analysis.high_freq_desc': { es: 'Estos slots ya se usaron recientemente. Descansa sus copies.', en: 'These slots were used recently. Rest their copies.' },
  'analysis.fresh_opps': { es: 'Oportunidades de Frescura', en: 'Fresh Opportunities' },
  'analysis.fresh_opps_desc': { es: 'Slots ignorados. Haz clic para agregarlos.', en: 'Ignored slots. Click to add them.' },
  'analysis.strategic_hacks': { es: 'Hacks Estratégicos de Conversión', en: 'Strategic Conversion Hacks' },
  'analysis.creative_proposals': { es: 'Propuestas de Publicación Premium', en: 'Premium Post Proposals' },

  // Instagram Optimizer
  'optimizer.title': { es: 'Optimizador de Posts de Instagram y Auditor de Enlaces', en: 'Instagram Post Optimizer & Link Auditor' },
  'optimizer.desc': { es: 'Analiza publicaciones pasadas e idea propuestas mejores.', en: 'Analyze past posts and create better proposals.' },
  'optimizer.config_title': { es: 'Configurar Auditoría de Instagram', en: 'Configure Instagram Audit' },
  'optimizer.profile_label': { es: 'Enlace de Perfil de Instagram', en: 'Instagram Profile Link' },
  'optimizer.post_label': { es: 'Describe una publicación que quieras mejorar', en: 'Describe a post you want to improve' },
  'optimizer.post_placeholder': { es: 'Ejemplo: Un post de un auto deportivo azul con monedas voladoras...', en: 'Example: A post of a blue sports car with flying coins...' },
  'optimizer.optimize_btn': { es: 'Optimizar con IA de Rediseño Básico', en: 'Optimize with AI Basic Redesign' },
  'optimizer.how_title': { es: '¿Cómo funciona la Optimización?', en: 'How does Optimization work?' },
  'optimizer.result_title': { es: 'Resultado del Auditor de Mejora Visual', en: 'Visual Improvement Audit Result' },
  'optimizer.original_concept': { es: 'Concepto Original Detectado:', en: 'Original Concept Detected:' },
  'optimizer.original_feedback': { es: '¿Por qué fatiga y causa ceguera?', en: 'Why does it cause ad blindness?' },
  'optimizer.improved_title': { es: 'Propuesta Mejorada e Inteligente', en: 'Improved Intelligent Proposal' },
  'optimizer.copy_copy': { es: 'Copiar Copy', en: 'Copy Text' },
  'optimizer.use_calendar': { es: 'Usar para Calendario', en: 'Use for Calendar' },

  // Comments & Giveaway
  'comments.title': { es: 'Extractor de Comentarios e Instagram Giveaway Picker', en: 'Comment Extractor & Instagram Giveaway Picker' },
  'comments.desc': { es: 'Extrae, audita y valida comentarios para premiar a tus jugadores en RD$.', en: 'Extract, audit and validate comments to reward your players.' },
  'comments.attention': { es: '¡ATENCIÓN! CÓMO EXTRAER COMENTARIOS 100% REALES', en: 'ATTENTION! HOW TO EXTRACT 100% REAL COMMENTS' },
  'comments.option_a': { es: 'Opción A: Enlace de Publicación', en: 'Option A: Post Link' },
  'comments.option_b': { es: 'Opción B: Archivo PDF / Excel / XLS', en: 'Option B: PDF / Excel / XLS File' },
  'comments.option_c': { es: 'Opción C: Pegar Comentarios Reales', en: 'Option C: Paste Real Comments' },
  'comments.extract_btn_link': { es: 'Extraer Comentarios de Enlace', en: 'Extract Comments from Link' },
  'comments.extract_btn_text': { es: 'Extraer Comentarios Reales Pegados', en: 'Extract Pasted Real Comments' },
  'comments.extract_btn_file': { es: 'Extraer Comentarios desde Documento', en: 'Extract Comments from Document' },
  'comments.no_results': { es: 'Aún no has extraído comentarios', en: 'No comments extracted yet' },
  'comments.no_results_desc': { es: 'Ingresa el enlace y haz click en "Extraer Comentarios".', en: 'Enter the link and click "Extract Comments".' },
  'comments.total_likes': { es: 'Likes Recopilados', en: 'Total Likes' },
  'comments.total_comments': { es: 'Comentarios Extraídos', en: 'Comments Extracted' },
  'comments.full_list': { es: 'Listado Completo de Comentarios', en: 'Full Comments List' },

  // Giveaway / Tombola
  'giveaway.title': { es: 'Tómbola del Sorteo VIP', en: 'VIP Giveaway Drawing' },
  'giveaway.search': { es: 'Buscar por Nombre/Comentario', en: 'Search by Name/Comment' },
  'giveaway.filter': { es: 'Filtrar por Palabra Clave', en: 'Filter by Keyword' },
  'giveaway.winners_count': { es: 'Cantidad de Ganadores', en: 'Number of Winners' },
  'giveaway.spin': { es: 'Girar Tómbola de Comentarios', en: 'Spin the Comment Wheel' },
  'giveaway.spinning': { es: 'Mezclando cupones de Instagram...', en: 'Shuffling Instagram coupons...' },
  'giveaway.winners_title': { es: '¡GANADORES DEL SORTEO DE COMENTARIOS!', en: 'COMMENT GIVEAWAY WINNERS!' },
  'giveaway.winners_sub': { es: 'Seleccionados al azar bajo auditoría de Instagram para Casino Club RV', en: 'Randomly selected under Instagram audit for Casino Club RV' },
  'giveaway.congratulate': { es: 'Copiar Felicitación', en: 'Copy Congratulations' },

  // Calendar
  'calendar.dossier': { es: 'Dossier de Contenido Semanal', en: 'Weekly Content Dossier' },
  'calendar.no_posts': { es: 'Sin publicaciones programadas.', en: 'No scheduled posts.' },
  'calendar.reference': { es: 'Ideas escritas a mano como referencia:', en: 'Handwritten ideas as reference:' },

  // Config Modal
  'config.title': { es: 'Configurar API Key y Uso Local', en: 'Configure API Key & Local Use' },
  'config.desc': { es: 'Ingresa tu API Key de Gemini para usar la aplicación con tus propios recursos.', en: 'Enter your Gemini API Key to use the app with your own resources.' },
  'config.api_label': { es: 'API Key de Gemini', en: 'Gemini API Key' },
  'config.api_placeholder': { es: 'Ingresa tu API Key aquí...', en: 'Enter your API Key here...' },
  'config.save': { es: 'Guardar y Cerrar', en: 'Save & Close' },
  'config.delete': { es: 'Eliminar API Key guardada', en: 'Delete Saved API Key' },
  'config.guide_title': { es: '📖 Guía para usar la aplicación:', en: '📖 Guide to use the app:' },
  'config.step1': { es: '1. Obtén tu API Key gratuita en Google AI Studio (ai.google.dev)', en: '1. Get your free API Key from Google AI Studio (ai.google.dev)' },
  'config.step2': { es: '2. Cópiala exactamente como aparece (sin espacios extras).', en: '2. Copy it exactly as it appears (no extra spaces).' },
  'config.step3': { es: '3. Pégala aquí arriba en el campo "API Key de Gemini".', en: '3. Paste it above in the "Gemini API Key" field.' },
  'config.step4': { es: '4. Haz clic en "Guardar y Cerrar". ¡Todo listo!', en: '4. Click "Save & Close". All set!' },

  // Loading Messages
  'loading.calendar': { es: 'Estructurando calendario...', en: 'Structuring calendar...' },
  'loading.ideas': { es: 'Creando ideas visuales...', en: 'Creating visual ideas...' },
  'loading.copy': { es: 'Redactando copy profesional...', en: 'Writing professional copy...' },
  'loading.finalizing': { es: 'Finalizando reporte para diseño...', en: 'Finalizing design report...' },
  'loading.extracting': { es: 'Analizando y estructurando comentarios...', en: 'Analyzing and structuring comments...' },
  'loading.spinning': { es: 'Haciendo girar la tómbola...', en: 'Spinning the wheel...' },

  // General
  'general.saved_key': { es: 'API Key guardada correctamente.', en: 'API Key saved successfully.' },
  'general.deleted_key': { es: 'API Key eliminada.', en: 'API Key deleted.' },
  'general.copied': { es: '¡Copiado!', en: 'Copied!' },
  'general.error': { es: 'Error', en: 'Error' },
  'general.success': { es: 'Éxito', en: 'Success' },
  'general.loading': { es: 'Cargando...', en: 'Loading...' },
  'general.close': { es: 'Cerrar', en: 'Close' },
  'general.save': { es: 'Guardar', en: 'Save' },
  'general.delete': { es: 'Eliminar', en: 'Delete' },
  'general.clear': { es: 'Limpiar', en: 'Clear' },

  // Days of the week
  'day.monday': { es: 'Lunes', en: 'Monday' },
  'day.tuesday': { es: 'Martes', en: 'Tuesday' },
  'day.wednesday': { es: 'Miércoles', en: 'Wednesday' },
  'day.thursday': { es: 'Jueves', en: 'Thursday' },
  'day.friday': { es: 'Viernes', en: 'Friday' },
  'day.saturday': { es: 'Sábado', en: 'Saturday' },
  'day.sunday': { es: 'Domingo', en: 'Sunday' },

  // Months
  'month.1': { es: 'Enero', en: 'January' },
  'month.2': { es: 'Febrero', en: 'February' },
  'month.3': { es: 'Marzo', en: 'March' },
  'month.4': { es: 'Abril', en: 'April' },
  'month.5': { es: 'Mayo', en: 'May' },
  'month.6': { es: 'Junio', en: 'June' },
  'month.7': { es: 'Julio', en: 'July' },
  'month.8': { es: 'Agosto', en: 'August' },
  'month.9': { es: 'Septiembre', en: 'September' },
  'month.10': { es: 'Octubre', en: 'October' },
  'month.11': { es: 'Noviembre', en: 'November' },
  'month.12': { es: 'Diciembre', en: 'December' },
};

export function t(key: string, lang: Language, params?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[lang] || entry['es'] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export function useTranslation(lang: Language) {
  return (key: string, params?: Record<string, string | number>) => t(key, lang, params);
}
