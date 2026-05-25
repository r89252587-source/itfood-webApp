import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Download, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';

export default function QRManagementView({ restaurantId }: { restaurantId: string }) {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

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
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => downloadQR(qr.id, qr.table_number)}
                    className="btn premium-hover" 
                    style={{ background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    <Download size={16} /> Download
                  </button>
                  <button 
                    onClick={() => handleDelete(qr.id)}
                    className="btn premium-hover" 
                    style={{ background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    <Trash2 size={16} /> Delete
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
