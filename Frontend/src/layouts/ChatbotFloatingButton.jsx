import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  History, 
  MessageSquare, 
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  createConversation,
  getConversations,
  sendMessage,
  deleteConversation,
} from "../services/chatbot.service.js";

const LOGO_URL = "/Sskoupio.png";

// Composant pour afficher les messages (texte ou tableau)
const MessageContent = ({ text }) => {
  // ... (garder le même code que dans l'original)
  // (je garde la même implémentation pour ne pas répéter, mais elle reste inchangée)
  const parseTableData = (content) => {
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        if (Array.isArray(data) && data.length > 0) {
          return { type: 'table', data };
        }
      }
      
      const tableMatch = content.match(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/);
      if (tableMatch) {
        const rows = tableMatch[1].trim().split('\n').map(row => row.split('|'));
        if (rows.length > 1) {
          return { type: 'table', data: rows };
        }
      }
      
      return { type: 'text', data: content };
    } catch (e) {
      return { type: 'text', data: content };
    }
  };

  const parseMarkdownTable = (content) => {
    const lines = content.split('\n');
    let tableLines = [];
    let inTable = false;
    let tableStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|') && (line.match(/\|/g) || []).length >= 2) {
        if (!inTable) {
          inTable = true;
          tableStart = i;
        }
        tableLines.push(line);
      } else if (inTable && line === '') {
        break;
      } else if (inTable) {
        break;
      }
    }
    
    if (tableLines.length > 1) {
      const headers = tableLines[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
      const data = [];
      
      for (let i = 2; i < tableLines.length; i++) {
        const cells = tableLines[i].split('|').filter(cell => cell.trim());
        if (cells.length === headers.length) {
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = cells[idx]?.trim() || '';
          });
          data.push(row);
        }
      }
      
      if (data.length > 0) {
        return {
          type: 'table',
          data: { headers, rows: data }
        };
      }
    }
    
    return null;
  };

  const renderTable = (data) => {
    if (data.headers && data.rows) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#f4f9ef] border-b border-[#d4e6b0]">
                {data.headers.map((header, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-semibold text-[#4d6936]">
                    {header}
                  </th>
                ))}
               </tr>
            </thead>
            <tbody>
              {data.rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  {data.headers.map((header, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 text-slate-600">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (Array.isArray(data) && data.length > 0) {
      if (data[0] && Array.isArray(data[0])) {
        return (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border-collapse">
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className={idx === 0 ? "bg-[#f4f9ef] border-b border-[#d4e6b0]" : "border-b border-slate-100"}>
                    {row.map((cell, cellIdx) => (
                      idx === 0 ? (
                        <th key={cellIdx} className="px-3 py-2 text-left font-semibold text-[#4d6936]">
                          {cell}
                        </th>
                      ) : (
                        <td key={cellIdx} className="px-3 py-2 text-slate-600">
                          {cell}
                        </td>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        return (
          <div className="my-2 space-y-1">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8C686]"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    
    return <div className="whitespace-pre-wrap">{data}</div>;
  };

  const tableData = parseMarkdownTable(text);
  if (tableData) {
    return renderTable(tableData.data);
  }

  const parsed = parseTableData(text);
  
  if (parsed.type === 'table') {
    return renderTable(parsed.data);
  }
  
  const formatText = (content) => {
    content = content.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="font-semibold text-[#5a7c3c]">$1</span>');
    content = content.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, 
      '<span class="text-blue-600 underline">$1</span>');
    content = content.replace(/(\d+(?:\.\d+)?\s*(?:€|EUR|USD|CFA))/g, 
      '<span class="font-bold text-[#5a7c3c]">$1</span>');
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return <div className="whitespace-pre-wrap leading-relaxed">{formatText(text)}</div>;
};

const ChatbotElegant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Nouvel état pour la largeur
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Charger les conversations initiales
  useEffect(() => {
    const loadConversations = async () => {
      try {
        let convs = await getConversations();
        if (!convs || convs.length === 0) {
          const newConv = await createConversation();
          convs = [newConv];
        }
        setConversations(convs);
        setActiveId(convs[0]?.id || null);
      } catch (error) {
        console.error("Erreur chargement conversations:", error);
        const fallbackConv = {
          id: Date.now().toString(),
          messages: [
            {
              id: `bot-${Date.now()}`,
              text: "Bonjour ! Je suis Sskoupio, votre assistant ERP. Je peux vous renseigner sur vos produits, clients, factures et statistiques. Comment puis-je vous aider aujourd'hui ? 😊",
              sender: "bot",
            },
          ],
          createdAt: Date.now(),
        };
        setConversations([fallbackConv]);
        setActiveId(fallbackConv.id);
      } finally {
        setIsLoading(false);
      }
    };
    loadConversations();
  }, []);

  // Gérer l'adaptation de l'historique sur desktop au démarrage
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setShowHistory(true);
    }
  }, [isOpen]);

  // Auto-scroll en bas de la discussion active
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId, isTyping]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // Ajouter un message à la discussion active localement
  const addMessage = (newMsg) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, newMsg], updatedAt: Date.now() } : c
      )
    );
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeId || isLoading) return;
    const userText = inputValue.trim();

    const userMsg = {
      id: `user-${Date.now()}`,
      text: userText,
      sender: "user",
    };
    addMessage(userMsg);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await sendMessage(activeId, userText);
      let botReply = response.reply || response.message || "Merci pour votre message.";
      
      if (response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          botReply = formatStructuredData(response.data, response.type);
        } else if (typeof response.data === 'object') {
          botReply = formatStructuredData([response.data], response.type);
        }
      }
      
      const botMsg = {
        id: `bot-${Date.now()}`,
        text: botReply,
        sender: "bot",
      };
      addMessage(botMsg);
    } catch (error) {
      console.error("Erreur envoi message:", error);
      const errorMsg = {
        id: `error-${Date.now()}`,
        text: "Désolé, une erreur est survenue lors de la communication avec le serveur. Veuillez réessayer.",
        sender: "bot",
      };
      addMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const formatStructuredData = (data, type) => {
    if (!data || data.length === 0) return "Aucune donnée trouvée.";
    
    let markdown = `📊 **${getDataTypeLabel(type)}** (${data.length} résultat${data.length > 1 ? 's' : ''})\n\n`;
    
    const headers = Object.keys(data[0]);
    markdown += "| " + headers.join(" | ") + " |\n";
    markdown += "|" + headers.map(() => "---").join("|") + "|\n";
    
    data.forEach(item => {
      markdown += "| " + headers.map(header => item[header] || "-").join(" | ") + " |\n";
    });
    
    return markdown;
  };
  
  const getDataTypeLabel = (type) => {
    const labels = {
      'orders': 'Commandes',
      'products': 'Produits',
      'customers': 'Clients',
      'invoices': 'Factures',
      'stats': 'Statistiques'
    };
    return labels[type] || 'Résultats';
  };

  const handleNewConversation = async () => {
    try {
      setIsTyping(true);
      const newConv = await createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      if (window.innerWidth < 640) {
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Erreur création discussion:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteConversation = async (e, idToDelete) => {
    e.stopPropagation();
    if (!window.confirm("Voulez-vous supprimer définitivement cette discussion ?")) return;

    try {
      await deleteConversation(idToDelete);
      const updatedConvs = conversations.filter((c) => c.id !== idToDelete);
      setConversations(updatedConvs);

      if (activeId === idToDelete) {
        if (updatedConvs.length > 0) {
          setActiveId(updatedConvs[0].id);
        } else {
          const newConv = await createConversation();
          setConversations([newConv]);
          setActiveId(newConv.id);
        }
      }
    } catch (error) {
      console.error("Erreur suppression discussion:", error);
    }
  };

  const toggleDrawer = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Extraire un titre pour l'historique
  const getConvTitle = (conv) => {
    if (conv.title && conv.title !== "Nouvelle conversation") return conv.title;
    const userMsgs = conv.messages?.filter((m) => m.sender === "user") || [];
    if (userMsgs.length > 0) {
      const firstText = userMsgs[0].text;
      return firstText.length > 18 ? firstText.substring(0, 16) + "..." : firstText;
    }
    return "Nouvelle discussion";
  };

  const formatConvDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Largeurs dynamiques selon l'état expanded
  const getDrawerWidth = () => {
    if (isExpanded) {
      return showHistory ? "w-full max-w-[1400px]" : "w-full max-w-[1200px]";
    }
    return showHistory ? "sm:w-[680px]" : "sm:w-[450px]";
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-450 shadow-sm select-none cursor-not-allowed"
      >
        <Loader2 size={13} className="animate-spin text-[#597442]" />
        <span className="hidden sm:inline">SskoupIA</span>
      </button>
    );
  }

  return (
    <>
      {/* Bouton dans le Header */}
      <button
        onClick={toggleDrawer}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#d4e6b0] bg-white text-xs font-bold text-[#5a7c3c] hover:bg-[#A8C686]/10 hover:border-[#8bb56a] hover:text-[#3a5a1e] transition-all active:scale-95 shadow-sm select-none"
      >
        <div className="relative flex h-5 w-5 items-center justify-center">
          <img
            src={LOGO_URL}
            alt="Sskoupio"
            className="h-5 w-5 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
        </div>
        <span className="hidden sm:inline">SskoupIA</span>
      </button>

      {/* Rendu du Tiroir de discussion */}
      {isOpen && (
        <>
          {/* Overlay d'arrière-plan avec flou */}
          <div
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleDrawer}
          />

          {/* Conteneur principal (Drawer) avec largeur dynamique */}
          <div 
            className={`fixed top-0 right-0 z-50 flex h-full ${getDrawerWidth()} bg-white shadow-2xl transition-all duration-300 ease-out overflow-hidden ${
              isExpanded ? 'rounded-none' : ''
            }`}
            style={{ right: 0 }}
          >
            {/* 1. Sidebar d'Historique (Rétractable) */}
            <div 
              className={`h-full w-[230px] border-r border-[#d4e6b0] bg-[#f4f9ef] flex flex-col transition-all duration-300 ${
                showHistory ? "translate-x-0 opacity-100" : "-translate-x-full w-0 opacity-0 hidden"
              }`}
            >
              {/* Entête Sidebar */}
              <div className="p-4 border-b border-[#d4e6b0] bg-[#eef6e8] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a7c3c] flex items-center gap-1.5">
                  <History size={13} /> Discussions
                </span>
                <button
                  onClick={handleNewConversation}
                  title="Nouvelle discussion"
                  className="p-1.5 rounded-lg bg-white border border-[#d4e6b0] text-[#5a7c3c] hover:bg-[#f4f9ef] hover:border-[#A8C686] hover:text-[#4d6936] transition-all hover:scale-105 active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Liste de l'historique */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveId(conv.id);
                        if (window.innerWidth < 640) {
                          setShowHistory(false);
                        }
                      }}
                      className={`group relative flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? "bg-white text-[#4d6936] border-l-4 border-[#5a7c3c] font-semibold shadow-sm" 
                          : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                      }`}
                    >
                      <MessageSquare size={16} className={`flex-shrink-0 ${isActive ? "text-[#5a7c3c]" : "text-[#8bb56a]"}`} />
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm truncate leading-snug">{getConvTitle(conv)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatConvDate(conv.updatedAt || conv.createdAt)}</p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        title="Supprimer cette discussion"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Zone principale de Discussion */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              {/* En-tête Principal avec bouton d'expansion */}
              <div className="bg-gradient-to-r from-[#5a7c3c] to-[#4d6936] px-5 py-4 flex items-center justify-between shadow-md relative z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    title={showHistory ? "Masquer l'historique" : "Afficher l'historique"}
                    className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors mr-1"
                  >
                    <History size={20} />
                  </button>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-0.5 shadow-md">
                    <img src={LOGO_URL} alt="Sskoupi" className="h-9 w-9 rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">Assistant Sskoupi</h3>
                    <p className="text-[11px] text-green-200/90 flex items-center gap-1 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                      </span>
                      En ligne • Qwen 2.5
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Bouton pour agrandir/réduire */}
                  <button 
                    onClick={toggleExpand}
                    title={isExpanded ? "Réduire" : "Agrandir"}
                    className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  <button 
                    onClick={toggleDrawer} 
                    className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Zone d'Affichage des Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 space-y-4 scrollbar-thin">
                {activeConversation?.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex animate-slideIn ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="mr-2.5 flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm border border-slate-100">
                            <img src={LOGO_URL} alt="S" className="h-6 w-6 rounded-full object-cover" />
                          </div>
                        )}
                        <div 
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm whitespace-pre-wrap ${
                            isUser 
                              ? "bg-[#A8C686] text-white rounded-tr-none font-medium shadow-[#A8C686]/10" 
                              : "bg-white text-slate-700 border border-slate-200/70 rounded-tl-none"
                          }`}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                          ) : (
                            <MessageContent text={msg.text} />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="h-16 w-16 bg-[#f4f9ef] text-[#5a7c3c] rounded-full flex items-center justify-center shadow-inner">
                      <Sparkles size={30} className="animate-pulse" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm">Nouvelle discussion avec Sskoupio</h4>
                    <p className="text-xs text-slate-400 max-w-[280px]">
                      Posez une question sur vos produits, vos clients, vos factures ou demandez des statistiques globales !
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      <button 
                        onClick={() => {
                          setInputValue("Liste des commandes");
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        📋 Voir les commandes
                      </button>
                      <button 
                        onClick={() => {
                          setInputValue("Produits disponibles");
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        🛍️ Liste des produits
                      </button>
                      <button 
                        onClick={() => {
                          setInputValue("Statistiques des ventes");
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        📊 Statistiques
                      </button>
                    </div>
                  </div>
                )}

                {isTyping && (
                  <div className="flex animate-slideIn items-center gap-2 justify-start">
                    <div className="mr-2.5 flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm border border-slate-100">
                      <img src={LOGO_URL} alt="S" className="h-6 w-6 rounded-full object-cover" />
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3 text-sm text-slate-400 shadow-sm rounded-tl-none">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de Saisie et Envoi */}
              <div className="border-t border-slate-150 bg-white p-4">
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 relative rounded-xl bg-slate-50 border border-slate-200/80 p-1 transition-all focus-within:bg-white focus-within:border-[#A8C686] focus-within:ring-2 focus-within:ring-[#f4f9ef] focus-within:shadow-md">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Écrivez votre message..."
                      className="w-full resize-none rounded-lg bg-transparent p-2.5 text-sm outline-none placeholder-slate-400"
                      rows={1}
                      style={{ maxHeight: "100px" }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#A8C686] to-[#7a9e5a] text-white transition-all hover:brightness-105 active:scale-95 shadow-md shadow-[#7a9e5a]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-slate-400">
                    Sskoupio IA • Base de données synchronisée
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Styles d'animation et de personnalisation */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn { animation: slideIn 0.25s ease-out forwards; }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default ChatbotElegant;