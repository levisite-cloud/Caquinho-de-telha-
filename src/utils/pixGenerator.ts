function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function generatePixCopiaECola(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number
): string {
  // Trata nomes para evitar caracteres inválidos (remove acentos e limita tamanho)
  const normalizedName = merchantName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).trim() || 'RECEBEDOR';
  const normalizedCity = merchantCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).trim() || 'CIDADE';
  const normalizedAmount = amount.toFixed(2);

  const payloadFormat = formatField('00', '01');
  const merchantAccountInfo = formatField(
    '26',
    formatField('00', 'br.gov.bcb.pix') + formatField('01', pixKey)
  );
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986');
  const transactionAmount = formatField('54', normalizedAmount);
  const countryCode = formatField('58', 'BR');
  const merchantNameField = formatField('59', normalizedName);
  const merchantCityField = formatField('60', normalizedCity);
  const additionalDataField = formatField('62', formatField('05', '***'));

  const payloadWithoutCrc = [
    payloadFormat,
    merchantAccountInfo,
    merchantCategoryCode,
    transactionCurrency,
    transactionAmount,
    countryCode,
    merchantNameField,
    merchantCityField,
    additionalDataField,
    '6304' // Prefixo do CRC
  ].join('');

  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}
