// ==========================================================================
// AURELIA SCENTS - WHATSAPP CONCIERGE & ORDER SYNC
// Dynamic Phone Sync with Store Settings
// ==========================================================================

function getWhatsAppPhone() {
  if (typeof state !== 'undefined' && state.settings && state.settings.whatsapp_number) {
    return state.settings.whatsapp_number.replace(/[^0-9]/g, '');
  }
  return "2347080097512";
}

function formatCurrency(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

/**
 * Formats a luxury itemized order receipt for WhatsApp chat
 */
function buildWhatsAppOrderMessage({ orderId, customer, items, subtotal, deliveryFee, total, paymentMethod }) {
  const lineItems = items.map((item, index) => {
    return `${index + 1}. *${item.name}* (${item.size || '50ml'}) × ${item.quantity}\n   ↳ ${formatCurrency(item.price * item.quantity)}`;
  }).join("\n\n");

  const message = 
`👑 *AURELIA SCENTS — ORDER #${orderId}*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

🛍️ *ORDERED CREATIONS:*
${lineItems}

━━━━━━━━━━━━━━━━━━━━
💰 *FINANCIAL SUMMARY:*
• *Subtotal:* ${formatCurrency(subtotal)}
• *Delivery:* ${deliveryFee > 0 ? formatCurrency(deliveryFee) : "FREE (Special Complimentary Offer)"}
• *TOTAL PAYABLE:* ${formatCurrency(total)}
• *Payment Channel:* ${paymentMethod === 'pay_on_delivery' ? 'Pay on Delivery / Bank Transfer' : 'Direct WhatsApp Concierge'}

📍 *DELIVERY DESTINATION:*
• *Recipient:* ${customer.name || 'Customer'}
• *Phone:* ${customer.phone || 'Provided via Chat'}
• *Address:* ${customer.address || ''}, ${customer.city || 'Lagos'}, ${customer.state || 'Lagos'}
${customer.notes ? `• *Special Notes:* ${customer.notes}` : ''}

━━━━━━━━━━━━━━━━━━━━
_Kindly confirm availability and provide payment details / dispatch timeline._ ✨`;

  return message;
}

/**
 * Opens WhatsApp with formatted order
 */
function sendOrderToWhatsApp(orderData) {
  const phone = getWhatsAppPhone();
  const message = buildWhatsAppOrderMessage(orderData);
  const encodedText = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Opens WhatsApp for personalized fragrance consultation
 */
function sendScentConsultationWhatsApp(productName, volume, price) {
  const phone = getWhatsAppPhone();
  const message = `Hello Aurelia Concierge! ✨ I am interested in *${productName}*${volume ? ` (${volume})` : ''}${price ? ` at ${formatCurrency(price)}` : ''}. Could you tell me more about its sillage and longevity?`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Opens general concierge chat
 */
function openGeneralConciergeWhatsApp() {
  const phone = getWhatsAppPhone();
  const message = `Hello Aurelia Scents! ✨ I would like assistance with bespoke fragrance recommendations.`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
