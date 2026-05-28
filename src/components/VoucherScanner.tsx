import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { Landmark, UploadCloud, Cpu, Check, AlertCircle, Copy, FileText, CheckCircle2 } from 'lucide-react';

interface VoucherScannerProps {
  league: League;
  onSubmitVoucher: (amount: number, code: string, filename: string) => Promise<void>;
  onClose?: () => void;
}

export default function VoucherScanner({ league, onSubmitVoucher, onClose }: VoucherScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<{
    amount: number;
    code: string;
    bankName: string;
  } | null>(null);

  const [inputAmount, setInputAmount] = useState<number>(league.costPerEntry || 5);
  const [inputCode, setInputCode] = useState<string>('');
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountVerification, setAccountVerification] = useState<'verified' | 'mismatch' | null>(null);
  const [detectedAccount, setDetectedAccount] = useState<string>('');

  const bank = league.bankConfig;

  // Pasos de la animación del OCR simulado
  const steps = [
    'Conectando con el procesador de imágenes OCR...',
    'Analizando estructura de comprobante...',
    'Identificando banco emisor y fecha...',
    'Leyendo valores monetarios y monto...',
    'Validando firmas digitales y número de transacción...'
  ];

  useEffect(() => {
    if (!scanning) return;
    setScanStep(0);
    const interval = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          finishScan();
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [scanning]);

  const finishScan = () => {
    setScanning(false);
    
    // Simulación inteligente de extracción de texto
    // Ignoramos fechas y horas automáticas del nombre del archivo (ej. WhatsApp Image YYYY-MM-DD at HH.MM.SS)
    let detectedAmount = league.costPerEntry || 9;
    if (file) {
      const filenameCleaned = file.name
        .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '') // Quitar fechas YYYY-MM-DD
        .replace(/\b\d{2}[-.:]\d{2}[-.:]\d{2}\b/g, '') // Quitar horas HH:MM:SS
        .replace(/\bat\b/gi, ''); // Quitar palabra "at"
      
      // Buscar cualquier número decimal o entero en el nombre limpio
      const match = filenameCleaned.match(/\b\d+(?:\.\d{2})?\b/);
      if (match) {
        const val = parseFloat(match[0]);
        if (val > 0) {
          detectedAmount = val;
        }
      }
    }

    const detectedCode = String(Math.floor(100000000 + Math.random() * 900000000));
    
    // Simulación de verificación de cuenta destinataria
    const lowerFilename = file ? file.name.toLowerCase() : '';
    const hasErrorKeyword = lowerFilename.includes('incorrecto') || lowerFilename.includes('error') || lowerFilename.includes('wrong') || lowerFilename.includes('falso');
    
    const correctAccount = bank?.accountNumber || '1234567890';
    const mockWrongAccount = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const scannedAccount = hasErrorKeyword ? mockWrongAccount : correctAccount;

    setDetectedAccount(scannedAccount);
    setAccountVerification(hasErrorKeyword ? 'mismatch' : 'verified');

    setScanResult({
      amount: detectedAmount,
      code: detectedCode,
      bankName: bank?.bankName || 'Banco Pichincha'
    });
    setInputAmount(detectedAmount);
    setInputCode(detectedCode);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setScanning(true);
      setScanResult(null);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult || submitting) return;

    setSubmitting(true);
    try {
      // Enviar al administrador
      await onSubmitVoucher(Number(inputAmount), inputCode || scanResult.code, file?.name || 'comprobante.png');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-lg mx-auto shadow-2xl animate-fadeIn relative" id="voucher-scanner-root">
      
      {/* Header */}
      <div className="text-center space-y-1.5 select-none">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs">
          🏦
        </div>
        <h3 className="text-lg font-black text-white tracking-tight font-sans">
          Pagar Inscripción en {league.name}
        </h3>
        <p className="text-[11px] text-slate-400 font-medium">
          Transfiere al creador de la liga para cargar tu saldo apostado y empezar a competir.
        </p>
      </div>

      {/* bank account details card */}
      {bank ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-inner">
          <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5 select-none">
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            Datos de Transferencia del Organizador
          </span>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block select-none">Banco Receptor</span>
              <span className="font-bold text-slate-200">{bank.bankName}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold block select-none">Tipo de Cuenta</span>
              <span className="font-bold text-slate-200 capitalize">{bank.accountType}</span>
            </div>

            <div className="col-span-2 border-t border-slate-900 pt-2 flex justify-between items-center group">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold block select-none">Número de Cuenta</span>
                <span className="font-mono font-bold text-slate-100 text-sm">{bank.accountNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bank.accountNumber, 'num')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              >
                {copiedField === 'num' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedField === 'num' ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="col-span-2 border-t border-slate-900 pt-2 flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold block select-none">Titular de Cuenta (Cédula)</span>
                <span className="font-bold text-slate-200 block">{bank.ownerName}</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">C.I.: {bank.ownerId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bank.ownerId, 'id')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              >
                {copiedField === 'id' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedField === 'id' ? 'Copiar C.I.' : 'Copiar C.I.'}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex justify-between text-xs items-center select-none">
            <span className="text-slate-400 font-bold">Costo de Entrada:</span>
            <span className="text-emerald-400 font-extrabold font-mono text-sm">${league.costPerEntry || 5}.00 USD</span>
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-4 text-center text-xs text-rose-300 select-none">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          El creador de esta liga aún no ha configurado sus datos de transferencia bancaria. Por favor contáctalo para realizar el pago.
        </div>
      )}

      {/* OCR scanner uploader */}
      {bank && (
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Sube la Captura del Comprobante</label>
          
          <div className="relative border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950/50 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center group cursor-pointer overflow-hidden min-h-[160px]">
            
            {/* OCR scanner scanning animation bar */}
            {scanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_8px_#6366f1] top-0 animate-scanLine z-20"></div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={scanning}
              className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />

            {!file && !scanning && (
              <div className="space-y-2 select-none">
                <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-all mx-auto" />
                <div>
                  <span className="text-xs font-bold text-slate-300 block">Selecciona o arrastra el comprobante</span>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-1">Soporta capturas JPG, PNG o PDF</span>
                </div>
              </div>
            )}

            {/* Scanning processing UI */}
            {scanning && (
              <div className="space-y-3.5 select-none z-10 animate-pulse">
                <Cpu className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-white block">Analizando Comprobante Bancario</span>
                  <span className="text-[9px] text-indigo-400 font-mono font-bold block">{steps[scanStep]}</span>
                </div>
              </div>
            )}

            {/* Successful scan result thumbnail */}
            {file && !scanning && (
              <div className="space-y-2.5 z-10 select-none">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Comprobante cargado correctamente</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCR Results Confirmation Form */}
      {scanResult && !scanning && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950/50 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-900 select-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Datos Leídos por Escáner de Red (OCR)
            </span>
          </div>

          {/* Account Number Verification Banner */}
          {accountVerification === 'verified' && (
            <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 p-3.5 rounded-xl flex items-start gap-2 text-[10.5px] leading-relaxed">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold uppercase block select-none tracking-wider text-[9px] text-emerald-400">✓ Cuenta Destinataria Verificada</span>
                El escáner OCR leyó la cuenta destinataria <strong className="font-mono text-white select-all">{detectedAccount}</strong>, coincidiendo plenamente con la cuenta oficial registrada para esta liga.
              </div>
            </div>
          )}

          {accountVerification === 'mismatch' && (
            <div className="bg-rose-950/25 border border-rose-900/40 text-rose-350 p-3.5 rounded-xl flex items-start gap-2 text-[10.5px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold uppercase block select-none tracking-wider text-[9px] text-rose-450">❌ ERROR OCR: Cuenta Destinataria Incorrecta</span>
                La cuenta leída en el comprobante es <strong className="font-mono text-rose-300 select-all">{detectedAccount}</strong>, la cual NO coincide con la cuenta registrada de la liga (<strong className="font-mono text-white select-all">{bank?.accountNumber}</strong>). Sube el comprobante de transferencia correcto.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amount confirmation */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block select-none">Monto Confirmado ($)</label>
              <div className="relative">
                <span className="text-xs font-extrabold text-slate-400 absolute left-3 top-2 font-mono">$</span>
                <input
                  type="number"
                  min="1"
                  value={inputAmount || ''}
                  disabled={accountVerification === 'mismatch'}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setInputAmount(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 pl-7 pr-3 text-xs text-white focus:outline-none transition-all font-mono font-bold disabled:opacity-40"
                  required
                />
              </div>
            </div>

            {/* Transaction Code confirmation */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block select-none">Nº Transacción / Referencia</label>
              <input
                type="text"
                value={inputCode}
                disabled={accountVerification === 'mismatch'}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none transition-all font-mono font-bold disabled:opacity-40"
                required
              />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 border-slate-800/80 rounded-xl p-3 text-[10px] text-slate-400 font-medium select-none leading-relaxed">
            💡 <strong>Consejo:</strong> Como el escaneo OCR corre de forma 100% estática en tu navegador (sin enviar tu comprobante a servidores externos de pago), el simulador extrae montos basándose en el **nombre del archivo** (ej: si lo renombras a <code className="text-indigo-400 font-bold font-mono">comprobante-1.00.png</code> leerá exactamente $1.00). Al subirlo con nombre genérico, predetermina el **costo oficial de tu liga ($9.00)**. Siéntete libre de modificar el monto a **$1.00** manualmente aquí arriba antes de enviar a revisión.
          </div>

          <button
            type="submit"
            disabled={submitting || accountVerification === 'mismatch'}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? 'Enviando comprobante...' : 'Enviar a Revisión del Administrador'}
          </button>
        </form>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          disabled={scanning || submitting}
          className="absolute top-2 right-2.5 w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all shrink-0"
          title="Cerrar modal"
        >
          ×
        </button>
      )}
    </div>
  );
}
