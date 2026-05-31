/**
 * Background WhatsApp notification dispatcher service.
 * Supports silent Fonnte API gateway integration and simulations.
 */
export const sendBackgroundWA = async (phone, message) => {
  const token = import.meta.env.VITE_FONNTE_TOKEN;

  // Check if Fonnte API token is configured
  if (!token || token.trim() === '') {
    console.log('WhatsApp Token is empty. Running in SIMULATION fallback mode.');
    return { success: false, mode: 'simulation', reason: 'Token not configured' };
  }

  // Fonnte expects standard Indonesian prefixes (e.g. 628...)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('08')) {
    cleanPhone = '628' + cleanPhone.substring(2);
  }

  try {
    // Construct standard Fonnte API FormData body
    const formData = new FormData();
    formData.append('target', cleanPhone);
    formData.append('message', message);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Gateway HTTP error! Status: ${response.status}`);
    }

    const resJson = await response.json();
    
    // Fonnte returns { status: true, ... } on success
    if (resJson.status === true) {
      console.log('Background WhatsApp sent successfully via Fonnte:', resJson);
      return { success: true, mode: 'api', data: resJson };
    } else {
      throw new Error(resJson.reason || 'Fonnte Gateway rejected the request.');
    }
  } catch (error) {
    console.error('Background WhatsApp dispatch failed:', error);
    throw error; // Let the caller UI handle the error and fallback
  }
};
