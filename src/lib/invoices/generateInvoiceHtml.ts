export function generateInvoiceHtml(data: {
  invoiceNumber: string;
  artistName: string;
  venueName: string;
  city?: string;
  eventDate: string;
  totalFee: number;
}) {
  const iva = data.totalFee * 0.21;
  const total = data.totalFee + iva;

  const format = (n: number) =>
    new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const fmt = (n: number): string => {
    const [intPart, decPart] = n.toFixed(2).split(".");
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intFormatted},${decPart}`;
  };

  return `
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 0;
        background: #fff;
        color: #1a1a1a;
        font-size: 14px;
        line-height: 1.5;
      }

      .page {
        max-width: 794px;
        margin: 0 auto;
        padding: 56px 64px 48px;
      }

      /* ── Header ── */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 28px;
        border-bottom: 2px solid #1a1a1a;
        margin-bottom: 36px;
      }

      .logo {
        height: 80px;
      }

      .invoice-box {
        text-align: right;
      }

      .invoice-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 4px;
      }

      .invoice-number {
        font-size: 22px;
        font-weight: 700;
        color: #1a1a1a;
        line-height: 1.2;
      }

      .invoice-date {
        font-size: 13px;
        color: #666;
        margin-top: 4px;
      }

      /* ── Party boxes ── */
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 36px;
      }

      .box {
        border: 1px solid #e6e6e6;
        border-radius: 8px;
        padding: 16px 20px;
        background: #fafafa;
      }

      .box-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 6px;
      }

      .box-value {
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
      }

      /* ── Line items table ── */
      .section {
        margin-bottom: 28px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        text-align: left;
        padding: 10px 12px;
        background: #f4f4f4;
        border-bottom: 2px solid #e0e0e0;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #555;
      }

      td {
        padding: 14px 12px;
        border-bottom: 1px solid #eee;
        color: #1a1a1a;
      }

      /* ── Totals ── */
      .totals {
        width: 320px;
        margin-left: auto;
        margin-top: 8px;
      }

      .totals td {
        padding: 8px 12px;
        border-bottom: none;
        color: #444;
      }

      .totals tr:last-child td {
        padding-top: 12px;
      }

      .total-final td {
        font-weight: 700;
        font-size: 16px;
        color: #1a1a1a;
        border-top: 2px solid #1a1a1a;
      }

      /* ── Footer ── */
      .footer {
        margin-top: 420px;
        padding-top: 16px;
        border-top: 1px solid #e6e6e6;
        font-size: 12px;
        color: #999;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div class="page">
        <div class="header">
          <img src="/logo.png" class="logo"/>

          <div class="invoice-box">
            <div class="invoice-label">Factura</div>
            <div class="invoice-number">${data.invoiceNumber}</div>
            <div class="invoice-date">${new Date().toLocaleDateString("es-ES")}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-label">Artista / Representación</div>
            <div class="box-value">${data.artistName}</div>
          </div>

          <div class="box">
            <div class="box-label">Facturado a</div>
            <div class="box-value">${data.venueName}</div>
            ${data.city ? `<div style="color:#666;font-size:13px;margin-top:2px">${data.city}</div>` : ""}
          </div>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th style="text-align:right">Importe</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Actuación artística (${data.eventDate})</td>
                <td style="text-align:right">${fmt(data.totalFee)} €</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table class="totals">
          <tr>
            <td>Base imponible</td>
            <td style="text-align:right">${fmt(data.totalFee)} €</td>
          </tr>

          <tr>
            <td>IVA (21%)</td>
            <td style="text-align:right">${fmt(iva)} €</td>
          </tr>

          <tr class="total-final">
            <td>Total</td>
            <td style="text-align:right">${fmt(total)} €</td>
          </tr>
        </table>

      <div class="footer">
        Factura generada automáticamente por Link&amp;Play.
      </div>
    </div>
  </body>
  </html>
  `;
}