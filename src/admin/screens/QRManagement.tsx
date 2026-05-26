import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';

export default function QRManagementView({ restaurantId }: { restaurantId: string }) {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [logoBase64, setLogoBase64] = useState<string>('');

  useEffect(() => {
    // Convert imported logo asset to base64 data URI to prevent Canvas/SVG export security issues
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/favicon.svg";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          setLogoBase64(dataUrl);
        } catch (e) {
          console.error("Failed to convert logo to base64:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (restaurantId) fetchQrCodes();
  }, [restaurantId]);

  async function fetchQrCodes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (err) {
      console.error('Error fetching QR codes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    setCreating(true);

    try {
      // 1. Generate a UUID for the QR code
      const id = crypto.randomUUID();
      const qrLink = `https://itfood.in/qr/${id}`;

      // 2. Insert into database
      const { error } = await supabase.from('qr_codes').insert({
        id,
        restaurant_id: restaurantId,
        table_number: tableNumber.trim(),
        qr_link: qrLink
      });

      if (error) throw error;

      setTableNumber('');
      fetchQrCodes();
    } catch (err) {
      console.error('Error creating QR code:', err);
      alert('Failed to create QR code.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this QR code?')) return;
    try {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id);
      if (error) throw error;
      fetchQrCodes();
    } catch (err) {
      console.error('Error deleting QR code:', err);
    }
  }

  function downloadQR(id: string, tableNum: string) {
    const svg = document.getElementById(`qr-svg-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 80;
      if(ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          ctx.fillStyle = "black";
          ctx.font = "bold 20px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`Table ${tableNum}`, canvas.width / 2, canvas.height - 20);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Table-${tableNum}-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function downloadGraphicQR(id: string, tableNum: string) {
    const svg = document.getElementById(`qr-svg-${id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();
    qrImg.onload = () => {
      const templateImg = new Image();
      templateImg.crossOrigin = "anonymous";
      templateImg.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // 1. Draw the template flyer first
          ctx.drawImage(templateImg, 0, 0);
          
          // 2. Draw the QR code on top at the exact center area
          // Bounding Box on 1024x1536 canvas:
          // X: 343 to 686 (Width = 343)
          // Y: 610 to 953 (Height = 343)
          ctx.drawImage(qrImg, 343, 610, 343, 343);
          
          // 3. Draw a stylized Table Number Badge at the top left
          ctx.save();
          const badgeX = 60;
          const badgeY = 60;
          const badgeW = 200;
          const badgeH = 60;
          const radius = 15;
          
          ctx.beginPath();
          ctx.moveTo(badgeX + radius, badgeY);
          ctx.lineTo(badgeX + badgeW - radius, badgeY);
          ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + radius);
          ctx.lineTo(badgeX + badgeW, badgeY + badgeH - radius);
          ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - radius, badgeY + badgeH);
          ctx.lineTo(badgeX + radius, badgeY + badgeH);
          ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - radius);
          ctx.lineTo(badgeX, badgeY + radius);
          ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
          ctx.closePath();
          
          ctx.fillStyle = "white";
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#FF0031"; // Brand Red
          ctx.stroke();
          
          ctx.fillStyle = "#1A1A1A";
          ctx.font = "bold 26px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`TABLE ${tableNum}`, badgeX + badgeW / 2, badgeY + badgeH / 2);
          ctx.restore();
        }
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `Table-${tableNum}-Flyer.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      templateImg.src = "/qr-template.png";
    };
    qrImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <div className="content-card premium-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header modern" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCodeIcon size={24} className="text-primary" />
              QR Code Management
            </h2>
            <p className="text-muted text-sm">Create and manage QR codes for table ordering</p>
          </div>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>Table Number / Name</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 12 or Balcony A"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}
              required
            />
          </div>
          <button type="submit" disabled={creating} className="btn btn-primary premium-hover" style={{ padding: '0.75rem 1.5rem', height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Generate QR
          </button>
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Loading QR codes...</div>
        ) : qrCodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', background: '#F8FAFC', borderRadius: '0.5rem' }}>
            No QR codes generated yet. Create one above to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {qrCodes.map((qr) => (
              <div key={qr.id} style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', background: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-main)' }}>Table {qr.table_number}</h3>
                
                <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', display: 'inline-block', marginBottom: '1rem' }}>
                  <QRCodeSVG 
                    id={`qr-svg-${qr.id}`}
                    value={qr.qr_link} 
                    size={160} 
                    level="H"
                    includeMargin={false}
                    imageSettings={logoBase64 ? {
                      src: logoBase64,
                      x: undefined,
                      y: undefined,
                      height: 35,
                      width: 35,
                      excavate: true
                    } : undefined}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => downloadQR(qr.id, qr.table_number)}
                      className="btn premium-hover" 
                      style={{ flex: 1, background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.875rem' }}
                      title="Download raw QR Code only"
                    >
                      <Download size={16} /> Raw QR
                    </button>
                    <button 
                      onClick={() => handleDelete(qr.id)}
                      className="btn premium-hover" 
                      style={{ background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      title="Delete QR"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => downloadGraphicQR(qr.id, qr.table_number)}
                    className="btn premium-hover" 
                    style={{ background: '#FF0031', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.875rem', fontWeight: '500', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                  >
                    <Download size={16} /> Download Stand Flyer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
