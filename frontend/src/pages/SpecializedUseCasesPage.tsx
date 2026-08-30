import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Calendar,
  Mic,
  MessageSquare,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Building2,
  Flame,
  ShieldCheck,
  Zap,
  Volume2,
  PhoneCall,
  Smartphone,
  Layers,
  Sparkles,
  RefreshCw,
  Receipt,
  FileCheck2,
  CreditCard,
  QrCode,
  Check,
  ExternalLink,
  Lock,
  Headphones,
} from 'lucide-react';
import {
  getB2BReceivablesSummary,
  recordPromiseToPay,
  fulfillPromiseToPay,
  getMandateSequencerSummary,
  executeMandateSequence,
  generateConversationalFlow,
} from '../api/usecases';
import {
  B2BReceivablesSummary,
  B2BReceivableInvoice,
  PromiseToPayRecord,
  MandateSequencerSummary,
  MandateSequenceItem,
  MandateExecuteResponse,
  ConversationalStudioResponse,
} from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const SpecializedUseCasesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'B2B' | 'MANDATES' | 'HINGLISH_VOICE' | 'CHECKOUT'>('HINGLISH_VOICE');

  // 1. B2B & PTP State
  const [b2bData, setB2bData] = useState<B2BReceivablesSummary | null>(null);
  const [loadingB2B, setLoadingB2B] = useState(true);
  const [selectedInvoiceForPtp, setSelectedInvoiceForPtp] = useState<B2BReceivableInvoice | null>(null);
  const [ptpDate, setPtpDate] = useState<string>('2026-09-05');
  const [ptpAmount, setPtpAmount] = useState<number>(12500);
  const [ptpNotes, setPtpNotes] = useState<string>('Customer confirmed payment on 5th September via NEFT');
  const [isSubmittingPtp, setIsSubmittingPtp] = useState(false);

  // 2. Mandate Sequencer State
  const [mandateData, setMandateData] = useState<MandateSequencerSummary | null>(null);
  const [loadingMandates, setLoadingMandates] = useState(true);
  const [executingMandateId, setExecutingMandateId] = useState<string | null>(null);
  const [mandateActionSuccess, setMandateActionSuccess] = useState<string | null>(null);
  const [executionReceiptModal, setExecutionReceiptModal] = useState<MandateExecuteResponse | null>(null);

  // 3. Conversational Studio State
  const [languageMode, setLanguageMode] = useState<'HINGLISH' | 'HINDI' | 'ENGLISH'>('HINGLISH');
  const [channelMode, setChannelMode] = useState<'VOICE_CALL' | 'WHATSAPP' | 'ALL'>('ALL');
  const [failureType, setFailureType] = useState<string>('insufficient_funds');
  const [conversationalAmount, setConversationalAmount] = useState<number>(4500);
  const [conversationalResponse, setConversationalResponse] = useState<ConversationalStudioResponse | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpokenTurn, setCurrentSpokenTurn] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Interactive WhatsApp Checkout Modals State
  const [checkoutModalType, setCheckoutModalType] = useState<'UPI' | 'CARD' | 'SUPPORT' | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'>('GPAY');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    method: string;
    amount: number;
    reference: string;
  } | null>(null);

  const isPlayingRef = useRef(false);

  const loadAllData = async () => {
    try {
      setLoadingB2B(true);
      setLoadingMandates(true);
      const [b2b, mnd] = await Promise.all([
        getB2BReceivablesSummary(),
        getMandateSequencerSummary(),
      ]);
      setB2bData(b2b);
      setMandateData(mnd);
    } catch (err) {
      console.error('Failed to load specialized use-case data', err);
    } finally {
      setLoadingB2B(false);
      setLoadingMandates(false);
    }
  };

  useEffect(() => {
    loadAllData();
    handleGenerateConversationalFlow('HINGLISH', 'ALL', 4500, 'insufficient_funds');

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleGenerateConversationalFlow = async (
    lang: 'HINGLISH' | 'HINDI' | 'ENGLISH',
    chan: 'VOICE_CALL' | 'WHATSAPP' | 'ALL',
    amt: number,
    ftype: string = failureType
  ) => {
    try {
      stopAudio();
      setGeneratingScript(true);
      const res = await generateConversationalFlow({
        customer_id: 'cust_001',
        amount: amt,
        preferred_language: lang,
        channel: chan,
        failure_type: ftype,
      });
      setConversationalResponse(res);
      setToastMessage(`Generated flow in ${lang} for ${lang === 'ENGLISH' ? '$' : '₹'}${amt.toLocaleString()}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate conversational flow', err);
    } finally {
      setGeneratingScript(false);
    }
  };

  // Browser Speech Synthesis Audio Player
  const stopAudio = () => {
    isPlayingRef.current = false;
    setIsPlayingAudio(false);
    setCurrentSpokenTurn(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playDialogueAudio = () => {
    if (!conversationalResponse?.voice_script?.dialogue_turns) return;

    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!('speechSynthesis' in window)) {
      setToastMessage('Speech synthesis not supported in this browser environment.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    window.speechSynthesis.cancel();
    isPlayingRef.current = true;
    setIsPlayingAudio(true);

    const turns = conversationalResponse.voice_script.dialogue_turns;
    const voices = window.speechSynthesis.getVoices();

    const langCode =
      languageMode === 'ENGLISH' ? 'en-US' : languageMode === 'HINDI' ? 'hi-IN' : 'hi-IN';

    const speakTurn = (index: number) => {
      if (!isPlayingRef.current || index >= turns.length) {
        stopAudio();
        return;
      }

      const turn = turns[index];
      setCurrentSpokenTurn(index);

      const utterance = new SpeechSynthesisUtterance(turn.text);
      utterance.lang = langCode;

      if (turn.speaker === 'AI Agent') {
        utterance.pitch = 1.1;
        utterance.rate = 1.02;
      } else {
        utterance.pitch = 0.92;
        utterance.rate = 0.96;
      }

      const voice =
        voices.find((v) => v.lang === langCode) ||
        voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          setTimeout(() => {
            speakTurn(index + 1);
          }, 450);
        }
      };

      utterance.onerror = () => {
        stopAudio();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakTurn(0);
  };

  const handleSimulateUpiPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const refId = `UPI/NPCI/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      setPaymentSuccessData({
        method: `UPI (${selectedUpiApp})`,
        amount: conversationalAmount,
        reference: refId,
      });
      setToastMessage(`✓ Payment of ₹${conversationalAmount.toLocaleString()} successfully recovered via UPI!`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1200);
  };

  const handleSimulateCardPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const authCode = `AUTH_VISA_${Math.floor(10000 + Math.random() * 90000)}`;
      setPaymentSuccessData({
        method: 'Credit Card (•••• 4242)',
        amount: conversationalAmount,
        reference: authCode,
      });
      setToastMessage(`✓ Payment of ₹${conversationalAmount.toLocaleString()} successfully recovered via Card!`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1200);
  };

  const handleCreatePromiseToPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPtp) return;
    try {
      setIsSubmittingPtp(true);
      await recordPromiseToPay({
        invoice_id: selectedInvoiceForPtp.id,
        customer_id: selectedInvoiceForPtp.customer_id,
        promised_amount: ptpAmount,
        promised_date: ptpDate,
        channel: 'VOICE_CALL',
        operator_notes: ptpNotes,
      });
      setToastMessage(`Promise-to-Pay recorded for ${selectedInvoiceForPtp.company_name}. Dunning paused.`);
      setSelectedInvoiceForPtp(null);
      setTimeout(() => setToastMessage(null), 5000);
      const b2b = await getB2BReceivablesSummary();
      setB2bData(b2b);
    } catch (err) {
      console.error('Failed to record PTP', err);
    } finally {
      setIsSubmittingPtp(false);
    }
  };

  const handleFulfillPromise = async (ptpId: string) => {
    try {
      await fulfillPromiseToPay(ptpId);
      setToastMessage('Promise-to-Pay marked as FULFILLED and collected.');
      setTimeout(() => setToastMessage(null), 5000);
      const b2b = await getB2BReceivablesSummary();
      setB2bData(b2b);
    } catch (err) {
      console.error('Failed to fulfill PTP', err);
    }
  };

  const handleExecuteMandate = async (mandateId: string) => {
    try {
      setExecutingMandateId(mandateId);
      const res = await executeMandateSequence(mandateId);
      setExecutionReceiptModal(res);
      setMandateActionSuccess(`Mandate auto-debited successfully! Receipt: ${res.execution_receipt}`);
      setTimeout(() => setMandateActionSuccess(null), 8000);
      const mnd = await getMandateSequencerSummary();
      setMandateData(mnd);
    } catch (err) {
      console.error('Failed to execute mandate', err);
    } finally {
      setExecutingMandateId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
            <Sparkles className="w-4 h-4" />
            <span>SPECIALIZED RECOVERY DIRECTIONS & PLAYBOOKS</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Specialized Recovery Hub
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            Targeted workflows for B2B receivables, Promise-to-Pay tracking, Mandate retry sequencing (UPI Autopay & eNACH), and localized Hinglish conversational recovery.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={loadAllData}
        >
          Refresh Hub
        </Button>
      </div>

      {/* Global Notification Toast */}
      {(toastMessage || mandateActionSuccess) && (
        <div className="p-4 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-fintech-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="font-semibold">{toastMessage || mandateActionSuccess}</p>
        </div>
      )}

      {/* 4 Main Direction Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-fintech-border pb-3">
        <button
          onClick={() => setActiveTab('HINGLISH_VOICE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeTab === 'HINGLISH_VOICE'
              ? 'bg-brand-500 text-white shadow-fintech-sm'
              : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Hinglish Voice & WhatsApp Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('MANDATES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeTab === 'MANDATES'
              ? 'bg-brand-500 text-white shadow-fintech-sm'
              : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mandate Retry Sequencer (UPI / eNACH)</span>
        </button>

        <button
          onClick={() => setActiveTab('B2B')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeTab === 'B2B'
              ? 'bg-brand-500 text-white shadow-fintech-sm'
              : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>B2B Receivables & Promise-to-Pay (PTP)</span>
        </button>

        <button
          onClick={() => setActiveTab('CHECKOUT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeTab === 'CHECKOUT'
              ? 'bg-brand-500 text-white shadow-fintech-sm'
              : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Checkout Drop-Off & Subscription Playbooks</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HINGLISH VOICE & WHATSAPP CONVERSATIONAL RECOVERY STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'HINGLISH_VOICE' && (
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-fintech-primary">
                  Conversational Recovery Generator & Audio Simulator
                </h3>
                <p className="text-xs text-fintech-secondary mt-0.5">
                  Generate empathetic, culturally resonant Hinglish/Hindi voice calls and interactive WhatsApp recovery messages.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-fintech-surface-subtle p-1 rounded-fintech-md border border-fintech-border text-xs">
                <button
                  onClick={() => {
                    setLanguageMode('HINGLISH');
                    handleGenerateConversationalFlow('HINGLISH', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-fintech-sm font-semibold transition-colors ${
                    languageMode === 'HINGLISH'
                      ? 'bg-brand-500 text-white shadow-fintech-sm'
                      : 'text-fintech-muted hover:text-fintech-primary'
                  }`}
                >
                  🇮🇳 Hinglish (Conversational)
                </button>
                <button
                  onClick={() => {
                    setLanguageMode('HINDI');
                    handleGenerateConversationalFlow('HINDI', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-fintech-sm font-semibold transition-colors ${
                    languageMode === 'HINDI'
                      ? 'bg-brand-500 text-white shadow-fintech-sm'
                      : 'text-fintech-muted hover:text-fintech-primary'
                  }`}
                >
                  हिंदी Hindi (Formal)
                </button>
                <button
                  onClick={() => {
                    setLanguageMode('ENGLISH');
                    handleGenerateConversationalFlow('ENGLISH', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-fintech-sm font-semibold transition-colors ${
                    languageMode === 'ENGLISH'
                      ? 'bg-brand-500 text-white shadow-fintech-sm'
                      : 'text-fintech-muted hover:text-fintech-primary'
                  }`}
                >
                  🌐 English
                </button>
              </div>
            </div>

            {/* Parameter Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-fintech-muted block mb-1 font-mono">Invoice Amount</label>
                <input
                  type="number"
                  value={conversationalAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConversationalAmount(val);
                  }}
                  className="w-full p-2 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary font-mono text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-fintech-muted block mb-1 font-mono">Failure Reason</label>
                <select
                  value={failureType}
                  onChange={(e) => {
                    setFailureType(e.target.value);
                  }}
                  className="w-full p-2 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="insufficient_funds">Insufficient Funds (Balance Dip)</option>
                  <option value="bank_timeout">Bank Gateway Timeout (504 / ZM)</option>
                  <option value="expired_card">Expired Card / Token Expired</option>
                  <option value="mandate_degraded">Mandate Debit Rail Glitch</option>
                </select>
              </div>

              <div>
                <label className="text-fintech-muted block mb-1 font-mono">Channel Target</label>
                <select
                  value={channelMode}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setChannelMode(val);
                  }}
                  className="w-full p-2 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value="ALL">Omnichannel (Voice + WhatsApp)</option>
                  <option value="VOICE_CALL">AI Voice Call (IVR Only)</option>
                  <option value="WHATSAPP">WhatsApp Interactive Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="primary"
                  size="md"
                  icon={Sparkles}
                  isLoading={generatingScript}
                  onClick={() =>
                    handleGenerateConversationalFlow(
                      languageMode,
                      channelMode,
                      conversationalAmount,
                      failureType
                    )
                  }
                  className="w-full"
                >
                  Regenerate Flow
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Split View: Voice Script (Left) + WhatsApp Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: AI Voice Call IVR Transcript & Audio Player */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fintech-border pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-brand-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-fintech-primary font-mono">
                    AI Voice Call Simulator ({languageMode})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={playDialogueAudio}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border shadow-sm ${
                      isPlayingAudio
                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Voice Call</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Listen Voice Simulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {conversationalResponse?.voice_script ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1 text-xs">
                    <span className="text-[10px] text-fintech-muted uppercase font-mono block">Opening Pitch</span>
                    <p className="font-semibold text-fintech-primary italic">
                      "{conversationalResponse.voice_script.opening_line}"
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {conversationalResponse.voice_script.dialogue_turns.map((turn, i) => {
                      const isCurrentlySpeaking = currentSpokenTurn === i;
                      const isAgent = turn.speaker === 'AI Agent';

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-fintech-md text-xs space-y-1 transition-all ${
                            isCurrentlySpeaking
                              ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-md scale-[1.01]'
                              : isAgent
                              ? 'bg-brand-500/10 border border-brand-500/20 text-brand-950 dark:text-brand-100 ml-4'
                              : 'bg-fintech-surface-subtle border border-fintech-border text-fintech-primary mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase block text-fintech-muted">
                              {turn.speaker}
                            </span>
                            {isCurrentlySpeaking && (
                              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                <Volume2 className="w-3 h-3 animate-bounce" /> Speaking now...
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed">{turn.text}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-fintech-border flex items-center justify-between text-[11px] text-fintech-muted">
                    <span>Est Duration: {conversationalResponse.voice_script.call_duration_est_sec}s</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                      TRAI / RBI Regulatory Compliant
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-fintech-muted text-xs">
                  Generating localized conversational script...
                </div>
              )}
            </div>

            {/* Right: WhatsApp Mobile Mockup with Live Interactive Actions */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
              <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-fintech-primary font-mono">
                    WhatsApp Payment Notification
                  </h4>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  Verified Business Sender
                </span>
              </div>

              {conversationalResponse?.whatsapp_message ? (
                <div className="space-y-3">
                  {/* Mock WhatsApp Chat Bubble */}
                  <div className="p-4 rounded-fintech-lg bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-1.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
                      <span>{conversationalResponse.whatsapp_message.header_text}</span>
                      <span>Today 10:14 AM</span>
                    </div>

                    <div className="text-xs text-fintech-primary whitespace-pre-line leading-relaxed font-sans">
                      {conversationalResponse.whatsapp_message.body_text}
                    </div>

                    {/* Clickable Quick Settlement Link */}
                    <div className="p-2.5 rounded-fintech-md bg-white dark:bg-slate-900 border border-emerald-500/30 text-xs flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono font-bold text-fintech-primary">
                          pay.recoverai.io/quick/settle
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCheckoutModalType('UPI');
                          setPaymentSuccessData(null);
                        }}
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        Open Portal <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Interactive 1-Click Pay Buttons */}
                    <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                      <button
                        onClick={() => {
                          setCheckoutModalType('UPI');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2.5 px-3 rounded-fintech-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-fintech-sm"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Pay via UPI (Instant QR & App)</span>
                      </button>

                      <button
                        onClick={() => {
                          setCheckoutModalType('CARD');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2.5 px-3 rounded-fintech-md bg-fintech-surface hover:bg-fintech-surface-subtle border border-fintech-border text-fintech-primary font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <CreditCard className="w-4 h-4 text-brand-500" />
                        <span>Pay via Card (1-Click Token)</span>
                      </button>

                      <button
                        onClick={() => {
                          setCheckoutModalType('SUPPORT');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2 px-3 rounded-fintech-md bg-transparent hover:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Support / Request Extension</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-fintech-muted text-center font-mono">
                    {conversationalResponse.whatsapp_message.opt_out_text}
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center text-fintech-muted text-xs">
                  Generating interactive WhatsApp template...
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE CHECKOUT & SETTLEMENT MODALS */}
          {/* ========================================================================= */}

          {/* Modal 1: UPI 1-Click Settlement */}
          {checkoutModalType === 'UPI' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-md rounded-fintech-xl border border-emerald-500/40 bg-fintech-surface p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        NPCI Real-Time Rails
                      </span>
                      <h3 className="text-base font-bold text-fintech-primary">
                        Instant UPI Payment
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-fintech-muted hover:text-fintech-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {!paymentSuccessData ? (
                  <div className="space-y-4 text-xs">
                    {/* Amount & Invoice Context */}
                    <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-fintech-muted block">Amount to Settle</span>
                        <span className="text-xl font-black font-mono text-fintech-primary">
                          ₹{conversationalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Zero Late Fee
                      </span>
                    </div>

                    {/* Choose UPI App */}
                    <div className="space-y-1.5">
                      <label className="text-fintech-muted font-mono font-bold text-[11px] block">
                        Select UPI Intent App:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'GPAY', name: 'Google Pay', icon: '🔵 GPay' },
                          { id: 'PHONEPE', name: 'PhonePe', icon: '🟣 PhonePe' },
                          { id: 'PAYTM', name: 'Paytm UPI', icon: '🔷 Paytm' },
                          { id: 'BHIM', name: 'BHIM / Cred', icon: '🟢 BHIM' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            onClick={() => setSelectedUpiApp(app.id as any)}
                            className={`p-2.5 rounded-fintech-md border text-xs font-bold text-left transition-all ${
                              selectedUpiApp === app.id
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                                : 'border-fintech-border bg-fintech-surface hover:bg-fintech-surface-subtle text-fintech-primary'
                            }`}
                          >
                            <span>{app.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* QR Code Demo Representation */}
                    <div className="p-4 rounded-fintech-md border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center space-y-2">
                      <QrCode className="w-16 h-16 mx-auto text-emerald-700 dark:text-emerald-300" />
                      <p className="text-[11px] text-fintech-muted font-mono">
                        Scan QR with any UPI App or click below to simulate instant payment approval
                      </p>
                    </div>

                    {/* Complete Button */}
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isProcessingPayment}
                      onClick={handleSimulateUpiPayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Simulate Instant Approval ({selectedUpiApp})
                    </Button>
                  </div>
                ) : (
                  /* Success State */
                  <div className="space-y-4 text-center animate-in zoom-in-95">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-fintech-primary">₹{paymentSuccessData.amount.toLocaleString()} Recovered Successfully!</h4>
                      <p className="text-xs text-fintech-muted mt-1 font-mono">
                        NPCI UTR: <strong>{paymentSuccessData.reference}</strong>
                      </p>
                    </div>

                    <div className="p-3 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 text-left space-y-1">
                      <div className="flex justify-between">
                        <span>Payment Rail:</span>
                        <strong>{paymentSuccessData.method}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Subscription Status:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">ACTIVE (No Interruption)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Audit Log:</span>
                        <span>Recorded in Append-Only Trail</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setCheckoutModalType(null)}
                      className="w-full"
                    >
                      Done & Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal 2: 1-Click Card Checkout */}
          {checkoutModalType === 'CARD' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-md rounded-fintech-xl border border-brand-500/40 bg-fintech-surface p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Tokenized Card Recovery
                      </span>
                      <h3 className="text-base font-bold text-fintech-primary">
                        1-Click Card Checkout
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-fintech-muted hover:text-fintech-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {!paymentSuccessData ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-fintech-muted block">Total Charge</span>
                        <span className="text-xl font-black font-mono text-fintech-primary">
                          ₹{conversationalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                        Smart 3DS Exempt
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-fintech-muted font-mono block mb-1">Saved Card on File</label>
                        <div className="p-2.5 rounded-fintech-md bg-fintech-surface border border-fintech-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-brand-500" />
                            <span className="font-mono font-bold text-fintech-primary">•••• •••• •••• 4242</span>
                          </div>
                          <span className="text-[10px] font-mono text-fintech-muted">Exp: 08/29</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-fintech-md bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-800 dark:text-brand-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 shrink-0 text-brand-500" />
                        <span>Frictionless 3DS Exemption applied. Zero OTP latency.</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isProcessingPayment}
                      onClick={handleSimulateCardPayment}
                      className="w-full"
                    >
                      Authorize & Pay ₹{conversationalAmount.toLocaleString()}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center animate-in zoom-in-95">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-fintech-primary">Card Authorized & Settled!</h4>
                      <p className="text-xs text-fintech-muted mt-1 font-mono">
                        Auth Code: <strong>{paymentSuccessData.reference}</strong>
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setCheckoutModalType(null)}
                      className="w-full"
                    >
                      Done & Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal 3: Call Support & Payment Extension */}
          {checkoutModalType === 'SUPPORT' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-md rounded-fintech-xl border border-fintech-border bg-fintech-surface p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Priority Billing Desk
                      </span>
                      <h3 className="text-base font-bold text-fintech-primary">
                        Customer Assistance
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-fintech-muted hover:text-fintech-primary text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Toll-Free Helpline:</span>
                      <strong className="font-mono text-fintech-primary">1800-RECOVER (24x7)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Connected Officer:</span>
                      <span className="font-semibold text-fintech-primary">Priority Billing Agent #802</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Account In Good Standing:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">YES</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setToastMessage('✓ 48-Hour Payment Extension Granted. Automated dunning paused.');
                        setTimeout(() => setToastMessage(null), 5000);
                        setCheckoutModalType(null);
                      }}
                      className="w-full p-2.5 rounded-fintech-md border border-fintech-border hover:bg-fintech-surface-subtle text-left font-bold text-fintech-primary flex items-center justify-between"
                    >
                      <span>Request 48-Hour Grace Extension</span>
                      <span className="text-[10px] text-brand-500 font-mono">1-Click Apply →</span>
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('Connecting to Live Voice Operator...');
                        setTimeout(() => setToastMessage(null), 4000);
                        setCheckoutModalType(null);
                      }}
                      className="w-full p-2.5 rounded-fintech-md bg-brand-500 hover:bg-brand-600 text-white text-center font-bold"
                    >
                      Connect Live with Billing Specialist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANDATE RETRY SEQUENCER (UPI AUTOPAY & ENACH) */}
      {/* ========================================================================= */}
      {activeTab === 'MANDATES' && mandateData && (
        <div className="space-y-6">
          {/* Mandates Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted font-mono">
                Total Mandates at Risk
              </span>
              <p className="text-xl font-black font-mono text-fintech-primary">
                {formatCurrency(mandateData.total_mandates_at_risk)}
              </p>
              <span className="text-[10px] text-fintech-muted font-mono">{mandateData.active_mandates_count} active sequences</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                UPI Autopay Volume
              </span>
              <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(mandateData.upi_autopay_volume)}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Real-time NPCI rail</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
                eNACH Batch Volume
              </span>
              <p className="text-xl font-black font-mono text-brand-600 dark:text-brand-400">
                {formatCurrency(mandateData.enach_volume)}
              </p>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">NACH Cycle 1 optimized</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 font-mono">
                Projected Success Lift
              </span>
              <p className="text-xl font-black font-mono text-purple-700 dark:text-purple-400">
                +{mandateData.optimal_window_projected_lift_pct}%
              </p>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-mono">Vs naive instant retries</span>
            </div>
          </div>

          {/* Salary Cycle & Timing Intelligence Callout */}
          <div className="rounded-fintech-lg border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-fintech-sm">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-fintech-primary uppercase tracking-wider font-mono">
                  Salary Cycle & Balance Availability Alignment
                </span>
                <p className="text-fintech-secondary leading-relaxed">
                  UPI Autopay & eNACH fail rates spike by 64% during month-end balance dips. RecoverAI automatically maps recurring mandate retries to the customer’s verified salary credit window (1st-5th of each month) to prevent debit bounces and customer penalty charges.
                </p>
              </div>
            </div>
          </div>

          {/* Mandate Sequences Table */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
            <div className="flex items-center justify-between border-b border-fintech-border pb-3">
              <h3 className="text-sm font-bold text-fintech-primary">Active Mandate Sequencing Queue</h3>
              <span className="text-xs text-fintech-muted font-mono">Bounded by Max 3 Network Attempts</span>
            </div>

            <div className="overflow-x-auto rounded-fintech-md border border-fintech-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-fintech-border bg-fintech-surface-subtle text-fintech-muted font-mono text-[10px]">
                    <th className="py-2.5 px-3 uppercase">Mandate Rail</th>
                    <th className="py-2.5 px-3 uppercase">Customer / Plan</th>
                    <th className="py-2.5 px-3 uppercase">Issuing Bank</th>
                    <th className="py-2.5 px-3 uppercase">Decline Root Cause</th>
                    <th className="py-2.5 px-3 uppercase">Optimal Retry Window</th>
                    <th className="py-2.5 px-3 uppercase">Expected Yield</th>
                    <th className="py-2.5 px-3 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border">
                  {mandateData.scheduled_sequences.map((m) => {
                    const isSettled = m.sequence_status === 'EXECUTED_SUCCESS';

                    return (
                      <tr key={m.id} className="hover:bg-fintech-surface-subtle transition-colors">
                        <td className="py-3 px-3">
                          <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20 uppercase">
                            {m.mandate_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-fintech-muted font-mono block mt-1">
                            Attempt {m.retry_attempt_number}/{m.max_mandate_attempts}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-fintech-primary block">{m.customer_name}</span>
                          <span className="text-[10px] text-fintech-muted">{m.subscription_plan}</span>
                        </td>

                        <td className="py-3 px-3 font-semibold text-fintech-secondary">
                          {m.bank_name}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`font-mono font-bold block ${
                              isSettled
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isSettled ? 'SETTLED_00' : m.detected_failure_code}
                          </span>
                          <span className="text-[10px] text-fintech-muted">{m.failure_reason}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block">
                            {m.optimal_retry_window}
                          </span>
                          {!isSettled && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                              Aligned to salary day #{m.aligned_salary_day}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {isSettled ? '100%' : `${m.expected_success_rate_pct}%`}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[11px] border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Debited
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={executingMandateId === m.mandate_id}
                              onClick={() => handleExecuteMandate(m.mandate_id)}
                            >
                              Execute Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Receipt Modal */}
          {executionReceiptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-md rounded-fintech-xl border border-emerald-500/40 bg-fintech-surface p-6 shadow-2xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        NPCI Clearing Confirmation
                      </span>
                      <h3 className="text-base font-bold text-fintech-primary">
                        Mandate Auto-Debited
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setExecutionReceiptModal(null)}
                    className="p-1 text-fintech-muted hover:text-fintech-primary"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Execution Receipt:</span>
                      <strong className="text-fintech-primary">{executionReceiptModal.execution_receipt}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Settled Amount:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(executionReceiptModal.amount_recovered)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Bank Response:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {executionReceiptModal.bank_response_code}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Settled At:</span>
                      <span className="text-fintech-secondary">
                        {new Date(executionReceiptModal.settled_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-fintech-muted">Audit Event:</span>
                      <span className="text-brand-600 dark:text-brand-400">{executionReceiptModal.audit_event_id}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                    <p className="font-semibold">✓ Funds Captured & Logged to Ledger</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      The recurring subscription has been restored to active standing without customer disruption.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-fintech-border">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setExecutionReceiptModal(null)}
                  >
                    Done & Close Receipt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: B2B RECEIVABLES CHASER & PROMISE-TO-PAY TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'B2B' && b2bData && (
        <div className="space-y-6">
          {/* Aging Buckets KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                Current (0-30 Days)
              </span>
              <p className="text-xl font-black font-mono text-fintech-primary">
                {formatCurrency(b2bData.current_bucket_amount)}
              </p>
              <span className="text-[10px] text-fintech-muted font-mono">Early dunning & PTP</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                Overdue (31-60 Days)
              </span>
              <p className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                {formatCurrency(b2bData.overdue_bucket_amount)}
              </p>
              <span className="text-[10px] text-fintech-muted font-mono">Account manager touch</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 font-mono">
                Critical (61-90 Days)
              </span>
              <p className="text-xl font-black font-mono text-purple-700 dark:text-purple-400">
                {formatCurrency(b2bData.critical_bucket_amount)}
              </p>
              <span className="text-[10px] text-fintech-muted font-mono">Human escalation gate</span>
            </div>

            <div className="p-4 rounded-fintech-lg bg-rose-500/5 border border-rose-500/30 shadow-fintech-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono">
                Default Risk (90+ Days)
              </span>
              <p className="text-xl font-black font-mono text-rose-700 dark:text-rose-400">
                {formatCurrency(b2bData.default_risk_bucket_amount)}
              </p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">Collections / Legal</span>
            </div>
          </div>

          {/* Active Promise-to-Pay (PTP) Tracker Strip */}
          <div className="rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-fintech-primary">
                  Promise-to-Pay (PTP) Commitments Tracker
                </h3>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300 font-mono border border-brand-500/20">
                  {b2bData.active_ptp_count} Active Commitments ({formatCurrency(b2bData.active_ptp_volume)})
                </span>
              </div>
              <span className="text-xs text-fintech-muted font-mono">
                Automated dunning pauses during valid PTP grace periods
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {b2bData.recent_promises.map((p) => (
                <div
                  key={p.id}
                  className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fintech-primary">{p.customer_name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        p.status === 'ACTIVE_PROMISE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : p.status === 'FULFILLED'
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-fintech-muted">Promised: {formatCurrency(p.promised_amount)}</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">Due: {p.promised_date}</span>
                  </div>

                  <p className="text-[11px] text-fintech-secondary italic">"{p.operator_notes}"</p>

                  <div className="pt-2 border-t border-fintech-border flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {p.dunning_paused ? '⏸ Dunning Paused (PTP Protected)' : '▶ Active Dunning'}
                    </span>
                    {p.status === 'ACTIVE_PROMISE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFulfillPromise(p.id)}
                      >
                        Mark Collected
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B2B Invoices Table */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
            <div className="flex items-center justify-between border-b border-fintech-border pb-3">
              <h3 className="text-sm font-bold text-fintech-primary">Corporate Receivables Ledger</h3>
              <span className="text-xs text-fintech-muted font-mono">{b2bData.total_invoices_count} Outstanding Invoices</span>
            </div>

            <div className="overflow-x-auto rounded-fintech-md border border-fintech-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-fintech-border bg-fintech-surface-subtle text-fintech-muted font-mono text-[10px]">
                    <th className="py-2.5 px-3 uppercase">Invoice / PO</th>
                    <th className="py-2.5 px-3 uppercase">Enterprise Account</th>
                    <th className="py-2.5 px-3 uppercase text-right">Amount Due</th>
                    <th className="py-2.5 px-3 uppercase">Aging</th>
                    <th className="py-2.5 px-3 uppercase">Status</th>
                    <th className="py-2.5 px-3 uppercase">Recommended Action</th>
                    <th className="py-2.5 px-3 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border">
                  {b2bData.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-fintech-surface-subtle transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-fintech-primary block">{inv.invoice_number}</span>
                        <span className="text-[10px] text-fintech-muted font-mono">{inv.po_number}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-fintech-primary">{inv.company_name}</span>
                          {inv.is_vip && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-fintech-muted">{inv.customer_name}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-fintech-primary">
                        {formatCurrency(inv.amount_due)}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-xs font-bold ${
                            inv.days_overdue > 60
                              ? 'text-rose-600 dark:text-rose-400'
                              : inv.days_overdue > 30
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-fintech-secondary'
                          }`}
                        >
                          {inv.days_overdue} days
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            inv.status === 'PROMISE_TO_PAY'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : inv.status === 'ESCALATED_HUMAN'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                              : inv.status === 'DISPUTED'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-fintech-surface-subtle text-fintech-muted border-fintech-border'
                          }`}
                        >
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] font-medium text-fintech-secondary">
                        {inv.recommended_action.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedInvoiceForPtp(inv);
                            setPtpAmount(Number(inv.amount_due));
                          }}
                        >
                          Log PTP
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Promise-to-Pay Log Modal */}
          {selectedInvoiceForPtp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-lg rounded-fintech-xl border border-fintech-border bg-fintech-surface p-6 shadow-2xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Promise-to-Pay (PTP) Commitment
                    </span>
                    <h3 className="text-base font-bold text-fintech-primary mt-0.5">
                      Log Commitment for {selectedInvoiceForPtp.company_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceForPtp(null)}
                    className="p-1 text-fintech-muted hover:text-fintech-primary"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePromiseToPay} className="space-y-4 text-xs">
                  <div>
                    <label className="text-fintech-muted block mb-1 font-mono">Promised Settlement Amount</label>
                    <input
                      type="number"
                      value={ptpAmount}
                      onChange={(e) => setPtpAmount(parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary font-mono text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-fintech-muted block mb-1 font-mono">Promised Payment Date</label>
                    <input
                      type="date"
                      value={ptpDate}
                      onChange={(e) => setPtpDate(e.target.value)}
                      className="w-full p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary font-mono text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-fintech-muted block mb-1 font-mono">Operator Notes & Confirmation Context</label>
                    <textarea
                      rows={3}
                      value={ptpNotes}
                      onChange={(e) => setPtpNotes(e.target.value)}
                      className="w-full p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-fintech-primary text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-fintech-md bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-700 dark:text-brand-300 space-y-1">
                    <strong>Policy Enforcement Guarantee:</strong>
                    <p>
                      Recording this PTP will automatically pause all automated email/SMS dunning until {ptpDate}. If unfulfilled on the target date, a high-urgency Broken Promise ticket will be generated.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-fintech-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoiceForPtp(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSubmittingPtp}
                      type="submit"
                    >
                      Confirm Promise to Pay
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CHECKOUT DROP-OFF & SUBSCRIPTION RECOVERY PLAYBOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'CHECKOUT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Playbook 1: Pre-Recovery Checkout Optimization */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Zap className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase font-mono text-fintech-primary">
                  1. Checkout Drop-Off Pre-Recovery
                </h3>
              </div>
              <p className="text-xs text-fintech-secondary leading-relaxed">
                Intervenes before payment failure occurs: performs real-time gateway routing, requests frictionless 3DS exemptions for low-risk transactions, and caches tokenized cryptograms.
              </p>
              <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-xs space-y-1">
                <span className="font-bold text-fintech-primary block">Key Metric Impact:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 block">+5.8 pp Checkout Conversion Lift</span>
                <span className="text-[10px] text-fintech-muted block">Eliminates 3DS drop-offs without increasing fraud risk</span>
              </div>
            </div>

            {/* Playbook 2: Smart Subscription Dunning */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <RefreshCw className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase font-mono text-fintech-primary">
                  2. Failed Subscription Dunning
                </h3>
              </div>
              <p className="text-xs text-fintech-secondary leading-relaxed">
                Bounded retry sequence with diminishing returns decay curves: delays retries to match customer paydays, pairs retries with soft WhatsApp reminders, and stops before churn thresholds.
              </p>
              <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-xs space-y-1">
                <span className="font-bold text-fintech-primary block">Key Metric Impact:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 block">78.4% Subscription Retention Yield</span>
                <span className="text-[10px] text-fintech-muted block">Prevents customer involuntary churn</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
