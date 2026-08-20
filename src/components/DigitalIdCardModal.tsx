import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Building2, 
  GraduationCap, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { AlumniRecord } from '../types';
import { AlumniAvatar } from './AlumniAvatar';

interface DigitalIdCardModalProps {
  alumni: AlumniRecord;
  onClose: () => void;
}

export const DigitalIdCardModal: React.FC<DigitalIdCardModalProps> = ({ alumni, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const rollText = alumni.rollNo || alumni.id || 'N/A';
  const phoneText = alumni.phone || 'Contact via Admin';
  const emailText = alumni.email || 'Email via Portal';
  const companyText = alumni.company || 'Textile / Garments Industry';
  const desigText = alumni.designation || 'PGD Professional';
  const batchText = alumni.batch || 'PGD Alumni Member';

  // Construct vCard QR payload with ALL member details
  const vcardPayload = `BEGIN:VCARD
VERSION:3.0
FN:${alumni.name}
ORG:${companyText}
TITLE:${desigText}
TEL:${phoneText}
EMAIL:${emailText}
NOTE:BUTEX PGD Alumni | SL:${rollText} | Batch:${batchText} | Uni:${alumni.university || 'BUTEX'}
END:VCARD`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(vcardPayload)}`;

  // Canvas PNG Download Generator
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        alert("Canvas rendering not supported in your browser.");
        return;
      }

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1200);
      bgGrad.addColorStop(0, '#020617'); // slate-950
      bgGrad.addColorStop(0.5, '#0f172a'); // slate-900
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 1200);

      // Gold Accent Header Bar
      const headerGrad = ctx.createLinearGradient(0, 0, 800, 0);
      headerGrad.addColorStop(0, '#f59e0b');
      headerGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, 800, 16);

      // Top Title Banner Box
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 40, 720, 100);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 720, 100);

      // Title Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BANGLADESH UNIVERSITY OF TEXTILES', 400, 80);

      ctx.fillStyle = '#fbbf24'; // amber-400
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('POST GRADUATE DIPLOMA (PGD) ALUMNI ASSOCIATION', 400, 115);

      // Card Content Box Background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.beginPath();
      ctx.roundRect(40, 160, 720, 980, 24);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Verified Badge Header inside Card
      ctx.fillStyle = '#047857'; // emerald-700
      ctx.beginPath();
      ctx.roundRect(60, 180, 420, 40, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓ OFFICIAL VERIFIED MEMBER', 270, 205);

      // Roll Number
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SL: ${rollText}`, 720, 205);

      // Try loading member avatar photo
      const memberPhotoUrl = alumni.photo || alumni.photoUrl;
      let hasDrawnPhoto = false;

      if (memberPhotoUrl) {
        try {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          photoImg.src = memberPhotoUrl;

          await new Promise((resolve) => {
            photoImg.onload = resolve;
            photoImg.onerror = resolve;
          });

          if (photoImg.complete && photoImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(70, 240, 110, 110, 16);
            ctx.clip();
            ctx.drawImage(photoImg, 70, 240, 110, 110);
            ctx.restore();

            // Gold Border around photo
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(70, 240, 110, 110, 16);
            ctx.stroke();
            hasDrawnPhoto = true;
          }
        } catch (e) {
          console.warn("Avatar image render skipped:", e);
        }
      }

      // Default avatar fallback circle if photo didn't load
      if (!hasDrawnPhoto) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(125, 295, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(alumni.name.charAt(0).toUpperCase(), 125, 308);
      }

      // Member Name & Titles (Left aligned next to photo)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(alumni.name, 200, 272);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(desigText, 200, 302);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(companyText, 200, 328);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`Batch: ${batchText} | Exp: ${alumni.experience || 'PGD'}+ Yrs`, 200, 352);

      // Details Table
      const startY = 380;
      const rowHeight = 44;
      const details = [
        ['Phone / WhatsApp:', phoneText],
        ['Email Address:', emailText],
        ['University:', alumni.university || 'BUTEX / PGD'],
        ['Job Status:', alumni.jobStatus || 'Active Alumni']
      ];

      details.forEach(([label, val], idx) => {
        const y = startY + idx * rowHeight;
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.beginPath();
        ctx.roundRect(70, y, 660, 38, 10);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, 90, y + 24);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, 710, y + 24);
      });

      // Draw QR Code Image Box
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrImageUrl;

      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve; // Continue rendering even if QR fails
      });

      // QR Container Box
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(70, 580, 660, 280, 20);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      if (qrImg.complete && qrImg.naturalWidth > 0) {
        // Draw white background behind QR
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(100, 605, 230, 230, 16);
        ctx.fill();
        ctx.drawImage(qrImg, 110, 615, 210, 210);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('vCard Member QR Code', 360, 650);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '15px sans-serif';
        ctx.fillText('Scan with smartphone camera to save contact', 360, 685);
        ctx.fillText(`details for ${alumni.name} into address book.`, 360, 710);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`Ref: butex-pgd-alumni/${rollText}`, 360, 760);
        ctx.fillText(`Status: Verified Digital ID`, 360, 785);
      }

      // Footer Branding
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('Issued by BUTEX PGD Alumni Association Portal | https://butex-pgd-alumni.web.app', 400, 1100);

      // Download link creation
      const link = document.createElement('a');
      link.download = `BUTEX_PGD_Digital_ID_${alumni.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate ID card image:", err);
      alert("Downloading card image failed. You can use the Print option to save as PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Download .vcf contact file
  const handleDownloadVCard = () => {
    const blob = new Blob([vcardPayload], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${alumni.name.replace(/\s+/g, '_')}_BUTEX_PGD.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Profile / QR link
  const handleCopyLink = () => {
    const link = `https://butex-pgd-alumni.web.app/verify/${encodeURIComponent(rollText)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Print ID Card
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
              PGD
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Official Digital Alumni ID</h3>
              <p className="text-[10px] text-amber-400 font-semibold">BUTEX PGD Alumni Association</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 space-y-6" ref={cardRef}>

          {/* Card Frame Visual */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-amber-500/50 shadow-xl space-y-4 relative overflow-hidden">
            
            {/* Top Organization Heading Banner */}
            <div className="bg-slate-900 border-2 border-amber-500/80 rounded-xl px-3 py-2.5 text-center space-y-0.5 shadow-md">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">
                BANGLADESH UNIVERSITY OF TEXTILES
              </h4>
              <p className="font-bold text-[10px] uppercase tracking-wider text-amber-400">
                POST GRADUATE DIPLOMA (PGD) ALUMNI ASSOCIATION
              </p>
            </div>

            {/* Security Status & Roll */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OFFICIAL VERIFIED MEMBER</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                SL: {rollText}
              </span>
            </div>

            {/* Photo + Core Member Attributes */}
            <div className="flex items-center space-x-4">
              <AlumniAvatar
                photoUrl={alumni.photo || alumni.photoUrl}
                name={alumni.name}
                sizeClass="w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl border-2 border-amber-400 shadow-md"
                textClass="text-2xl font-bold"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-extrabold text-lg text-white truncate leading-tight">{alumni.name}</h2>
                <p className="text-xs text-amber-400 font-semibold truncate">{desigText}</p>
                <p className="text-xs text-slate-300 truncate font-medium">{companyText}</p>
                <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                    {batchText}
                  </span>
                  {alumni.experience && (
                    <span className="text-amber-300 font-semibold">{alumni.experience}+ Yrs Exp</span>
                  )}
                </div>
              </div>
            </div>

            {/* Full Member Detailed Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Phone / WhatsApp</span>
                <span className="font-semibold text-slate-200 font-mono">{phoneText}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Email Address</span>
                <span className="font-semibold text-slate-200 truncate block">{emailText}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Academic / University</span>
                <span className="font-semibold text-slate-200 truncate block">{alumni.university || 'BUTEX'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Job Status</span>
                <span className="font-semibold text-amber-300 truncate block">{alumni.jobStatus || 'Active Alumni'}</span>
              </div>
            </div>

            {/* QR Code Section containing ALL Member Info */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 bg-white p-2 rounded-xl shrink-0 flex items-center justify-center border-2 border-amber-400 shadow-md">
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${alumni.name}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-amber-400 font-bold text-xs">
                  <QrCode className="w-4 h-4" />
                  <span>vCard Member QR Code</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Scan this QR code with any smartphone camera to automatically save <strong>{alumni.name}</strong>'s full contact details & verify PGD membership.
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Ref: butex-pgd-alumni/{rollText}
                </div>
              </div>
            </div>

          </div>

          {/* Download & Actions Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownloadImage}
                disabled={downloading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Generating Image...' : 'Download ID Card (PNG)'}</span>
              </button>

              <button
                onClick={handleDownloadVCard}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
              >
                <User className="w-4 h-4" />
                <span>Download vCard Contact</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print ID Badge</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copied Link!' : 'Copy Verify URL'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
