const axios = require('axios')
const cheerio = require('cheerio')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

function parsePrice(txt) {
  if (!txt) return 0
  // 12.345,67 TL veya 12.345 TL formatları
  const clean = txt.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

module.exports = async function trendyol(query) {
  const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9' }, timeout: 15000 })
  const $ = cheerio.load(data)

  // yeni tasarım sınıfları sık değişiyor bu yüzden esnek seçiciler
  const card = $('[data-cy=product-card], .p-card-wrppr, .prdct-cntnr .p-card-wrppr').first()
  const linkPath = card.find('a[href]').attr('href') || ''
  const title = card.find('[class*=prdct-desc-cntnr-ttl], [class*=product-title], .p-card-chldrn-cntnr').text().trim()
  const priceTxt = card.find('.prc-box-dscntd, .prc-box-sllng, [class*=prc-box-price]').first().text().trim()

  const priceNum = parsePrice(priceTxt)
  const productUrl = linkPath.startsWith('http') ? linkPath : ('https://www.trendyol.com' + linkPath)

  return {
    site: 'Trendyol',
    title: title || query,
    price: priceTxt || (priceNum ? `${priceNum} TL` : ''),
    priceNum,
    url: productUrl
  }
}
