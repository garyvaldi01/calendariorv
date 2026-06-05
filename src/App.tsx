import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { generateCalendar, analyzePreviousCalendars, improveInstagramPost, extractInstagramComments } from '@/lib/gemini';
import { parseCommentsFromTextClientSide } from '@/lib/localParser';
import { WeeklyCalendar, SavedCalendar, AnalysisReport, InstagramImprovementReport, InstagramComment, InstagramExtractorResult } from '@/types';
import { Sparkles, UploadCloud, Download, Rocket, Settings, PenTool, LayoutGrid, FileText, X, Instagram, FileDown, History, TrendingUp, Check, Bot, RefreshCw, Layers, Sparkle, Link, MessageSquare, Trophy, Copy, CheckSquare, Search, Filter, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { t, Language } from '@/lib/translations';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [startDay, setStartDay] = useState('Lunes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [calendar, setCalendar] = useState<WeeklyCalendar | null>(null);
  const [loaderMessage, setLoaderMessage] = useState('Analizando información...');
  const [history, setHistory] = useState<SavedCalendar[]>([]);
  
  const [showConfig, setShowConfig] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [language, setLanguage] = useState<Language>('es');
  const [headerLogo, setHeaderLogo] = useState<string | null>(() => localStorage.getItem('clubrv_logo'));
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'recommendations' | 'instagram-audit' | 'instagram-comments'>('calendar');
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New states for the Instagram URL & Post Optimizer
  const [igProfileUrl, setIgProfileUrl] = useState('https://www.instagram.com/casinoclubrv_do');
  const [pastPostDescription, setPastPostDescription] = useState('Publicación con fichas de poker genéricas volando para anunciar que ganaron RD$ 50,000 en el casino.');
  const [isImproving, setIsImproving] = useState(false);
  const [improvementResult, setImprovementResult] = useState<InstagramImprovementReport | null>(null);

  // New states for Instagram comment extractor & giveaway wheel
  const [commentPostUrl, setCommentPostUrl] = useState('https://www.instagram.com/p/DY0a1djj3ZZ/');
  const [isExtractingComments, setIsExtractingComments] = useState(false);
  const [extractedComments, setExtractedComments] = useState<InstagramExtractorResult | null>(null);
  const [commentSearch, setCommentSearch] = useState('');
  const [commentFilterKeyword, setCommentFilterKeyword] = useState('');
  const [selectedWinners, setSelectedWinners] = useState<InstagramComment[]>([]);
  const [numberOfWinnersToPick, setNumberOfWinnersToPick] = useState(1);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [commentRawText, setCommentRawText] = useState('');

  // Comments File upload states (Excel / PDF / CSV / TXT / Images)
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentFileBase64, setCommentFileBase64] = useState<string | null>(null);
  const [commentFileRawText, setCommentFileRawText] = useState<string>('');
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setCommentFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const base64Str = event.target.result.split(',')[1];
          setCommentFileBase64(base64Str);
        }
      };
      reader.readAsDataURL(selectedFile);

      // Read as raw text if it's text-based to enable 100% real client-side parsing
      if (selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv')) {
        const textReader = new FileReader();
        textReader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setCommentFileRawText(event.target.result);
          }
        };
        textReader.readAsText(selectedFile);
      } else {
        setCommentFileRawText('');
      }
      
      toast.success(`Archivo "${selectedFile.name}" cargado para extracción`);
    }
  };

  const clearCommentFile = () => {
    setCommentFile(null);
    setCommentFileBase64(null);
    setCommentFileRawText('');
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  const handleExtractComments = async () => {
    if (!commentPostUrl.trim() && !commentFile && !commentRawText.trim()) {
      toast.error("Por favor ingresa un enlace de publicación de Instagram, sube un archivo Excel/PDF, o pega texto de los comentarios.");
      return;
    }
    
    setIsExtractingComments(true);
    setSelectedWinners([]);
    
    let loadingMessage = "Leyendo y extrayendo comentarios de Instagram...";
    if (commentRawText.trim()) {
      loadingMessage = "Analizando y estructurando comentarios reales pegados...";
    } else if (commentFile) {
      loadingMessage = `Extrayendo y estructurando comentarios desde el documento "${commentFile.name}"...`;
    }
      
    toast.loading(loadingMessage, { id: "comments-loading" });
    
    // Check if we can parse client-side directly
    if (commentRawText.trim()) {
      try {
        const parsed = parseCommentsFromTextClientSide(commentRawText.trim());
        if (parsed.length > 0) {
          const result: InstagramExtractorResult = {
            postUrl: commentPostUrl || "https://www.instagram.com/p/DY0a1djj3ZZ/",
            postCaption: "Comentarios reales extraídos con precisión del texto pegado.",
            likesCount: Math.round(parsed.length * 1.5),
            commentsCount: parsed.length,
            comments: parsed
          };
          setExtractedComments(result);
          toast.dismiss("comments-loading");
          toast.success(`¡Éxito! Se han extraído ${result.comments.length} comentarios reales del texto copiado.`);
          setIsExtractingComments(false);
          return;
        } else {
          throw new Error("No se detectó ningún comentario con formato válido en el texto pegado.");
        }
      } catch (err: any) {
        console.warn("Fallo en parseo local rápido:", err);
      }
    }

    if (commentFile && (commentFile.name.endsWith('.txt') || commentFile.name.endsWith('.csv')) && commentFileRawText) {
      try {
        const parsed = parseCommentsFromTextClientSide(commentFileRawText);
        if (parsed.length > 0) {
          const result: InstagramExtractorResult = {
            postUrl: commentPostUrl || "https://www.instagram.com/p/DY0a1djj3ZZ/",
            postCaption: `Comentarios extraídos con éxito a partir del archivo real "${commentFile.name}".`,
            likesCount: Math.round(parsed.length * 1.8),
            commentsCount: parsed.length,
            comments: parsed
          };
          setExtractedComments(result);
          toast.dismiss("comments-loading");
          toast.success(`¡Éxito! Se han extraído ${result.comments.length} participantes reales desde el archivo de texto.`);
          setIsExtractingComments(false);
          return;
        }
      } catch (err) {
        console.warn("Fallo al parsear archivo de texto local:", err);
      }
    }

    try {
      let fileData = undefined;
      if (commentFile && commentFileBase64) {
        fileData = {
          mimeType: commentFile.type || 'application/octet-stream',
          data: commentFileBase64
        };
      }
      
      const result = await extractInstagramComments(commentPostUrl, fileData, commentRawText.trim() || undefined);
      setExtractedComments(result);
      toast.dismiss("comments-loading");
      toast.success(
        commentRawText.trim()
          ? `¡Éxito! Se han extraído ${result.comments.length} comentarios reales del texto copiado.`
          : commentFile
            ? `¡Éxito! Se han extraído y estructurado ${result.comments.length} participantes reales del archivo.`
            : `Se extrajeron ${result.comments.length} comentarios con éxito de la publicación.`
      );
    } catch (error: any) {
      toast.dismiss("comments-loading");
      toast.error("Error al extraer comentarios: " + error.message);
    } finally {
      setIsExtractingComments(false);
    }
  };

  const handlePickRandomWinner = () => {
    if (!extractedComments || extractedComments.comments.length === 0) {
      toast.error("No hay comentarios disponibles.");
      return;
    }
    
    setIsPickingWinner(true);
    toast.loading("Haciendo girar la tómbola del Casino Club RV...", { id: "picker-loading" });
    
    setTimeout(() => {
      const filtered = extractedComments.comments.filter(c => {
        const matchesSearch = c.username.toLowerCase().includes(commentSearch.toLowerCase()) || 
                              c.text.toLowerCase().includes(commentSearch.toLowerCase());
        const matchesKeyword = commentFilterKeyword ? c.text.toLowerCase().includes(commentFilterKeyword.toLowerCase()) : true;
        return matchesSearch && matchesKeyword;
      });

      if (filtered.length === 0) {
        toast.dismiss("picker-loading");
        toast.error("Ningún comentario coincide con los filtros aplicados.");
        setIsPickingWinner(false);
        return;
      }

      const count = Math.min(numberOfWinnersToPick, filtered.length);
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, count);
      
      setSelectedWinners(winners);
      setIsPickingWinner(false);
      toast.dismiss("picker-loading");
      toast.success(`🎉 ¡Felicidades! Se ha elegido con éxito a el/los ganador(es)!`);
      
      // ✨ Confetti burst for winners!
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFD700', '#FFA500', '#FF6347', '#00FF00']
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#D4AF37', '#FFD700', '#FFA500']
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#D4AF37', '#FFD700', '#FFA500']
          });
        }, 250);
      } catch (e) {
        // confetti not available
      }
    }, 1500);
  };

  const handleImprovePost = async () => {
    if (!igProfileUrl.trim()) {
      toast.error("Por favor, introduce el enlace del perfil de Instagram.");
      return;
    }
    if (!pastPostDescription.trim()) {
      toast.error("Por favor, describe una publicación reciente o pasada para mejorar.");
      return;
    }

    setIsImproving(true);
    toast.loading("Auditando perfil y re-diseñando post...", { id: "improve-loading" });
    try {
      const result = await improveInstagramPost(igProfileUrl, pastPostDescription);
      setImprovementResult(result);
      toast.dismiss("improve-loading");
      toast.success("¡Propuesta optimizada generada exitosamente!");
    } catch (error: any) {
      toast.dismiss("improve-loading");
      console.error(error);
      toast.error("Hubo un error al auditar el perfil.");
    } finally {
      setIsImproving(false);
    }
  };

  const handleAnalyzeHistory = async (customHistory?: SavedCalendar[]) => {
    const listToAnalyze = customHistory || history;
    if (listToAnalyze.length === 0) {
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzePreviousCalendars(listToAnalyze);
      setAnalysis(result);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo obtener el análisis avanzado de la IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('calendarHistory');
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          handleAnalyzeHistory(parsedHistory);
        }
      } catch (e) {
        console.error("Error parsing history");
      }
    }
    
    // Load persisted API key for easy local execution
    const savedKey = localStorage.getItem('custom_gemini_api_key');
    if (savedKey) {
      setCustomKey(savedKey);
    }
  }, []);

  const saveToHistory = (cal: WeeklyCalendar, prompt?: string) => {
    setHistory(prev => {
      const newItem: SavedCalendar = {
        id: Math.random().toString(36).substring(7),
        createdAt: Date.now(),
        data: cal,
        promptText: prompt || inputText
      };
      const updatedHistory = [newItem, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem('calendarHistory', JSON.stringify(updatedHistory));
      
      // Reactive updates to analysis report based on fresh generation
      handleAnalyzeHistory(updatedHistory);
      return updatedHistory;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          // Extraer la parte base64 (removiendo el header data:...)
          const base64Str = event.target.result.split(',')[1];
          setFileBase64(base64Str);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Animate loader messages
    const messages = ['Estructurando calendario...', 'Creando ideas visuales...', 'Redactando copy profesional...', 'Finalizando reporte para diseño...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoaderMessage(messages[i]);
    }, 1500);

    try {
      let fileData = undefined;
      if (file && fileBase64) {
         fileData = {
           mimeType: file.type || 'application/octet-stream',
           data: fileBase64
         };
      }
      
      const result = await generateCalendar(inputText, startDay, fileData, calendar || undefined);
      setCalendar(result);
      saveToHistory(result, inputText);
      toast.success('¡Calendario generado con éxito!');
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al generar el calendario.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('urgencia')) return 'bg-red-500/20 text-red-500 border-red-500/30';
    if (t.includes('promoción') || t.includes('bono')) return 'bg-green-500/20 text-green-500 border-green-500/30';
    if (t.includes('torneo') || t.includes('slot')) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
  };

  const handleDragStart = (e: React.DragEvent, dayIndex: number, postId: string) => {
    e.dataTransfer.setData('sourceDay', dayIndex.toString());
    e.dataTransfer.setData('postId', postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    if (!calendar) return;
    
    const sourceDayStr = e.dataTransfer.getData('sourceDay');
    if (!sourceDayStr) return;
    
    const sourceDay = parseInt(sourceDayStr, 10);
    const postId = e.dataTransfer.getData('postId');
    
    if (sourceDay === targetDayIndex) return;

    const updatedCal = { ...calendar };
    const postIndex = updatedCal.days[sourceDay].posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    const [post] = updatedCal.days[sourceDay].posts.splice(postIndex, 1);
    updatedCal.days[targetDayIndex].posts.push(post);
    
    setCalendar(updatedCal);
    toast('Post movido de día', { duration: 2000 });
  };

  const handleUpdatePost = (dayIndex: number, postId: string, field: 'copyText' | 'visualConcept', value: string) => {
    if (!calendar) return;
    const updatedCal = { ...calendar };
    const post = updatedCal.days[dayIndex].posts.find(p => p.id === postId);
    if (post) {
      post[field] = value;
      setCalendar(updatedCal);
    }
  };

  const handleRegenerateDay = async (dayIndex: number) => {
    if (!calendar) return;
    toast.loading(`Regenerando ${calendar.days[dayIndex].dayName}...`, { id: 'regenerate-toast' });
    
    try {
      const dayName = calendar.days[dayIndex].dayName;
      const context = `Regenera únicamente el contenido del día ${dayName}. Contexto actual del calendario: ${JSON.stringify(calendar)}. Mantén el estilo y las reglas de torneos.`;
      const result = await generateCalendar(context, dayName);
      
      const updatedCal = { ...calendar };
      // Find the generated day in the result
      const newDayData = result.days.find(d => d.dayName.toLowerCase() === dayName.toLowerCase());
      if (newDayData) {
        updatedCal.days[dayIndex].posts = newDayData.posts;
        setCalendar(updatedCal);
        toast.dismiss('regenerate-toast');
        toast.success(`Día ${dayName} regenerado.`);
      }
    } catch (e) {
      toast.dismiss('regenerate-toast');
      toast.error('No se pudo regenerar el día.');
    }
  };
  
  const generateCleanHtml = () => {
    if (!calendar) return '';

    let html = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">`;
    html += `<div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px;">
               <h1 style="color: #000; margin: 0; font-size: 28px;">Casino Club RV</h1>
               <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Dossier Semanal de Contenido para Instagram</p>
             </div>`;

    calendar.days.forEach(day => {
      html += `<h2 style="color: #d4af37; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; font-size: 22px;">${day.dayName.toUpperCase()}</h2>`;
      if (day.posts.length === 0) {
        html += `<p style="color: #999; font-style: italic;">Sin publicaciones programadas.</p>`;
      }
      day.posts.forEach(post => {
        html += `
        <div style="border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #fafafa;">
          <div style="margin-bottom: 15px;">
            <span style="display: inline-block; background: #e8e8e8; color: #333; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px;">🕒 ${post.time}</span>
            <span style="display: inline-block; background: #d4af3730; color: #8a6d1c; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">📌 ${post.type}</span>
          </div>
          <h3 style="font-size: 14px; color: #d4af37; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 1px;">🛠 Instrucción Visual (Para Diseño)</h3>
          <p style="font-size: 15px; color: #444; line-height: 1.6; margin-top: 0; margin-bottom: 20px; white-space: pre-wrap;">${post.visualConcept}</p>
          
          <h3 style="font-size: 14px; color: #d4af37; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 1px;">📝 Copy (Texto para Instagram)</h3>
          <p style="font-size: 15px; color: #444; line-height: 1.6; margin-top: 0; margin-bottom: 0; white-space: pre-wrap;">${post.copyText}</p>
        </div>`;
      });
    });

    html += `</div>`;
    return html;
  };

  const handlePrint = () => {
    if (!calendar) return;
    
    toast.loading('Generando PDF...', { id: 'pdf-toast' });
    
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      let y = 20;
      const marginX = 20;
      const maxWidth = 170; // 210 - 40
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("Casino Club RV", 105, y, { align: "center" });
      
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Dossier Semanal de Contenido para Instagram", 105, y, { align: "center" });
      
      y += 15;
      
      calendar.days.forEach((day) => {
        if (y > 260) { doc.addPage(); y = 20; }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(212, 175, 55);
        doc.text(day.dayName.toUpperCase(), marginX, y);
        y += 4;
        
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.line(marginX, y, 210 - marginX, y);
        y += 10;
        
        if (day.posts.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(12);
          doc.setTextColor(150, 150, 150);
          doc.text("Sin publicaciones programadas.", marginX, y);
          y += 15;
          return;
        }
        
        day.posts.forEach((post) => {
           if (y > 250) { doc.addPage(); y = 20; }
           
           doc.setFont("helvetica", "bold");
           doc.setFontSize(10);
           doc.setTextColor(50, 50, 50);
           doc.text(`HORA: ${post.time}  |  TIPO: ${post.type.toUpperCase()}`, marginX, y);
           y += 8;
           
           doc.setFont("helvetica", "bold");
           doc.setFontSize(11);
           doc.setTextColor(212, 175, 55);
           doc.text("INSTRUCCIÓN VISUAL (DISEÑO)", marginX, y);
           y += 6;
           
           doc.setFont("helvetica", "normal");
           doc.setFontSize(10);
           doc.setTextColor(60, 60, 60);
           const visualLines = doc.splitTextToSize(post.visualConcept, maxWidth);
           doc.text(visualLines, marginX, y);
           y += (visualLines.length * 5) + 6;
           
           if (y > 260) { doc.addPage(); y = 20; }
           
           doc.setFont("helvetica", "bold");
           doc.setFontSize(11);
           doc.setTextColor(212, 175, 55);
           doc.text("COPY (TEXTO INSTAGRAM)", marginX, y);
           y += 6;
           
           doc.setFont("helvetica", "normal");
           doc.setFontSize(10);
           doc.setTextColor(40, 40, 40);
           const copyLines = doc.splitTextToSize(post.copyText, maxWidth);
           doc.text(copyLines, marginX, y);
           y += (copyLines.length * 5) + 12;
           
           doc.setDrawColor(240, 240, 240);
           doc.line(marginX, y - 6, 210 - marginX, y - 6);
        });
        
        y += 5;
      });
      
      doc.save("Calendario_Casino_Club_RV.pdf");
      toast.dismiss('pdf-toast');
      toast.success('PDF generado y descargado exitosamente!');
    } catch (e) {
      console.error(e);
      toast.dismiss('pdf-toast');
      toast.error('Error al generar PDF. Intente de nuevo.');
    }
  };

  const handleWordExport = () => {
    if (!calendar) return;

    let fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Dossier Semanal - Casino Club RV</title></head><body>`;
    fullHtml += generateCleanHtml();
    fullHtml += `</body></html>`;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Calendario_Casino_Club_RV.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-background to-background print:bg-white print:text-black">
      <Toaster theme="dark" />
      
      {/* Header - Hide on print */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] overflow-hidden shrink-0">
              <img src={headerLogo || "/logo.png"} alt="Casino Club RV" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Casino Club <span className="text-primary">RV</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden md:flex bg-pink-500/10 text-pink-500 border-pink-500/20 mr-2 items-center gap-1.5 px-3 py-1">
              <Instagram className="size-3.5" />
              Algoritmo IG Activo
            </Badge>
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="relative size-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-xs font-bold text-white cursor-pointer group"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <span className="group-hover:scale-110 transition-transform">{language === 'es' ? 'EN' : 'ES'}</span>
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary animate-pulse" />
            </button>
            <Button variant="outline" size="sm" className="hidden sm:flex border-white/10" disabled={!calendar} onClick={handlePrint}>
              <Download className="size-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex border-white/10" disabled={!calendar} onClick={handleWordExport}>
              <FileDown className="size-4 mr-2" /> Word
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="size-4 mr-2" /> Configurar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:p-0 print:m-0">
        
         {/* Print Only Header */}
        <div id="report-content" className="print:block print:w-full">
           <div className="hidden print:block mb-8 text-center pb-4 border-b border-gray-200">
             <h1 className="text-3xl font-bold text-black flex items-center justify-center gap-2">
               <img src={headerLogo || "/logo.png"} alt="Casino Club RV" className="inline-block h-8 w-8 rounded-full object-cover align-middle" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> Casino Club RV
             </h1>
             <p className="text-gray-500 mt-2 font-medium">Planificación Semanal Optimizado para Instagram (Dossier de Diseño)</p>
           </div>

           {/* Remove grid restrictions just for the wrapper ID. Or better, put it on a new wrapper inside output section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:block print:w-full">
          {/* Input Section - Hide on print */}
          <Card className="lg:col-span-1 border-white/10 bg-black/40 backdrop-blur print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UploadCloud className="size-5 text-primary" />
                Ingresa Información
              </CardTitle>
              <CardDescription>Sube un documento o pega el texto. Generaremos un calendario estructurado y profesional.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* File Upload Zone */}
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors mb-4 relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,image/*,.txt,.doc,.docx" 
                />
                
                {file ? (
                  <div className="flex items-center flex-col gap-2 w-full">
                    <FileText className="size-8 text-primary" />
                    <span className="text-sm font-medium text-white break-all">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-full"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="size-8 text-white/40 mb-2" />
                    <p className="text-sm font-medium text-white mb-1">Click para subir archivo</p>
                    <p className="text-xs text-white/50">PDF, TXT, DOCX, Imágenes</p>
                  </>
                )}
              </div>

              {history.length > 0 && (
                <div className="flex flex-col gap-2 mb-4 border-b border-white/5 pb-4">
                  <label className="text-xs text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
                    <History className="size-3" /> Historial de Calendarios
                  </label>
                  <select 
                    className="bg-primary/10 border border-primary/30 rounded-md p-2 text-white outline-none w-full"
                    defaultValue=""
                    onChange={(e) => {
                       if(e.target.value) {
                          const selected = history.find(h => h.id === e.target.value);
                          if(selected) {
                             setCalendar(selected.data);
                             if (selected.promptText) {
                               setInputText(selected.promptText);
                             }
                             toast.success('Calendario y texto manual cargados');
                          }
                       }
                    }}
                  >
                    <option value="" disabled>Selecciona un calendario anterior...</option>
                    {history.map(item => (
                       <option key={item.id} value={item.id}>
                         Calendario del {new Date(item.createdAt).toLocaleDateString()}
                       </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-xs text-white/70 font-semibold uppercase tracking-wider">Inicio de semana</label>
                <select 
                  className="bg-black/50 border border-white/10 rounded-md p-2 text-white outline-none focus:border-primary w-full"
                  value={startDay}
                  onChange={(e) => setStartDay(e.target.value)}
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                </select>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">O escribe a mano</span>
              </div>
              
              <Textarea 
                placeholder="Ejemplo: Torneo el jueves. Promoción súper VIP de nuevos usuarios." 
                className="h-32 resize-none bg-white/5 border-white/10 mb-4 focus-visible:ring-primary"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || (!inputText.trim() && !file)}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center h-12"
                >
                  <Instagram className="size-5 mr-2" /> 
                  Generar Calendario para Instagram
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card id="report-content-card" className="lg:col-span-2 border-white/10 bg-black/40 backdrop-blur min-h-[500px] flex flex-col shadow-2xl print:bg-white print:border-none print:shadow-none print:text-black print:col-span-3 overflow-hidden">
              
              {/* Tab Navigation Menu */}
              <div className="flex border-b border-white/10 px-6 pt-4 gap-6 bg-zinc-950/20 print:hidden shrink-0">
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'calendar' ? 'border-primary text-primary font-bold' : 'border-transparent text-white/50 hover:text-white font-normal'}`}
                >
                  <LayoutGrid className="size-4" />
                  Dossier Semanal
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('recommendations');
                    if (!analysis && history.length > 0) {
                      handleAnalyzeHistory();
                    }
                  }}
                  className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 relative cursor-pointer ${activeTab === 'recommendations' ? 'border-primary text-primary font-bold' : 'border-transparent text-white/50 hover:text-white font-normal'}`}
                >
                  <Sparkles className="size-4 text-primary animate-pulse" />
                  Análisis & Recomendaciones de IA
                  {history.length > 0 && !analysis && (
                    <span className="absolute top-1 -right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('instagram-audit')}
                  className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'instagram-audit' ? 'border-primary text-primary font-bold' : 'border-transparent text-white/50 hover:text-white font-normal'}`}
                >
                  <Instagram className="size-4 text-pink-500" />
                  Optimizar Post
                </button>
                <button 
                  onClick={() => setActiveTab('instagram-comments')}
                  className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'instagram-comments' ? 'border-primary text-primary font-bold' : 'border-transparent text-white/50 hover:text-white font-normal'}`}
                >
                  <MessageSquare className="size-4 text-blue-400 animate-pulse" />
                  Extraer Comentarios (Sorteos)
                </button>
              </div>

              <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 print:hidden"
                >
                  <div className="relative">
                    <div className="size-16 rounded-full border-t-2 border-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="size-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium tracking-tight mt-4 text-white">{loaderMessage}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Procesando la información para tu diseñador. Estructurando copies de alto impacto.
                  </p>
                </motion.div>
              ) : activeTab === 'recommendations' ? (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[750px]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bot className="size-5 text-primary" />
                        Auditor Experto & Analizador de Rotación
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Auditoría inteligente sobre tus últimos {history.length} calendarios para garantizar un feed diverso y libre de fatiga de marca.
                      </p>
                    </div>
                    {history.length > 0 && (
                      <Button 
                        onClick={() => handleAnalyzeHistory()} 
                        disabled={isAnalyzing}
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:bg-primary/10 text-primary shrink-0 gap-1.5"
                      >
                        <RefreshCw className={`size-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        Volver a Auditar
                      </Button>
                    )}
                  </div>

                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-pulse">
                      <div className="relative">
                        <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        <Bot className="absolute inset-0 m-auto size-5 text-primary" />
                      </div>
                      <p className="text-sm text-white/70 font-medium">Buscando patrones en posts históricos...</p>
                      <p className="text-[11px] text-zinc-500">Evaluando slots recurrentes, vacíos creativos y ganchos de conversión en RD$...</p>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-zinc-950/20 max-w-lg mx-auto my-8">
                      <Layers className="size-10 text-white/20 mb-3 animate-bounce" />
                      <h4 className="text-white font-semibold mb-1 text-sm uppercase">Historial Vacío</h4>
                      <p className="text-xs max-w-xs mb-4">
                        Necesitamos que generes al menos un calendario de contenido para que nuestro Auditor de IA tenga datos históricos que extraer e interpretar.
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('calendar')}
                        className="bg-primary hover:bg-primary/95 text-black font-semibold h-9"
                      >
                        Generar tu Primer Calendario Now
                      </Button>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                      
                      {/* Summary Banner */}
                      <div className="relative bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start shadow-inner">
                        <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 self-start md:self-center">
                          <Bot className="size-6 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold tracking-wider text-primary uppercase block">Diagnóstico de Diversidad de Marca</span>
                          <p className="text-sm text-gray-200 leading-relaxed font-sans">{analysis.summary}</p>
                        </div>
                      </div>

                      {/* Diagnostic Grid containing Most Used vs Suggested Slots */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Most Used (Risk of exhaustion) */}
                        <div className="border border-red-500/10 bg-red-950/20 rounded-xl p-4 flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                            Alta Frecuencia (Evitar Saturación)
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Estos slots y temáticas ya se usaron recientemente. Te recomendamos descansar sus copies para asegurar que tu Instagram se sienta VIP y fresco.
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {analysis.mostUsedGames.map((game, idx) => (
                              <Badge key={idx} variant="outline" className="bg-red-500/5 text-red-300 border-red-500/15 text-[11px] font-mono">
                                {game}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Not Used (Fresh Opportunities) */}
                        <div className="border border-green-500/10 bg-green-950/20 rounded-xl p-4 flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-green-400" />
                            Oportunidades de Frescura Recurrentes
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Prestigiosos slots de Casino Club RV ignorados u olvidados. Haz clic para agregarlo y cargarlo automáticamente en tu próxima planificación.
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {analysis.suggestedGamesNotUsed.map((game, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="bg-green-500/5 text-green-300 border-green-500/30 text-[11px] font-mono cursor-pointer hover:bg-green-500/20 hover:border-green-400 transition-all"
                                onClick={() => {
                                  setInputText(prev => `${prev ? prev + ", " : ""}Promociona de forma innovadora el juego "${game}" enfocado en premios de RD$ dominicanos`);
                                  setActiveTab('calendar');
                                  toast.success(`⚠️ ¡Se programó de forma automática "${game}" al prompt principal!`);
                                }}
                              >
                                + {game}
                              </Badge>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Strategic Hacks & Tips of Casino Advertising */}
                      <div className="border border-white/5 bg-zinc-950/60 rounded-xl p-5 space-y-3.5">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="size-4" />
                          Hacks Estratégicos de Conversión para Instagram (RD$)
                        </h4>
                        <ul className="space-y-3">
                          {analysis.strategicTips.map((tip, idx) => (
                            <li key={idx} className="flex gap-2.5 text-xs text-gray-300 items-start leading-relaxed">
                              <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Creative Ready-to-go Post Proposals */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          <PenTool className="size-4 text-primary animate-pulse" />
                          Propuestas de Publicación Premium Adicionales
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {analysis.creativePostIdeas.slice(0, 3).map((idea, idx) => (
                            <div key={idx} className="border border-white/10 rounded-xl bg-zinc-950/80 p-4 space-y-4 flex flex-col justify-between hover:border-primary/40 transition-all group">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-[10px] font-bold text-primary uppercase font-mono tracking-wider">{idea.game}</span>
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1.5 py-0 h-4">Sugerencia VIP</Badge>
                                </div>
                                <h5 className="font-bold text-sm text-white">{idea.title}</h5>
                                <div className="text-[11px] text-zinc-400 bg-white/[0.02] p-2.5 rounded border border-white/5 font-sans leading-relaxed">
                                  <strong className="text-primary block text-[9.5px] uppercase tracking-wider mb-1">Diseño Visual (Para Diseñadores):</strong>
                                  {idea.visualConcept}
                                </div>
                              </div>
                              <div className="space-y-3 pt-3 border-t border-white/5">
                                <div className="text-[11.5px] text-zinc-300 font-sans italic leading-relaxed bg-zinc-950 p-2.5 rounded border border-white/5">
                                  "{idea.suggestedCopyText}"
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      navigator.clipboard.writeText(idea.suggestedCopyText);
                                      toast.success("¡Texto publicitario copiado con éxito!");
                                    }}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-[10.5px] h-8 w-full flex items-center justify-center"
                                  >
                                    Copia Rápida
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setInputText(prev => `${prev ? prev + "\n" : ""}Generar un post estructurado alrededor de la idea "${idea.title}", con el tema gráfico de "${idea.game}". Regla: ${idea.visualConcept}`);
                                      setActiveTab('calendar');
                                      toast.info(`¡Cargado en el prompt para tu próxima generación!`);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-black font-semibold text-[10.5px] h-8 px-2.5 shrink-0"
                                    title="Incluir este diseño en tu próximo calendario semanal"
                                  >
                                    Usar Idea
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                      <Bot className="size-10 text-white/20 mb-3" />
                      <p className="text-xs">No hay recomendaciones disponibles de momento.</p>
                      <Button 
                        size="sm" 
                        onClick={() => handleAnalyzeHistory()}
                        className="mt-3 bg-primary text-black font-semibold"
                      >
                        Generar Recomendaciones
                      </Button>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'instagram-audit' ? (
                <motion.div
                  key="instagram-audit"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[750px] print:hidden"
                >
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Instagram className="size-5 text-pink-500 animate-pulse" />
                      Optimizador de Posts de Instagram y Auditor de Enlaces
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      Analiza publicaciones pasadas de tu perfil e idea propuestas infinitamente mejores, de diseño básico e impactante sin saturar al usuario dominicano.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input card */}
                    <div className="bg-zinc-950/40 rounded-xl p-5 border border-white/5 space-y-4">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Link className="size-4" />
                        Configurar Auditoría de Instagram
                      </h4>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block font-sans">
                          Enlace de Perfil de Instagram (Instagram Link)
                        </label>
                        <input 
                          type="text" 
                          value={igProfileUrl}
                          onChange={(e) => setIgProfileUrl(e.target.value)}
                          placeholder="https://www.instagram.com/casinoclubrv_do"
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block font-sans">
                          Describe una publicación que quieras mejorar
                        </label>
                        <Textarea 
                          value={pastPostDescription}
                          onChange={(e) => setPastPostDescription(e.target.value)}
                          placeholder="Ejemplo: Un post de un auto deportivo azul con muchas monedas voladoras que regalaba 10 mil pesos y tenía mucho texto que aburría."
                          className="h-28 resize-none bg-black/50 border-white/10 text-white focus-visible:ring-primary text-sm leading-relaxed"
                        />
                        <p className="text-[10px] text-zinc-500 italic font-sans animate-pulse">
                          Especifica cómo era el diseño o el texto original de tu Instagram para que la IA proponga un concepto de diseño básico más efectivo y de alta calidad.
                        </p>
                      </div>

                      <Button 
                        onClick={handleImprovePost} 
                        disabled={isImproving || !igProfileUrl.trim() || !pastPostDescription.trim()}
                        className="w-full bg-gradient-to-r from-pink-600 via-red-500 to-yellow-500 hover:from-pink-500 hover:to-yellow-400 text-white font-bold h-11 shadow-[0_4px_15px_rgba(219,39,119,0.2)] cursor-pointer"
                      >
                        {isImproving ? (
                          <span className="flex items-center gap-2 font-sans">
                            <RefreshCw className="size-4 animate-spin" />
                            Auditando Feed e Iterando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 font-sans">
                            <Sparkles className="size-4 animate-pulse" />
                            Optimizar con IA de Rediseño Básico
                          </span>
                        )}
                      </Button>
                    </div>

                    {/* Guidelines to optimize card */}
                    <div className="bg-zinc-950/20 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <Bot className="size-4 text-pink-500" />
                          ¿Cómo funciona la Optimización de Contenidos?
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                          A diferencia de los formatos genéricos cargados e ignorados, esta herramienta realiza un análisis estratégico:
                        </p>
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2.5 items-start">
                            <span className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">1</span>
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-gray-200 block font-sans">Sustitución de Stock Genérico</span>
                              <span className="text-[11px] text-zinc-400 block leading-normal font-sans">Se descartan las fichas tridimensionales de siempre por los personajes emblemáticos oficiales de la web.</span>
                            </div>
                          </div>
                          <div className="flex gap-2.5 items-start">
                            <span className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">2</span>
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-gray-200 block font-sans">Estructura Visual de Alto Contraste</span>
                              <span className="text-[11px] text-zinc-400 block leading-normal font-sans">Se diseña un boceto básico unielemento para evitar la ceguera de Instagram, muy fácil de armar para tu diseñador.</span>
                            </div>
                          </div>
                          <div className="flex gap-2.5 items-start">
                            <span className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">3</span>
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold text-gray-200 block font-sans">Inmunidad de Emojis (SEO IG)</span>
                              <span className="text-[11px] text-zinc-400 block leading-normal font-sans">El copy se genera de manera formal y corporativa, garantizando un perfil VIP en pesos dominicanos (RD$).</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10.5px] bg-white/[0.02] border border-white/5 rounded-lg p-3 text-zinc-400 italic font-sans leading-relaxed mt-4">
                        "Un diseño básico enfocado en un personaje reconocible como Zeus o el Pescador aumenta la conversión de clicks hasta un 130% en comparación con imágenes promocionales abstractas."
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  {isImproving ? (
                    <div className="border border-white/5 bg-zinc-900/40 rounded-xl p-16 text-center space-y-4 animate-pulse">
                      <div className="relative inline-block">
                        <div className="size-12 rounded-full border border-pink-500 border-t-transparent animate-spin" />
                        <Instagram className="absolute inset-0 m-auto size-5 text-pink-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-white font-sans">Extrayendo información del feed de Instagram...</h4>
                        <p className="text-xs text-zinc-500 font-sans">Evaluando el enlace {igProfileUrl} y procesando la iteración creativa...</p>
                      </div>
                    </div>
                  ) : improvementResult ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Resultado del Auditor de Mejora Visual</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Original Post (Unimproved) */}
                        <div className="border border-red-500/20 bg-red-950/10 rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span className="size-2 rounded-full bg-red-400 animate-pulse" />
                              Idea Pasada / Analizada
                            </span>
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Poco Efectiva</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider font-sans">Concepto Original Detectado:</label>
                            <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 italic">
                              "{improvementResult.originalAnalyzedConcept}"
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider font-sans">¿Por qué fatiga y causa ceguera publicitaria?:</label>
                            <p className="text-xs text-red-300/90 leading-relaxed bg-red-950/50 p-3 rounded-lg border border-red-500/10 font-sans">
                              {improvementResult.originalFeedback}
                            </p>
                          </div>
                        </div>

                        {/* Improved Post (Premium and Basic) */}
                        <div className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <Sparkle className="size-3.5 text-primary animate-pulse" />
                              Propuesta Mejorada e Inteligente
                            </span>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold font-sans">VIP & Súper Básica</Badge>
                          </div>

                          <div className="space-y-3 font-sans">
                            <div className="flex justify-between items-center bg-black/30 p-2.5 rounded-lg border border-white/5">
                              <div>
                                <span className="text-[9px] text-primary font-mono uppercase tracking-widest block font-bold">Slot de Destino</span>
                                <span className="text-xs font-bold text-white uppercase">{improvementResult.improvedGameName}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-zinc-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                                {improvementResult.improvedTitle}
                              </span>
                            </div>

                            <div className="space-y-1.5 bg-black/20 p-3.5 rounded-lg border border-white/5">
                              <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">🛠 Diseño Visual (Para el Diseñador):</span>
                              <p className="text-xs text-gray-200 leading-relaxed font-sans font-medium">
                                {improvementResult.improvedVisualConcept}
                              </p>
                            </div>

                            <div className="space-y-1.5 bg-black/30 p-3.5 rounded-lg border border-white/5">
                              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">📝 Copy Redactado (Sin Emojis en RD$):</span>
                              <p className="text-xs text-zinc-300 leading-relaxed font-sans italic">
                                "{improvementResult.improvedCopyText}"
                              </p>
                            </div>

                            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-xs flex gap-2 items-start mt-2">
                              <Check className="size-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-[10.5px] text-white block uppercase tracking-wide">Hack de Conversión Dominicana (Instagram):</strong>
                                <span className="text-zinc-300 text-[11px] leading-normal block mt-0.5">{improvementResult.hygieneRecommendation}</span>
                              </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(improvementResult.improvedCopyText);
                                  toast.success("¡Texto publicitario mejorado copiado!");
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-9 border-white/10 cursor-pointer"
                              >
                                Copiar Copy
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setInputText(prev => `${prev ? prev + "\n" : ""}Estructurar una semana de posts incorporando la siguiente propuesta mejorada: "${improvementResult.improvedTitle}" para la slot "${improvementResult.improvedGameName}", aplicando la instrucción de diseño: ${improvementResult.improvedVisualConcept}`);
                                  setActiveTab('calendar');
                                  toast.info("¡Propuesta de diseño básico inyectada con éxito al generador semanal!");
                                }}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold text-xs h-9 cursor-pointer"
                              >
                                Usar para Calendario
                              </Button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-muted-foreground bg-zinc-950/20 max-w-md mx-auto mt-6 font-sans">
                      <Instagram className="size-8 mx-auto text-white/30 mb-2 font-sans" />
                      <p className="text-xs font-sans">
                        Ingresa el enlace de tu perfil de Instagram y describe qué diseño anterior deseas optimizar para ver y usar la propuesta mejorada de diseño básico de Zeus, Sweet Bonanza y otros slots reales.
                      </p>
                    </div>
                  )}

                </motion.div>
              ) : activeTab === 'instagram-comments' ? (
                <motion.div
                  key="instagram-comments"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[750px] print:hidden"
                >
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <MessageSquare className="size-5 text-blue-400 animate-pulse" />
                      Extractor de Comentarios e Instagram Giveaway Picker
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      Extrae, audita y valida los comentarios de cualquier publicación para premiar a tus jugadores con bonos en pesos dominicanos (RD$).
                    </p>
                  </div>

                  {/* Banner Explicativo - Muy llamativo y esclarecedor */}
                  <div className="bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-yellow-500/20 rounded-xl p-4.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4.5 text-yellow-400 animate-pulse" />
                      <h4 className="text-xs font-black text-yellow-300 uppercase tracking-widest font-sans">
                        ¡ATENCIÓN! CÓMO EXTRAER LOS COMENTARIOS 100% REALES
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans leading-normal font-sans">
                      Instagram tiene políticas estrictas antibots que impiden el raspado masivo de comentarios utilizando solo el enlace (Opción A). 
                      Para asegurar que obtienes <strong>los comentarios reales y 100% verdaderos</strong> de tu sorteo de Casino Club RV sin simulación:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5 text-zinc-300 font-sans">
                      <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1 font-sans">
                        <strong className="text-primary font-bold text-[11px] block uppercase tracking-wide">Opción Recomendada (Copiar y Pegar):</strong>
                        <span className="text-[11px] text-zinc-400 leading-relaxed block font-sans">
                          Abre la publicación en tu navegador (móvil o PC), selecciona con el mouse o dedo los comentarios reales, cópialos (<kbd className="bg-zinc-800 text-[9px] px-1 rounded">Cmd+C</kbd> / <kbd className="bg-zinc-800 text-[9px] px-1 rounded">Ctrl+C</kbd>) y pégalos en la <strong>Opción C</strong> abajo. Se cargará tu base de participantes reales al instante.
                        </span>
                      </div>
                      <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1 font-sans">
                        <strong className="text-primary font-bold text-[11px] block uppercase tracking-wide">Opción por Archivo (Excel o PDF):</strong>
                        <span className="text-[11px] text-zinc-400 leading-relaxed block font-sans">
                          Si exportaste tu sorteo en un archivo PDF, Excel (.xlsx, .xls), CSV o bloc de notas (.txt) de los comentarios, simplemente súbelo en la <strong>Opción B</strong> para que el extractor analice la lista exacta de usuarios.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Opción 1: Enlace de IG */}
                    <div className="bg-zinc-950/40 rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <Link className="size-4 text-primary" />
                          Opción A: Enlace de Publicación
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          Introduce el link de Instagram para intentar extraer comments públicos reales usando Google Grounding.
                        </p>
                        <input 
                          type="text" 
                          value={commentPostUrl}
                          onChange={(e) => setCommentPostUrl(e.target.value)}
                          placeholder="https://www.instagram.com/p/DY0a1djj3ZZ/"
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 italic font-sans mt-2">
                        Link activo: {commentPostUrl.length > 30 ? commentPostUrl.substring(0, 30) + "..." : commentPostUrl}
                      </p>
                    </div>

                    {/* Opción 2: Subir PDF o Excel */}
                    <div className="bg-zinc-950/40 rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <UploadCloud className="size-4 text-primary" />
                          Opción B: Archivo PDF / Excel / XLS
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          Sube un listado en PDF, Excel (.xlsx/.xls), CSV o de Texto (.txt). La IA extraerá los nombres y textos reales.
                        </p>
                        
                        <div 
                          className="border-2 border-dashed border-white/20 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors relative"
                          onClick={() => commentFileInputRef.current?.click()}
                        >
                          <input 
                            type="file" 
                            ref={commentFileInputRef} 
                            onChange={handleCommentFileChange} 
                            className="hidden" 
                            accept=".pdf,image/*,.txt,.csv,.xlsx,.xls" 
                          />
                          
                          {commentFile ? (
                            <div className="flex items-center flex-col gap-1 w-full">
                              <FileText className="size-7 text-primary" />
                              <span className="text-xs font-semibold text-white break-all max-w-[200px] line-clamp-1">{commentFile.name}</span>
                              <span className="text-[10px] text-zinc-400">{(commentFile.size / 1024).toFixed(1)} KB</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); clearCommentFile(); }}
                                className="absolute top-1 right-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0 rounded-full cursor-pointer"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="size-6 text-white/40 mb-1" />
                              <p className="text-xs font-bold text-white">Click para buscar archivo</p>
                              <p className="text-[10px] text-white/40">Excel, PDF, CSV, TXT e imágenes</p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {commentFile && (
                        <div className="flex items-center justify-between text-[10px] bg-primary/10 border border-primary/20 rounded-md p-2 font-mono mt-2">
                          <span className="text-primary font-bold uppercase tracking-wider">Planilla Lista ✅</span>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clearCommentFile(); }}
                            className="text-red-400 hover:text-red-300 font-sans underline cursor-pointer font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Opción 3: Pegar texto de comentarios */}
                    <div className="bg-zinc-950/40 rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <Sparkles className="size-4 text-primary" />
                          Opción C: Pegar Comentarios Reales
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                          ¡100% Real! Copia el texto directamente de los comentarios de Instagram y pégalo aquí. La IA estructurará todos los nombres y comentarios sin simulación.
                        </p>
                        
                        <textarea
                          placeholder="Pega aquí los comentarios copiados de Instagram... (ej. @g.betermi excelente, @manuel: participando)"
                          value={commentRawText}
                          onChange={(e) => setCommentRawText(e.target.value)}
                          className="w-full h-24 bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-mono resize-none"
                        />
                      </div>
                      
                      {commentRawText && (
                        <div className="flex items-center justify-between text-[10px] bg-primary/10 border border-primary/20 rounded-md p-2 font-mono mt-2">
                          <span className="text-primary font-bold uppercase tracking-wider">Texto Listo ✅ ({commentRawText.length} caracs)</span>
                          <button 
                            type="button"
                            onClick={() => setCommentRawText('')}
                            className="text-red-400 hover:text-red-300 font-sans underline cursor-pointer font-bold"
                          >
                            Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción unificado */}
                  <div className="flex justify-center pt-2">
                    <Button 
                      onClick={handleExtractComments}
                      disabled={isExtractingComments || (!commentPostUrl.trim() && !commentFile && !commentRawText.trim())}
                      className="bg-primary hover:bg-primary/95 text-black font-extrabold uppercase text-xs tracking-wider px-10 py-3 h-12 cursor-pointer shadow-[0_4px_15px_rgba(212,175,55,0.2)] font-sans"
                    >
                      {isExtractingComments ? (
                        <span className="flex items-center gap-2 font-sans">
                          <RefreshCw className="size-4 animate-spin" />
                          Procesando Extracción Inteligente con la IA...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-sans">
                          {commentRawText.trim() ? (
                            <>
                              <Sparkles className="size-4 text-black animate-pulse" />
                              Extraer Comentarios Reales Pegados
                            </>
                          ) : commentFile ? (
                            <>
                              <Sparkles className="size-4 text-black animate-pulse" />
                              Extraer Comentarios desde Documento
                            </>
                          ) : (
                            <>
                              <Download className="size-4 text-black" />
                              Extraer Comentarios de Enlace
                            </>
                          )}
                        </span>
                      )}
                    </Button>
                  </div>

                  {extractedComments ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Stats Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div className="bg-zinc-950/20 border border-white/5 rounded-xl p-4 space-y-1 font-sans">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Publicación de Destino</span>
                          <span className="text-xs text-zinc-300 font-medium line-clamp-2 block leading-relaxed italic" title={extractedComments.postCaption}>
                            "{extractedComments.postCaption}"
                          </span>
                        </div>
                        <div className="bg-zinc-950/20 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Likes Recopilados</span>
                          <span className="text-2xl font-black text-white font-mono mt-1">
                            {extractedComments.likesCount} <span className="text-xs text-zinc-500">Likes</span>
                          </span>
                        </div>
                        <div className="bg-zinc-950/20 border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Comentarios Extraídos</span>
                          <span className="text-2xl font-black text-blue-400 font-mono mt-1">
                            {extractedComments.commentsCount} <span className="text-xs text-zinc-500 font-sans">Respuestas</span>
                          </span>
                        </div>
                      </div>

                      {/* Giveaway Control Panel */}
                      <div className="border border-yellow-500/20 bg-yellow-500/[0.02] rounded-xl p-5 space-y-5">
                        <div className="flex items-center gap-2">
                          <Trophy className="size-5 text-primary animate-bounce" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Tómbola del Sorteo VIP de Casino Club RV</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block font-sans">Buscar por Nombre/Comentario</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={commentSearch}
                                onChange={(e) => setCommentSearch(e.target.value)}
                                placeholder="Ej: @manuel o Sweet..."
                                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-sans"
                              />
                              <Search className="size-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block font-sans">Filtrar por Palabra Clave</label>
                            <div className="relative">
                              <input 
                                type="text"
                                value={commentFilterKeyword}
                                onChange={(e) => setCommentFilterKeyword(e.target.value)}
                                placeholder="Ej: Bonanza o Zeus"
                                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors font-sans"
                              />
                              <Filter className="size-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block font-sans font-sans">Cantidad de Ganadores</label>
                            <select
                              value={numberOfWinnersToPick}
                              onChange={(e) => setNumberOfWinnersToPick(Number(e.target.value))}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary cursor-pointer font-sans"
                            >
                              <option value={1}>1 Ganador Único</option>
                              <option value={2}>2 Ganadores</option>
                              <option value={3}>3 Ganadores</option>
                              <option value={5}>5 Ganadores (Historias)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-center pt-2">
                          <Button 
                            onClick={handlePickRandomWinner}
                            disabled={isPickingWinner || extractedComments.comments.length === 0}
                            className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:to-amber-400 text-black font-black uppercase text-xs tracking-widest h-11 px-8 cursor-pointer shadow-[0_4px_20px_rgba(217,119,6,0.3)] font-sans"
                          >
                            {isPickingWinner ? (
                              <span className="flex items-center gap-2 font-sans">
                                <RefreshCw className="size-4 animate-spin" />
                                Mezclando cupones de Instagram...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 font-sans">
                                <Trophy className="size-4" />
                                Girar Tómbola de Comentarios
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Picked Winners Board */}
                      {selectedWinners.length > 0 && (
                        <div className="border-2 border-primary bg-primary/[0.04] rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-[0_10px_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
                          <div className="inline-flex size-14 rounded-full bg-primary/20 border border-primary/30 items-center justify-center text-primary mb-2">
                            <Trophy className="size-7" />
                          </div>
                          
                          <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-wider font-sans">🏆 ¡GANADORES DEL SORTEO DE COMENTARIOS! 🏆</h4>
                            <p className="text-xs text-zinc-400 mt-1 font-sans">Seleccionados al azar bajo auditoría de Instagram para Casino Club RV</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 justify-center max-w-4xl mx-auto">
                            {selectedWinners.map((winner, index) => (
                              <div key={winner.id} className="bg-zinc-950/80 border border-primary/30 rounded-xl p-4 text-left relative hover:border-primary transition-all shadow-md">
                                <span className="absolute top-2 right-2 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono">
                                  #{index + 1}
                                </span>
                                <div className="space-y-1.5">
                                  <span className="text-sm font-bold text-primary block font-mono">
                                    {winner.username}
                                  </span>
                                  <p className="text-xs text-gray-200 italic leading-relaxed line-clamp-3">
                                    "{winner.text}"
                                  </p>
                                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-500 font-mono">
                                    <span>{winner.timestamp}</span>
                                    <span>❤️ {winner.likesCount} likes</span>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-1.5">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`¡Felicidades a nuestro ganador ${winner.username} por participar en el Sorteo de Instagram comentando "${winner.text}"! Te has llevado un bono exclusivo de Casino Club RV.`);
                                      toast.success(`Mensaje de felicitación para ${winner.username} copiado.`);
                                    }}
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold h-7 cursor-pointer border border-primary/20 font-sans"
                                  >
                                    Copia Felicitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Comments List Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider font-sans flex items-center gap-1.5 font-sans">
                            <MessageSquare className="size-4 text-zinc-500" />
                            Listado Completo de Comentarios Extraídos ({extractedComments.comments.length})
                          </h4>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Auditados en RD$</span>
                        </div>

                        <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950/40 font-sans">
                          <div className="max-h-[350px] overflow-y-auto">
                            <div className="divide-y divide-white/5">
                              {extractedComments.comments
                                .filter(c => {
                                  const matchesSearch = c.username.toLowerCase().includes(commentSearch.toLowerCase()) || 
                                                        c.text.toLowerCase().includes(commentSearch.toLowerCase());
                                  const matchesKeyword = commentFilterKeyword ? c.text.toLowerCase().includes(commentFilterKeyword.toLowerCase()) : true;
                                  return matchesSearch && matchesKeyword;
                                })
                                .map((comment) => (
                                  <div key={comment.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-bold text-zinc-400 font-mono">
                                        {comment.username.substring(1, 4).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-blue-400 font-mono flex items-center gap-1">
                                          {comment.username}
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              navigator.clipboard.writeText(comment.username);
                                              toast.success(`Usuario ${comment.username} copiado`);
                                            }}
                                            className="size-4 p-0 text-zinc-500 hover:text-white cursor-pointer"
                                            title="Copiar nombre de usuario"
                                          >
                                            <Copy className="size-2.5" />
                                          </Button>
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{comment.timestamp}</span>
                                      </div>
                                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                                        {comment.text}
                                      </p>
                                    </div>
                                    <div className="shrink-0 flex items-center text-[10px] text-zinc-500 font-mono self-center gap-1">
                                      <span>❤️</span>
                                      <span>{comment.likesCount}</span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="border border-dashed border-white/10 rounded-xl p-16 text-center text-muted-foreground bg-zinc-950/20 max-w-lg mx-auto mt-6 space-y-4 font-sans">
                      <Instagram className="size-10 mx-auto text-pink-500/40 animate-pulse" />
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <p className="text-sm font-bold text-white font-sans">
                          Aún no has extraído comentarios
                        </p>
                        <p className="text-xs font-sans text-zinc-400 leading-relaxed font-sans">
                          Ingresa el enlace de Instagram arriba y haz click en "Extraer Comentarios" para cargar los nombres de usuario y comentarios para auditar.
                        </p>
                      </div>
                      <div className="text-[11px] bg-white/[0.02] border border-white/5 rounded-lg p-3 text-zinc-400 italic font-mono flex justify-center items-center gap-2 text-left">
                        <CheckSquare className="size-3.5 text-primary shrink-0" />
                        <span>Enlace de prueba listo por defecto para auditar: <br/><strong className="text-zinc-300 font-mono block mt-0.5">https://www.instagram.com/p/DY0a1djj3ZZ/</strong></span>
                      </div>
                    </div>
                  )}

                </motion.div>
              ) : calendar ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full print:overflow-visible"
                >
                  <div className="p-6 print:p-0">
                    <div className="flex items-center justify-between mb-6 print:hidden">
                       <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                         <LayoutGrid className="text-primary size-5" /> 
                         Dossier de Contenido Semanal
                       </h2>
                    </div>

                    {inputText && (
                      <div className="mb-6 bg-yellow-500/5 border border-[rgba(212,175,55,0.2)] rounded-xl p-4 animate-in fade-in duration-300">
                        <span className="text-[10px] uppercase font-bold text-primary block tracking-wider mb-1">✍️ Ideas escritas a mano como referencia:</span>
                        <p className="text-xs text-zinc-300 leading-normal font-sans italic">{inputText}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-6 lg:flex-row lg:gap-4 overflow-x-auto pb-4 print:flex-col print:overflow-visible print:gap-8">
                      {calendar.days.map((day, i) => (
                        <div 
                          key={i} 
                          className="flex-1 min-w-[320px] flex flex-col gap-3 min-h-[300px] p-2 bg-black/20 rounded-xl border border-white/5 print:bg-transparent print:border-none print:p-0 print:min-w-full"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, i)}
                        >
                          <div className="border-b border-white/10 pb-2 mb-2 px-1 flex items-center justify-between print:border-gray-300">
                            <h3 className="font-semibold text-lg text-white capitalize print:text-black print:text-xl">{day.dayName}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-white/40 hover:text-primary hover:bg-primary/10 print:hidden"
                              onClick={() => handleRegenerateDay(i)}
                              title="Regenerar este día"
                            >
                              <Sparkles className="size-3.5" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-col gap-4 print:gap-6">
                            {day.posts.map((post) => (
                              <Card 
                                key={post.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, i, post.id)}
                                className="bg-white/5 border-white/10 hover:border-primary/50 transition-colors group cursor-grab active:cursor-grabbing print:bg-gray-50 print:border-gray-200 print:shadow-sm print:break-inside-avoid"
                              >
                                <CardContent className="p-4 relative">
                                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 print:border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs bg-black/50 border-white/10 print:bg-gray-100 print:border-gray-300 print:text-black">
                                        {post.time}
                                      </Badge>
                                      <Badge className={`${getTypeColor(post.type)} print:bg-transparent print:border-gray-300 print:text-gray-700`} variant="outline">
                                        {post.type}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="bg-primary/5 rounded-md p-3 border border-primary/10 group/item print:bg-gray-100 print:border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] uppercase font-bold text-primary block tracking-wider">🛠 Idea Visual (Click para editar)</span>
                                      </div>
                                      <div 
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="text-sm text-gray-200 font-medium leading-relaxed font-sans whitespace-pre-wrap outline-none focus:bg-white/5 p-1 rounded transition-colors print:text-gray-800"
                                        onBlur={(e) => handleUpdatePost(i, post.id, 'visualConcept', e.currentTarget.innerText)}
                                      >
                                        {post.visualConcept}
                                      </div>
                                    </div>
                                    
                                    <div className="px-1 group/item">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block tracking-wider print:text-gray-500">📝 Caption (Click para editar)</span>
                                      <div 
                                        contentEditable
                                        suppressContentEditableWarning
                                        className="text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap outline-none focus:bg-white/5 p-1 rounded transition-colors print:text-gray-700"
                                        onBlur={(e) => handleUpdatePost(i, post.id, 'copyText', e.currentTarget.innerText)}
                                      >
                                        {post.copyText}
                                      </div>
                                    </div>
                                  </div>
                                  
                                </CardContent>
                              </Card>
                            ))}
                            {day.posts.length === 0 && (
                                <div className="text-center p-4 border border-dashed border-white/10 rounded-lg text-white/30 text-sm print:hidden">
                                  Arrastra posts aquí
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
                >
                  <div className="border-dashed border border-white/10 m-6 rounded-lg bg-white/5 p-8 print:hidden">
                    <Rocket className="size-12 mb-4 text-white/20 mx-auto" />
                    <h3 className="text-xl font-medium text-white mb-2">Dossier en Blanco</h3>
                    <p className="max-w-md text-sm mx-auto">
                      Sube un documento con tus ideas y nosotros lo convertiremos en un reporte listo para mandar a tus diseñadores.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
         </div>
        </div>
      </main>

      {/* Settings / Local PC Setup Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <Card className="w-full max-w-lg border-white/10 bg-zinc-950 text-white shadow-2xl relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Settings className="size-5 text-primary animate-spin" />
                  Configurar API Key y Uso Local
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowConfig(false)}
                  className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <CardDescription className="text-white/60">
                Pega tu clave personal para usar el calendario de forma ilimitada localmente o en la web.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              {/* API Key box */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider block">
                  Gemini API Key (Google AI Studio)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Pega aquí tu clave AIzaSy..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button 
                    onClick={() => {
                      localStorage.setItem('custom_gemini_api_key', customKey.trim());
                      toast.success('¡API Key guardada localmente!');
                      setShowConfig(false);
                    }}
                    className="bg-primary hover:bg-primary/95 text-black font-semibold px-4"
                  >
                    Guardar
                  </Button>
                </div>
                <p className="text-[11px] text-white/50">
                  La API Key se almacena de forma 100% segura en el almacenamiento local de tu propio navegador (<span className="text-primary font-mono">localStorage</span>). No se envía a ningún servidor intermediario. Obtén una gratis en{" "}
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary hover:underline font-semibold text-primary/90"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>

              {/* Local Guide Info Box */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket className="size-3.5 text-primary animate-pulse" />
                  ¿Cómo ejecutar en tu PC local paso a paso?
                </h4>
                <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs space-y-2 text-white/80">
                  <p>
                    <span className="text-primary font-bold">1. Descarga el proyecto:</span> Abre el menú de exportación en AI Studio (Export to ZIP) y guárdalo en tu PC.
                  </p>
                  <p>
                    <span className="text-primary font-bold">2. Descomprime:</span> Extrae todo el contenido del archivo ZIP en una carpeta de tu computadora.
                  </p>
                  <p>
                    <span className="text-primary font-bold">3. Ejecuta los comandos:</span> Abre una terminal de comandos en esa carpeta y ejecuta los siguientes comandos:
                  </p>
                  <div className="bg-black border border-white/10 rounded p-2 text-primary font-mono select-all flex items-center justify-between">
                    <span>npm install && npm run dev</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 text-white"
                      onClick={() => {
                        navigator.clipboard.writeText("npm install && npm run dev");
                        toast.success("¡Comandos copiados al portapapeles!");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p>
                    <span className="text-primary font-bold">4. Listo:</span> Abre <span className="text-primary hover:underline underline-offset-2">http://localhost:3000</span> en tu navegador, haz clic en este botón de "Configurar" y pega tu API Key.
                  </p>
                </div>
              </div>

              {/* Delete local key option */}
              {customKey && (
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <Button 
                    variant="link" 
                    size="sm"
                    className="text-red-400 hover:text-red-300 p-0 text-xs h-auto"
                    onClick={() => {
                      localStorage.removeItem('custom_gemini_api_key');
                      setCustomKey('');
                      toast.success('Clave eliminada localmente.');
                      setShowConfig(false);
                    }}
                  >
                    Eliminar API Key guardada
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


