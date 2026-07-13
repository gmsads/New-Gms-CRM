export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Zero Rupees';

  const num = Number(amount);
  if (num === 0) return 'Zero Rupees';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertGroup(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertGroup(n % 100) : '');
  }

  function convertNumber(n) {
    if (n === 0) return 'Zero';
    
    // Indian Number System: Crore (10^7), Lakh (10^5), Thousand (10^3), Hundred
    let res = '';
    
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) {
      res += convertGroup(crore) + ' Crore ';
    }
    
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      res += convertGroup(lakh) + ' Lakh ';
    }
    
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      res += convertGroup(thousand) + ' Thousand ';
    }
    
    if (n > 0) {
      res += convertGroup(n);
    }
    
    return res.trim();
  }

  const parts = Number(num.toFixed(2)).toString().split('.');
  const integerPart = parseInt(parts[0], 10) || 0;
  const decimalPart = parts[1] ? parseInt(parts[1].padEnd(2, '0').substring(0, 2), 10) : 0;

  let result = '';
  if (integerPart > 0) {
    result += convertNumber(integerPart) + ' Rupees';
  } else {
    result += 'Zero Rupees';
  }

  if (decimalPart > 0) {
    result += ' and ' + convertNumber(decimalPart) + ' Paise';
  }

  return result;
}
