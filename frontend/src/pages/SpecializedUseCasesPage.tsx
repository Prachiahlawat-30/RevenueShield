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
  Copy,
  Download,
  Search,
  Sliders,
  Filter,
  ArrowRight,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'HINGLISH_VOICE' | 'MANDATES' | 'B2B' | 'CHECKOUT'>('HINGLISH_VOICE');

  // 1. B2B & PTP State
  const [b2bData, setB2bData] = useState<B2BReceivablesSummary | null>(null);
  const [loadingB2B, setLoadingB2B] = useState(true);
  const [selectedInvoiceForPtp, setSelectedInvoiceForPtp] = useState<B2BReceivableInvoice | null>(null);
  const [ptpDate, setPtpDate] = useState<string>('2026-09-08');
  const [ptpAmount, setPtpAmount] = useState<number>(12500);
  const [ptpRail, setPtpRail] = useState<'NEFT' | 'RTGS' | 'CHEQUE' | 'WIRE'>('NEFT');
  const [ptpNotes, setPtpNotes] = useState<string>('Customer CFO confirmed clearance on 8th September via NEFT');
  const [isSubmittingPtp, setIsSubmittingPtp] = useState(false);
  const [b2bSearch, setB2bSearch] = useState('');
  const [b2bAgingFilter, setB2bAgingFilter] = useState<'ALL' | 'CURRENT' | 'OVERDUE' | 'CRITICAL' | 'DEFAULT'>('ALL');

  // 2. Mandate Sequencer State
  const [mandateData, setMandateData] = useState<MandateSequencerSummary | null>(null);
  const [loadingMandates, setLoadingMandates] = useState(true);
  const [executingMandateId, setExecutingMandateId] = useState<string | null>(null);
  const [mandateActionSuccess, setMandateActionSuccess] = useState<string | null>(null);
  const [executionReceiptModal, setExecutionReceiptModal] = useState<MandateExecuteResponse | null>(null);
  const [mandateRailFilter, setMandateRailFilter] = useState<'ALL' | 'UPI_AUTOPAY' | 'ENACH' | 'DEBIT_CARD'>('ALL');
  const [mandateSearch, setMandateSearch] = useState('');

  // 3. Conversational Studio State
  const [languageMode, setLanguageMode] = useState<'HINGLISH' | 'HINDI' | 'ENGLISH'>('HINGLISH');
  const [channelMode, setChannelMode] = useState<'VOICE_CALL' | 'WHATSAPP' | 'ALL'>('ALL');
  const [failureType, setFailureType] = useState<string>('insufficient_funds');
  const [conversationalAmount, setConversationalAmount] = useState<number>(4500);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [conversationalResponse, setConversationalResponse] = useState<ConversationalStudioResponse | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpokenTurn, setCurrentSpokenTurn] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPayloadCopied, setIsPayloadCopied] = useState(false);

  // 4. Interactive WhatsApp Checkout Modals State
  const [checkoutModalType, setCheckoutModalType] = useState<'UPI' | 'CARD' | 'SUPPORT' | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'>('GPAY');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    method: string;
    amount: number;
    reference: string;
  } | null>(null);

  // 5. Checkout & Subscription Playbook Interactive Simulation State
  const [simCartValue, setSimCartValue] = useState<number>(85);
  const [simMerchantRisk, setSimMerchantRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [simCardScheme, setSimCardScheme] = useState<'VISA' | 'MASTERCARD' | 'RUPAY'>('VISA');
  const [simAuthResult, setSimAuthResult] = useState<string | null>(null);

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
      setToastMessage(`✓ Generated recovery flow in ${lang} for ₹${amt.toLocaleString()}`);
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
      setToastMessage('Speech synthesis is not supported in this browser environment.');
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
      utterance.rate = speechRate;

      if (turn.speaker === 'AI Agent') {
        utterance.pitch = 1.08;
      } else {
        utterance.pitch = 0.94;
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
          }, 400);
        }
      };

      utterance.onerror = () => {
        stopAudio();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakTurn(0);
  };

  const handleCopyWebhookPayload = () => {
    if (!conversationalResponse) return;
    const payload = {
      event: 'recoverai.conversational_recovery.dispatched',
      timestamp: new Date().toISOString(),
      recipient: {
        customer_id: 'cust_001',
        phone: '+91 98765 43210',
        preferred_language: languageMode,
      },
      invoice: {
        amount: conversationalAmount,
        currency: 'INR',
        failure_type: failureType,
      },
      whatsapp_template: conversationalResponse.whatsapp_message,
      voice_ivr_script: conversationalResponse.voice_script,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsPayloadCopied(true);
    setToastMessage('✓ Production Twilio / WhatsApp Business API JSON payload copied to clipboard!');
    setTimeout(() => {
      setIsPayloadCopied(false);
      setToastMessage(null);
    }, 4000);
  };

  const handleSimulateUpiPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const refId = `UPI-${selectedUpiApp}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      setPaymentSuccessData({
        method: `${selectedUpiApp} (NPCI Rail)`,
        amount: conversationalAmount,
        reference: refId,
      });
      setToastMessage(`✓ Captured ₹${conversationalAmount.toLocaleString()} via ${selectedUpiApp}! Settled into merchant ledger.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1100);
  };

  const handleSimulateCardPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      const authCode = `AUTH-CARD-${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentSuccessData({
        method: 'Saved Tokenized Card (•••• 4242)',
        amount: conversationalAmount,
        reference: authCode,
      });
      setToastMessage(`✓ Authorized ₹${conversationalAmount.toLocaleString()} via Tokenized Card! Settled to merchant ledger.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1100);
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
        operator_notes: `${ptpRail} payment commitment: ${ptpNotes}`,
      });
      setToastMessage(`✓ Promise-to-Pay recorded for ${selectedInvoiceForPtp.company_name}. Dunning paused until ${ptpDate}.`);
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
      setToastMessage('✓ Promise-to-Pay marked as FULFILLED! Funds captured to ledger.');
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
      setMandateActionSuccess(`✓ Mandate auto-debited successfully! NPCI Receipt: ${res.execution_receipt}`);
      setTimeout(() => setMandateActionSuccess(null), 8000);
      const mnd = await getMandateSequencerSummary();
      setMandateData(mnd);
    } catch (err) {
      console.error('Failed to execute mandate', err);
    } finally {
      setExecutingMandateId(null);
    }
  };

  // Filtered lists for production searchability
  const filteredInvoices = (b2bData?.invoices || []).filter((inv) => {
    const matchesSearch =
      inv.company_name.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(b2bSearch.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(b2bSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (b2bAgingFilter === 'CURRENT') return inv.days_overdue <= 30;
    if (b2bAgingFilter === 'OVERDUE') return inv.days_overdue > 30 && inv.days_overdue <= 60;
    if (b2bAgingFilter === 'CRITICAL') return inv.days_overdue > 60 && inv.days_overdue <= 90;
    if (b2bAgingFilter === 'DEFAULT') return inv.days_overdue > 90;

    return true;
  });

  const filteredMandates = (mandateData?.scheduled_sequences || []).filter((m: MandateSequenceItem) => {
    const matchesSearch =
      m.customer_name.toLowerCase().includes(mandateSearch.toLowerCase()) ||
      m.mandate_id.toLowerCase().includes(mandateSearch.toLowerCase()) ||
      m.bank_name.toLowerCase().includes(mandateSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (mandateRailFilter === 'UPI_AUTOPAY') return m.mandate_type === 'UPI_AUTOPAY';
    if (mandateRailFilter === 'ENACH') return m.mandate_type === 'ENACH';
    if (mandateRailFilter === 'DEBIT_CARD') return m.mandate_type === 'DEBIT_CARD_MANDATE' || m.mandate_type === 'CREDIT_CARD_MANDATE';

    return true;
  });

  // Calculate 3DS Exemption probability
  const calculate3dsExemption = () => {
    let score = 92;
    if (simCartValue > 150) score -= 18;
    if (simMerchantRisk === 'MEDIUM') score -= 12;
    if (simMerchantRisk === 'HIGH') score -= 35;
    return Math.max(12, Math.min(98, score));
  };

  const exemptionScore = calculate3dsExemption();
  const isExemptionGranted = exemptionScore >= 75;

  return (
    <div className="space-y-6 animate-fintech-fade pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Specialized Recovery Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
            Specialized Recovery Hub
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Production playbooks for B2B receivables, Promise-to-Pay tracking, Mandate retry sequencing (UPI Autopay & eNACH), and localized Hinglish conversational voice recovery.
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

      {/* Global Notification Banner */}
      {(toastMessage || mandateActionSuccess) && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-fintech-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="font-semibold">{toastMessage || mandateActionSuccess}</p>
        </div>
      )}

      {/* Main Direction Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('HINGLISH_VOICE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'HINGLISH_VOICE'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4 text-indigo-500" />
          <span>Hinglish Voice & WhatsApp Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('MANDATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MANDATES'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Mandate Retry Sequencer (UPI / eNACH)</span>
        </button>

        <button
          onClick={() => setActiveTab('B2B')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'B2B'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-500" />
          <span>B2B Receivables & Promise-to-Pay (PTP)</span>
        </button>

        <button
          onClick={() => setActiveTab('CHECKOUT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CHECKOUT'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-500" />
          <span>Checkout Drop-Off & Subscription Playbooks</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HINGLISH VOICE & WHATSAPP CONVERSATIONAL RECOVERY STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'HINGLISH_VOICE' && (
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Conversational Recovery Generator & Speech Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Synthesizes empathetic, culturally resonant Hinglish/Hindi IVR calls and interactive WhatsApp recovery messages with 1-click settlement.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => {
                    setLanguageMode('HINGLISH');
                    handleGenerateConversationalFlow('HINGLISH', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    languageMode === 'HINGLISH'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🇮🇳 Hinglish (Conversational)
                </button>
                <button
                  onClick={() => {
                    setLanguageMode('HINDI');
                    handleGenerateConversationalFlow('HINDI', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    languageMode === 'HINDI'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  हिंदी Hindi (Formal)
                </button>
                <button
                  onClick={() => {
                    setLanguageMode('ENGLISH');
                    handleGenerateConversationalFlow('ENGLISH', channelMode, conversationalAmount, failureType);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    languageMode === 'ENGLISH'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🌐 English
                </button>
              </div>
            </div>

            {/* Parameter Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-mono">Invoice Amount</label>
                <input
                  type="number"
                  value={conversationalAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setConversationalAmount(val);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-mono">Failure Reason</label>
                <select
                  value={failureType}
                  onChange={(e) => setFailureType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="insufficient_funds">Insufficient Funds (Balance Dip)</option>
                  <option value="bank_timeout">Bank Gateway Timeout (504 / ZM)</option>
                  <option value="expired_card">Expired Card / Token Expired</option>
                  <option value="mandate_degraded">Mandate Debit Rail Glitch</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-mono">Speech Speed</label>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value={0.85}>0.85x (Deliberate)</option>
                  <option value={1.0}>1.0x (Standard)</option>
                  <option value={1.15}>1.15x (Fast)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-mono">Channel Target</label>
                <select
                  value={channelMode}
                  onChange={(e) => setChannelMode(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none"
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
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                    AI Voice Call Simulator ({languageMode})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {isPlayingAudio && (
                    <div className="flex items-end gap-0.5 h-4 px-2">
                      <span className="w-1 bg-emerald-500 animate-pulse h-2 rounded-full" />
                      <span className="w-1 bg-emerald-500 animate-pulse h-4 rounded-full" />
                      <span className="w-1 bg-emerald-500 animate-pulse h-3 rounded-full" />
                      <span className="w-1 bg-emerald-500 animate-pulse h-4 rounded-full" />
                    </div>
                  )}

                  <button
                    onClick={playDialogueAudio}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border shadow-sm cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
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
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">Opening Pitch</span>
                    <p className="font-semibold text-slate-900 dark:text-white italic">
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
                          className={`p-3 rounded-xl text-xs space-y-1 transition-all ${
                            isCurrentlySpeaking
                              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-md scale-[1.01]'
                              : isAgent
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-slate-900 dark:text-white ml-4'
                              : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase block text-slate-500 dark:text-slate-400">
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

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Est Duration: {conversationalResponse.voice_script.call_duration_est_sec}s</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      TRAI / RBI Regulatory Compliant
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Generating localized conversational script...
                </div>
              )}
            </div>

            {/* Right: WhatsApp Mobile Mockup with Live Interactive Actions */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                    WhatsApp Payment Notification
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyWebhookPayload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isPayloadCopied ? 'Copied!' : 'Export API Payload'}</span>
                  </button>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 font-bold">
                    Verified Business Sender
                  </span>
                </div>
              </div>

              {conversationalResponse?.whatsapp_message ? (
                <div className="space-y-3">
                  {/* Mock WhatsApp Chat Bubble */}
                  <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200/60 dark:border-emerald-900/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/20 pb-1.5 text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
                      <span>{conversationalResponse.whatsapp_message.header_text}</span>
                      <span>Today 10:14 AM</span>
                    </div>

                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                      {conversationalResponse.whatsapp_message.body_text}
                    </div>

                    {/* Clickable Quick Settlement Link */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 text-xs flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          pay.recoverai.io/quick/settle
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCheckoutModalType('UPI');
                          setPaymentSuccessData(null);
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Open Portal <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Interactive 1-Click Pay Buttons */}
                    <div className="space-y-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/20">
                      <button
                        onClick={() => {
                          setCheckoutModalType('UPI');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Pay via UPI (Instant QR & App)</span>
                      </button>

                      <button
                        onClick={() => {
                          setCheckoutModalType('CARD');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span>Pay via Card (1-Click Token)</span>
                      </button>

                      <button
                        onClick={() => {
                          setCheckoutModalType('SUPPORT');
                          setPaymentSuccessData(null);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-transparent hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Support / Request Extension</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-mono">
                    {conversationalResponse.whatsapp_message.opt_out_text}
                  </p>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fintech-fade">
              <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        NPCI Real-Time Rails
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Instant UPI Payment
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {!paymentSuccessData ? (
                  <div className="space-y-4 text-xs">
                    {/* Amount & Invoice Context */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Amount to Settle</span>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          ₹{conversationalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        Zero Late Fee
                      </span>
                    </div>

                    {/* Choose UPI App */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 dark:text-slate-400 font-mono font-bold text-[11px] block">
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
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                              selectedUpiApp === app.id
                                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-900 dark:text-white'
                            }`}
                          >
                            <span>{app.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* QR Code Demo Representation */}
                    <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-center space-y-2">
                      <QrCode className="w-16 h-16 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
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
                      Authorize ₹{conversationalAmount.toLocaleString()} via {selectedUpiApp}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center animate-in zoom-in-95">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Received!</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        Reference: <strong>{paymentSuccessData.reference}</strong>
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                        Settled to Merchant Ledger
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setCheckoutModalType(null)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      Done & Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal 2: 1-Click Tokenized Card Checkout */}
          {checkoutModalType === 'CARD' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fintech-fade">
              <div className="w-full max-w-md rounded-2xl border border-indigo-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Tokenized Card Recovery
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        1-Click Card Checkout
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {!paymentSuccessData ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Charge</span>
                        <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                          ₹{conversationalAmount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                        Smart 3DS Exempt
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-500 font-mono block mb-1">Saved Card on File</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span className="font-mono font-bold text-slate-900 dark:text-white">•••• •••• •••• 4242</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">Exp: 08/29</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 shrink-0 text-indigo-600" />
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
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">Card Authorized & Settled!</h4>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fintech-fade">
              <div className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Priority Billing Desk
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Customer Assistance
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModalType(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Toll-Free Helpline:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">1800-RECOVER (24x7)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Connected Officer:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">Priority Billing Specialist #802</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account In Good Standing:</span>
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
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left font-bold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>Request 48-Hour Grace Extension</span>
                      <span className="text-[10px] text-indigo-600 font-mono">1-Click Apply →</span>
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('Connecting to Live Voice Operator...');
                        setTimeout(() => setToastMessage(null), 4000);
                        setCheckoutModalType(null);
                      }}
                      className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Total Mandates at Risk
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(mandateData.total_mandates_at_risk)}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">{mandateData.active_mandates_count} active sequences</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                UPI Autopay Volume
              </span>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(mandateData.upi_autopay_volume)}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Real-time NPCI rail</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                eNACH Batch Volume
              </span>
              <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(mandateData.enach_volume)}
              </p>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">NACH Cycle 1 optimized</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                Salary Credit Alignment
              </span>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {mandateData.active_mandates_count > 0
                  ? Math.round((mandateData.salary_cycle_aligned_count / mandateData.active_mandates_count) * 100)
                  : 88}%
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                {mandateData.salary_cycle_aligned_count} aligned (1st–5th)
              </span>
            </div>
          </div>

          {/* Month-End Liquidity Bounce vs Salary Alignment Explainer */}
          <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-[#111827] space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider">
                Why RecoverAI Delays Month-End Mandate Debits to Salary Windows
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Historical banking data shows that recurring debits attempted between the <strong>28th and 31st</strong> fail at a <strong>3.4x higher rate</strong> due to month-end account balance dips. RecoverAI automatically pauses mandate debits and aligns execution with the customer's verified salary credit window (<strong>1st–5th of month</strong>), clearing charges during <strong>NACH Cycle 1 (09:00 AM)</strong> when liquidity is peak.
            </p>
          </div>

          {/* Mandate Schedule & Queue Table */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Mandate Retry Queue</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredMandates.length} mandates scheduled for clearing
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search UMN or customer..."
                    value={mandateSearch}
                    onChange={(e) => setMandateSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(['ALL', 'UPI_AUTOPAY', 'ENACH', 'DEBIT_CARD'] as const).map((rail) => (
                    <button
                      key={rail}
                      onClick={() => setMandateRailFilter(rail)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        mandateRailFilter === rail
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {rail === 'ALL' ? 'All Rails' : rail.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono text-[10px]">
                    <th className="py-3 px-4 uppercase">Customer & Mandate UMN</th>
                    <th className="py-3 px-4 uppercase">Payment Rail</th>
                    <th className="py-3 px-4 uppercase text-right">Debit Amount</th>
                    <th className="py-3 px-4 uppercase">Target Window</th>
                    <th className="py-3 px-4 uppercase">Cycle Alignment</th>
                    <th className="py-3 px-4 uppercase">Status</th>
                    <th className="py-3 px-4 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMandates.map((m: MandateSequenceItem) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{m.customer_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.mandate_id} • {m.bank_name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {m.mandate_type === 'UPI_AUTOPAY' ? '⚡ UPI Autopay' : m.mandate_type === 'ENACH' ? '🏦 eNACH Batch' : '💳 Card Mandate'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{Number(m.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {m.next_scheduled_retry} ({m.optimal_retry_window})
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] block">
                          ✓ Salary Aligned (Day {m.aligned_salary_day})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Cleared {m.expected_success_rate_pct}%</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            m.sequence_status === 'EXECUTED_SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200'
                          }`}
                        >
                          {m.sequence_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={executingMandateId === m.id}
                          isLoading={executingMandateId === m.id}
                          onClick={() => handleExecuteMandate(m.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Execute Auto-Debit Now
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NPCI Mandate Execution Receipt Modal */}
          {executionReceiptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fintech-fade">
              <div className="w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                        NPCI / RBI Mandate Clearing Receipt
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Auto-Debit Execution Confirmed
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setExecutionReceiptModal(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Execution Receipt:</span>
                      <strong className="text-slate-900 dark:text-white">{executionReceiptModal.execution_receipt}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settled Amount:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(executionReceiptModal.amount_recovered)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Response:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {executionReceiptModal.bank_response_code} (SUCCESS)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settled At:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(executionReceiptModal.settled_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Audit Event ID:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{executionReceiptModal.audit_event_id}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                    <p className="font-semibold">✓ Funds Captured & Settled to Ledger</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      The recurring subscription has been restored to active standing with zero customer disruption.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                Current (0-30 Days)
              </span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(b2bData.current_bucket_amount)}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Automated soft reminders</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                Overdue (31-60 Days)
              </span>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(b2bData.overdue_bucket_amount)}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Account manager touch</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-mono">
                Critical (61-90 Days)
              </span>
              <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(b2bData.critical_bucket_amount)}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Human escalation gate</span>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono">
                Default Risk (90+ Days)
              </span>
              <p className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
                {formatCurrency(b2bData.default_risk_bucket_amount)}
              </p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">Specialized collections</span>
            </div>
          </div>

          {/* Active Promise-to-Pay (PTP) Tracker Strip */}
          <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Promise-to-Pay (PTP) Commitments Tracker
                </h3>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200/60">
                  {b2bData.active_ptp_count} Active Commitments ({formatCurrency(b2bData.active_ptp_volume)})
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Automated dunning pauses during verified PTP grace periods
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {b2bData.recent_promises.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{p.customer_name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        p.status === 'ACTIVE_PROMISE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                          : p.status === 'FULFILLED'
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200'
                      }`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Promised: {formatCurrency(p.promised_amount)}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Due: {p.promised_date}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{p.operator_notes}"</p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {p.dunning_paused ? '⏸ Dunning Paused (PTP Protected)' : '▶ Active Dunning'}
                    </span>
                    {p.status === 'ACTIVE_PROMISE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFulfillPromise(p.id)}
                        className="cursor-pointer"
                      >
                        Mark Collected
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B2B Invoices Table with Search and Filtering */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Corporate Receivables Ledger</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredInvoices.length} outstanding accounts
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice or company..."
                    value={b2bSearch}
                    onChange={(e) => setB2bSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(['ALL', 'CURRENT', 'OVERDUE', 'CRITICAL', 'DEFAULT'] as const).map((bucket) => (
                    <button
                      key={bucket}
                      onClick={() => setB2bAgingFilter(bucket)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        b2bAgingFilter === bucket
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {bucket === 'ALL' ? 'All Aging' : bucket}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono text-[10px]">
                    <th className="py-3 px-4 uppercase">Invoice / PO</th>
                    <th className="py-3 px-4 uppercase">Enterprise Account</th>
                    <th className="py-3 px-4 uppercase text-right">Amount Due</th>
                    <th className="py-3 px-4 uppercase">Aging</th>
                    <th className="py-3 px-4 uppercase">Status</th>
                    <th className="py-3 px-4 uppercase">Recommended Action</th>
                    <th className="py-3 px-4 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">{inv.invoice_number}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.po_number}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{inv.company_name}</span>
                          {inv.is_vip && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{inv.customer_name}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.amount_due)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-xs font-bold ${
                            inv.days_overdue > 60
                              ? 'text-rose-600 dark:text-rose-400'
                              : inv.days_overdue > 30
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {inv.days_overdue} days
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            inv.status === 'PROMISE_TO_PAY'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                              : inv.status === 'ESCALATED_HUMAN'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200'
                              : inv.status === 'DISPUTED'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
                          }`}
                        >
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {inv.recommended_action.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedInvoiceForPtp(inv);
                            setPtpAmount(Number(inv.amount_due));
                          }}
                          className="cursor-pointer"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fintech-fade">
              <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Promise-to-Pay (PTP) Commitment
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      Log Commitment for {selectedInvoiceForPtp.company_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceForPtp(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePromiseToPay} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1 font-mono">Promised Settlement Amount</label>
                      <input
                        type="number"
                        value={ptpAmount}
                        onChange={(e) => setPtpAmount(parseFloat(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1 font-mono">Settlement Channel</label>
                      <select
                        value={ptpRail}
                        onChange={(e) => setPtpRail(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="NEFT">NEFT Clearance</option>
                        <option value="RTGS">RTGS Immediate</option>
                        <option value="CHEQUE">Corporate Cheque</option>
                        <option value="WIRE">SWIFT / International Wire</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-mono">Promised Payment Date</label>
                    <input
                      type="date"
                      value={ptpDate}
                      onChange={(e) => setPtpDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 font-mono">Operator Notes & Confirmation Context</label>
                    <textarea
                      rows={3}
                      value={ptpNotes}
                      onChange={(e) => setPtpNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 space-y-1">
                    <strong>Deterministic Policy Guarantee:</strong>
                    <p>
                      Recording this PTP will automatically pause all automated email/SMS dunning until {ptpDate}. If unfulfilled on the target date, a high-urgency Broken Promise ticket will be generated.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
      {/* TAB 4: CHECKOUT DROP-OFF & SUBSCRIPTION RECOVERY PLAYBOOKS (INTERACTIVE SIMULATOR) */}
      {/* ========================================================================= */}
      {activeTab === 'CHECKOUT' && (
        <div className="space-y-6">
          {/* Interactive Playbook 1: Pre-Recovery 3DS Friction Simulator */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    1. Checkout Drop-Off Pre-Recovery & Smart 3DS Simulator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Intervenes before failure occurs: requests frictionless 3DS exemptions for low-risk transactions and caches network tokens.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                +5.8 pp Checkout Conversion Lift
              </span>
            </div>

            {/* Interactive Simulation Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-300 font-mono font-semibold">Cart Transaction Amount</label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">${simCartValue}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={simCartValue}
                  onChange={(e) => setSimCartValue(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-1">TRA exemption threshold: $150 (Visa/Mastercard)</span>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 font-mono font-semibold block mb-1">Merchant Risk Profile</label>
                <select
                  value={simMerchantRisk}
                  onChange={(e) => setSimMerchantRisk(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="LOW">Low Risk Tier (TRA Exemption Eligible)</option>
                  <option value="MEDIUM">Standard Risk Tier (Partial 3DS)</option>
                  <option value="HIGH">High Risk Tier (Mandatory Full OTP)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 font-mono font-semibold block mb-1">Acquiring Card Scheme</label>
                <select
                  value={simCardScheme}
                  onChange={(e) => setSimCardScheme(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="VISA">Visa Secure (TRA Rule 2.2)</option>
                  <option value="MASTERCARD">Mastercard Identity Check</option>
                  <option value="RUPAY">RuPay PaySecure (Domestic)</option>
                </select>
              </div>
            </div>

            {/* Live Projected Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Exemption Approval Propensity</span>
                <p className={`text-xl font-black font-mono ${isExemptionGranted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                  {exemptionScore}%
                </p>
                <span className="text-[10px] text-slate-400">{isExemptionGranted ? '✓ Frictionless Flow (Zero OTP)' : '⚠ 3DS Challenge Flow Triggered'}</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Projected Conversion Lift</span>
                <p className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {isExemptionGranted ? '+5.8 pp' : '+0.9 pp'}
                </p>
                <span className="text-[10px] text-slate-400">Eliminates OTP drop-off latency</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Fraud Liability Shift</span>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  Acquirer Shift
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Protected under Visa/MC Rules</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                {simAuthResult || 'Click simulate to test ISO 8583 message response'}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Zap}
                onClick={() => {
                  setSimAuthResult(`✓ ISO 8583 Response 0110: TRA Exemption Approved for $${simCartValue}. Network token cached.`);
                }}
              >
                Simulate Authorization Request
              </Button>
            </div>
          </div>

          {/* Interactive Playbook 2: Subscription Dunning Decay Curves */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    2. Failed Subscription Dunning & Yield Decay Curves
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bounded retry sequence showing diminishing returns across attempts, proving why RecoverAI stops at Attempt 3.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                78.4% Retention Yield
              </span>
            </div>

            {/* Decay Curve Bar Visualization */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-mono block">
                Historical Recovery Propensity by Retry Step
              </span>

              {[
                { attempt: 'Attempt 1 (Immediate + 2h)', yieldPct: 54, costPer1k: 12.4, status: 'HIGH_YIELD' },
                { attempt: 'Attempt 2 (Payday Aligned + 24h)', yieldPct: 24, costPer1k: 38.1, status: 'OPTIMAL' },
                { attempt: 'Attempt 3 (WhatsApp Paired + 72h)', yieldPct: 8, costPer1k: 142.0, status: 'MARGINAL_BOUND' },
                { attempt: 'Attempt 4 (Diminishing Return)', yieldPct: 1.2, costPer1k: 890.0, status: 'POLICY_STOPPED' },
              ].map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{step.attempt}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{step.yieldPct}% Salvage</span>
                      <span className="text-slate-400">(${step.costPer1k}/$1k recovered)</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          step.status === 'POLICY_STOPPED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                        }`}
                      >
                        {step.status === 'POLICY_STOPPED' ? '🛑 Policy Stop Triggered' : '✓ Authorized'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        step.status === 'POLICY_STOPPED' ? 'bg-rose-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${step.yieldPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <strong>Deterministic Policy Guardrail:</strong>
              <p>
                Attempt 4 generates only 1.2% salvage at a cost of $890 per $1,000 recovered, crossing the merchant's net-negative margin boundary. RecoverAI's Policy Engine automatically stops autonomous retries and halts processing to preserve card scheme reputation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
